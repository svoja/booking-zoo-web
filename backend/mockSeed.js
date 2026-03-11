import mysql from 'mysql2/promise';

const MOCK_FORM_TITLE = 'แบบประเมินทดสอบ Mock Analytics';
const MOCK_QUIZ_TITLE = 'ควิสทดสอบ Mock Analytics';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3307,
  user: process.env.MYSQL_USER || 'zoo_user',
  password: process.env.MYSQL_PASSWORD || 'zoo_password',
  database: process.env.MYSQL_DATABASE || 'zoo_booking',
  connectionLimit: 10,
  waitForConnections: true,
});

function isSeedEnabled() {
  return String(process.env.SEED_MOCK_DATA || '').trim().toLowerCase() === 'true';
}

async function hasMockData() {
  const [[formRow]] = await pool.execute(
    'SELECT id FROM evaluation_forms WHERE title = ? LIMIT 1',
    [MOCK_FORM_TITLE]
  );
  if (formRow?.id) return true;

  const [[quizRow]] = await pool.execute(
    'SELECT id FROM quizzes WHERE title = ? LIMIT 1',
    [MOCK_QUIZ_TITLE]
  );
  return Boolean(quizRow?.id);
}

export async function seedMockDataIfEnabled() {
  if (!isSeedEnabled()) return false;
  if (await hasMockData()) return false;

  const now = new Date().toISOString();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [bookingAResult] = await conn.execute(
      `INSERT INTO bookings (
        schoolName, contactName, contactPhone1, contactPhone2,
        studentsCount, teachersCount, gradeLevel,
        serviceAQ, serviceSnow, serviceWaterPark, serviceDino,
        receiverName, bookingReceivedAt, remarks, visitDate, visitTime,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'โรงเรียนทดลองข้อมูล ม็อกเอ',
        'ครูอรทัย ใจดี',
        '081-111-1111',
        '',
        120,
        8,
        'ป.5/1',
        1,
        0,
        0,
        1,
        'เจ้าหน้าที่ตัวอย่าง 1',
        '2026-03-01',
        'ใช้ทดสอบ dashboard และผลประเมิน',
        '2026-03-20',
        '09:00 น.',
        'approved',
        now,
        now,
      ]
    );

    const [bookingBResult] = await conn.execute(
      `INSERT INTO bookings (
        schoolName, contactName, contactPhone1, contactPhone2,
        studentsCount, teachersCount, gradeLevel,
        serviceAQ, serviceSnow, serviceWaterPark, serviceDino,
        receiverName, bookingReceivedAt, remarks, visitDate, visitTime,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'โรงเรียนทดลองข้อมูล ม็อกบี',
        'ครูพงศ์ศักดิ์ ดีงาม',
        '081-222-2222',
        '',
        80,
        6,
        'ม.1/2',
        0,
        1,
        0,
        0,
        'เจ้าหน้าที่ตัวอย่าง 2',
        '2026-03-02',
        'ใช้ทดสอบ dashboard และผลประเมิน',
        '2026-03-22',
        '10:30 น.',
        'approved',
        now,
        now,
      ]
    );

    const bookingAId = Number(bookingAResult.insertId);
    const bookingBId = Number(bookingBResult.insertId);

    const [formResult] = await conn.execute(
      `INSERT INTO evaluation_forms
        (title, description, created_by, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [MOCK_FORM_TITLE, 'ใช้สำหรับทดสอบ dashboard และผลประเมิน', 'mock-seed', now, now]
    );
    const formId = Number(formResult.insertId);

    const evaluationQuestions = [
      ['การประสานงานก่อนเข้าชมชัดเจนหรือไม่', 'rating', 1],
      ['กิจกรรมเหมาะสมกับช่วงวัยของนักเรียนหรือไม่', 'rating', 1],
      ['ข้อเสนอแนะเพิ่มเติม', 'text', 0],
    ];

    for (let i = 0; i < evaluationQuestions.length; i += 1) {
      const [prompt, type, required] = evaluationQuestions[i];
      await conn.execute(
        `INSERT INTO evaluation_form_questions
          (form_id, question_id, prompt, question_type, is_required, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [formId, i + 1, prompt, type, required, i + 1]
      );
    }

    const [submissionAResult] = await conn.execute(
      `INSERT INTO evaluation_submissions
        (form_id, booking_id, respondent_name, respondent_role, respondent_phone, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [formId, bookingAId, 'ครูอรทัย ใจดี', 'ครูผู้ควบคุม', '081-111-1111', now, now]
    );
    const submissionAId = Number(submissionAResult.insertId);

    const [submissionBResult] = await conn.execute(
      `INSERT INTO evaluation_submissions
        (form_id, booking_id, respondent_name, respondent_role, respondent_phone, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [formId, bookingBId, 'ครูพงศ์ศักดิ์ ดีงาม', 'ครูแนะแนว', '081-222-2222', now, now]
    );
    const submissionBId = Number(submissionBResult.insertId);

    const evaluationAnswers = [
      [submissionAId, 1, 'การประสานงานก่อนเข้าชมชัดเจนหรือไม่', 'rating', 5, '', 1],
      [submissionAId, 2, 'กิจกรรมเหมาะสมกับช่วงวัยของนักเรียนหรือไม่', 'rating', 4, '', 2],
      [submissionAId, 3, 'ข้อเสนอแนะเพิ่มเติม', 'text', null, 'กิจกรรมดี นักเรียนมีส่วนร่วมมาก', 3],
      [submissionBId, 1, 'การประสานงานก่อนเข้าชมชัดเจนหรือไม่', 'rating', 3, '', 1],
      [submissionBId, 2, 'กิจกรรมเหมาะสมกับช่วงวัยของนักเรียนหรือไม่', 'rating', 2, '', 2],
      [submissionBId, 3, 'ข้อเสนอแนะเพิ่มเติม', 'text', null, 'อยากให้เพิ่มเวลาช่วงตอบคำถาม', 3],
    ];

    for (const answer of evaluationAnswers) {
      await conn.execute(
        `INSERT INTO evaluation_submission_answers
          (submission_id, question_id, prompt, question_type, rating_value, text_value, answer_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        answer
      );
    }

    const [quizResult] = await conn.execute(
      `INSERT INTO quizzes
        (title, description, created_by, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [MOCK_QUIZ_TITLE, 'ใช้สำหรับทดสอบ dashboard และผลควิส', 'mock-seed', now, now]
    );
    const quizId = Number(quizResult.insertId);

    const quizQuestions = [
      ['สัตว์ชนิดใดเป็นสัตว์เลี้ยงลูกด้วยนม?', 1],
      ['นักเรียนได้เรียนรู้อะไรจากการเข้าชมวันนี้?', 0],
    ];

    for (let i = 0; i < quizQuestions.length; i += 1) {
      const [prompt, required] = quizQuestions[i];
      await conn.execute(
        `INSERT INTO quiz_questions
          (quiz_id, question_id, prompt, is_required, question_order)
         VALUES (?, ?, ?, ?, ?)`,
        [quizId, i + 1, prompt, required, i + 1]
      );
    }

    const sessionToken = `mock_session_${Date.now()}`;
    const [sessionResult] = await conn.execute(
      `INSERT INTO quiz_sessions
        (quiz_id, session_name, session_token, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [quizId, 'รอบทดสอบ มีนาคม 2026', sessionToken, now, now]
    );
    const sessionId = Number(sessionResult.insertId);

    const [quizSubmissionAResult] = await conn.execute(
      `INSERT INTO quiz_submissions
        (quiz_id, session_id, student_name, student_code, class_room, submitted_at, submission_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quizId, sessionId, 'ด.ช.ธนา มั่งมี', 'ST001', 'ป.5/1', now, `mock_sub_${Date.now()}_1`]
    );
    const quizSubmissionAId = Number(quizSubmissionAResult.insertId);

    const [quizSubmissionBResult] = await conn.execute(
      `INSERT INTO quiz_submissions
        (quiz_id, session_id, student_name, student_code, class_room, submitted_at, submission_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quizId, sessionId, 'ด.ญ.พิมพ์ชนก สดใส', 'ST002', 'ป.5/1', now, `mock_sub_${Date.now()}_2`]
    );
    const quizSubmissionBId = Number(quizSubmissionBResult.insertId);

    const quizAnswers = [
      [quizSubmissionAId, 1, 'สัตว์ชนิดใดเป็นสัตว์เลี้ยงลูกด้วยนม?', 'ช้าง', 1],
      [quizSubmissionAId, 2, 'นักเรียนได้เรียนรู้อะไรจากการเข้าชมวันนี้?', 'ได้รู้เรื่องการดูแลสัตว์และการอนุรักษ์', 2],
      [quizSubmissionBId, 1, 'สัตว์ชนิดใดเป็นสัตว์เลี้ยงลูกด้วยนม?', 'ยีราฟ', 1],
      [quizSubmissionBId, 2, 'นักเรียนได้เรียนรู้อะไรจากการเข้าชมวันนี้?', 'ได้เห็นการทำงานของเจ้าหน้าที่และพฤติกรรมสัตว์', 2],
    ];

    for (const answer of quizAnswers) {
      await conn.execute(
        `INSERT INTO quiz_submission_answers
          (submission_id, question_id, prompt, answer, answer_order)
         VALUES (?, ?, ?, ?, ?)`,
        answer
      );
    }

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
