import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBooking } from '../api';

function toDateText(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export default function PrintLetter() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBooking(id)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (error) return <div className="p-6 text-rose-600">{error}</div>;
  if (!booking) return null;

  const visitDate = booking.visitDate ? toDateText(booking.visitDate) : '-';
  const letterDate = toDateText(new Date().toISOString().slice(0, 10));

  return (
    <div className="mx-auto w-full max-w-[840px] p-4 print:max-w-none print:p-0">
      <div className="mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
        >
          Print
        </button>
      </div>

      <article className="rounded-xl border border-[#d4e0d4] bg-white p-8 leading-7 text-slate-800 print:rounded-none print:border-0 print:shadow-none">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#2d5a3a]">Participation Request Letter</h1>
          <p className="text-sm text-slate-500">Document No. EDU-04301.08/2024</p>
        </header>

        <div className="mb-6 flex items-center justify-between text-sm">
          <span>To: Chiang Mai Zoo Director</span>
          <span>Date: {letterDate}</span>
        </div>

        <div className="mb-6">
          <p><strong>School:</strong> {booking.schoolName || '-'}</p>
          <p><strong>Contact:</strong> {booking.contactName || '-'}</p>
          <p><strong>Phone:</strong> {[booking.contactPhone1, booking.contactPhone2].filter(Boolean).join(' / ') || '-'}</p>
        </div>

        <div className="space-y-4 text-sm">
          <p>
            We would like to bring students to join educational activities at Chiang Mai Zoo.
            Please find the booking details below.
          </p>
          <p>
            Students: <strong>{booking.studentsCount ?? '-'}</strong> persons,
            Teachers/Guardians: <strong>{booking.teachersCount ?? '-'}</strong> persons.
          </p>
          <p>
            Planned visit date: <strong>{visitDate}</strong>
            {booking.visitTime ? <>, time <strong>{booking.visitTime}</strong></> : null}.
          </p>
          <p>
            Requested services:
            {' '}
            {[
              booking.serviceAQ ? 'AQ' : null,
              booking.serviceSnow ? 'Snow Buddy' : null,
              booking.serviceWaterPark ? 'Shuttle Bus' : null,
              booking.serviceDino ? 'Dino Island' : null,
            ].filter(Boolean).join(', ') || '-'}
          </p>
          {booking.remarks ? <p><strong>Remarks:</strong> {booking.remarks}</p> : null}
          <p>Thank you for your consideration.</p>
        </div>

        <footer className="mt-16 text-right text-sm">
          <p>Signature __________________________</p>
          <p>School Director</p>
        </footer>
      </article>
    </div>
  );
}
