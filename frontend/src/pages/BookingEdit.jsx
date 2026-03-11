import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking, updateBooking } from '../api';

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

const cardClass = 'rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';
const fieldClass = 'mt-1 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none transition focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20';
const labelClass = 'mt-3 block text-sm font-medium text-[#2d5a3a]';

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
      navigate(`/features/booking/booking/${id}`);
    } catch (err) {
      setError(err.message || 'อัปเดตรายการจองไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pb-8 text-slate-500">กำลังโหลด...</div>;
  if (error && !form) return <div className="pb-8 text-rose-600">{error}</div>;
  if (!form) return null;

  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">แก้ไขรายการจอง #{id}</h1>
      <p className="mb-5 text-slate-600">แก้ไขข้อมูลโรงเรียน ผู้ติดต่อ จำนวนผู้เข้าชม และสถานะ</p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">ข้อมูลโรงเรียน</h2>
          <label className={labelClass}>ชื่อโรงเรียน / ที่อยู่ / หน่วยงาน *</label>
          <textarea
            value={form.schoolName}
            onChange={(e) => update('schoolName', e.target.value)}
            rows={2}
            required
            className={fieldClass}
          />
          <label className={labelClass}>ระดับชั้น</label>
          <input
            type="text"
            value={form.gradeLevel}
            onChange={(e) => update('gradeLevel', e.target.value)}
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
            className={fieldClass}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">เบอร์โทร 1</label>
              <input type="tel" value={form.contactPhone1} onChange={(e) => update('contactPhone1', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">เบอร์โทร 2</label>
              <input type="tel" value={form.contactPhone2} onChange={(e) => update('contactPhone2', e.target.value)} className={fieldClass} />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">จำนวนผู้เข้าชม</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">นักเรียน</label>
              <input type="number" min="0" value={form.studentsCount} onChange={(e) => update('studentsCount', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">ครู/ผู้ปกครอง</label>
              <input type="number" min="0" value={form.teachersCount} onChange={(e) => update('teachersCount', e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3 text-sm text-slate-700">
            <p className="font-semibold text-[#2d5a3a]">สรุปค่าใช้จ่าย</p>
            <p>นักเรียน: {studentsCount} x {formatCurrency(STUDENT_PRICE)} = {formatCurrency(studentCost)}</p>
            <p>ครู/ผู้ปกครอง: {teachersCount} x {formatCurrency(TEACHER_PRICE)} = {formatCurrency(teacherCost)}</p>
            <p>รวมจำนวนคน: {totalPeople}</p>
            <p>ค่าบริการพื้นฐาน: {formatCurrency(baseCost)}</p>
            {addonSummaries.map((addon) => (
              <p key={addon.key}>บริการเสริม {addon.label}: {formatCurrency(addon.addonTotalCost)}</p>
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
                <input type="checkbox" checked={form[addon.key]} onChange={(e) => update(addon.key, e.target.checked)} />
                <span>{addon.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-[#2d5a3a]">ข้อมูลการรับจอง</h2>
          <label className={labelClass}>ชื่อผู้รับเรื่อง</label>
          <input type="text" value={form.receiverName} onChange={(e) => update('receiverName', e.target.value)} className={fieldClass} />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">วันที่รับจอง</label>
              <input type="date" value={form.bookingReceivedAt} onChange={(e) => update('bookingReceivedAt', e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">วันที่เข้าชม</label>
              <input type="date" value={form.visitDate} onChange={(e) => update('visitDate', e.target.value)} className={fieldClass} />
            </div>
          </div>

          <label className={labelClass}>เวลาเข้าชม</label>
          <input type="text" value={form.visitTime} onChange={(e) => update('visitTime', e.target.value)} className={fieldClass} />

          <label className={labelClass}>หมายเหตุ</label>
          <textarea value={form.remarks} onChange={(e) => update('remarks', e.target.value)} rows={2} className={fieldClass} />

          <label className={labelClass}>สถานะ</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)} className={fieldClass}>
            <option value="pending">รอดำเนินการ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ไม่อนุมัติ</option>
          </select>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a] disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/features/booking/booking/${id}`)}
            className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
