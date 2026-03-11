import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBookingEvaluationForm, submitBookingEvaluation } from '../api';

const cardClass = 'mx-auto w-full max-w-4xl rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';
const fieldClass = 'mt-1 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none transition focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20';
const labelClass = 'mt-3 block text-sm font-medium text-[#2d5a3a]';

export default function BookingEvaluationForm() {
  const { id } = useParams();
  const [formMeta, setFormMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payload, setPayload] = useState({
    respondentName: '',
    respondentRole: '',
    respondentPhone: '',
    answers: {},
  });

  useEffect(() => {
    getBookingEvaluationForm(id)
      .then((data) => {
        setFormMeta(data);
        const initialAnswers = Object.fromEntries((data.form?.questions || []).map((q) => [q.id, '']));
        setPayload({
          respondentName: data.existing?.respondentName || '',
          respondentRole: data.existing?.respondentRole || '',
          respondentPhone: data.existing?.respondentPhone || '',
          answers: { ...initialAnswers, ...(data.existing?.answers || {}) },
        });
      })
      .catch((err) => setError(err.message || 'โหลดแบบประเมินไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateAnswer = (questionId, value) => {
    setPayload((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formMeta?.form) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const answers = Object.fromEntries(
        (formMeta.form.questions || []).map((q) => [
          q.id,
          q.type === 'rating' ? Number(payload.answers[q.id]) || 0 : String(payload.answers[q.id] || ''),
        ])
      );

      await submitBookingEvaluation(id, {
        formId: formMeta.form.id,
        respondentName: payload.respondentName,
        respondentRole: payload.respondentRole,
        respondentPhone: payload.respondentPhone,
        answers,
      });

      setSuccess('ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น');
    } catch (err) {
      setError(err.message || 'ส่งแบบประเมินไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className={cardClass}>
          <p className="text-center text-slate-500">กำลังโหลดแบบประเมิน...</p>
        </div>
      </div>
    );
  }

  if (error && !formMeta) {
    return (
      <div className="min-h-screen p-4">
        <div className={cardClass}>
          <p className="text-center text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  const booking = formMeta?.booking || {};
  const evaluationForm = formMeta?.form || { questions: [] };

  return (
    <div className="min-h-screen p-4">
      <div className={cardClass}>
        <h1 className="mb-1 text-2xl font-bold text-[#2d5a3a]">{evaluationForm.title || 'แบบประเมินหลังเข้าชม'}</h1>
        <p className="mb-1 text-sm text-slate-600">โรงเรียน: {booking.schoolName || '-'}</p>
        <p className="mb-1 text-sm text-slate-600">
          วันเข้าชม: {booking.visitDate || '-'} {booking.visitTime ? `เวลา ${booking.visitTime}` : ''}
        </p>
        <p className="mb-4 text-sm text-slate-600">{evaluationForm.description || '-'}</p>

        {error ? <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

        <form onSubmit={handleSubmit}>
          <label className={labelClass}>ชื่อผู้ประเมิน *</label>
          <input
            value={payload.respondentName}
            onChange={(e) => setPayload((prev) => ({ ...prev, respondentName: e.target.value }))}
            className={fieldClass}
            required
            placeholder="เช่น ครูผู้รับผิดชอบ"
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">ตำแหน่ง/หน้าที่</label>
              <input
                value={payload.respondentRole}
                onChange={(e) => setPayload((prev) => ({ ...prev, respondentRole: e.target.value }))}
                className={fieldClass}
                placeholder="เช่น ครูประจำชั้น"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">เบอร์โทรติดต่อ</label>
              <input
                value={payload.respondentPhone}
                onChange={(e) => setPayload((prev) => ({ ...prev, respondentPhone: e.target.value }))}
                className={fieldClass}
                placeholder="08x-xxx-xxxx"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {(evaluationForm.questions || []).map((question, index) => (
              <div key={question.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                <label className="block text-sm font-medium text-[#2d5a3a]">
                  {index + 1}. {question.prompt} {question.required ? '*' : ''}
                </label>

                {question.type === 'rating' ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[5, 4, 3, 2, 1].map((score) => (
                      <label key={`${question.id}-${score}`} className="inline-flex items-center gap-1 rounded-lg border border-[#d4e0d4] bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={score}
                          checked={Number(payload.answers[question.id]) === score}
                          onChange={() => updateAnswer(question.id, score)}
                          required={question.required}
                        />
                        {score}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={payload.answers[question.id] || ''}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    rows={3}
                    className={fieldClass}
                    required={question.required}
                    placeholder="พิมพ์คำตอบของคุณ"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a] disabled:opacity-60"
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งแบบประเมิน'}
          </button>
        </form>
      </div>
    </div>
  );
}
