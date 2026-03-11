import { useEffect, useMemo, useState } from 'react';
import {
  createEvaluationForm,
  getEvaluationForm,
  getEvaluationFormSubmissions,
  getEvaluationForms,
  getBookings,
  updateEvaluationForm,
} from '../api';

const cardClass = 'rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';
const fieldClass = 'mt-1 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none transition focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20';
const labelClass = 'mt-3 block text-sm font-medium text-[#2d5a3a]';

function qrImageUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`;
}

function newQuestion() {
  return { prompt: '', type: 'rating', required: true };
}

function scoreLabel(score) {
  if (score >= 4.5) return 'ดีมาก';
  if (score >= 3.5) return 'ดี';
  if (score >= 2.5) return 'ปานกลาง';
  if (score >= 1.5) return 'ควรปรับปรุง';
  return 'ต้องปรับปรุงมาก';
}

function SectionTitle({ icon, children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#2d5a3a]">
      <span className="material-symbols-outlined app-icon text-[#4a7c59]" aria-hidden>{icon}</span>
      <span>{children}</span>
    </h2>
  );
}

export default function EvaluationStaff() {
  const [bookings, setBookings] = useState([]);
  const [bookingQuery, setBookingQuery] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [forms, setForms] = useState([]);
  const [editingFormId, setEditingFormId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    createdBy: '',
    isActive: true,
    questions: [newQuestion()],
  });

  const baseOrigin = useMemo(() => window.location.origin, []);
  const shareOrigin = useMemo(() => {
    const configured = import.meta.env.VITE_PUBLIC_BASE_URL;
    if (configured && String(configured).trim()) return String(configured).trim().replace(/\/+$/, '');
    return baseOrigin;
  }, [baseOrigin]);

  const isLocalhostShare = useMemo(() => {
    try {
      return ['localhost', '127.0.0.1'].includes(new URL(shareOrigin).hostname);
    } catch {
      return false;
    }
  }, [shareOrigin]);

  const loadForms = async () => {
    const rows = await getEvaluationForms();
    setForms(rows);
  };

  const loadBookings = async (q = '') => {
    const rows = await getBookings(q);
    setBookings(Array.isArray(rows) ? rows : []);
  };

  const resetForm = () => {
    setEditingFormId(null);
    setForm({
      title: '',
      description: '',
      createdBy: '',
      isActive: true,
      questions: [newQuestion()],
    });
  };

  useEffect(() => {
    loadForms()
      .catch((err) => setError(err.message || 'โหลดรายการแบบประเมินไม่สำเร็จ'))
      .finally(() => setLoading(false));
    loadBookings().catch(() => {});
  }, []);

  const updateQuestion = (index, next) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...next } : q)),
    }));
  };

  const addQuestion = () => setForm((prev) => ({ ...prev, questions: [...prev.questions, newQuestion()] }));

  const removeQuestion = (index) => {
    setForm((prev) => {
      if (prev.questions.length <= 1) return prev;
      return { ...prev, questions: prev.questions.filter((_, i) => i !== index) };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingFormId) {
        await updateEvaluationForm(editingFormId, form);
      } else {
        await createEvaluationForm(form);
      }
      resetForm();
      await loadForms();
    } catch (err) {
      setError(err.message || (editingFormId ? 'แก้ไขแบบประเมินไม่สำเร็จ' : 'สร้างแบบประเมินไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (formId) => {
    setError('');
    try {
      const data = await getEvaluationForm(formId);
      if (!data) {
        setError('ไม่พบแบบประเมินที่ต้องการแก้ไข');
        return;
      }
      setEditingFormId(data.id);
      setForm({
        title: data.title || '',
        description: data.description || '',
        createdBy: data.createdBy || '',
        isActive: data.isActive !== false,
        questions: (data.questions || []).length > 0
          ? data.questions.map((question) => ({
            prompt: question.prompt || '',
            type: question.type || 'rating',
            required: question.required !== false,
          }))
          : [newQuestion()],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'โหลดแบบประเมินเพื่อแก้ไขไม่สำเร็จ');
    }
  };

  const toggleActive = async (evaluationForm) => {
    setError('');
    try {
      await updateEvaluationForm(evaluationForm.id, { isActive: !evaluationForm.isActive });
      await loadForms();
    } catch (err) {
      setError(err.message || 'อัปเดตสถานะแบบประเมินไม่สำเร็จ');
    }
  };

  const openSubmissions = async (formId) => {
    setSelectedLoading(true);
    setSelectedData(null);
    setError('');
    try {
      const data = await getEvaluationFormSubmissions(formId);
      setSelectedData(data);
    } catch (err) {
      setError(err.message || 'โหลดผลประเมินไม่สำเร็จ');
    } finally {
      setSelectedLoading(false);
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError('คัดลอกลิงก์ไม่สำเร็จ');
    }
  };

  const selectedEvaluationLink = selectedBookingId
    ? `${shareOrigin}/evaluation/booking/${selectedBookingId}`
    : '';

  const openQrPreview = (url, title) => {
    setQrPreview({ url, title });
  };

  const closeQrPreview = () => {
    setQrPreview(null);
  };

  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">จัดการแบบประเมิน</h1>
      <p className="mb-5 text-slate-600">สร้างชุดคำถามเองได้ เลือกชนิดคำตอบเป็นคะแนน 1-5 หรือข้อความอิสระ</p>

      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      <section className={`${cardClass} mb-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#2d5a3a]">
            <span className="material-symbols-outlined app-icon text-[#4a7c59]" aria-hidden>{editingFormId ? 'edit_square' : 'post_add'}</span>
            <span>{editingFormId ? `แก้ไขแบบประเมิน #${editingFormId}` : 'สร้างแบบประเมินใหม่'}</span>
          </h2>
          {editingFormId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
            >
              <span className="material-symbols-outlined app-icon" aria-hidden>close</span>
              ยกเลิกการแก้ไข
            </button>
          ) : null}
        </div>
        <form onSubmit={handleCreate}>
          <label className={labelClass}>ชื่อแบบประเมิน *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className={fieldClass}
            required
            placeholder="เช่น แบบประเมินหลังทัศนศึกษา"
          />

          <label className={labelClass}>คำอธิบาย</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            className={fieldClass}
            rows={2}
          />

          <label className={labelClass}>ผู้สร้าง</label>
          <input
            value={form.createdBy}
            onChange={(e) => setForm((prev) => ({ ...prev, createdBy: e.target.value }))}
            className={fieldClass}
            placeholder="เช่น ฝ่ายการศึกษา"
          />

          <label className={labelClass}>คำถาม</label>
          <div className="mt-2 grid gap-2">
            {form.questions.map((question, index) => (
              <div key={`q-${index}`} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 text-sm font-semibold text-[#2d5a3a]">คำถามที่ {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    disabled={form.questions.length <= 1}
                    className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
                  >
                    ลบ
                  </button>
                </div>

                <textarea
                  value={question.prompt}
                  onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                  rows={2}
                  className={fieldClass}
                  required
                  placeholder="ระบุคำถาม"
                />

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(index, { type: e.target.value })}
                    className="rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm"
                  >
                    <option value="rating">คะแนน 1-5</option>
                    <option value="text">คำตอบข้อความ</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-[#d4e0d4] bg-white px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                    />
                    คำถามบังคับ
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-3 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
            >
              <span className="material-symbols-outlined app-icon" aria-hidden>add_circle</span>
              เพิ่มคำถาม
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a] disabled:opacity-60"
            >
              <span className="material-symbols-outlined app-icon" aria-hidden>{saving ? 'progress_activity' : 'save'}</span>
              {saving ? 'กำลังบันทึก...' : (editingFormId ? 'บันทึกการแก้ไข' : 'บันทึกแบบประเมิน')}
            </button>
          </div>
        </form>
      </section>

      <section className={`${cardClass} mb-4`}>
        <SectionTitle icon="qr_code_2">สร้างลิงก์แบบประเมิน</SectionTitle>
        {isLocalhostShare ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            ลิงก์ตอนนี้เป็น localhost ใช้ได้เฉพาะเครื่องนี้ ถ้าจะแชร์ให้คนอื่น ให้ตั้งค่า `VITE_PUBLIC_BASE_URL` เป็นโดเมนหรือ IP ที่เข้าถึงได้จริง
          </p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={bookingQuery}
            onChange={(e) => setBookingQuery(e.target.value)}
            placeholder="ค้นหาโรงเรียนหรือรหัสรายการจอง"
            className="rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => loadBookings(bookingQuery).catch((err) => setError(err.message || 'ค้นหารายการจองไม่สำเร็จ'))}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
          >
            <span className="material-symbols-outlined app-icon" aria-hidden>search</span>
            ค้นหา
          </button>
        </div>
        <select
          value={selectedBookingId}
          onChange={(e) => setSelectedBookingId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm"
        >
          <option value="">เลือกรายการจอง</option>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.id} - {b.schoolName || '-'} ({b.visitDate || '-'} {b.visitTime || ''})
            </option>
          ))}
        </select>
        {selectedEvaluationLink ? (
          <div className="mt-2 rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
            <p className="m-0 break-all text-xs text-slate-600">{selectedEvaluationLink}</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(selectedEvaluationLink)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
                  >
                    <span className="material-symbols-outlined app-icon" aria-hidden>content_copy</span>
                    คัดลอกลิงก์
                  </button>
                  <a
                    href={selectedEvaluationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4a7c59] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d5a3a]"
                  >
                    <span className="material-symbols-outlined app-icon" aria-hidden>open_in_new</span>
                    เปิดฟอร์ม
                  </a>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  ใช้ QR นี้ให้โรงเรียนหรือผู้ประเมินสแกนจากมือถือ เพื่อเปิดแบบประเมินรายการนี้ได้ทันที
                </p>
              </div>

              <div className="w-[116px] shrink-0 rounded-lg border border-[#d4e0d4] bg-white p-2 text-center">
                <button
                  type="button"
                  onClick={() => openQrPreview(selectedEvaluationLink, `แบบประเมินรายการ #${selectedBookingId}`)}
                  className="block w-full rounded"
                >
                  <img
                    src={qrImageUrl(selectedEvaluationLink)}
                    alt={`QR แบบประเมินรายการ ${selectedBookingId}`}
                    className="mx-auto h-[90px] w-[90px] rounded"
                  />
                </button>
                <p className="m-0 mt-1 text-[11px] text-slate-500">QR แบบประเมิน</p>
                <button
                  type="button"
                  onClick={() => openQrPreview(selectedEvaluationLink, `แบบประเมินรายการ #${selectedBookingId}`)}
                  className="mt-1 inline-flex items-center gap-1 rounded border border-[#4a7c59]/25 bg-white px-2 py-1 text-[11px] font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
                >
                  <span className="material-symbols-outlined app-icon" aria-hidden>fullscreen</span>
                  QR เต็มจอ
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className={`${cardClass} mb-4`}>
        <SectionTitle icon="list_alt">รายการแบบประเมิน</SectionTitle>
        {loading ? <p className="text-slate-500">กำลังโหลด...</p> : null}
        {!loading && forms.length === 0 ? <p className="text-slate-500">ยังไม่มีแบบประเมิน</p> : null}

        <div className="grid gap-3">
          {forms.map((evaluationForm) => {
            return (
              <article key={evaluationForm.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="m-0 text-lg font-semibold text-[#2d5a3a]">{evaluationForm.title}</h3>
                    <p className="m-0 mt-1 text-sm text-slate-600">{evaluationForm.description || 'ไม่มีคำอธิบาย'}</p>
                    <p className="m-0 mt-1 text-sm text-slate-600">
                      คำถาม: {evaluationForm.questionCount} | คำตอบ: {evaluationForm.submissionCount}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(evaluationForm.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
                    >
                      <span className="material-symbols-outlined app-icon" aria-hidden>edit</span>
                      แก้ไขแบบประเมิน
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(evaluationForm)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
                    >
                      <span className="material-symbols-outlined app-icon" aria-hidden>{evaluationForm.isActive ? 'toggle_off' : 'toggle_on'}</span>
                      {evaluationForm.isActive ? 'ปิดรับแบบฟอร์มนี้' : 'เปิดใช้งานแบบฟอร์มนี้'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSubmissions(evaluationForm.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#4a7c59] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d5a3a]"
                    >
                      <span className="material-symbols-outlined app-icon" aria-hidden>visibility</span>
                      ดูคำตอบ
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={cardClass}>
        <SectionTitle icon="forum">คำตอบที่เลือกดู</SectionTitle>
        {selectedLoading ? <p className="text-slate-500">กำลังโหลดคำตอบ...</p> : null}
        {!selectedLoading && !selectedData ? <p className="text-slate-500">กด “ดูคำตอบ” จากรายการด้านบน</p> : null}

        {selectedData ? (
          <>
            <p className="m-0 text-sm text-slate-600">
              แบบประเมิน: <strong className="text-[#2d5a3a]">{selectedData.form.title}</strong>
            </p>
            <p className="m-0 mb-3 text-sm text-slate-600">จำนวนคำตอบ: {selectedData.submissions.length}</p>

            {selectedData.submissions.length === 0 ? (
              <p className="text-slate-500">ยังไม่มีผู้ส่งแบบประเมิน</p>
            ) : (
              <div className="grid gap-3">
                {selectedData.submissions.map((submission) => (
                  <article key={submission.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="m-0 text-sm font-semibold text-[#2d5a3a]">{submission.booking?.schoolName || '-'}</p>
                        <p className="m-0 text-xs text-slate-500">
                          ผู้ประเมิน: {submission.respondentName || '-'} | ส่งเมื่อ: {new Date(submission.submittedAt).toLocaleString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="m-0 text-xs text-slate-500">คะแนนเฉลี่ย</p>
                        <p className="m-0 text-lg font-bold text-[#2d5a3a]">{Number(submission.averageScore || 0).toFixed(2)} / 5</p>
                        <p className="m-0 text-xs text-slate-600">{scoreLabel(Number(submission.averageScore || 0))}</p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-2">
                      {submission.answers.map((answer, index) => (
                        <div key={`${submission.id}-${answer.questionId}`}>
                          <p className="m-0 text-sm font-medium text-slate-700">{index + 1}. {answer.prompt}</p>
                          <p className="m-0 text-sm text-slate-600">
                            {answer.type === 'rating' ? `คะแนน: ${answer.rating ?? '-'}` : (answer.answer || '-')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>

      {qrPreview ? (
        <div className="fixed inset-0 z-[100] bg-black/80 p-4">
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-3">
            <p className="m-0 text-center text-sm font-semibold text-white">{qrPreview.title}</p>
            <div className="rounded-2xl bg-white p-4 shadow-2xl">
              <img
                src={qrImageUrl(qrPreview.url)}
                alt={qrPreview.title}
                className="h-[80vw] w-[80vw] max-h-[520px] max-w-[520px] rounded-lg"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => copyLink(qrPreview.url)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/50 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                <span className="material-symbols-outlined app-icon" aria-hidden>content_copy</span>
                คัดลอกลิงก์
              </button>
              <button
                type="button"
                onClick={closeQrPreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-slate-100"
              >
                <span className="material-symbols-outlined app-icon" aria-hidden>close</span>
                ปิด
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
