import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookingEvaluations } from '../api';

const statusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
};

function scoreLabel(score) {
  if (score >= 4.5) return 'ดีมาก';
  if (score >= 3.5) return 'ดี';
  if (score >= 2.5) return 'ปานกลาง';
  if (score >= 1.5) return 'ควรปรับปรุง';
  return 'ต้องปรับปรุงมาก';
}

export default function BookingEvaluations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBookingEvaluations()
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
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

  if (loading) return <p className="pb-8 text-slate-500">กำลังโหลดผลประเมิน...</p>;
  if (error) return <p className="pb-8 text-rose-600">{error}</p>;

  return (
    <div className="pb-8">
      <h1 className="mb-4 text-3xl font-bold text-[#2d5a3a]">ผลประเมินหลังเข้าชม</h1>

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
                    สถานะการจอง: {statusLabels[row.booking?.status] || row.booking?.status || '-'}
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
