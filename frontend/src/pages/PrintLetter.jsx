import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBooking } from '../api';
import styles from './PrintLetter.module.css';

function toThaiDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const thai = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const day = d.getDate();
  const month = thai[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} พ.ศ.${year}`;
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

  const handlePrint = () => window.print();

  if (loading) return <div className={styles.wrap}><p>กำลังโหลด...</p></div>;
  if (error) return <div className={styles.wrap}><p className={styles.err}>{error}</p></div>;
  if (!booking) return null;

  const visitDateThai = booking.visitDate ? toThaiDate(booking.visitDate) : '';
  const letterDate = toThaiDate(new Date().toISOString().slice(0, 10));

  return (
    <div className={styles.wrap}>
      <div className={`${styles.noPrint} ${styles.toolbar}`}>
        <button type="button" onClick={handlePrint} className={styles.printBtn}>
          🖨️ พิมพ์เอกสาร
        </button>
      </div>

      <div className={styles.letter}>
        <div className={styles.letterHead}>
          <div className={styles.emblem} />
          <p className={styles.letterTitle}>หนังสือขอเข้าร่วมโครงการ</p>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.docId}>ที่ ศธ ๐๔๓๐๑.๐๘/๒๐๒๔</div>
          <div className={styles.docDate}>วันที่ {letterDate}</div>
        </div>

        <div className={styles.schoolBlock}>
          <p className={styles.schoolName}>{booking.schoolName || 'ชื่อโรงเรียน'}</p>
          <p className={styles.schoolAddr}>{booking.schoolName || 'ที่อยู่โรงเรียน'}</p>
        </div>

        <div className={styles.toBlock}>
          <p><strong>เรียน</strong> ผู้อำนวยการสวนสัตว์เชียงใหม่</p>
          <p><strong>เรื่อง</strong> ขอเข้าร่วมโครงการให้บริการความรู้ภายในสวนสัตว์เชียงใหม่ (Chiangmai Zoo Edzoocation)</p>
        </div>

        <div className={styles.body}>
          <p>
            ด้วย{booking.schoolName || 'โรงเรียน'} มีความประสงค์จะนำนักเรียนเข้าร่วมโครงการให้บริการความรู้
            ภายในสวนสัตว์เชียงใหม่ (Chiangmai Zoo Edzoocation) โดยมีรายละเอียดดังนี้
          </p>
          <p>
            จำนวนนักเรียน <strong>{booking.studentsCount ?? '—'} คน</strong> จำนวนครู/ผู้ปกครอง <strong>{booking.teachersCount ?? '—'} คน</strong>
            จะเดินทางไปศึกษาดูงาน ณ สวนสัตว์เชียงใหม่ ใน{' '}
            {visitDateThai ? <strong>วัน{visitDateThai}</strong> : 'วันที่ไปเยือน'}
            {booking.visitTime ? ` เวลา ${booking.visitTime}` : ''}
          </p>
          <p>จึงเรียนมาเพื่อโปรดทราบ และขอความอนุเคราะห์ดำเนินการต่อไป</p>
        </div>

        <div className={styles.contactBlock}>
          <p><strong>ผู้ประสานงาน:</strong> {booking.contactName || '—'}</p>
          <p><strong>เบอร์โทร:</strong> {[booking.contactPhone1, booking.contactPhone2].filter(Boolean).join(' / ') || '—'}</p>
        </div>

        <div className={styles.signBlock}>
          <p className={styles.signLabel}>ลงชื่อ _______________________ ผู้ลงนาม</p>
          <p className={styles.signRole}>(ผู้อำนวยการโรงเรียน)</p>
        </div>

        <div className={styles.footer}>
          <p>ฝ่ายบริหารงานกิจการนักเรียน</p>
          <p>โทร ๐๕๓-๑๑๒๑๘๐ อีเมล (ระบุตามโรงเรียน)</p>
        </div>
      </div>
    </div>
  );
}
