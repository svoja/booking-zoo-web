import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeBookingDb,
  getAllBookings,
  getBookingById,
  createBooking as dbCreateBooking,
  updateBooking as dbUpdateBooking,
  deleteBookingById,
  searchBookings,
} from './db.js';
import {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  getQuizSessions,
  createQuizSession,
  getPublicQuiz,
  getPublicQuizBySessionToken,
  submitQuiz,
  submitQuizBySessionToken,
  getQuizSubmissions,
  getQuizSessionSubmissions,
  getPublicQuizResults,
  getPublicQuizResultsBySessionToken,
  initializeQuizDb,
} from './quizDb.js';
import {
  getAllBookingEvaluations,
  getAllEvaluationForms,
  getEvaluationFormById,
  createEvaluationForm,
  updateEvaluationForm,
  getEvaluationSubmissionsByForm,
  getPublicBookingEvaluationForm,
  submitBookingEvaluation,
  getBookingEvaluationByBookingId,
  initializeEvaluationDb,
} from './evaluationDb.js';
import { seedMockDataIfEnabled } from './mockSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const PORT = process.env.PORT || 3001;

const configuredCorsOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const corsOrigins = isProduction
  ? (configuredCorsOrigins.length > 0 ? configuredCorsOrigins : false)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

function rowToBooking(row) {
  return {
    id: row.id,
    schoolName: row.schoolName ?? '',
    contactName: row.contactName ?? '',
    contactPhone1: row.contactPhone1 ?? '',
    contactPhone2: row.contactPhone2 ?? '',
    studentsCount: row.studentsCount ?? 0,
    teachersCount: row.teachersCount ?? 0,
    gradeLevel: row.gradeLevel ?? '',
    serviceAQ: Boolean(row.serviceAQ),
    serviceSnow: Boolean(row.serviceSnow),
    serviceWaterPark: Boolean(row.serviceWaterPark),
    serviceDino: Boolean(row.serviceDino),
    receiverName: row.receiverName ?? '',
    bookingReceivedAt: row.bookingReceivedAt ?? '',
    remarks: row.remarks ?? '',
    visitDate: row.visitDate ?? '',
    visitTime: row.visitTime ?? '',
    status: row.status ?? 'pending',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

app.get('/api/bookings', async (req, res) => {
  try {
    const { q } = req.query;
    const rows = q && String(q).trim() ? await searchBookings(q) : await getAllBookings();
    const ordered = [...rows].sort((a, b) => (b.id || 0) - (a.id || 0));
    res.json(ordered.map(rowToBooking));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const row = await getBookingById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToBooking(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const created = await dbCreateBooking(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const updated = await dbUpdateBooking(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const ok = await deleteBookingById(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id/evaluation-form', async (req, res) => {
  try {
    const data = await getPublicBookingEvaluationForm(req.params.id);
    if (!data) return res.status(404).json({ error: 'Booking not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id/evaluation', async (req, res) => {
  try {
    const data = await getBookingEvaluationByBookingId(req.params.id);
    if (!data) return res.status(404).json({ error: 'Evaluation not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/evaluations', async (req, res) => {
  try {
    const rows = await getAllBookingEvaluations();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/evaluations/forms', async (req, res) => {
  try {
    const rows = await getAllEvaluationForms();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/evaluations/forms/:id', async (req, res) => {
  try {
    const form = await getEvaluationFormById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Evaluation form not found' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/evaluations/forms', async (req, res) => {
  try {
    const created = await createEvaluationForm(req.body || {});
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/evaluations/forms/:id', async (req, res) => {
  try {
    const updated = await updateEvaluationForm(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Evaluation form not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/evaluations/forms/:id/submissions', async (req, res) => {
  try {
    const data = await getEvaluationSubmissionsByForm(req.params.id);
    if (!data) return res.status(404).json({ error: 'Evaluation form not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/:id/evaluation', async (req, res) => {
  try {
    const submitted = await submitBookingEvaluation(req.params.id, req.body || {});
    if (!submitted) return res.status(404).json({ error: 'Booking not found' });
    res.status(201).json(submitted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/quizzes', async (req, res) => {
  try {
    res.json(await getAllQuizzes());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const quiz = await getQuizById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quizzes', async (req, res) => {
  try {
    const created = await createQuiz(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const updated = await updateQuiz(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Quiz not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id/public', async (req, res) => {
  try {
    const quiz = await getPublicQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not available' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id/sessions', async (req, res) => {
  try {
    const sessions = await getQuizSessions(req.params.id);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quizzes/:id/sessions', async (req, res) => {
  try {
    const created = await createQuizSession(req.params.id, req.body || {});
    if (!created) return res.status(404).json({ error: 'Quiz not found' });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/quiz-sessions/:token/public', async (req, res) => {
  try {
    const quiz = await getPublicQuizBySessionToken(req.params.token);
    if (!quiz) return res.status(404).json({ error: 'Quiz session not available' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quiz-sessions/:token/submissions', async (req, res) => {
  try {
    const submitted = await submitQuizBySessionToken(req.params.token, req.body);
    if (!submitted) return res.status(404).json({ error: 'Quiz session not available' });
    res.status(201).json(submitted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/quizzes/:id/submissions', async (req, res) => {
  try {
    const submitted = await submitQuiz(req.params.id, req.body);
    if (!submitted) return res.status(404).json({ error: 'Quiz not available' });
    res.status(201).json(submitted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id/submissions', async (req, res) => {
  try {
    const data = await getQuizSubmissions(req.params.id);
    if (!data) return res.status(404).json({ error: 'Quiz not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id/sessions/:sessionId/submissions', async (req, res) => {
  try {
    const data = await getQuizSessionSubmissions(req.params.id, req.params.sessionId);
    if (!data) return res.status(404).json({ error: 'Quiz session not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quizzes/:id/public-results', async (req, res) => {
  try {
    const data = await getPublicQuizResults(req.params.id);
    if (!data) return res.status(404).json({ error: 'Quiz not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quiz-sessions/:token/public-results', async (req, res) => {
  try {
    const data = await getPublicQuizResultsBySessionToken(req.params.token);
    if (!data) return res.status(404).json({ error: 'Quiz session not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (isProduction) {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist, { fallthrough: true }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

Promise.all([initializeBookingDb(), initializeQuizDb(), initializeEvaluationDb()])
  .then(async () => {
    await seedMockDataIfEnabled();
    app.listen(PORT, () => {
      console.log(isProduction
        ? `Zoo booking running at http://localhost:${PORT}`
        : `Zoo booking API at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
