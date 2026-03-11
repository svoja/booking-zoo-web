import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBooking } from '../api';

const statusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
};

const cardClass = 'rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBooking(id)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="pb-8 text-slate-500">กำลังโหลด...</div>;

  if (error || !booking) {
    return (
      <div className="pb-8">
        <p className="mb-2 text-rose-600">{error || 'ไม่พบรายการจอง'}</p>
        <Link to="/features/booking/list" className="font-semibold text-[#2d5a3a] hover:underline">กลับไปรายการจอง</Link>
      </div>
    );
  }

  const b = booking;

  return (
    <div className="grid gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#2d5a3a]">
          <span className="mr-2 text-slate-500">#{b.id}</span>
          {b.schoolName || '(ไม่ระบุโรงเรียน)'}
        </h1>
        <span className="rounded-full border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-3 py-1 text-xs font-semibold text-[#2d5a3a]">
          {statusLabels[b.status] || b.status}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">ข้อมูลโรงเรียน</h2>
          <p className="text-sm text-slate-700">{b.schoolName || '-'}</p>
          <p className="mt-2 text-xs text-slate-500">ระดับชั้น</p>
          <p className="text-sm text-slate-700">{b.gradeLevel || '-'}</p>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">ข้อมูลผู้ติดต่อ</h2>
          <p className="text-xs text-slate-500">ชื่อ</p>
          <p className="text-sm text-slate-700">{b.contactName || '-'}</p>
          <p className="mt-2 text-xs text-slate-500">เบอร์โทร 1 / 2</p>
          <p className="text-sm text-slate-700">{b.contactPhone1 || '-'} {b.contactPhone2 ? ` / ${b.contactPhone2}` : ''}</p>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">จำนวนผู้เข้าชม</h2>
          <p className="text-sm text-slate-700">นักเรียน {b.studentsCount} / ครู {b.teachersCount}</p>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">บริการที่เลือก</h2>
          <div className="flex flex-wrap gap-1 text-xs">
            {b.serviceAQ ? <span className="rounded-full bg-slate-100 px-2 py-1">AQ</span> : null}
            {b.serviceSnow ? <span className="rounded-full bg-slate-100 px-2 py-1">Snow Buddy</span> : null}
            {b.serviceWaterPark ? <span className="rounded-full bg-slate-100 px-2 py-1">Bus</span> : null}
            {b.serviceDino ? <span className="rounded-full bg-slate-100 px-2 py-1">Dino</span> : null}
            {!b.serviceAQ && !b.serviceSnow && !b.serviceWaterPark && !b.serviceDino ? <span>-</span> : null}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">ข้อมูลการรับจอง</h2>
        <p className="text-xs text-slate-500">ผู้รับเรื่อง</p>
        <p className="text-sm text-slate-700">{b.receiverName || '-'}</p>
        <p className="mt-2 text-xs text-slate-500">วันที่รับจอง</p>
        <p className="text-sm text-slate-700">{b.bookingReceivedAt || '-'}</p>
        {b.visitDate ? (
          <>
            <p className="mt-2 text-xs text-slate-500">วัน/เวลาเข้าชม</p>
            <p className="text-sm text-slate-700">{b.visitDate} {b.visitTime ? `| ${b.visitTime}` : ''}</p>
          </>
        ) : null}
        {b.remarks ? (
          <>
            <p className="mt-2 text-xs text-slate-500">หมายเหตุ</p>
            <p className="text-sm text-slate-700">{b.remarks}</p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/evaluation/booking/${b.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[#4a7c59]/25 bg-white px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#f0f7f0]"
        >
          เปิดลิงก์แบบประเมิน
        </a>
        <Link
          to={`/features/booking/print/${b.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
        >
          พิมพ์หนังสือ
        </Link>
        <Link
          to={`/features/booking/booking/${b.id}/edit`}
          className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
        >
          แก้ไข
        </Link>
        <button
          type="button"
          onClick={() => navigate('/features/booking/list')}
          className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          กลับไปรายการจอง
        </button>
      </div>
    </div>
  );
}
