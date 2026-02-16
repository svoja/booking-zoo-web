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
