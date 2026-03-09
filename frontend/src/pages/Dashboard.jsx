import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../api';
import styles from './Dashboard.module.css';

const STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ยกเลิก',
};

const SERVICE_LABELS = [
  { key: 'serviceAQ', label: 'AQ' },
  { key: 'serviceSnow', label: 'Snow Buddy' },
  { key: 'serviceWaterPark', label: 'รถบริการ' },
  { key: 'serviceDino', label: 'Dino Island' },
];

function safeDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function thaiDate(dateStr) {
  const date = safeDate(dateStr);
  if (!date) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('th-TH', { month: 'short', year: '2-digit' }).format(date);
}

function getLastMonths(count) {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return months;
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch((err) => setError(err.message || 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    const serviceCounts = Object.fromEntries(SERVICE_LABELS.map((s) => [s.key, 0]));
    const schoolCounts = {};
    const visitsByDate = {};

    let totalStudents = 0;
    let totalTeachers = 0;

    bookings.forEach((b) => {
      if (statusCounts[b.status] !== undefined) statusCounts[b.status] += 1;

      totalStudents += Number(b.studentsCount) || 0;
      totalTeachers += Number(b.teachersCount) || 0;

      SERVICE_LABELS.forEach((service) => {
        if (b[service.key]) serviceCounts[service.key] += 1;
      });

      const school = (b.schoolName || '').trim() || 'ไม่ระบุโรงเรียน';
      schoolCounts[school] = (schoolCounts[school] || 0) + 1;

      if (b.visitDate) {
        visitsByDate[b.visitDate] = (visitsByDate[b.visitDate] || 0) + 1;
      }
    });

    const totalPeople = totalStudents + totalTeachers;
    const avgPeoplePerBooking = totalBookings ? Math.round(totalPeople / totalBookings) : 0;

    const topSchools = Object.entries(schoolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topVisitDates = Object.entries(visitsByDate)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);

    const upcomingVisits = bookings
      .filter((b) => {
        const d = safeDate(b.visitDate);
        return d && d >= today && d <= next7Days;
      })
      .sort((a, b) => (a.visitDate || '').localeCompare(b.visitDate || ''))
      .slice(0, 8);

    const months = getLastMonths(6);
    const countsByMonth = Object.fromEntries(months.map((m) => [monthKey(m), 0]));
    bookings.forEach((b) => {
      const source = safeDate(b.bookingReceivedAt) || safeDate((b.createdAt || '').slice(0, 10));
      if (!source) return;
      const key = monthKey(source);
      if (countsByMonth[key] !== undefined) countsByMonth[key] += 1;
    });

    const monthTrend = months.map((m) => {
      const key = monthKey(m);
      return {
        key,
        label: monthLabel(key),
        count: countsByMonth[key] || 0,
      };
    });

    const maxTrend = Math.max(...monthTrend.map((m) => m.count), 1);

    return {
      totalBookings,
      totalStudents,
      totalTeachers,
      totalPeople,
      avgPeoplePerBooking,
      statusCounts,
      serviceCounts,
      topSchools,
      topVisitDates,
      upcomingVisits,
      monthTrend,
      maxTrend,
    };
  }, [bookings]);

  if (loading) return <div className={styles.page}><p className={styles.center}>กำลังโหลดข้อมูลแดชบอร์ด...</p></div>;
  if (error) return <div className={styles.page}><p className={styles.center}>{error}</p></div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>แดชบอร์ดภาพรวมการจอง</h1>
      <p className={styles.subtitle}>สรุปข้อมูลการจองทั้งหมด เพื่อดูแนวโน้มและภาระงานรายวัน</p>

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>รายการจองทั้งหมด</p>
          <p className={styles.kpiValue}>{metrics.totalBookings}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>จำนวนนักเรียนรวม</p>
          <p className={styles.kpiValue}>{metrics.totalStudents}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>จำนวนครู/ผู้ปกครองรวม</p>
          <p className={styles.kpiValue}>{metrics.totalTeachers}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>เฉลี่ยคนต่อการจอง</p>
          <p className={styles.kpiValue}>{metrics.avgPeoplePerBooking}</p>
        </article>
      </section>

      <section className={styles.grid2}>
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>สถานะการจอง</h2>
          <ul className={styles.list}>
            {Object.entries(metrics.statusCounts).map(([key, value]) => (
              <li key={key} className={styles.row}>
                <span>{STATUS_LABELS[key]}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>ความนิยมบริการเสริม</h2>
          <ul className={styles.list}>
            {SERVICE_LABELS.map((service) => (
              <li key={service.key} className={styles.row}>
                <span>{service.label}</span>
                <strong>{metrics.serviceCounts[service.key] || 0}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>แนวโน้มจำนวนจอง (ย้อนหลัง 6 เดือน)</h2>
        <div className={styles.trendGrid}>
          {metrics.monthTrend.map((m) => (
            <div key={m.key} className={styles.trendItem}>
              <div
                className={styles.trendBar}
                style={{ height: `${Math.max((m.count / metrics.maxTrend) * 100, 4)}%` }}
                title={`${m.label}: ${m.count} รายการ`}
              />
              <p className={styles.trendCount}>{m.count}</p>
              <p className={styles.trendLabel}>{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.grid2}>
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>โรงเรียนที่จองบ่อยสุด</h2>
          {metrics.topSchools.length === 0 ? (
            <p className={styles.empty}>ยังไม่มีข้อมูล</p>
          ) : (
            <ul className={styles.list}>
              {metrics.topSchools.map(([name, count]) => (
                <li key={name} className={styles.row}>
                  <span>{name}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>วันที่มีการจองหนาแน่น</h2>
          {metrics.topVisitDates.length === 0 ? (
            <p className={styles.empty}>ยังไม่มีวันไปเยือน</p>
          ) : (
            <ul className={styles.list}>
              {metrics.topVisitDates.map(([date, count]) => (
                <li key={date} className={styles.row}>
                  <span>{thaiDate(date)}</span>
                  <strong>{count} โรงเรียน</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>นัดหมาย 7 วันข้างหน้า</h2>
        {metrics.upcomingVisits.length === 0 ? (
          <p className={styles.empty}>ไม่มีนัดหมายใน 7 วันข้างหน้า</p>
        ) : (
          <ul className={styles.upcomingList}>
            {metrics.upcomingVisits.map((b) => (
              <li key={b.id} className={styles.upcomingItem}>
                <div>
                  <Link to={`/booking/${b.id}`} className={styles.bookingLink}>
                    {b.schoolName || 'ไม่ระบุโรงเรียน'}
                  </Link>
                  <p className={styles.upcomingMeta}>
                    {thaiDate(b.visitDate)} {b.visitTime ? `· ${b.visitTime}` : ''} · น.ร. {b.studentsCount} / ครู {b.teachersCount}
                  </p>
                </div>
                <span className={styles.badge}>{STATUS_LABELS[b.status] || b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
