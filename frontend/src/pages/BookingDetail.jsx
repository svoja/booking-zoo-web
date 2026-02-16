import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBooking } from '../api';
import styles from './BookingDetail.module.css';

const statusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ยกเลิก',
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBooking(id)
      .then((data) => { if (!cancelled) setBooking(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className={styles.page}><p className={styles.loading}>กำลังโหลด...</p></div>;
  if (error || !booking) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error || 'ไม่พบรายการ'}</p>
        <Link to="/list">กลับไปรายการจอง</Link>
      </div>
    );
  }

  const b = booking;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.no}>#{b.id}</span>
          {b.schoolName || '(ไม่ระบุโรงเรียน)'}
        </h1>
        <span className={styles.status} data-status={b.status}>
          {statusLabels[b.status] || b.status}
        </span>
      </div>

      <div className={styles.card}>
        <h2>ข้อมูลโรงเรียน</h2>
        <p className={styles.value}>{b.schoolName || '—'}</p>
        <p className={styles.label}>ระดับชั้น</p>
        <p className={styles.value}>{b.gradeLevel || '—'}</p>
      </div>

      <div className={styles.card}>
        <h2>ผู้ประสานงาน</h2>
        <p className={styles.label}>ชื่อ</p>
        <p className={styles.value}>{b.contactName || '—'}</p>
        <p className={styles.label}>เบอร์โทร 1 / 2</p>
        <p className={styles.value}>{b.contactPhone1 || '—'} {b.contactPhone2 && ` / ${b.contactPhone2}`}</p>
      </div>

      <div className={styles.card}>
        <h2>จำนวนผู้เข้าร่วม</h2>
        <p className={styles.value}>นักเรียน {b.studentsCount} คน · ครู/ผู้ปกครอง {b.teachersCount} คน</p>
      </div>

      <div className={styles.card}>
        <h2>บริการ</h2>
        <div className={styles.services}>
          {b.serviceAQ && <span>AQ</span>}
          {b.serviceSnow && <span>Snow Buddy</span>}
          {b.serviceWaterPark && <span>สวนน้ำ</span>}
          {b.serviceDino && <span>Dino</span>}
          {!b.serviceAQ && !b.serviceSnow && !b.serviceWaterPark && !b.serviceDino && <span>—</span>}
        </div>
      </div>

      <div className={styles.card}>
        <h2>การรับจอง</h2>
        <p className={styles.label}>ผู้รับจอง</p>
        <p className={styles.value}>{b.receiverName || '—'}</p>
        <p className={styles.label}>วันที่รับจอง</p>
        <p className={styles.value}>{b.bookingReceivedAt || '—'}</p>
        {b.visitDate && (
          <>
            <p className={styles.label}>วันที่ไปเยือน / เวลา</p>
            <p className={styles.value}>{b.visitDate} {b.visitTime && ` · ${b.visitTime}`}</p>
          </>
        )}
        {b.remarks && (
          <>
            <p className={styles.label}>หมายเหตุ</p>
            <p className={styles.value}>{b.remarks}</p>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <Link
          to={`/print/${b.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btnPrint}
        >
          🖨️ พิมพ์เอกสาร (Template ลูกค้า)
        </Link>
        <Link to={`/booking/${b.id}/edit`} className={styles.btnEdit}>แก้ไข</Link>
        <button type="button" className={styles.btnBack} onClick={() => navigate('/list')}>
          กลับไปรายการจอง
        </button>
      </div>
    </div>
  );
}
