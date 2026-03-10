import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

function createQuestions() {
  return [
    {
      id: 1,
      text: 'Q1',
      choices: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
      correctChoiceId: 'a',
    },
  ];
}

async function loadDbModule() {
  const dir = mkdtempSync(join(tmpdir(), 'zoo-booking-test-'));
  const bookingsFile = join(dir, 'bookings.json');
  const questionsFile = join(dir, 'quiz-questions.json');
  const quizSubmissionsFile = join(dir, 'quiz-submissions.json');
  const surveysFile = join(dir, 'surveys.json');

  writeFileSync(bookingsFile, '[]', 'utf8');
  writeFileSync(questionsFile, JSON.stringify(createQuestions(), null, 2), 'utf8');
  writeFileSync(quizSubmissionsFile, '[]', 'utf8');
  writeFileSync(surveysFile, '[]', 'utf8');

  process.env.BOOKINGS_FILE = bookingsFile;
  process.env.QUIZ_QUESTIONS_FILE = questionsFile;
  process.env.QUIZ_SUBMISSIONS_FILE = quizSubmissionsFile;
  process.env.SURVEYS_FILE = surveysFile;

  const dbPath = pathToFileURL(join(process.cwd(), 'db.js')).href;
  const mod = await import(`${dbPath}?t=${Date.now()}_${Math.random()}`);
  return mod;
}

function validBookingPayload(overrides = {}) {
  return {
    schoolName: 'School A',
    contactName: 'Teacher A',
    contactPhone1: '0812345678',
    contactPhone2: '',
    studentsCount: 100,
    teachersCount: 5,
    gradeLevel: 'P5',
    serviceAQ: true,
    serviceSnow: false,
    serviceWaterPark: false,
    serviceDino: false,
    receiverName: 'Staff A',
    bookingReceivedAt: '2026-03-11',
    remarks: '',
    visitDate: '2026-03-20',
    visitTime: '09:00',
    ...overrides,
  };
}

test('booking validation blocks invalid payloads', async () => {
  const db = await loadDbModule();

  assert.throws(
    () => db.createBooking(validBookingPayload({ schoolName: '' })),
    /schoolName is required/i
  );

  assert.throws(
    () => db.createBooking(validBookingPayload({ contactPhone1: '123' })),
    /contactPhone1 is invalid/i
  );

  assert.throws(
    () => db.createBooking(validBookingPayload({ studentsCount: -1 })),
    /studentsCount must be a non-negative number/i
  );

  assert.throws(
    () => db.createBooking(validBookingPayload({ visitDate: '2026-03-01' })),
    /visitDate must not be earlier/i
  );
});

test('capacity rules enforce daily school limit and students per school limit', async () => {
  const db = await loadDbModule();

  db.createBooking(validBookingPayload({ schoolName: 'S1' }));
  db.createBooking(validBookingPayload({ schoolName: 'S2' }));
  db.createBooking(validBookingPayload({ schoolName: 'S3' }));
  db.createBooking(validBookingPayload({ schoolName: 'S4' }));

  assert.throws(
    () => db.createBooking(validBookingPayload({ schoolName: 'S5' })),
    /maximum 4 schools per day/i
  );

  assert.throws(
    () => db.createBooking(validBookingPayload({ visitDate: '2026-03-21', studentsCount: 201 })),
    /maximum 200 students per school/i
  );
});

test('status transition follows workflow and records history', async () => {
  const db = await loadDbModule();
  const created = db.createBooking(validBookingPayload());

  assert.equal(created.status, 'pending');
  assert.equal(created.statusHistory.length, 1);

  const confirmed = db.transitionBookingStatus(created.id, {
    toStatus: 'confirmed',
    actor: 'staff1',
    reason: 'verified',
  });
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(confirmed.statusHistory.length, 2);

  assert.throws(
    () => db.transitionBookingStatus(created.id, { toStatus: 'completed', actor: 'staff1' }),
    /invalid status transition/i
  );

  const checkedIn = db.transitionBookingStatus(created.id, { toStatus: 'checked_in', actor: 'staff2' });
  const completed = db.transitionBookingStatus(created.id, { toStatus: 'completed', actor: 'staff3' });
  assert.equal(checkedIn.status, 'checked_in');
  assert.equal(completed.status, 'completed');

  assert.throws(
    () => db.transitionBookingStatus(created.id, { toStatus: 'cancelled', actor: 'staff4' }),
    /invalid status transition/i
  );
});

test('quiz and survey submissions require bookingId and prevent duplicates', async () => {
  const db = await loadDbModule();
  const created = db.createBooking(validBookingPayload());

  assert.throws(
    () => db.createQuizSubmission({ participantKey: 'room-a', answers: [] }),
    /bookingId is required/i
  );

  const quiz = db.createQuizSubmission({
    bookingId: created.id,
    participantKey: 'room-a',
    answers: [{ questionId: 1, choiceId: 'a' }],
  });
  assert.equal(quiz.bookingId, created.id);

  assert.throws(
    () =>
      db.createQuizSubmission({
        bookingId: created.id,
        participantKey: 'room-a',
        answers: [{ questionId: 1, choiceId: 'a' }],
      }),
    /already exists/i
  );

  const survey = db.createSurvey({
    bookingId: created.id,
    ratings: { learning: 5, fun: 5, safety: 5, service: 5 },
    comment: 'great',
  });
  assert.equal(survey.bookingId, created.id);

  assert.throws(
    () =>
      db.createSurvey({
        bookingId: created.id,
        ratings: { learning: 5, fun: 5, safety: 5, service: 5 },
        comment: 'duplicate',
      }),
    /already exists/i
  );
});

test('end-to-end summary reports funnel and bottlenecks', async () => {
  const db = await loadDbModule();
  const b1 = db.createBooking(validBookingPayload({ schoolName: 'School 1' }));
  const b2 = db.createBooking(validBookingPayload({ schoolName: 'School 2', visitDate: '2026-03-21' }));

  db.transitionBookingStatus(b1.id, { toStatus: 'confirmed', actor: 'staff' });
  db.transitionBookingStatus(b1.id, { toStatus: 'checked_in', actor: 'staff' });
  db.transitionBookingStatus(b1.id, { toStatus: 'completed', actor: 'staff' });

  db.createQuizSubmission({
    bookingId: b1.id,
    participantKey: 'grp1',
    answers: [{ questionId: 1, choiceId: 'a' }],
  });
  db.createSurvey({
    bookingId: b1.id,
    ratings: { learning: 5, fun: 4, safety: 4, service: 5 },
    comment: 'ok',
  });

  const summary = db.getEndToEndSummary();
  assert.deepEqual(summary.funnel, {
    booked: 2,
    confirmed: 1,
    checkedIn: 1,
    quizCompleted: 1,
    surveyCompleted: 1,
  });
  assert.equal(summary.pendingBottlenecks.pending, 1);
  assert.equal(summary.pendingBottlenecks.quizDoneAwaitingSurvey, 0);
});
