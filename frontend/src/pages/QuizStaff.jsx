import { useEffect, useMemo, useState } from 'react';
import {
  createQuiz,
  createQuizSession,
  getQuizSessionSubmissions,
  getQuizSessions,
  getQuizSubmissions,
  getQuizzes,
  updateQuiz,
} from '../api';

const cardClass = 'rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';
const fieldClass = 'mt-1 w-full rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm outline-none transition focus:border-[#4a7c59] focus:ring-2 focus:ring-[#4a7c59]/20';
const labelClass = 'mt-3 block text-sm font-medium text-[#2d5a3a]';

function newQuestion() {
  return { prompt: '', required: true };
}

function qrImageUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`;
}

export default function QuizStaff() {
  const [quizzes, setQuizzes] = useState([]);
  const [sessionsByQuiz, setSessionsByQuiz] = useState({});
  const [sessionNameByQuiz, setSessionNameByQuiz] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
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

  const loadSessions = async (quizId) => {
    const rows = await getQuizSessions(quizId);
    setSessionsByQuiz((prev) => ({ ...prev, [quizId]: rows }));
  };

  const loadQuizzes = async () => {
    const rows = await getQuizzes();
    setQuizzes(rows);
    await Promise.all(rows.map((quiz) => loadSessions(quiz.id)));
  };

  useEffect(() => {
    loadQuizzes()
      .catch((err) => setError(err.message || 'โหลดรายการ Quiz ไม่สำเร็จ'))
      .finally(() => setLoading(false));
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

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createQuiz(form);
      setForm({ title: '', description: '', createdBy: '', isActive: true, questions: [newQuestion()] });
      await loadQuizzes();
    } catch (err) {
      setError(err.message || 'สร้าง Quiz ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async (quizId) => {
    setError('');
    try {
      await createQuizSession(quizId, { sessionName: sessionNameByQuiz[quizId] || '' });
      setSessionNameByQuiz((prev) => ({ ...prev, [quizId]: '' }));
      await Promise.all([loadQuizzes(), loadSessions(quizId)]);
    } catch (err) {
      setError(err.message || 'สร้างรอบควิสไม่สำเร็จ');
    }
  };

  const toggleActive = async (quiz) => {
    setError('');
    try {
      await updateQuiz(quiz.id, { isActive: !quiz.isActive });
      await loadQuizzes();
    } catch (err) {
      setError(err.message || 'อัปเดตสถานะ Quiz ไม่สำเร็จ');
    }
  };

  const openAllResults = async (quizId) => {
    setSubmissionError('');
    setSelectedLoading(true);
    try {
      const data = await getQuizSubmissions(quizId);
      setSelectedData({ ...data, mode: 'all' });
    } catch (err) {
      setSubmissionError(err.message || 'โหลดผลคำตอบไม่สำเร็จ');
      setSelectedData(null);
    } finally {
      setSelectedLoading(false);
    }
  };

  const openSessionResults = async (quizId, sessionId) => {
    setSubmissionError('');
    setSelectedLoading(true);
    try {
      const data = await getQuizSessionSubmissions(quizId, sessionId);
      setSelectedData({ ...data, mode: 'session' });
    } catch (err) {
      setSubmissionError(err.message || 'โหลดผลคำตอบรายรอบไม่สำเร็จ');
      setSelectedData(null);
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

  const openQrPreview = (url, title) => {
    setQrPreview({ url, title });
  };

  const closeQrPreview = () => {
    setQrPreview(null);
  };

  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">Quiz สำหรับเจ้าหน้าที่</h1>
      <p className="mb-5 text-slate-600">สร้างควิสเดียว แล้วเปิดหลายรอบได้ แต่ละรอบมี QR/LINK ต่างกัน และเก็บคำตอบแยกรอบ</p>

      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      <section className={`${cardClass} mb-4`}>
        <h2 className="text-base font-semibold text-[#2d5a3a]">สร้าง Quiz ใหม่</h2>
        <form onSubmit={handleCreateQuiz}>
          <label className={labelClass}>ชื่อ Quiz *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className={fieldClass}
            required
            placeholder="เช่น แบบทดสอบหลังเข้าชมสวนสัตว์"
          />

          <label className={labelClass}>รายละเอียด</label>
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
          />

          <label className={labelClass}>คำถาม (ปลายเปิด)</label>
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
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                  />
                  คำถามบังคับ
                </label>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={addQuestion} className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-3 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20">+ เพิ่มคำถาม</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a] disabled:opacity-60">
              {saving ? 'กำลังบันทึก...' : 'บันทึก Quiz'}
            </button>
          </div>
        </form>
      </section>

      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">รายการ Quiz และรอบควิส</h2>
        {isLocalhostShare ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            ลิงก์แชร์ตอนนี้เป็น localhost ใช้ได้เฉพาะเครื่องนี้ ถ้าจะแชร์ให้คนอื่น ให้ตั้งค่า `VITE_PUBLIC_BASE_URL` เป็นโดเมน/IP จริง
          </p>
        ) : null}
        {loading ? <p className="text-slate-500">กำลังโหลด...</p> : null}
        {!loading && quizzes.length === 0 ? <p className="text-slate-500">ยังไม่มี Quiz</p> : null}

        <div className="grid gap-4">
          {quizzes.map((quiz) => {
            const allResultsUrl = `${shareOrigin}/quiz/${quiz.id}/results`;
            const sessions = sessionsByQuiz[quiz.id] || [];

            return (
              <article key={quiz.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="m-0 text-lg font-semibold text-[#2d5a3a]">{quiz.title}</h3>
                    <p className="m-0 mt-1 text-sm text-slate-600">{quiz.description || 'ไม่มีรายละเอียด'}</p>
                    <p className="m-0 mt-1 text-sm text-slate-600">
                      คำถาม: {quiz.questionCount} | คำตอบรวม: {quiz.submissionCount} | จำนวนรอบ: {quiz.sessionCount || sessions.length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleActive(quiz)} className="rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]">
                      {quiz.isActive ? 'ปิดรับทั้งควิส' : 'เปิดรับทั้งควิส'}
                    </button>
                    <button type="button" onClick={() => openAllResults(quiz.id)} className="rounded-lg bg-[#4a7c59] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2d5a3a]">
                      ดูผลรวมทุกคำตอบ
                    </button>
                    <a href={allResultsUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#4a7c59]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]">
                      เปิดหน้าผลรวม
                    </a>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-[#d4e0d4] bg-white p-3">
                  <p className="m-0 text-sm font-semibold text-[#2d5a3a]">สร้างรอบใหม่</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      value={sessionNameByQuiz[quiz.id] || ''}
                      onChange={(e) => setSessionNameByQuiz((prev) => ({ ...prev, [quiz.id]: e.target.value }))}
                      placeholder="ชื่อรอบ เช่น รอบเช้า 11 มี.ค."
                      className="min-w-[220px] flex-1 rounded-lg border border-[#d4e0d4] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateSession(quiz.id)}
                      className="rounded-lg bg-[#4a7c59] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
                    >
                      + สร้างรอบ
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  {sessions.length === 0 ? <p className="m-0 text-sm text-slate-500">ยังไม่มีรอบควิส</p> : null}
                  {sessions.map((session) => {
                    const sessionQuizUrl = `${shareOrigin}/quiz/session/${session.sessionToken}`;
                    const sessionResultsUrl = `${shareOrigin}/quiz/session/${session.sessionToken}/results`;
                    return (
                      <div key={session.id} className="rounded-lg border border-[#d4e0d4] bg-white p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="m-0 text-sm font-semibold text-[#2d5a3a]">{session.sessionName}</p>
                            <p className="m-0 text-xs text-slate-600">คำตอบในรอบนี้: {session.submissionCount}</p>
                            <p className="m-0 mt-1 text-xs text-slate-500 break-all">ลิงก์ทำควิส: {sessionQuizUrl}</p>
                            <p className="m-0 mt-1 text-xs text-slate-500 break-all">ลิงก์ผลรอบนี้: {sessionResultsUrl}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button type="button" onClick={() => copyLink(sessionQuizUrl)} className="rounded-lg border border-[#4a7c59]/25 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]">คัดลอกลิงก์รอบ</button>
                              <button type="button" onClick={() => copyLink(sessionResultsUrl)} className="rounded-lg border border-[#4a7c59]/25 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]">คัดลอกลิงก์ผลรอบ</button>
                              <a href={sessionResultsUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#4a7c59]/25 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]">เปิดหน้าผลรอบ</a>
                              <button type="button" onClick={() => openSessionResults(quiz.id, session.id)} className="rounded-lg bg-[#4a7c59] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2d5a3a]">ดูคำตอบรอบนี้</button>
                            </div>
                          </div>
                          <div className="w-[110px] shrink-0 rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-2 text-center">
                            <button
                              type="button"
                              onClick={() => openQrPreview(sessionQuizUrl, `${quiz.title} - ${session.sessionName}`)}
                              className="block w-full rounded"
                            >
                              <img src={qrImageUrl(sessionQuizUrl)} alt={`QR ${session.sessionName}`} className="mx-auto h-[90px] w-[90px] rounded" />
                            </button>
                            <p className="m-0 mt-1 text-[11px] text-slate-500">QR เฉพาะรอบ</p>
                            <button
                              type="button"
                              onClick={() => openQrPreview(sessionQuizUrl, `${quiz.title} - ${session.sessionName}`)}
                              className="mt-1 rounded border border-[#4a7c59]/25 bg-white px-2 py-1 text-[11px] font-semibold text-[#2d5a3a] hover:bg-[#e8f3e8]"
                            >
                              QR เต็มจอ
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-base font-semibold text-[#2d5a3a]">ผลคำตอบที่เลือกดู</h2>
        {selectedLoading ? <p className="text-slate-500">กำลังโหลดผลคำตอบ...</p> : null}
        {submissionError ? <p className="text-rose-600">{submissionError}</p> : null}
        {!selectedLoading && !selectedData ? <p className="text-slate-500">เลือก “ดูผลรวมทุกคำตอบ” หรือ “ดูคำตอบรอบนี้” จากรายการด้านบน</p> : null}
        {selectedData ? (
          <>
            <p className="m-0 text-sm text-slate-600">
              Quiz: <strong className="text-[#2d5a3a]">{selectedData.quiz.title}</strong>
            </p>
            {selectedData.mode === 'session' && selectedData.session ? (
              <p className="m-0 text-sm text-slate-600">รอบ: <strong className="text-[#2d5a3a]">{selectedData.session.sessionName}</strong></p>
            ) : (
              <p className="m-0 text-sm text-slate-600">แสดงทุกคำตอบจากทุกแหล่ง</p>
            )}
            <p className="m-0 mb-3 text-sm text-slate-600">จำนวนคำตอบ: {selectedData.submissions.length}</p>

            {selectedData.submissions.length === 0 ? (
              <p className="text-slate-500">ยังไม่มีผู้ส่งคำตอบ</p>
            ) : (
              <div className="grid gap-3">
                {selectedData.submissions.map((submission) => (
                  <article key={submission.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                    <p className="m-0 text-sm font-semibold text-[#2d5a3a]">
                      {submission.studentName || 'ไม่ระบุชื่อ'} {submission.classRoom ? `(${submission.classRoom})` : ''}
                    </p>
                    <p className="m-0 text-xs text-slate-500">
                      {submission.sessionName ? `รอบ: ${submission.sessionName} | ` : ''}รหัสนักเรียน: {submission.studentCode || '-'} | ส่งเมื่อ: {new Date(submission.submittedAt).toLocaleString('th-TH')}
                    </p>
                    <div className="mt-2 space-y-2">
                      {submission.answers.map((answer, index) => (
                        <div key={`${submission.id}-${answer.questionId}`}>
                          <p className="m-0 text-sm font-medium text-slate-700">{index + 1}. {answer.prompt}</p>
                          <p className="m-0 whitespace-pre-wrap text-sm text-slate-600">{answer.answer || '-'}</p>
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
                className="rounded-lg border border-white/50 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                คัดลอกลิงก์รอบ
              </button>
              <button
                type="button"
                onClick={closeQrPreview}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-slate-100"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
