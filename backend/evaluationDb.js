import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3307,
  user: process.env.MYSQL_USER || 'zoo_user',
  password: process.env.MYSQL_PASSWORD || 'zoo_password',
  database: process.env.MYSQL_DATABASE || 'zoo_booking',
  connectionLimit: 10,
  waitForConnections: true,
});

let initPromise = null;

const QUESTION_TYPES = new Set(['rating', 'text']);

const DEFAULT_FORM = {
  title: 'แบบประเมินความพึงพอใจหลังเข้าชม',
  description: 'กรุณาให้คะแนนและข้อเสนอแนะเพื่อปรับปรุงการให้บริการ',
  createdBy: 'system',
  questions: [
    { prompt: 'การประสานงานและการต้อนรับของเจ้าหน้าที่', type: 'rating', required: true },
    { prompt: 'เนื้อหาความรู้และกิจกรรมเหมาะสมกับนักเรียน', type: 'rating', required: true },
    { prompt: 'ความปลอดภัยระหว่างเข้าชม', type: 'rating', required: true },
    { prompt: 'ความสะอาดและความพร้อมของสถานที่', type: 'rating', required: true },
    { prompt: 'ความตรงต่อเวลาและการจัดการตามกำหนดการ', type: 'rating', required: true },
    { prompt: 'ความพึงพอใจโดยรวม', type: 'rating', required: true },
    { prompt: 'ข้อเสนอแนะเพิ่มเติม', type: 'text', required: false },
  ],
};

function normalizeQuestions(rawQuestions) {
  return (Array.isArray(rawQuestions) ? rawQuestions : [])
    .map((q, index) => {
      const type = String(q.type ?? 'text').trim().toLowerCase();
      return {
        id: index + 1,
        prompt: String(q.prompt ?? '').trim(),
        type: QUESTION_TYPES.has(type) ? type : 'text',
        required: Boolean(q.required),
      };
    })
    .filter((q) => q.prompt);
}

function normalizeAnswerByType(type, rawValue) {
  if (type === 'rating') {
    const rating = Number(rawValue);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('คำถามแบบคะแนนต้องตอบเป็นตัวเลข 1-5');
    }
    return { ratingValue: rating, textValue: '' };
  }
  return { ratingValue: null, textValue: String(rawValue ?? '').trim() };
}

function mapFormRow(row) {
  return {
    id: Number(row.id),
    title: row.title ?? '',
    description: row.description ?? '',
    createdBy: row.created_by ?? '',
    isActive: Boolean(row.is_active),
    questionCount: Number(row.question_count) || 0,
    submissionCount: Number(row.submission_count) || 0,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

function mapQuestionRow(row) {
  return {
    id: Number(row.question_id),
    prompt: row.prompt ?? '',
    type: row.question_type ?? 'text',
    required: Boolean(row.is_required),
  };
}

function mapSubmissionWithAnswers(submissionRow, answers) {
  const mappedAnswers = answers.map((a) => ({
    questionId: Number(a.question_id),
    prompt: a.prompt ?? '',
    type: a.question_type ?? 'text',
    rating: a.rating_value === null ? null : Number(a.rating_value),
    answer: a.question_type === 'rating' ? (a.rating_value === null ? '' : String(a.rating_value)) : (a.text_value ?? ''),
  }));

  return {
    id: Number(submissionRow.id),
    bookingId: Number(submissionRow.booking_id),
    formId: Number(submissionRow.form_id),
    respondentName: submissionRow.respondent_name ?? '',
    respondentRole: submissionRow.respondent_role ?? '',
    respondentPhone: submissionRow.respondent_phone ?? '',
    submittedAt: submissionRow.submitted_at ?? '',
    updatedAt: submissionRow.updated_at ?? '',
    answers: mappedAnswers,
  };
}

async function getQuestionsByFormId(formId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT question_id, prompt, question_type, is_required
     FROM evaluation_form_questions
     WHERE form_id = ?
     ORDER BY question_order ASC`,
    [Number(formId)]
  );
  return rows.map(mapQuestionRow);
}

async function getFormBaseById(formId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT id, title, description, created_by, is_active, created_at, updated_at
     FROM evaluation_forms
     WHERE id = ?`,
    [Number(formId)]
  );
  return rows[0] ?? null;
}

async function getActiveFormBase(conn = pool) {
  const [rows] = await conn.query(
    `SELECT id, title, description, created_by, is_active, created_at, updated_at
     FROM evaluation_forms
     WHERE is_active = 1
     ORDER BY id DESC
     LIMIT 1`
  );
  return rows[0] ?? null;
}

async function getBookingBasic(bookingId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT id, schoolName, visitDate, visitTime, status
     FROM bookings
     WHERE id = ?`,
    [Number(bookingId)]
  );
  return rows[0] ?? null;
}

async function getSubmissionByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT *
     FROM evaluation_submissions
     WHERE booking_id = ?
     LIMIT 1`,
    [Number(bookingId)]
  );
  if (!rows[0]) return null;

  const [answerRows] = await conn.execute(
    `SELECT question_id, prompt, question_type, rating_value, text_value
     FROM evaluation_submission_answers
     WHERE submission_id = ?
     ORDER BY answer_order ASC`,
    [Number(rows[0].id)]
  );
  return mapSubmissionWithAnswers(rows[0], answerRows);
}

