import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicQuizResults } from '../api';

const cardClass = 'mx-auto w-full max-w-4xl rounded-xl border border-[#d4e0d4] bg-white p-4 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';

export default function QuizPublicResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPublicQuizResults(id)
      .then(setData)
      .catch((err) => setError(err.message || 'โหลดผลลัพธ์ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className={cardClass}>
          <p className="text-center text-slate-500">กำลังโหลดผลลัพธ์...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-4">
        <div className={cardClass}>
          <p className="text-center text-rose-600">{error || 'ไม่พบผลลัพธ์'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className={cardClass}>
        <h1 className="mb-1 text-2xl font-bold text-[#2d5a3a]">ผลลัพธ์ควิส: {data.quiz.title}</h1>
        <p className="mb-3 text-sm text-slate-600">{data.quiz.description || 'สรุปผลคำตอบจากผู้ทำควิส'}</p>
        <p className="mb-4 text-sm text-slate-600">จำนวนผู้ส่งคำตอบ: {data.submissions.length}</p>

        {data.submissions.length === 0 ? (
          <p className="text-slate-500">ยังไม่มีคำตอบที่ส่งเข้ามา</p>
        ) : (
          <div className="grid gap-3">
            {data.submissions.map((submission) => (
              <article key={submission.id} className="rounded-lg border border-[#d4e0d4] bg-[#f7fbf6] p-3">
                <p className="m-0 text-sm font-semibold text-[#2d5a3a]">
                  {submission.studentName || 'ไม่ระบุชื่อ'} {submission.classRoom ? `(${submission.classRoom})` : ''}
                </p>
                <p className="m-0 text-xs text-slate-500">
                  ส่งเมื่อ: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('th-TH') : '-'}
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
      </div>
    </div>
  );
}
