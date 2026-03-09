import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, deleteBooking } from '../api';
import styles from './BookingList.module.css';

const STUDENT_PRICE = 50;
const TEACHER_PRICE = 100;
const ADDONS = [
  { key: 'serviceAQ', studentPrice: 80, teacherPrice: 120 },
  { key: 'serviceSnow', studentPrice: 130, teacherPrice: 230 },
  { key: 'serviceDino', studentPrice: 50, teacherPrice: 70 },
  { key: 'serviceWaterPark', studentPrice: 10, teacherPrice: 25 },
];

const statusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ยกเลิก',
};

export default function BookingList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const formatCurrency = (value) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);

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
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการจองนี้ใช่หรือไม่?')) return;
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
    <div className={styles.page}>
      <h1 className={styles.title}>
        <span className={styles.titleIcon}>📚</span>
        รายการจอง
      </h1>

      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา ชื่อโรงเรียน, ผู้ติดต่อ, เบอร์โทร, หมายเหตุ..."
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchBtn}>ค้นหา</button>
      </form>

      {loading ? (
        <p className={styles.loading}>กำลังโหลด...</p>
      ) : list.length === 0 ? (
        <div className={styles.empty}>
          <p>ไม่พบรายการจอง</p>
          <Link to="/">ไปหน้าฟอร์มจอง</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {list.map((b) => (
            <article key={b.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.no}>#{b.id}</span>
                <span className={styles.status} data-status={b.status}>
                  {statusLabels[b.status] || b.status}
                </span>
              </div>
              <h3 className={styles.school}>{b.schoolName || '(ไม่ระบุโรงเรียน)'}</h3>
              <p className={styles.meta}>
                น.ร. {b.studentsCount} / ครู {b.teachersCount}
                {b.gradeLevel && ` · ${b.gradeLevel}`}
              </p>
              <p className={styles.meta}>ราคารวม {formatCurrency(calculateTotalPrice(b))}</p>
              <p className={styles.contact}>
                {b.contactName && `${b.contactName} · `}
                {b.contactPhone1 || '-'}
              </p>
              <div className={styles.services}>
                {b.serviceAQ && <span>AQ</span>}
                {b.serviceSnow && <span>Snow</span>}
                {b.serviceWaterPark && <span>สวนน้ำ</span>}
                {b.serviceDino && <span>Dino</span>}
                {!b.serviceAQ && !b.serviceSnow && !b.serviceWaterPark && !b.serviceDino && (
                  <span className={styles.noService}>—</span>
                )}
              </div>
              <div className={styles.actions}>
                <Link to={`/booking/${b.id}`} className={styles.btnDetail}>ดูรายละเอียด</Link>
                <Link to={`/booking/${b.id}/edit`} className={styles.btnEdit}>แก้ไข</Link>
                <button
                  type="button"
                  className={styles.btnDelete}
                  onClick={() => handleDelete(b.id)}
                  disabled={deleteId === b.id}
                >
                  {deleteId === b.id ? 'กำลังลบ...' : 'ลบ'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