async function ensureDefaultForm(conn = pool) {
  const [[countRow]] = await conn.query('SELECT COUNT(*) AS count FROM evaluation_forms');
  if (Number(countRow.count) > 0) return;

  const now = new Date().toISOString();
  const [result] = await conn.execute(
    `INSERT INTO evaluation_forms (title, description, created_by, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [DEFAULT_FORM.title, DEFAULT_FORM.description, DEFAULT_FORM.createdBy, now, now]
  );
  const formId = Number(result.insertId);

  for (let i = 0; i < DEFAULT_FORM.questions.length; i += 1) {
    const q = DEFAULT_FORM.questions[i];
    await conn.execute(
      `INSERT INTO evaluation_form_questions
       (form_id, question_id, prompt, question_type, is_required, question_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [formId, i + 1, q.prompt, q.type, q.required ? 1 : 0, i + 1]
    );
  }
}

export async function initializeEvaluationDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluation_forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      created_by VARCHAR(255) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(30) NOT NULL,
      updated_at VARCHAR(30) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluation_form_questions (
      form_id INT NOT NULL,
      question_id INT NOT NULL,
      prompt TEXT NOT NULL,
      question_type VARCHAR(20) NOT NULL DEFAULT 'text',
      is_required TINYINT(1) NOT NULL DEFAULT 0,
      question_order INT NOT NULL DEFAULT 1,
      PRIMARY KEY (form_id, question_id),
      INDEX idx_eval_questions_order (form_id, question_order),
      CONSTRAINT fk_eval_questions_form
        FOREIGN KEY (form_id) REFERENCES evaluation_forms(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluation_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      booking_id INT NOT NULL UNIQUE,
      respondent_name VARCHAR(255) NOT NULL DEFAULT '',
      respondent_role VARCHAR(255) NOT NULL DEFAULT '',
      respondent_phone VARCHAR(50) NOT NULL DEFAULT '',
      submitted_at VARCHAR(30) NOT NULL,
      updated_at VARCHAR(30) NOT NULL,
      INDEX idx_eval_submissions_form (form_id),
      INDEX idx_eval_submissions_booking (booking_id),
      CONSTRAINT fk_eval_submissions_form
        FOREIGN KEY (form_id) REFERENCES evaluation_forms(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluation_submission_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      submission_id INT NOT NULL,
      question_id INT NOT NULL,
      prompt TEXT NOT NULL,
      question_type VARCHAR(20) NOT NULL DEFAULT 'text',
      rating_value INT NULL,
      text_value TEXT NOT NULL,
      answer_order INT NOT NULL DEFAULT 1,
      INDEX idx_eval_answers_submission (submission_id),
      CONSTRAINT fk_eval_answers_submission
        FOREIGN KEY (submission_id) REFERENCES evaluation_submissions(id)
        ON DELETE CASCADE
    )
  `);

  await ensureDefaultForm();
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeEvaluationDb();
  }
  return initPromise;
}

export async function getAllEvaluationForms() {
  await ensureInitialized();
  const [rows] = await pool.query(
    `SELECT
       f.id,
       f.title,
       f.description,
       f.created_by,
       f.is_active,
       f.created_at,
       f.updated_at,
       COALESCE(qc.question_count, 0) AS question_count,
       COALESCE(sc.submission_count, 0) AS submission_count
     FROM evaluation_forms f
     LEFT JOIN (
       SELECT form_id, COUNT(*) AS question_count
       FROM evaluation_form_questions
       GROUP BY form_id
     ) qc ON qc.form_id = f.id
     LEFT JOIN (
       SELECT form_id, COUNT(*) AS submission_count
       FROM evaluation_submissions
       GROUP BY form_id
     ) sc ON sc.form_id = f.id
     ORDER BY f.id DESC`
  );

  return rows.map(mapFormRow);
}

export async function getEvaluationFormById(formId) {
  await ensureInitialized();
  const row = await getFormBaseById(formId);
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title ?? '',
    description: row.description ?? '',
    createdBy: row.created_by ?? '',
    isActive: Boolean(row.is_active),
    questions: await getQuestionsByFormId(row.id),
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export async function createEvaluationForm(payload = {}) {
  await ensureInitialized();

  const title = String(payload.title ?? '').trim();
  const description = String(payload.description ?? '').trim();
  const createdBy = String(payload.createdBy ?? '').trim();
  const questions = normalizeQuestions(payload.questions);

  if (!title) throw new Error('ต้องระบุชื่อแบบประเมิน');
  if (questions.length === 0) throw new Error('ต้องมีคำถามอย่างน้อย 1 ข้อ');

  const now = new Date().toISOString();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO evaluation_forms (title, description, created_by, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, createdBy, payload.isActive === false ? 0 : 1, now, now]
    );

    const formId = Number(result.insertId);

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      await conn.execute(
        `INSERT INTO evaluation_form_questions
         (form_id, question_id, prompt, question_type, is_required, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [formId, q.id, q.prompt, q.type, q.required ? 1 : 0, i + 1]
      );
    }

    await conn.commit();
    return getEvaluationFormById(formId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateEvaluationForm(formId, payload = {}) {
  await ensureInitialized();
  const current = await getEvaluationFormById(formId);
  if (!current) return null;

  const title = String(payload.title ?? current.title).trim();
  const description = String(payload.description ?? current.description).trim();
  const createdBy = String(payload.createdBy ?? current.createdBy).trim();
  const nextQuestions = Array.isArray(payload.questions)
    ? normalizeQuestions(payload.questions)
    : current.questions.map((q, index) => ({
      id: index + 1,
      prompt: String(q.prompt ?? '').trim(),
      type: String(q.type ?? 'text').trim().toLowerCase(),
      required: Boolean(q.required),
    }));

  if (!title) throw new Error('ต้องระบุชื่อแบบประเมิน');
  if (nextQuestions.length === 0) throw new Error('ต้องมีคำถามอย่างน้อย 1 ข้อ');

  const now = new Date().toISOString();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE evaluation_forms
       SET title = ?, description = ?, created_by = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      [
        title,
        description,
        createdBy,
        payload.isActive === undefined ? (current.isActive ? 1 : 0) : (payload.isActive ? 1 : 0),
        now,
        Number(formId),
      ]
    );

    if (Array.isArray(payload.questions)) {
      await conn.execute('DELETE FROM evaluation_form_questions WHERE form_id = ?', [Number(formId)]);
      for (let i = 0; i < nextQuestions.length; i += 1) {
        const q = nextQuestions[i];
        await conn.execute(
          `INSERT INTO evaluation_form_questions
           (form_id, question_id, prompt, question_type, is_required, question_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [Number(formId), q.id, q.prompt, q.type, q.required ? 1 : 0, i + 1]
        );
      }
    }

    await conn.commit();
    return getEvaluationFormById(formId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getEvaluationSubmissionsByForm(formId) {
  await ensureInitialized();

  const form = await getEvaluationFormById(formId);
  if (!form) return null;

  const [rows] = await pool.execute(
    `SELECT
       s.*,
       b.schoolName AS booking_school_name,
       b.visitDate AS booking_visit_date,
       b.visitTime AS booking_visit_time,
       b.status AS booking_status
     FROM evaluation_submissions s
     JOIN bookings b ON b.id = s.booking_id
     WHERE s.form_id = ?
     ORDER BY s.id DESC`,
    [Number(formId)]
  );

  const submissions = [];
  for (const row of rows) {
    const [answerRows] = await pool.execute(
      `SELECT question_id, prompt, question_type, rating_value, text_value
       FROM evaluation_submission_answers
       WHERE submission_id = ?
       ORDER BY answer_order ASC`,
      [Number(row.id)]
    );

    const mapped = mapSubmissionWithAnswers(row, answerRows);
    const ratingScores = mapped.answers
      .filter((a) => a.type === 'rating' && Number.isInteger(a.rating))
      .map((a) => Number(a.rating));

    submissions.push({
      ...mapped,
      averageScore: ratingScores.length
        ? Number((ratingScores.reduce((sum, v) => sum + v, 0) / ratingScores.length).toFixed(2))
        : 0,
      booking: {
        id: Number(row.booking_id),
        schoolName: row.booking_school_name ?? '',
        visitDate: row.booking_visit_date ?? '',
        visitTime: row.booking_visit_time ?? '',
        status: row.booking_status ?? 'pending',
      },
    });
  }

  return {
    form,
    submissions,
  };
}

export async function getAllBookingEvaluations() {
  await ensureInitialized();

  const [rows] = await pool.query(
    `SELECT
       s.*,
       f.title AS form_title,
       b.schoolName AS booking_school_name,
       b.visitDate AS booking_visit_date,
       b.visitTime AS booking_visit_time,
       b.status AS booking_status
     FROM evaluation_submissions s
     JOIN evaluation_forms f ON f.id = s.form_id
     JOIN bookings b ON b.id = s.booking_id
     ORDER BY s.updated_at DESC, s.id DESC`
  );

  const result = [];
  for (const row of rows) {
    const [answerRows] = await pool.execute(
      `SELECT question_id, prompt, question_type, rating_value, text_value
       FROM evaluation_submission_answers
       WHERE submission_id = ?
       ORDER BY answer_order ASC`,
      [Number(row.id)]
    );

    const mapped = mapSubmissionWithAnswers(row, answerRows);
    const ratingScores = mapped.answers
      .filter((a) => a.type === 'rating' && Number.isInteger(a.rating))
      .map((a) => Number(a.rating));

    result.push({
      ...mapped,
      formTitle: row.form_title ?? '',
      averageScore: ratingScores.length
        ? Number((ratingScores.reduce((sum, v) => sum + v, 0) / ratingScores.length).toFixed(2))
        : 0,
      booking: {
        id: Number(row.booking_id),
        schoolName: row.booking_school_name ?? '',
        visitDate: row.booking_visit_date ?? '',
        visitTime: row.booking_visit_time ?? '',
        status: row.booking_status ?? 'pending',
      },
    });
  }

  return result;
}

export async function getBookingEvaluationByBookingId(bookingId) {
  await ensureInitialized();
  return getSubmissionByBookingId(bookingId);
}

export async function getPublicBookingEvaluationForm(bookingId) {
  await ensureInitialized();

  const booking = await getBookingBasic(bookingId);
  if (!booking) return null;

  const activeForm = await getActiveFormBase();
  if (!activeForm) return null;

  const questions = await getQuestionsByFormId(activeForm.id);
  const existing = await getSubmissionByBookingId(bookingId);

  const answerByQuestion = Object.fromEntries(
    (existing?.answers || []).map((a) => [a.questionId, a.type === 'rating' ? (a.rating ?? '') : (a.answer ?? '')])
  );

  return {
    form: {
      id: Number(activeForm.id),
      title: activeForm.title ?? '',
      description: activeForm.description ?? '',
      questions,
    },
    booking: {
      id: Number(booking.id),
      schoolName: booking.schoolName ?? '',
      visitDate: booking.visitDate ?? '',
      visitTime: booking.visitTime ?? '',
      status: booking.status ?? 'pending',
    },
    existing: existing
      ? {
        respondentName: existing.respondentName,
        respondentRole: existing.respondentRole,
        respondentPhone: existing.respondentPhone,
        answers: answerByQuestion,
      }
      : null,
  };
}

export async function submitBookingEvaluation(bookingId, payload = {}) {
  await ensureInitialized();

  const booking = await getBookingBasic(bookingId);
  if (!booking) return null;

  const formId = Number(payload.formId || 0);
  const form = formId > 0
    ? await getEvaluationFormById(formId)
    : await (async () => {
      const active = await getActiveFormBase();
      if (!active) return null;
      return getEvaluationFormById(active.id);
    })();

  if (!form || !form.isActive) {
    throw new Error('แบบประเมินยังไม่พร้อมใช้งาน');
  }

  const respondentName = String(payload.respondentName ?? '').trim();
  if (!respondentName) throw new Error('กรุณากรอกชื่อผู้ประเมิน');

  const respondentRole = String(payload.respondentRole ?? '').trim();
  const respondentPhone = String(payload.respondentPhone ?? '').trim();
  const rawAnswers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};

  const normalizedAnswers = form.questions.map((q) => {
    const rawValue = rawAnswers[q.id];
    const normalized = normalizeAnswerByType(q.type, rawValue);

    if (q.required) {
      if (q.type === 'rating' && normalized.ratingValue === null) {
        throw new Error(`กรุณาตอบคำถาม "${q.prompt}"`);
      }
      if (q.type === 'text' && !normalized.textValue) {
        throw new Error(`กรุณาตอบคำถาม "${q.prompt}"`);
      }
    }

    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      ratingValue: normalized.ratingValue,
      textValue: normalized.textValue,
    };
  });

  const now = new Date().toISOString();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const existing = await getSubmissionByBookingId(bookingId, conn);
    let submissionId = 0;

    if (existing) {
      submissionId = Number(existing.id);
      await conn.execute(
        `UPDATE evaluation_submissions
         SET form_id = ?, respondent_name = ?, respondent_role = ?, respondent_phone = ?, updated_at = ?
         WHERE id = ?`,
        [Number(form.id), respondentName, respondentRole, respondentPhone, now, submissionId]
      );
      await conn.execute('DELETE FROM evaluation_submission_answers WHERE submission_id = ?', [submissionId]);
    } else {
      const [result] = await conn.execute(
        `INSERT INTO evaluation_submissions
         (form_id, booking_id, respondent_name, respondent_role, respondent_phone, submitted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [Number(form.id), Number(bookingId), respondentName, respondentRole, respondentPhone, now, now]
      );
      submissionId = Number(result.insertId);
    }

    for (let i = 0; i < normalizedAnswers.length; i += 1) {
      const answer = normalizedAnswers[i];
      await conn.execute(
        `INSERT INTO evaluation_submission_answers
         (submission_id, question_id, prompt, question_type, rating_value, text_value, answer_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          submissionId,
          Number(answer.questionId),
          answer.prompt,
          answer.type,
          answer.ratingValue,
          answer.textValue,
          i + 1,
        ]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getSubmissionByBookingId(bookingId);
}
