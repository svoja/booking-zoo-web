import mysql from 'mysql2/promise';
import { randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const legacyQuizPath = join(__dirname, 'quizzes.json');
const legacySubmissionPath = join(__dirname, 'quiz-submissions.json');

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

function loadLegacy(path) {
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return [];
  }
}

function normalizeQuestions(rawQuestions) {
  return (Array.isArray(rawQuestions) ? rawQuestions : [])
    .map((q, index) => ({
      id: index + 1,
      prompt: String(q.prompt ?? '').trim(),
      required: Boolean(q.required),
    }))
    .filter((q) => q.prompt);
}

function newToken(prefix = '') {
  return `${prefix}${randomBytes(8).toString('hex')}`;
}

async function runOptionalSql(sql) {
  try {
    await pool.query(sql);
  } catch (err) {
    const ignorable = ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR'];
    if (!ignorable.includes(err.code)) throw err;
  }
}

async function migrateLegacyDataIfNeeded() {
  const [[quizCountRow]] = await pool.query('SELECT COUNT(*) AS count FROM quizzes');
  if (Number(quizCountRow.count) > 0) return;

  const legacyQuizzes = loadLegacy(legacyQuizPath);
  const legacySubmissions = loadLegacy(legacySubmissionPath);
  if (legacyQuizzes.length === 0 && legacySubmissions.length === 0) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const quiz of legacyQuizzes) {
      await conn.execute(
        `INSERT INTO quizzes
          (id, title, description, created_by, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(quiz.id) || null,
          String(quiz.title ?? ''),
          String(quiz.description ?? ''),
          String(quiz.createdBy ?? ''),
          quiz.isActive === false ? 0 : 1,
          String(quiz.createdAt ?? new Date().toISOString()),
          String(quiz.updatedAt ?? new Date().toISOString()),
        ]
      );

      const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
      for (let i = 0; i < questions.length; i += 1) {
        const question = questions[i];
        const questionId = Number(question.id) || i + 1;
        await conn.execute(
          `INSERT INTO quiz_questions
            (quiz_id, question_id, prompt, is_required, question_order)
           VALUES (?, ?, ?, ?, ?)`,
          [Number(quiz.id), questionId, String(question.prompt ?? ''), question.required ? 1 : 0, i + 1]
        );
      }

      const now = new Date().toISOString();
      await conn.execute(
        `INSERT INTO quiz_sessions
          (quiz_id, session_name, session_token, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 1, ?, ?)`,
        [Number(quiz.id), 'Legacy Session', newToken('legacy_'), now, now]
      );
    }

    for (const submission of legacySubmissions) {
      await conn.execute(
        `INSERT INTO quiz_submissions
          (id, quiz_id, student_name, student_code, class_room, submitted_at, submission_token)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(submission.id) || null,
          Number(submission.quizId),
          String(submission.studentName ?? ''),
          String(submission.studentCode ?? ''),
          String(submission.classRoom ?? ''),
          String(submission.submittedAt ?? new Date().toISOString()),
          newToken('sub_'),
        ]
      );

      const answers = Array.isArray(submission.answers) ? submission.answers : [];
      for (let i = 0; i < answers.length; i += 1) {
        const answer = answers[i];
        await conn.execute(
          `INSERT INTO quiz_submission_answers
            (submission_id, question_id, prompt, answer, answer_order)
           VALUES (?, ?, ?, ?, ?)`,
          [Number(submission.id), Number(answer.questionId) || i + 1, String(answer.prompt ?? ''), String(answer.answer ?? ''), i + 1]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function initializeQuizDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quizzes (
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
    CREATE TABLE IF NOT EXISTS quiz_questions (
      quiz_id INT NOT NULL,
      question_id INT NOT NULL,
      prompt TEXT NOT NULL,
      is_required TINYINT(1) NOT NULL DEFAULT 0,
      question_order INT NOT NULL DEFAULT 1,
      PRIMARY KEY (quiz_id, question_id),
      INDEX idx_quiz_questions_order (quiz_id, question_order),
      CONSTRAINT fk_quiz_questions_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT NOT NULL,
      session_name VARCHAR(255) NOT NULL,
      session_token VARCHAR(64) NOT NULL UNIQUE,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(30) NOT NULL,
      updated_at VARCHAR(30) NOT NULL,
      INDEX idx_quiz_sessions_quiz (quiz_id),
      CONSTRAINT fk_quiz_sessions_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT NOT NULL,
      session_id INT NULL,
      student_name VARCHAR(255) NOT NULL DEFAULT '',
      student_code VARCHAR(255) NOT NULL DEFAULT '',
      class_room VARCHAR(255) NOT NULL DEFAULT '',
      submitted_at VARCHAR(30) NOT NULL,
      submission_token VARCHAR(64) NULL,
      INDEX idx_quiz_submissions_quiz_id (quiz_id),
      INDEX idx_quiz_submissions_session_id (session_id),
      CONSTRAINT fk_quiz_submissions_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_submission_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      submission_id INT NOT NULL,
      question_id INT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      answer_order INT NOT NULL DEFAULT 1,
      INDEX idx_submission_answers_submission_id (submission_id),
      CONSTRAINT fk_submission_answers_submission
        FOREIGN KEY (submission_id) REFERENCES quiz_submissions(id)
        ON DELETE CASCADE
    )
  `);

  await runOptionalSql('ALTER TABLE quiz_submissions ADD COLUMN session_id INT NULL');
  await runOptionalSql('ALTER TABLE quiz_submissions ADD COLUMN submission_token VARCHAR(64) NULL');
  await runOptionalSql('CREATE INDEX idx_quiz_submissions_session_id ON quiz_submissions(session_id)');
  await runOptionalSql('CREATE UNIQUE INDEX uq_quiz_submissions_submission_token ON quiz_submissions(submission_token)');

  await migrateLegacyDataIfNeeded();
}

async function ensureInitialized() {
  if (!initPromise) initPromise = initializeQuizDb();
  return initPromise;
}

async function getQuestionsByQuizId(id) {
  const [rows] = await pool.execute(
    `SELECT question_id, prompt, is_required
     FROM quiz_questions
     WHERE quiz_id = ?
     ORDER BY question_order ASC`,
    [Number(id)]
  );
  return rows.map((r) => ({
    id: Number(r.question_id),
    prompt: r.prompt ?? '',
    required: Boolean(r.is_required),
  }));
}

async function getQuizBaseById(id) {
  const [rows] = await pool.execute(
    `SELECT id, title, description, created_by, is_active, created_at, updated_at
     FROM quizzes
     WHERE id = ?`,
    [Number(id)]
  );
  return rows[0] ?? null;
}

async function createSessionForQuiz(quizId, name = '') {
  const now = new Date().toISOString();
  const sessionName = String(name || `Round ${now.slice(0, 10)}`).trim();
  const token = newToken('sess_');
  const [result] = await pool.execute(
    `INSERT INTO quiz_sessions
      (quiz_id, session_name, session_token, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [Number(quizId), sessionName, token, now, now]
  );
  return {
    id: Number(result.insertId),
    quizId: Number(quizId),
    sessionName,
    sessionToken: token,
    isActive: true,
    submissionCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getAllQuizzes() {
  await ensureInitialized();
  const [rows] = await pool.query(
    `SELECT
      q.id,
      q.title,
      q.description,
      q.created_by,
      q.is_active,
      q.created_at,
      q.updated_at,
      COALESCE(qc.question_count, 0) AS question_count,
      COALESCE(sc.submission_count, 0) AS submission_count,
      COALESCE(ss.session_count, 0) AS session_count
     FROM quizzes q
     LEFT JOIN (SELECT quiz_id, COUNT(*) AS question_count FROM quiz_questions GROUP BY quiz_id) qc ON qc.quiz_id = q.id
     LEFT JOIN (SELECT quiz_id, COUNT(*) AS submission_count FROM quiz_submissions GROUP BY quiz_id) sc ON sc.quiz_id = q.id
     LEFT JOIN (SELECT quiz_id, COUNT(*) AS session_count FROM quiz_sessions GROUP BY quiz_id) ss ON ss.quiz_id = q.id
     ORDER BY q.id DESC`
  );
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title ?? '',
    description: r.description ?? '',
    createdBy: r.created_by ?? '',
    isActive: Boolean(r.is_active),
    questionCount: Number(r.question_count) || 0,
    submissionCount: Number(r.submission_count) || 0,
    sessionCount: Number(r.session_count) || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getQuizById(id) {
  await ensureInitialized();
  const row = await getQuizBaseById(id);
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title ?? '',
    description: row.description ?? '',
    createdBy: row.created_by ?? '',
    isActive: Boolean(row.is_active),
    questions: await getQuestionsByQuizId(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createQuiz(payload) {
  await ensureInitialized();
  const title = String(payload.title ?? '').trim();
  const questions = normalizeQuestions(payload.questions);
  if (!title) throw new Error('Quiz title is required');
  if (questions.length === 0) throw new Error('At least one question is required');

  const now = new Date().toISOString();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `INSERT INTO quizzes (title, description, created_by, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, String(payload.description ?? '').trim(), String(payload.createdBy ?? '').trim(), payload.isActive === false ? 0 : 1, now, now]
    );
    const quizId = Number(result.insertId);
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      await conn.execute(
        `INSERT INTO quiz_questions (quiz_id, question_id, prompt, is_required, question_order)
         VALUES (?, ?, ?, ?, ?)`,
        [quizId, q.id, q.prompt, q.required ? 1 : 0, i + 1]
      );
    }
    await conn.execute(
      `INSERT INTO quiz_sessions (quiz_id, session_name, session_token, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [quizId, 'Round 1', newToken('sess_'), now, now]
    );
    await conn.commit();
    return getQuizById(quizId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateQuiz(id, payload) {
  await ensureInitialized();
  const current = await getQuizById(id);
  if (!current) return null;

  const title = String(payload.title ?? current.title).trim();
  if (!title) throw new Error('Quiz title is required');
  const nextQuestions = Array.isArray(payload.questions)
    ? normalizeQuestions(payload.questions)
    : current.questions.map((q, index) => ({ id: index + 1, prompt: String(q.prompt ?? '').trim(), required: Boolean(q.required) }));
  if (nextQuestions.length === 0) throw new Error('At least one question is required');

  const now = new Date().toISOString();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE quizzes
       SET title = ?, description = ?, created_by = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      [title, String(payload.description ?? current.description ?? '').trim(), String(payload.createdBy ?? current.createdBy ?? '').trim(), payload.isActive === undefined ? (current.isActive ? 1 : 0) : (payload.isActive ? 1 : 0), now, Number(id)]
    );
    if (Array.isArray(payload.questions)) {
      await conn.execute('DELETE FROM quiz_questions WHERE quiz_id = ?', [Number(id)]);
      for (let i = 0; i < nextQuestions.length; i += 1) {
        const q = nextQuestions[i];
        await conn.execute(
          `INSERT INTO quiz_questions (quiz_id, question_id, prompt, is_required, question_order)
           VALUES (?, ?, ?, ?, ?)`,
          [Number(id), q.id, q.prompt, q.required ? 1 : 0, i + 1]
        );
      }
    }
    await conn.commit();
    return getQuizById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getQuizSessions(quizId) {
  await ensureInitialized();
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.quiz_id,
      s.session_name,
      s.session_token,
      s.is_active,
      s.created_at,
      s.updated_at,
      COALESCE(sc.submission_count, 0) AS submission_count
     FROM quiz_sessions s
     LEFT JOIN (
       SELECT session_id, COUNT(*) AS submission_count
       FROM quiz_submissions
       WHERE session_id IS NOT NULL
       GROUP BY session_id
     ) sc ON sc.session_id = s.id
     WHERE s.quiz_id = ?
     ORDER BY s.id DESC`,
    [Number(quizId)]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    quizId: Number(r.quiz_id),
    sessionName: r.session_name ?? '',
    sessionToken: r.session_token ?? '',
    isActive: Boolean(r.is_active),
    submissionCount: Number(r.submission_count) || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createQuizSession(quizId, payload) {
  await ensureInitialized();
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;
  return createSessionForQuiz(quizId, payload?.sessionName);
}

export async function getPublicQuiz(id) {
  await ensureInitialized();
  const row = await getQuizBaseById(id);
  if (!row || !Boolean(row.is_active)) return null;
  return {
    id: Number(row.id),
    title: row.title ?? '',
    description: row.description ?? '',
    questions: await getQuestionsByQuizId(row.id),
  };
}

export async function getPublicQuizBySessionToken(token) {
  await ensureInitialized();
  const [rows] = await pool.execute(
    `SELECT
      s.id AS session_id,
      s.session_name,
      s.session_token,
      s.is_active AS session_active,
      q.id AS quiz_id,
      q.title,
      q.description,
      q.is_active AS quiz_active
     FROM quiz_sessions s
     JOIN quizzes q ON q.id = s.quiz_id
     WHERE s.session_token = ?`,
    [String(token)]
  );
  const row = rows[0];
  if (!row) return null;
  if (!Boolean(row.session_active) || !Boolean(row.quiz_active)) return null;
  return {
    id: Number(row.quiz_id),
    title: row.title ?? '',
    description: row.description ?? '',
    session: {
      id: Number(row.session_id),
      name: row.session_name ?? '',
      token: row.session_token ?? '',
    },
    questions: await getQuestionsByQuizId(row.quiz_id),
  };
}

export async function submitQuiz(id, payload) {
  await ensureInitialized();
  const quiz = await getPublicQuiz(id);
  if (!quiz) return null;
  return insertSubmission({ quiz, payload, sessionId: null });
}

export async function submitQuizBySessionToken(token, payload) {
  await ensureInitialized();
  const quiz = await getPublicQuizBySessionToken(token);
  if (!quiz) return null;
  return insertSubmission({ quiz, payload, sessionId: quiz.session.id });
}

async function insertSubmission({ quiz, payload, sessionId }) {
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const answerMap = new Map(answers.map((a) => [Number(a.questionId), String(a.answer ?? '').trim()]));

  for (const question of quiz.questions) {
    if (question.required && !answerMap.get(question.id)) {
      throw new Error(`Question "${question.prompt}" is required`);
    }
  }

  const now = new Date().toISOString();
  const submissionToken = newToken('sub_');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `INSERT INTO quiz_submissions
        (quiz_id, session_id, student_name, student_code, class_room, submitted_at, submission_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [Number(quiz.id), sessionId ? Number(sessionId) : null, String(payload.studentName ?? '').trim(), String(payload.studentCode ?? '').trim(), String(payload.classRoom ?? '').trim(), now, submissionToken]
    );
    const submissionId = Number(result.insertId);
    for (let i = 0; i < quiz.questions.length; i += 1) {
      const q = quiz.questions[i];
      await conn.execute(
        `INSERT INTO quiz_submission_answers (submission_id, question_id, prompt, answer, answer_order)
         VALUES (?, ?, ?, ?, ?)`,
        [submissionId, q.id, q.prompt, answerMap.get(q.id) ?? '', i + 1]
      );
    }
    await conn.commit();
    return {
      id: submissionId,
      quizId: Number(quiz.id),
      sessionId: sessionId ? Number(sessionId) : null,
      submissionToken,
      studentName: String(payload.studentName ?? '').trim(),
      studentCode: String(payload.studentCode ?? '').trim(),
      classRoom: String(payload.classRoom ?? '').trim(),
      answers: quiz.questions.map((q) => ({
        questionId: q.id,
        prompt: q.prompt,
        answer: answerMap.get(q.id) ?? '',
      })),
      submittedAt: now,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getSubmissionAnswers(submissionId) {
  const [rows] = await pool.execute(
    `SELECT question_id, prompt, answer
     FROM quiz_submission_answers
     WHERE submission_id = ?
     ORDER BY answer_order ASC`,
    [Number(submissionId)]
  );
  return rows.map((r) => ({
    questionId: Number(r.question_id),
    prompt: r.prompt ?? '',
    answer: r.answer ?? '',
  }));
}

async function getSubmissionsByWhere(whereSql, params) {
  const [rows] = await pool.execute(
    `SELECT
      qs.id,
      qs.quiz_id,
      qs.session_id,
      s.session_name,
      qs.student_name,
      qs.student_code,
      qs.class_room,
      qs.submitted_at
     FROM quiz_submissions qs
     LEFT JOIN quiz_sessions s ON s.id = qs.session_id
     WHERE ${whereSql}
     ORDER BY qs.id DESC`,
    params
  );

  const submissions = [];
  for (const row of rows) {
    submissions.push({
      id: Number(row.id),
      quizId: Number(row.quiz_id),
      sessionId: row.session_id ? Number(row.session_id) : null,
      sessionName: row.session_name ?? '',
      studentName: row.student_name ?? '',
      studentCode: row.student_code ?? '',
      classRoom: row.class_room ?? '',
      answers: await getSubmissionAnswers(row.id),
      submittedAt: row.submitted_at,
    });
  }
  return submissions;
}

export async function getQuizSubmissions(id) {
  await ensureInitialized();
  const quiz = await getQuizById(id);
  if (!quiz) return null;
  return {
    quiz,
    submissions: await getSubmissionsByWhere('qs.quiz_id = ?', [Number(id)]),
  };
}

export async function getQuizSessionSubmissions(quizId, sessionId) {
  await ensureInitialized();
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;
  const [sessionRows] = await pool.execute(
    'SELECT id, session_name, session_token FROM quiz_sessions WHERE id = ? AND quiz_id = ?',
    [Number(sessionId), Number(quizId)]
  );
  const session = sessionRows[0];
  if (!session) return null;
  return {
    quiz,
    session: {
      id: Number(session.id),
      sessionName: session.session_name ?? '',
      sessionToken: session.session_token ?? '',
    },
    submissions: await getSubmissionsByWhere('qs.quiz_id = ? AND qs.session_id = ?', [Number(quizId), Number(sessionId)]),
  };
}

export async function getPublicQuizResults(id) {
  await ensureInitialized();
  const data = await getQuizSubmissions(id);
  if (!data) return null;
  return {
    quiz: {
      id: data.quiz.id,
      title: data.quiz.title,
      description: data.quiz.description,
      questions: data.quiz.questions,
    },
    submissions: data.submissions.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      sessionName: s.sessionName,
      studentName: s.studentName,
      classRoom: s.classRoom,
      answers: s.answers,
      submittedAt: s.submittedAt,
    })),
  };
}

export async function getPublicQuizResultsBySessionToken(token) {
  await ensureInitialized();
  const quiz = await getPublicQuizBySessionToken(token);
  if (!quiz) return null;
  const submissions = await getSubmissionsByWhere('qs.quiz_id = ? AND qs.session_id = ?', [quiz.id, quiz.session.id]);
  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
    },
    session: {
      id: quiz.session.id,
      name: quiz.session.name,
      token: quiz.session.token,
    },
    submissions: submissions.map((s) => ({
      id: s.id,
      studentName: s.studentName,
      classRoom: s.classRoom,
      answers: s.answers,
      submittedAt: s.submittedAt,
    })),
  };
}
