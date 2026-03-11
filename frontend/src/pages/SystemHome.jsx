import { Link } from 'react-router-dom';

const cardClass = 'rounded-xl border border-[#d4e0d4] bg-white p-5 shadow-[0_2px_12px_rgba(74,124,89,0.08)]';

export default function SystemHome() {
  return (
    <div className="pb-8">
      <h1 className="mb-1 text-3xl font-bold text-[#2d5a3a]">ฟีเจอร์ของระบบ</h1>
      <p className="mb-5 text-slate-600">ขณะนี้ระบบรองรับทั้งโมดูลการจองและโมดูลควิสแล้ว</p>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className={cardClass}>
          <h2 className="text-lg font-semibold text-[#2d5a3a]">ฟีเจอร์การจอง</h2>
          <p className="mt-2 text-sm text-slate-600">
            สร้างและจัดการรายการจองของโรงเรียน ดูปฏิทินความจุ และติดตามภาพรวมผ่านหน้าภาพรวมการจอง
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/features/booking/form"
              className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
            >
              เข้าใช้งานโมดูลการจอง
            </Link>
            <Link
              to="/features/booking/dashboard"
              className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
            >
              ดูภาพรวมการจอง
            </Link>
          </div>
        </article>

        <article className={cardClass}>
          <h2 className="text-lg font-semibold text-[#2d5a3a]">ฟีเจอร์ควิส</h2>
          <p className="mt-2 text-sm text-slate-600">
            เจ้าหน้าที่สามารถสร้างควิสแบบปลายเปิด แชร์ลิงก์ผ่าน QR ให้นักเรียนทำบนมือถือ และดูผลคำตอบที่ส่งกลับได้
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/features/quiz"
              className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
            >
              เข้าใช้งานโมดูลควิส
            </Link>
          </div>
        </article>

        <article className={cardClass}>
          <h2 className="text-lg font-semibold text-[#2d5a3a]">ฟีเจอร์แบบประเมิน</h2>
          <p className="mt-2 text-sm text-slate-600">
            เก็บผลประเมินหลังเข้าชมจากโรงเรียนในรูปแบบคะแนน 1-5 และดูสรุปคะแนนความพึงพอใจรายโรงเรียนได้
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/features/evaluation"
              className="rounded-lg bg-[#4a7c59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d5a3a]"
            >
              จัดการแบบประเมิน
            </Link>
            <Link
              to="/features/evaluation/results"
              className="rounded-lg border border-[#4a7c59]/25 bg-[#4a7c59]/10 px-4 py-2 text-sm font-semibold text-[#2d5a3a] hover:bg-[#4a7c59]/20"
            >
              ดูผลประเมิน
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
