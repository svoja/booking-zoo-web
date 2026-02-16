import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllBookings,
  getBookingById,
  createBooking as dbCreateBooking,
  updateBooking as dbUpdateBooking,
  deleteBookingById,
  searchBookings,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = isProduction
  ? true
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

app.get('/api/bookings', (req, res) => {
  try {
    const { q } = req.query;
    const rows = q && String(q).trim() ? searchBookings(q) : getAllBookings();
    const ordered = [...rows].sort((a, b) => (b.id || 0) - (a.id || 0));
    res.json(ordered.map(rowToBooking));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id', (req, res) => {
  try {
    const row = getBookingById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToBooking(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const created = dbCreateBooking(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bookings/:id', (req, res) => {
  try {
    const updated = dbUpdateBooking(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  try {
    const ok = deleteBookingById(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
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

app.listen(PORT, () => {
  console.log(isProduction
    ? `Zoo booking running at http://localhost:${PORT}`
    : `Zoo booking API at http://localhost:${PORT}`);
});
