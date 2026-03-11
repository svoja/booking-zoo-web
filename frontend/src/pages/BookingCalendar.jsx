import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../api';

const MAX_SCHOOLS_PER_DAY = 4;
const MAX_STUDENTS_PER_SCHOOL = 200;

const thaiMonths = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

function formatDateThai(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${thaiMonths[m - 1]} ${y}`;
}

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  return dateStr.slice(0, 7);
}

export default function BookingCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const withVisitDate = bookings.filter((b) => b.visitDate && getMonthKey(b.visitDate) === monthKey);
  const byDate = {};
  withVisitDate.forEach((b) => {
    const d = b.visitDate;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(b);
  });
  const sortedDates = Object.keys(byDate).sort();

  const yearOptions = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 2; y += 1) yearOptions.push(y);

  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">ปฏิทินการจอง</h1>
      <p className="mb-4 text-slate-600">
        เกณฑ์แนะนำ: ไม่เกิน {MAX_SCHOOLS_PER_DAY} โรงเรียนต่อวัน และไม่เกิน {MAX_STUDENTS_PER_SCHOOL} คนต่อโรงเรียน
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-sm font-medium text-[#2d5a3a]">
          เดือน
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="ml-2 rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm"
          >
            {thaiMonths.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-[#2d5a3a]">
          ปี
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="ml-2 rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-slate-500">กำลังโหลด...</p>
      ) : sortedDates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4e0d4] bg-white p-6 text-center text-slate-600">
          ไม่มีรายการจองในเดือน {thaiMonths[month - 1]} {year}
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedDates.map((dateStr) => {
            const list = byDate[dateStr];
            const overLimit = list.length > MAX_SCHOOLS_PER_DAY;
            return (
              <section key={dateStr} className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[#2d5a3a]">{formatDateThai(dateStr)}</h2>
                  <span className="text-sm text-slate-600">
                    {list.length} โรงเรียน
                    {overLimit ? <span className="ml-1 font-semibold text-rose-600">(เกิน {MAX_SCHOOLS_PER_DAY})</span> : null}
                  </span>
                </div>

                <ul className="divide-y divide-[#d4e0d4]">
                  {list.map((b) => {
                    const overStudents = b.studentsCount > MAX_STUDENTS_PER_SCHOOL;
                    return (
                      <li key={b.id} className="py-2">
                        <Link to={`/features/booking/booking/${b.id}`} className="font-semibold text-[#2d5a3a] hover:underline">
                          {b.schoolName || '(ไม่ระบุโรงเรียน)'}
                        </Link>
                        <p className="text-sm text-slate-600">นักเรียน {b.studentsCount} / ครู {b.teachersCount}</p>
                        {b.visitTime ? <p className="text-sm text-slate-600">เวลา {b.visitTime}</p> : null}
                        {overStudents ? <p className="text-xs font-medium text-rose-600">เกิน {MAX_STUDENTS_PER_SCHOOL} คนต่อโรงเรียน</p> : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
