import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../api';
import styles from './BookingCalendar.module.css';

const MAX_SCHOOLS_PER_DAY = 4;
const MAX_STUDENTS_PER_SCHOOL = 200;

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatDateThai(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
}

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  return dateStr.slice(0, 7); // YYYY-MM
}

function getDaysInMonth(year, month) {
  const last = new Date(year, month, 0);
  return last.getDate();
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
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 2; y++) yearOptions.push(y);
  const monthOptions = thaiMonths.map((name, i) => ({ value: i + 1, name }));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <span className={styles.titleIcon}>📅</span>
        รายการจองตามวัน
      </h1>
      <p className={styles.subtitle}>
        เดือนนี้มีโรงเรียนไหนมาบ้าง — ใน 1 วันมีได้ไม่เกิน {MAX_SCHOOLS_PER_DAY} โรงเรียน (ผู้พูดนำทาง {MAX_SCHOOLS_PER_DAY} คน) รับได้โรงเรียนละไม่เกิน {MAX_STUDENTS_PER_SCHOOL} คน
      </p>

      <div className={styles.controls}>
        <label>
          <span className={styles.labelText}>เดือน</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={styles.select}
          >
            {monthOptions.map(({ value, name }) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.labelText}>ปี</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={styles.select}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y + 543}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className={styles.loading}>กำลังโหลด...</p>
      ) : sortedDates.length === 0 ? (
        <div className={styles.empty}>
          <p>ไม่มีรายการจองในเดือน{thaiMonths[month - 1]} {year + 543}</p>
          <p className={styles.hint}>กรอก &quot;วันที่ไปเยือน&quot; ในฟอร์มจองหรือแก้ไขรายการจอง เพื่อให้แสดงในหน้านี้</p>
        </div>
      ) : (
        <div className={styles.days}>
          {sortedDates.map((dateStr) => {
            const list = byDate[dateStr];
            const overLimit = list.length > MAX_SCHOOLS_PER_DAY;
            return (
              <section key={dateStr} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <h2 className={styles.dayTitle}>{formatDateThai(dateStr)}</h2>
                  <span className={styles.schoolCount}>
                    {list.length} โรงเรียน
                    {overLimit && (
                      <span className={styles.warn}> (เกิน {MAX_SCHOOLS_PER_DAY} โรงเรียน/วัน)</span>
                    )}
                  </span>
                </div>
                <ul className={styles.schoolList}>
                  {list.map((b) => {
                    const overStudents = b.studentsCount > MAX_STUDENTS_PER_SCHOOL;
                    return (
                      <li key={b.id} className={styles.schoolItem}>
                        <Link to={`/booking/${b.id}`} className={styles.schoolLink}>
                          {b.schoolName || '(ไม่ระบุโรงเรียน)'}
                        </Link>
                        <span className={styles.counts}>
                          น.ร. {b.studentsCount} · ครู {b.teachersCount}
                        </span>
                        {overStudents && (
                          <span className={styles.note}>
                            (เกิน {MAX_STUDENTS_PER_SCHOOL} คน/โรงเรียน)
                          </span>
                        )}
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
