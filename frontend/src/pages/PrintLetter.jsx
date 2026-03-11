import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBooking } from '../api';

function toDateText(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
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

  if (loading) return <div className="p-6 text-slate-500">กำลังโหลด...</div>;
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
          พิมพ์
        </button>
      </div>

      <article className="rounded-xl border border-[#d4e0d4] bg-white p-8 leading-7 text-slate-800 print:rounded-none print:border-0 print:shadow-none">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#2d5a3a]">หนังสือขอความอนุเคราะห์เข้าร่วมกิจกรรม</h1>
          <p className="text-sm text-slate-500">เลขที่เอกสาร EDU-04301.08/2024</p>
        </header>

        <div className="mb-6 flex items-center justify-between text-sm">
          <span>เรียน ผู้อำนวยการสวนสัตว์เชียงใหม่</span>
          <span>วันที่ {letterDate}</span>
        </div>

        <div className="mb-6">
          <p><strong>โรงเรียน/หน่วยงาน:</strong> {booking.schoolName || '-'}</p>
          <p><strong>ผู้ติดต่อ:</strong> {booking.contactName || '-'}</p>
          <p><strong>เบอร์โทร:</strong> {[booking.contactPhone1, booking.contactPhone2].filter(Boolean).join(' / ') || '-'}</p>
        </div>

        <div className="space-y-4 text-sm">
          <p>
            ทางโรงเรียน/หน่วยงานมีความประสงค์นำนักเรียนเข้าร่วมกิจกรรมการเรียนรู้ ณ สวนสัตว์เชียงใหม่
            โดยมีรายละเอียดการจองดังนี้
          </p>
          <p>
            จำนวนนักเรียน <strong>{booking.studentsCount ?? '-'}</strong> คน,
            ครู/ผู้ปกครอง <strong>{booking.teachersCount ?? '-'}</strong> คน
          </p>
          <p>
            กำหนดวันเข้าชม <strong>{visitDate}</strong>
            {booking.visitTime ? <>, เวลา <strong>{booking.visitTime}</strong></> : null}
          </p>
          <p>
            บริการที่ต้องการ:
            {' '}
            {[
              booking.serviceAQ ? 'AQ' : null,
              booking.serviceSnow ? 'Snow Buddy' : null,
              booking.serviceWaterPark ? 'รถรับส่ง' : null,
              booking.serviceDino ? 'Dino Island' : null,
            ].filter(Boolean).join(', ') || '-'}
          </p>
          {booking.remarks ? <p><strong>หมายเหตุ:</strong> {booking.remarks}</p> : null}
          <p>จึงเรียนมาเพื่อโปรดพิจารณา</p>
        </div>

        <footer className="mt-16 text-right text-sm">
          <p>ลงชื่อ __________________________</p>
          <p>ผู้อำนวยการสถานศึกษา</p>
        </footer>
      </article>
    </div>
  );
}
