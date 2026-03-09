import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../api';
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

const defaultValues = {
  schoolName: '',
  contactName: '',
  contactPhone1: '',
  contactPhone2: '',
  studentsCount: '',
  teachersCount: '',
  gradeLevel: '',
  serviceAQ: false,
  serviceSnow: false,
  serviceWaterPark: false,
  serviceDino: false,
  receiverName: '',
  bookingReceivedAt: new Date().toISOString().slice(0, 10),
  remarks: '',
  visitDate: '',
  visitTime: '',
  status: 'pending',
};

export default function BookingForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const studentsCount = Number(form.studentsCount) || 0;
  const teachersCount = Number(form.teachersCount) || 0;
  const totalPeople = studentsCount + teachersCount;
  const studentCost = studentsCount * STUDENT_PRICE;
  const teacherCost = teachersCount * TEACHER_PRICE;
  const baseCost = studentCost + teacherCost;
  const addonSummaries = ADDONS
    .filter((addon) => form[addon.key])
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

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        ...form,
        studentsCount: Number(form.studentsCount) || 0,
        teachersCount: Number(form.teachersCount) || 0,
      };
      const created = await createBooking(body);
      setForm(defaultValues);
      navigate(`/booking/${created.id}`);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <span className={styles.titleIcon}>📋</span>
        ฟอร์มจองเข้าชม
      </h1>
      <p className={styles.subtitle}>
        กรอกข้อมูลโรงเรียนและผู้ประสานงาน เพื่อจองเข้าร่วมโครงการให้บริการความรู้ สวนสัตว์เชียงใหม่
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.card}>
          <h2>ข้อมูลโรงเรียน</h2>
          <label>
            ชื่อ - ที่อยู่โรงเรียน / สังกัด <span className={styles.required}>*</span>
          </label>
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
            placeholder="ชื่อ-นามสกุล"
          />
          <div className={styles.row2}>
            <label>เบอร์โทร 1</label>
            <label>เบอร์โทร 2</label>
          </div>
          <div className={styles.row2}>
            <input
              type="tel"
              value={form.contactPhone1}
              onChange={(e) => update('contactPhone1', e.target.value)}
              placeholder="081-2345678"
            />
            <input
              type="tel"
              value={form.contactPhone2}
              onChange={(e) => update('contactPhone2', e.target.value)}
              placeholder="082-3456789"
            />
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
              placeholder="0"
            />
            <input
              type="number"
              min="0"
              value={form.teachersCount}
              onChange={(e) => update('teachersCount', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className={styles.summary}>
            <p className={styles.summaryTitle}>สรุปรายการ</p>
            <p>นักเรียน: {studentsCount} x {formatCurrency(STUDENT_PRICE)} = {formatCurrency(studentCost)}</p>
            <p>ครู/ผู้ปกครอง: {teachersCount} x {formatCurrency(TEACHER_PRICE)} = {formatCurrency(teacherCost)}</p>
            <p>รวมจำนวนคน: {totalPeople}</p>
            <p>ค่าบริการพื้นฐาน: {formatCurrency(baseCost)}</p>
            {addonSummaries.map((addon) => (
              <p key={addon.key}>
                บริการเสริม {addon.label}: ({studentsCount} x {formatCurrency(addon.studentPrice)}) + ({teachersCount} x {formatCurrency(addon.teacherPrice)}) = {formatCurrency(addon.addonTotalCost)}
              </p>
            ))}
            <p>รวมค่าบริการเสริม: {formatCurrency(addonTotalCost)}</p>
            <p className={styles.summaryTotal}>ราคารวมทั้งหมด: {formatCurrency(totalCost)}</p>
          </div>
        </section>

        <section className={styles.card}>
          <h2>บริการที่ต้องการ</h2>
          <div className={styles.checkboxes}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.serviceAQ}
                onChange={(e) => update('serviceAQ', e.target.checked)}
              />
              <span>AQ (Chiangmai Zoo Aquarium)</span>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.serviceSnow}
                onChange={(e) => update('serviceSnow', e.target.checked)}
              />
              <span>Snow Buddy Winter Land</span>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.serviceWaterPark}
                onChange={(e) => update('serviceWaterPark', e.target.checked)}
              />
              <span>รถบริการภายในสวนสัตว์</span>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.serviceDino}
                onChange={(e) => update('serviceDino', e.target.checked)}
              />
              <span>Dino Island</span>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h2>ข้อมูลการรับจอง</h2>
          <label>ผู้รับจอง (เจ้าหน้าที่)</label>
          <input
            type="text"
            value={form.receiverName}
            onChange={(e) => update('receiverName', e.target.value)}
            placeholder="ชื่อเจ้าหน้าที่ที่รับจอง"
          />
          <div className={styles.row2}>
            <div>
              <label>วันที่รับจอง</label>
              <input
                type="date"
                value={form.bookingReceivedAt}
                onChange={(e) => update('bookingReceivedAt', e.target.value)}
              />
            </div>
            <div>
              <label>วันที่ไปเยือน (สำหรับเอกสาร)</label>
              <input
                type="date"
                value={form.visitDate}
                onChange={(e) => update('visitDate', e.target.value)}
              />
            </div>
          </div>
          <label>เวลา (สำหรับเอกสาร)</label>
          <input
            type="text"
            value={form.visitTime}
            onChange={(e) => update('visitTime', e.target.value)}
            placeholder="เช่น 08.00 น. เป็นต้นไป"
          />
          <label>หมายเหตุ</label>
          <textarea
            value={form.remarks}
            onChange={(e) => update('remarks', e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม"
            rows={2}
          />
        </section>

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการจอง'}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/list')}
          >
            ดูรายการจอง
          </button>
        </div>
      </form>
    </div>
  );
}
