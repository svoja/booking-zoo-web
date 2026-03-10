import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../api';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const SERVICE_LABELS = [
  { key: 'serviceAQ', label: 'AQ' },
  { key: 'serviceSnow', label: 'Snow Buddy' },
  { key: 'serviceWaterPark', label: 'Shuttle Bus' },
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

const panelClass = 'rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
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

      const school = (b.schoolName || '').trim() || 'Unknown school';
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

  if (loading) {
    return (
      <div className="pb-8">
        <p className="text-center text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-8">
        <p className="text-center text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">Booking Dashboard</h1>
      <p className="mb-5 text-slate-600">Overview of booking volume, demand, and upcoming visits</p>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className={panelClass}>
          <p className="mb-1 text-sm text-slate-600">Total bookings</p>
          <p className="text-3xl font-bold leading-tight text-[#2d5a3a]">{metrics.totalBookings}</p>
        </article>
        <article className={panelClass}>
          <p className="mb-1 text-sm text-slate-600">Total students</p>
          <p className="text-3xl font-bold leading-tight text-[#2d5a3a]">{metrics.totalStudents}</p>
        </article>
        <article className={panelClass}>
          <p className="mb-1 text-sm text-slate-600">Total teachers</p>
          <p className="text-3xl font-bold leading-tight text-[#2d5a3a]">{metrics.totalTeachers}</p>
        </article>
        <article className={panelClass}>
          <p className="mb-1 text-sm text-slate-600">Avg people / booking</p>
          <p className="text-3xl font-bold leading-tight text-[#2d5a3a]">{metrics.avgPeoplePerBooking}</p>
        </article>
      </section>

      <section className="mb-4 grid gap-3 lg:grid-cols-2">
        <article className={panelClass}>
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">Booking status</h2>
          <ul className="divide-y divide-[#d4e0d4]">
            {Object.entries(metrics.statusCounts).map(([key, value]) => (
              <li key={key} className="flex items-baseline justify-between py-2">
                <span>{STATUS_LABELS[key] || key}</span>
                <strong className="text-[#2d5a3a]">{value}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className={panelClass}>
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">Service popularity</h2>
          <ul className="divide-y divide-[#d4e0d4]">
            {SERVICE_LABELS.map((service) => (
              <li key={service.key} className="flex items-baseline justify-between py-2">
                <span>{service.label}</span>
                <strong className="text-[#2d5a3a]">{metrics.serviceCounts[service.key] || 0}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className={`${panelClass} mb-4`}>
        <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">Booking trend (last 6 months)</h2>
        <div className="grid h-56 grid-cols-6 items-end gap-3">
          {metrics.monthTrend.map((m) => (
            <div key={m.key} className="grid h-full grid-rows-[1fr_auto_auto] items-end gap-1.5">
              <div
                className="w-full rounded-t-lg rounded-b bg-gradient-to-b from-[#6b9b6b] to-[#2d5a3a]"
                style={{ height: `${Math.max((m.count / metrics.maxTrend) * 100, 4)}%` }}
                title={`${m.label}: ${m.count} entries`}
              />
              <p className="m-0 text-center text-sm font-semibold text-[#2d5a3a]">{m.count}</p>
              <p className="m-0 text-center text-xs text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 grid gap-3 lg:grid-cols-2">
        <article className={panelClass}>
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">Top schools</h2>
          {metrics.topSchools.length === 0 ? (
            <p className="m-0 text-slate-500">No data yet</p>
          ) : (
            <ul className="divide-y divide-[#d4e0d4]">
              {metrics.topSchools.map(([name, count]) => (
                <li key={name} className="flex items-baseline justify-between py-2">
                  <span>{name}</span>
                  <strong className="text-[#2d5a3a]">{count}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={panelClass}>
          <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">Most crowded visit dates</h2>
          {metrics.topVisitDates.length === 0 ? (
            <p className="m-0 text-slate-500">No visit dates yet</p>
          ) : (
            <ul className="divide-y divide-[#d4e0d4]">
              {metrics.topVisitDates.map(([date, count]) => (
                <li key={date} className="flex items-baseline justify-between py-2">
                  <span>{thaiDate(date)}</span>
                  <strong className="text-[#2d5a3a]">{count} schools</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className={panelClass}>
        <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">Upcoming visits (7 days)</h2>
        {metrics.upcomingVisits.length === 0 ? (
          <p className="m-0 text-slate-500">No upcoming visits in 7 days</p>
        ) : (
          <ul className="divide-y divide-[#d4e0d4]">
            {metrics.upcomingVisits.map((b) => (
              <li key={b.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/booking/${b.id}`} className="font-semibold text-[#2d5a3a] hover:underline">
                    {b.schoolName || 'Unknown school'}
                  </Link>
                  <p className="m-0 text-sm text-slate-600">
                    {thaiDate(b.visitDate)} {b.visitTime ? `· ${b.visitTime}` : ''} · Students {b.studentsCount} / Teachers {b.teachersCount}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-2.5 py-1 text-xs font-medium text-[#2d5a3a]">
                  {STATUS_LABELS[b.status] || b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
