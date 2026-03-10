import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBooking } from '../api';

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
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

  if (loading) return <div className="pb-8 text-slate-500">Loading...</div>;

  if (error || !booking) {
    return (
      <div className="pb-8">
        <p className="mb-2 text-rose-600">{error || 'Booking not found'}</p>
        <Link to="/list" className="font-semibold text-[#2d5a3a] hover:underline">Back to list</Link>
      </div>
    );
  }

  const b = booking;

  return (
    <div className="grid gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#2d5a3a]">
          <span className="mr-2 text-slate-500">#{b.id}</span>
          {b.schoolName || '(Unknown school)'}
        </h1>
        <span className="rounded-full border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-3 py-1 text-xs font-semibold text-[#2d5a3a]">
          {statusLabels[b.status] || b.status}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">School</h2>
          <p className="text-sm text-slate-700">{b.schoolName || '-'}</p>
          <p className="mt-2 text-xs text-slate-500">Grade level</p>
          <p className="text-sm text-slate-700">{b.gradeLevel || '-'}</p>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">Contact</h2>
          <p className="text-xs text-slate-500">Name</p>
          <p className="text-sm text-slate-700">{b.contactName || '-'}</p>
          <p className="mt-2 text-xs text-slate-500">Phone 1 / 2</p>
          <p className="text-sm text-slate-700">{b.contactPhone1 || '-'} {b.contactPhone2 ? ` / ${b.contactPhone2}` : ''}</p>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">Participants</h2>
          <p className="text-sm text-slate-700">Students {b.studentsCount} · Teachers {b.teachersCount}</p>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">Services</h2>
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
        <h2 className="mb-2 text-base font-semibold text-[#2d5a3a]">Booking Meta</h2>
        <p className="text-xs text-slate-500">Receiver</p>
        <p className="text-sm text-slate-700">{b.receiverName || '-'}</p>
        <p className="mt-2 text-xs text-slate-500">Received date</p>
        <p className="text-sm text-slate-700">{b.bookingReceivedAt || '-'}</p>
        {b.visitDate ? (
          <>
            <p className="mt-2 text-xs text-slate-500">Visit date / time</p>
            <p className="text-sm text-slate-700">{b.visitDate} {b.visitTime ? `· ${b.visitTime}` : ''}</p>
          </>
        ) : null}
        {b.remarks ? (
          <>
            <p className="mt-2 text-xs text-slate-500">Remarks</p>
            <p className="text-sm text-slate-700">{b.remarks}</p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/print/${b.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
        >
          Print Letter
        </Link>
        <Link
          to={`/booking/${b.id}/edit`}
          className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => navigate('/list')}
          className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to list
        </button>
      </div>
    </div>
  );
}
