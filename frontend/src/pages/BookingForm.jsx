import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../api';

const STUDENT_PRICE = 50;
const TEACHER_PRICE = 100;
const ADDONS = [
  {
    key: 'serviceAQ',
    label: 'AQ (Chiangmai Zoo Aquarium)',
    studentPrice: 80,
    teacherPrice: 120,
  },
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
    label: 'รถรับส่งสวนสัตว์',
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

const cardClass = 'rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';
const fieldClass = 'mt-1 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none transition focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20';
const labelClass = 'mt-3 block text-sm font-medium text-[#2d5a3a]';

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
      navigate(`/features/booking/booking/${created.id}`);
    } catch (err) {
      setError(err.message || 'บันทึกการจองไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">สร้างรายการจอง</h1>
      <p className="mb-5 text-slate-600">กรอกข้อมูลโรงเรียน ผู้ติดต่อ จำนวนผู้เข้าชม และบริการที่ต้องการ</p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">ข้อมูลโรงเรียน</h2>
          <label className={labelClass}>ชื่อโรงเรียน / ที่อยู่ / หน่วยงาน *</label>
          <textarea
            value={form.schoolName}
            onChange={(e) => update('schoolName', e.target.value)}
            placeholder="ตัวอย่าง: โรงเรียนเชียงใหม่วิทยา อ.เมือง จ.เชียงใหม่"
            rows={2}
            required
            className={fieldClass}
          />

          <label className={labelClass}>ระดับชั้น</label>
          <input
            type="text"
            value={form.gradeLevel}
            onChange={(e) => update('gradeLevel', e.target.value)}
            placeholder="เช่น ป.1-ป.3"
            className={fieldClass}
          />
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">ผู้ประสานงาน</h2>
          <label className={labelClass}>ชื่อผู้ติดต่อ</label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => update('contactName', e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            className={fieldClass}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">เบอร์โทร 1</label>
              <input
                type="tel"
                value={form.contactPhone1}
                onChange={(e) => update('contactPhone1', e.target.value)}
                placeholder="081-2345678"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">เบอร์โทร 2</label>
              <input
                type="tel"
                value={form.contactPhone2}
                onChange={(e) => update('contactPhone2', e.target.value)}
                placeholder="082-3456789"
                className={fieldClass}
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">จำนวนผู้เข้าชม</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">นักเรียน</label>
              <input
                type="number"
                min="0"
                value={form.studentsCount}
                onChange={(e) => update('studentsCount', e.target.value)}
                placeholder="0"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">ครู/ผู้ปกครอง</label>
              <input
                type="number"
                min="0"
                value={form.teachersCount}
                onChange={(e) => update('teachersCount', e.target.value)}
                placeholder="0"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3 text-sm text-slate-700">
            <p className="font-semibold text-[#2d5a3a]">สรุปค่าใช้จ่าย</p>
            <p>นักเรียน: {studentsCount} x {formatCurrency(STUDENT_PRICE)} = {formatCurrency(studentCost)}</p>
            <p>ครู/ผู้ปกครอง: {teachersCount} x {formatCurrency(TEACHER_PRICE)} = {formatCurrency(teacherCost)}</p>
            <p>รวมจำนวนคน: {totalPeople}</p>
            <p>ค่าบริการพื้นฐาน: {formatCurrency(baseCost)}</p>
            {addonSummaries.map((addon) => (
              <p key={addon.key}>
                บริการเสริม {addon.label}: {formatCurrency(addon.addonTotalCost)}
              </p>
            ))}
            <p>รวมค่าบริการเสริม: {formatCurrency(addonTotalCost)}</p>
            <p className="text-base font-bold text-[#2d5a3a]">ยอดรวมทั้งหมด: {formatCurrency(totalCost)}</p>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">บริการที่ต้องการ</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ADDONS.map((addon) => (
              <label key={addon.key} className="flex items-center gap-2 rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[addon.key]}
                  onChange={(e) => update(addon.key, e.target.checked)}
                />
                <span>{addon.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">ข้อมูลการรับจอง</h2>
          <label className={labelClass}>ชื่อผู้รับเรื่อง</label>
          <input
            type="text"
            value={form.receiverName}
            onChange={(e) => update('receiverName', e.target.value)}
            placeholder="ชื่อเจ้าหน้าที่"
            className={fieldClass}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">วันที่รับจอง</label>
              <input
                type="date"
                value={form.bookingReceivedAt}
                onChange={(e) => update('bookingReceivedAt', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">วันที่เข้าชม</label>
              <input
                type="date"
                value={form.visitDate}
                onChange={(e) => update('visitDate', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <label className={labelClass}>เวลาเข้าชม</label>
          <input
            type="text"
            value={form.visitTime}
            onChange={(e) => update('visitTime', e.target.value)}
            placeholder="เช่น 08:00"
            className={fieldClass}
          />

          <label className={labelClass}>หมายเหตุ</label>
          <textarea
            value={form.remarks}
            onChange={(e) => update('remarks', e.target.value)}
            rows={2}
            className={fieldClass}
          />
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a] disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกรายการจอง'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/features/booking/list')}
            className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
          >
            ดูรายการจอง
          </button>
        </div>
      </form>
    </div>
  );
}
