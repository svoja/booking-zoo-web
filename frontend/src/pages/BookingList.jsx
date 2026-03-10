import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, deleteBooking } from '../api';

const STUDENT_PRICE = 50;
const TEACHER_PRICE = 100;
const ADDONS = [
  { key: 'serviceAQ', studentPrice: 80, teacherPrice: 120 },
  { key: 'serviceSnow', studentPrice: 130, teacherPrice: 230 },
  { key: 'serviceDino', studentPrice: 50, teacherPrice: 70 },
  { key: 'serviceWaterPark', studentPrice: 10, teacherPrice: 25 },
];

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function getDateValue(value, fallback) {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? fallback : time;
}

export default function BookingList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('bookingDateDesc');
  const [deleteId, setDeleteId] = useState(null);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(date);
  };

  const calculateTotalPrice = (booking) => {
    const students = Number(booking.studentsCount) || 0;
    const teachers = Number(booking.teachersCount) || 0;
    const baseCost = students * STUDENT_PRICE + teachers * TEACHER_PRICE;
    const addonCost = ADDONS.reduce((sum, addon) => {
      if (!booking[addon.key]) return sum;
      return sum + students * addon.studentPrice + teachers * addon.teacherPrice;
    }, 0);
    return baseCost + addonCost;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBookings(search);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedList = [...list].sort((a, b) => {
    if (sortBy === 'bookingDateAsc') {
      return (
        getDateValue(a.bookingReceivedAt, Number.POSITIVE_INFINITY)
        - getDateValue(b.bookingReceivedAt, Number.POSITIVE_INFINITY)
      );
    }

    return (
      getDateValue(b.bookingReceivedAt, Number.NEGATIVE_INFINITY)
      - getDateValue(a.bookingReceivedAt, Number.NEGATIVE_INFINITY)
    );
  });

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    setDeleteId(id);
    try {
      await deleteBooking(id);
      setList((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="pb-8">
      <h1 className="mb-4 text-3xl font-bold text-[#2d5a3a]">Booking List</h1>

      <form onSubmit={handleSearch} className="mb-4 grid gap-2 rounded-xl border border-[#d4e0d4] bg-white p-3 shadow-[0_2px_12px_rgba(74,124,89,0.08)] sm:grid-cols-[1fr_auto_auto]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search school, contact, phone, notes"
          className="rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20"
        >
          <option value="bookingDateDesc">Received date: newest first</option>
          <option value="bookingDateAsc">Received date: oldest first</option>
        </select>
        <button type="submit" className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4e0d4] bg-white p-6 text-center text-slate-600">
          <p className="mb-2">No bookings found</p>
          <Link to="/" className="font-semibold text-[#2d5a3a] hover:underline">Create booking</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedList.map((b) => (
            <article key={b.id} className="rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">#{b.id}</span>
                <span className="rounded-full border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-2.5 py-1 text-xs font-medium text-[#2d5a3a]">
                  {statusLabels[b.status] || b.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-[#2d5a3a]">{b.schoolName || '(Unknown school)'}</h3>
              <p className="text-sm text-slate-600">
                Students {b.studentsCount} / Teachers {b.teachersCount}
                {b.gradeLevel ? ` · ${b.gradeLevel}` : ''}
              </p>
              <p className="text-sm text-slate-600">Received {formatDate(b.bookingReceivedAt)}</p>
              <p className="text-sm text-slate-600">Total {formatCurrency(calculateTotalPrice(b))}</p>
              <p className="mb-2 text-sm text-slate-600">
                {b.contactName ? `${b.contactName} · ` : ''}
                {b.contactPhone1 || '-'}
              </p>

              <div className="mb-3 flex flex-wrap gap-1 text-xs">
                {b.serviceAQ ? <span className="rounded-full bg-slate-100 px-2 py-1">AQ</span> : null}
                {b.serviceSnow ? <span className="rounded-full bg-slate-100 px-2 py-1">Snow</span> : null}
                {b.serviceWaterPark ? <span className="rounded-full bg-slate-100 px-2 py-1">Bus</span> : null}
                {b.serviceDino ? <span className="rounded-full bg-slate-100 px-2 py-1">Dino</span> : null}
                {!b.serviceAQ && !b.serviceSnow && !b.serviceWaterPark && !b.serviceDino ? <span className="text-slate-400">-</span> : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/booking/${b.id}`} className="rounded-lg bg-[#4a7c59] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d5a3a]">
                  Detail
                </Link>
                <Link to={`/booking/${b.id}/edit`} className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  disabled={deleteId === b.id}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  {deleteId === b.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
