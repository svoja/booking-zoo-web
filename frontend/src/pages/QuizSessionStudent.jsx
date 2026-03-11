import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicQuizBySession, submitQuizBySession } from '../api';

const cardClass = 'mx-auto w-full max-w-xl rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';
const fieldClass = 'mt-1 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none transition focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20';
const labelClass = 'mt-3 block text-sm font-medium text-[#2d5a3a]';

export default function QuizSessionStudent() {
  const { token } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [answers, setAnswers] = useState({});
  const [student, setStudent] = useState({
    studentName: '',
    studentCode: '',
    classRoom: '',
  });

  useEffect(() => {
    getPublicQuizBySession(token)
      .then((data) => {
        setQuiz(data);
        setAnswers(Object.fromEntries((data.questions || []).map((q) => [q.id, ''])));
      })
      .catch((err) => setError(err.message || 'ไม่พบรอบควิส หรือรอบนี้ปิดรับคำตอบแล้ว'))
      .finally(() => setLoading(false));
  }, [token]);

  const updateAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quiz) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await submitQuizBySession(token, {
        ...student,
        answers: quiz.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] || '' })),
      });
      setSuccess('ส่งคำตอบเรียบร้อยแล้ว ขอบคุณค่ะ/ครับ');
      setAnswers(Object.fromEntries((quiz.questions || []).map((q) => [q.id, ''])));
      setStudent({ studentName: '', studentCode: '', classRoom: '' });
    } catch (err) {
      setError(err.message || 'ส่งคำตอบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen p-4"><div className={cardClass}><p className="text-center text-slate-500">กำลังโหลดควิส...</p></div></div>;
  }

  if (error && !quiz) {
    return <div className="min-h-screen p-4"><div className={cardClass}><p className="text-center text-rose-600">{error}</p></div></div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className={cardClass}>
        <h1 className="mb-1 text-2xl font-bold text-[#2d5a3a]">{quiz.title}</h1>
        <p className="mb-1 text-sm font-semibold text-[#2d5a3a]">รอบ: {quiz.session?.name || '-'}</p>
        <p className="mb-4 text-sm text-slate-600">{quiz.description || 'กรุณาตอบคำถามตามความเข้าใจของตนเอง'}</p>

        {error ? <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

        <form onSubmit={handleSubmit}>
          <label className={labelClass}>ชื่อ-นามสกุล *</label>
          <input
            value={student.studentName}
            onChange={(e) => setStudent((prev) => ({ ...prev, studentName: e.target.value }))}
            className={fieldClass}
            required
            placeholder="กรอกชื่อของนักเรียน"
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">รหัสนักเรียน</label>
              <input
                value={student.studentCode}
                onChange={(e) => setStudent((prev) => ({ ...prev, studentCode: e.target.value }))}
                className={fieldClass}
                placeholder="ถ้ามี"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2d5a3a]">ห้อง/ระดับชั้น</label>
              <input
                value={student.classRoom}
                onChange={(e) => setStudent((prev) => ({ ...prev, classRoom: e.target.value }))}
                className={fieldClass}
                placeholder="เช่น ป.6/1"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {(quiz.questions || []).map((question, index) => (
              <div key={question.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                <label className="block text-sm font-medium text-[#2d5a3a]">
                  {index + 1}. {question.prompt} {question.required ? '*' : ''}
                </label>
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  rows={3}
                  className={fieldClass}
                  required={question.required}
                  placeholder="พิมพ์คำตอบของคุณ"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a] disabled:opacity-60"
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
