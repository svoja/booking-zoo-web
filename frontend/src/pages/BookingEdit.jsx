import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking, updateBooking } from '../api';
import styles from './BookingForm.module.css';

const STUDENT_PRICE = 50;
const TEACHER_PRICE = 100;
const ADDONS = [
  {
    key: 'serviceSnow',
    label: 'Snow Buddy Winter Land',
    studentPrice: 130,
    teacherPrice: 230,
  },
  {
    key: 'serviceDino',
    label: 'Dino Island',
    studentPrice: 50,
    teacherPrice: 70,
  },
  {
    key: 'serviceWaterPark',
    label: 'รถบริการภายในสวนสัตว์',
    studentPrice: 10,
    teacherPrice: 25,
  },
];

export default function BookingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const studentsCount = Number(form?.studentsCount) || 0;
  const teachersCount = Number(form?.teachersCount) || 0;
  const totalPeople = studentsCount + teachersCount;
  const studentCost = studentsCount * STUDENT_PRICE;
  const teacherCost = teachersCount * TEACHER_PRICE;
  const baseCost = studentCost + teacherCost;
  const addonSummaries = ADDONS
    .filter((addon) => form?.[addon.key])
    .map((addon) => {
      const addonStudentCost = studentsCount * addon.studentPrice;
      const addonTeacherCost = teachersCount * addon.teacherPrice;
      return {
        ...addon,
        addonStudentCost,
        addonTeacherCost,
        addonTotalCost: addonStudentCost + addonTeacherCost,
      };
    });
  const addonTotalCost = addonSummaries.reduce((sum, addon) => sum + addon.addonTotalCost, 0);
  const totalCost = baseCost + addonTotalCost;
  const formatCurrency = (value) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);

  useEffect(() => {
    getBooking(id)
      .then((b) => {
        setForm({
          schoolName: b.schoolName ?? '',
          contactName: b.contactName ?? '',
          contactPhone1: b.contactPhone1 ?? '',
          contactPhone2: b.contactPhone2 ?? '',
          studentsCount: b.studentsCount ?? '',
          teachersCount: b.teachersCount ?? '',
          gradeLevel: b.gradeLevel ?? '',
          serviceAQ: Boolean(b.serviceAQ),
          serviceSnow: Boolean(b.serviceSnow),
          serviceWaterPark: Boolean(b.serviceWaterPark),
          serviceDino: Boolean(b.serviceDino),
          receiverName: b.receiverName ?? '',
          bookingReceivedAt: (b.bookingReceivedAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
          remarks: b.remarks ?? '',
          visitDate: (b.visitDate || '').slice(0, 10),
          visitTime: b.visitTime ?? '',
          status: b.status ?? 'pending',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (name, value) => setForm((f) => (f ? { ...f, [name]: value } : f));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    setSaving(true);
    try {
      const body = {
        ...form,
        studentsCount: Number(form.studentsCount) || 0,
        teachersCount: Number(form.teachersCount) || 0,
      };
      await updateBooking(id, body);
      navigate(`/booking/${id}`);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.page}><p>กำลังโหลด...</p></div>;
  if (error && !form) return <div className={styles.page}><p className={styles.error}>{error}</p></div>;
  if (!form) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <span className={styles.titleIcon}>✏️</span>
        แก้ไขการจอง #{id}
      </h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.card}>
          <h2>ข้อมูลโรงเรียน</h2>
          <label>ชื่อ - ที่อยู่โรงเรียน / สังกัด <span className={styles.required}>*</span></label>
          <textarea
            value={form.schoolName}
            onChange={(e) => update('schoolName', e.target.value)}
            placeholder="เช่น โรงเรียนตัวอย่าง อ.เมือง จ.เชียงใหม่"
            rows={2}
            required
          />
          <label>ระดับชั้น</label>
          <input
            type="text"
            value={form.gradeLevel}
            onChange={(e) => update('gradeLevel', e.target.value)}
            placeholder="เช่น ป.1-ป.3, อนุบาล, ม.6"
          />
        </section>

        <section className={styles.card}>
          <h2>ผู้ประสานงาน (ขอไว้ 2 เบอร์)</h2>
          <label>ชื่อผู้ประสานงาน</label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
          <div className={styles.row2}>
            <label>เบอร์โทร 1</label>
            <label>เบอร์โทร 2</label>
          </div>
          <div className={styles.row2}>
            <input type="tel" value={form.contactPhone1} onChange={(e) => update('contactPhone1', e.target.value)} />
            <input type="tel" value={form.contactPhone2} onChange={(e) => update('contactPhone2', e.target.value)} />
          </div>
        </section>

        <section className={styles.card}>
          <h2>จำนวนผู้เข้าร่วม</h2>
          <div className={styles.row2}>
            <label>จำนวนนักเรียน</label>
            <label>จำนวนครู / ผู้ปกครอง</label>
          </div>
          <div className={styles.row2}>
            <input
              type="number"
              min="0"
              value={form.studentsCount}
              onChange={(e) => update('studentsCount', e.target.value)}
            />
            <input
              type="number"
              min="0"
              value={form.teachersCount}
              onChange={(e) => update('teachersCount', e.target.value)}
            />
          </div>
          <div className={styles.summary}>
            <p className={styles.summaryTitle}>Summary</p>
            <p>Students: {studentsCount} x {formatCurrency(STUDENT_PRICE)} = {formatCurrency(studentCost)}</p>
            <p>Teachers/Guardians: {teachersCount} x {formatCurrency(TEACHER_PRICE)} = {formatCurrency(teacherCost)}</p>
            <p>Total People: {totalPeople}</p>
            <p>Base Cost: {formatCurrency(baseCost)}</p>
            {addonSummaries.map((addon) => (
              <p key={addon.key}>
                Add-on {addon.label}: ({studentsCount} x {formatCurrency(addon.studentPrice)}) + ({teachersCount} x {formatCurrency(addon.teacherPrice)}) = {formatCurrency(addon.addonTotalCost)}
              </p>
            ))}
            <p>Add-on Total: {formatCurrency(addonTotalCost)}</p>
            <p className={styles.summaryTotal}>Total Cost: {formatCurrency(totalCost)}</p>
          </div>
        </section>

        <section className={styles.card}>
          <h2>บริการที่ต้องการ</h2>
          <div className={styles.checkboxes}>
            <label className={styles.check}>
              <input type="checkbox" checked={form.serviceAQ} onChange={(e) => update('serviceAQ', e.target.checked)} />
              <span>AQ (Chiangmai Zoo Aquarium)</span>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={form.serviceSnow} onChange={(e) => update('serviceSnow', e.target.checked)} />
              <span>Snow Buddy Winter Land</span>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={form.serviceWaterPark} onChange={(e) => update('serviceWaterPark', e.target.checked)} />
              <span>รถบริการภายในสวนสัตว์</span>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={form.serviceDino} onChange={(e) => update('serviceDino', e.target.checked)} />
              <span>Dino Island</span>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h2>ข้อมูลการรับจอง</h2>
          <label>ผู้รับจอง (เจ้าหน้าที่)</label>
          <input type="text" value={form.receiverName} onChange={(e) => update('receiverName', e.target.value)} />
          <label>วันที่รับจอง</label>
          <input type="date" value={form.bookingReceivedAt} onChange={(e) => update('bookingReceivedAt', e.target.value)} />
          <label>วันที่ไปเยือน (สำหรับเอกสาร)</label>
          <input type="date" value={form.visitDate} onChange={(e) => update('visitDate', e.target.value)} />
          <label>เวลา (สำหรับเอกสาร)</label>
          <input type="text" value={form.visitTime} onChange={(e) => update('visitTime', e.target.value)} placeholder="เช่น 08.00 น. เป็นต้นไป" />
          <label>หมายเหตุ</label>
          <textarea value={form.remarks} onChange={(e) => update('remarks', e.target.value)} rows={2} />
          <label>สถานะ</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="pending">รอดำเนินการ</option>
            <option value="approved">อนุมัติ</option>
            <option value="rejected">ยกเลิก</option>
          </select>
        </section>

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => navigate(`/booking/${id}`)}>
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
