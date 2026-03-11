const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function getBookings(q) {
  const search = q ? `?q=${encodeURIComponent(q)}` : '';
  return request(`/bookings${search}`);
}

export async function getBooking(id) {
  return request(`/bookings/${id}`);
}

export async function createBooking(body) {
  return request('/bookings', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateBooking(id, body) {
  return request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteBooking(id) {
  return request(`/bookings/${id}`, { method: 'DELETE' });
}

export async function getBookingEvaluationForm(id) {
  return request(`/bookings/${id}/evaluation-form`);
}

export async function getBookingEvaluation(id) {
  return request(`/bookings/${id}/evaluation`);
}

export async function getBookingEvaluations() {
  return request('/evaluations');
}

export async function getEvaluationForms() {
  return request('/evaluations/forms');
}

export async function getEvaluationForm(id) {
  return request(`/evaluations/forms/${id}`);
}

export async function createEvaluationForm(body) {
  return request('/evaluations/forms', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateEvaluationForm(id, body) {
  return request(`/evaluations/forms/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function getEvaluationFormSubmissions(id) {
  return request(`/evaluations/forms/${id}/submissions`);
}

export async function submitBookingEvaluation(id, body) {
  return request(`/bookings/${id}/evaluation`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getQuizzes() {
  return request('/quizzes');
}

export async function getQuiz(id) {
  return request(`/quizzes/${id}`);
}

export async function createQuiz(body) {
  return request('/quizzes', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateQuiz(id, body) {
  return request(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function getPublicQuiz(id) {
  return request(`/quizzes/${id}/public`);
}

export async function submitQuiz(id, body) {
  return request(`/quizzes/${id}/submissions`, { method: 'POST', body: JSON.stringify(body) });
}

export async function getQuizSubmissions(id) {
  return request(`/quizzes/${id}/submissions`);
}

export async function getPublicQuizResults(id) {
  return request(`/quizzes/${id}/public-results`);
}

export async function getQuizSessions(id) {
  return request(`/quizzes/${id}/sessions`);
}

export async function createQuizSession(id, body) {
  return request(`/quizzes/${id}/sessions`, { method: 'POST', body: JSON.stringify(body) });
}

export async function getPublicQuizBySession(token) {
  return request(`/quiz-sessions/${encodeURIComponent(token)}/public`);
}

export async function submitQuizBySession(token, body) {
  return request(`/quiz-sessions/${encodeURIComponent(token)}/submissions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getQuizSessionSubmissions(id, sessionId) {
  return request(`/quizzes/${id}/sessions/${sessionId}/submissions`);
}

export async function getPublicQuizResultsBySession(token) {
  return request(`/quiz-sessions/${encodeURIComponent(token)}/public-results`);
}
