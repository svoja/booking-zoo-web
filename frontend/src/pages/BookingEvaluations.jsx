import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookingEvaluations, getBookings } from '../api';

const statusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
};

function getDisplayStatus(row) {
  const rawStatus = row.booking?.status;
  if (rawStatus === 'pending' && row.submittedAt) {
    return 'approved';
  }
  return rawStatus;
}

function scoreLabel(score) {
  if (score >= 4.5) return 'ดีมาก';
  if (score >= 3.5) return 'ดี';
  if (score >= 2.5) return 'ปานกลาง';
  if (score >= 1.5) return 'ควรปรับปรุง';
  return 'ต้องปรับปรุงมาก';
}

export default function BookingEvaluations() {
  const [rows, setRows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBookingEvaluations(), getBookings()])
      .then(([evaluationData, bookingData]) => {
        if (cancelled) return;
        setRows(Array.isArray(evaluationData) ? evaluationData : []);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'โหลดผลประเมินไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalSubmissions = rows.length;
    const responseRate = bookings.length ? (totalSubmissions / bookings.length) * 100 : 0;
    const averageScore = totalSubmissions
      ? rows.reduce((sum, row) => sum + Number(row.averageScore || 0), 0) / totalSubmissions
      : 0;

    const formCounts = {};
    const schoolCounts = {};
    const lowScoreRows = [];
    const questionRatings = {};

    rows.forEach((row) => {
      const formTitle = row.formTitle || 'ไม่ระบุแบบประเมิน';
      formCounts[formTitle] = (formCounts[formTitle] || 0) + 1;

      const school = row.booking?.schoolName || 'ไม่ระบุโรงเรียน';
      schoolCounts[school] = (schoolCounts[school] || 0) + 1;

      if (Number(row.averageScore || 0) <= 3) {
        lowScoreRows.push(row);
      }

      (row.answers || []).forEach((answer) => {
        if (answer.type !== 'rating' || !Number.isFinite(Number(answer.rating))) return;
        if (!questionRatings[answer.prompt]) {
          questionRatings[answer.prompt] = { total: 0, count: 0 };
        }
        questionRatings[answer.prompt].total += Number(answer.rating);
        questionRatings[answer.prompt].count += 1;
      });
    });

    const topForms = Object.entries(formCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topSchools = Object.entries(schoolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const questionAverages = Object.entries(questionRatings)
      .map(([prompt, value]) => ({
        prompt,
        average: value.count ? Number((value.total / value.count).toFixed(2)) : 0,
        count: value.count,
      }))
      .sort((a, b) => a.average - b.average);

    return {
      totalSubmissions,
      averageScore: Number(averageScore.toFixed(2)),
      responseRate: Number(responseRate.toFixed(1)),
      lowScoreCount: lowScoreRows.length,
      topForms,
      topSchools,
      weakestQuestions: questionAverages.slice(0, 3),
    };
  }, [rows, bookings]);

  if (loading) return <p className="pb-8 text-slate-500">กำลังโหลดผลประเมิน...</p>;
  if (error) return <p className="pb-8 text-rose-600">{error}</p>;

  return (
    <div className="pb-8">
      <h1 className="mb-4 text-3xl font-bold text-[#2d5a3a]">ผลประเมินหลังเข้าชม</h1>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <p className="text-sm text-slate-600">ส่งแบบประเมินแล้ว</p>
          <p className="mt-2 text-3xl font-bold text-[#2d5a3a]">{metrics.totalSubmissions}</p>
        </article>
        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <p className="text-sm text-slate-600">คะแนนเฉลี่ยรวม</p>
          <p className="mt-2 text-3xl font-bold text-[#2d5a3a]">{metrics.averageScore.toFixed(2)} / 5</p>
        </article>
        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <p className="text-sm text-slate-600">อัตราการตอบกลับ</p>
          <p className="mt-2 text-3xl font-bold text-[#2d5a3a]">{metrics.responseRate.toFixed(1)}%</p>
        </article>
        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <p className="text-sm text-slate-600">คะแนนต่ำกว่า 3</p>
          <p className="mt-2 text-3xl font-bold text-[#2d5a3a]">{metrics.lowScoreCount}</p>
        </article>
      </section>

      <section className="mb-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">แบบประเมินที่ถูกใช้มากสุด</h2>
          {metrics.topForms.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {metrics.topForms.map(([formTitle, count]) => (
                <li key={formTitle} className="flex items-center justify-between gap-3">
                  <span>{formTitle}</span>
                  <strong className="text-[#2d5a3a]">{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">โรงเรียนที่ตอบแบบประเมินมากสุด</h2>
          {metrics.topSchools.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {metrics.topSchools.map(([school, count]) => (
                <li key={school} className="flex items-center justify-between gap-3">
                  <span>{school}</span>
                  <strong className="text-[#2d5a3a]">{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">ประเด็นที่ควรจับตา</h2>
          {metrics.weakestQuestions.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูลคะแนน</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {metrics.weakestQuestions.map((item) => (
                <li key={item.prompt}>
                  <p className="font-medium text-slate-700">{item.prompt}</p>
                  <p className="text-xs text-slate-500">เฉลี่ย {item.average.toFixed(2)} / 5 จาก {item.count} คำตอบ</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[#d4e0d4] bg-white p-4 text-sm text-slate-600">
          ยังไม่มีการส่งแบบประเมิน
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#2d5a3a]">{row.booking?.schoolName || '-'}</h2>
                  <p className="text-sm text-slate-600">
                    วันเข้าชม: {row.booking?.visitDate || '-'} {row.booking?.visitTime ? `เวลา ${row.booking.visitTime}` : ''}
                  </p>
                  <p className="text-sm text-slate-600">
                    สถานะการจอง: {statusLabels[getDisplayStatus(row)] || getDisplayStatus(row) || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">คะแนนเฉลี่ย</p>
                  <p className="text-2xl font-bold text-[#2d5a3a]">{Number(row.averageScore || 0).toFixed(2)} / 5</p>
                  <p className="text-sm text-slate-600">{scoreLabel(Number(row.averageScore || 0))}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-slate-700">ผู้ประเมิน: {row.respondentName || '-'}</p>
                <p className="text-slate-700">ตำแหน่ง: {row.respondentRole || '-'}</p>
                <p className="text-slate-700">เบอร์โทร: {row.respondentPhone || '-'}</p>
                <p className="text-slate-700">ส่งเมื่อ: {row.submittedAt || '-'}</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">แบบประเมิน: {row.formTitle || '-'}</p>

              {(row.answers || []).filter((a) => a.type === 'text' && a.answer).slice(0, 1).map((a) => (
                <div key={`${row.id}-${a.questionId}`} className="mt-3 rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] px-3 py-2 text-sm text-slate-700">
                  {a.prompt}: {a.answer}
                </div>
              ))}

              <div className="mt-3">
                <Link
                  to={`/features/booking/booking/${row.bookingId}`}
                  className="inline-block rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#f0f7f0]"
                >
                  ดูรายละเอียดการจอง
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
