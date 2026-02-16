import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'bookings.json');

function load() {
  if (!existsSync(dbPath)) return [];
  try {
    const data = readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function save(rows) {
  writeFileSync(dbPath, JSON.stringify(rows, null, 2), 'utf8');
}

function nextId(rows) {
  return rows.length === 0 ? 1 : Math.max(...rows.map((r) => r.id)) + 1;
}

function rowToBooking(r) {
  return {
    id: r.id,
    schoolName: r.schoolName ?? '',
    contactName: r.contactName ?? '',
    contactPhone1: r.contactPhone1 ?? '',
    contactPhone2: r.contactPhone2 ?? '',
    studentsCount: r.studentsCount ?? 0,
    teachersCount: r.teachersCount ?? 0,
    gradeLevel: r.gradeLevel ?? '',
    serviceAQ: Boolean(r.serviceAQ),
    serviceSnow: Boolean(r.serviceSnow),
    serviceWaterPark: Boolean(r.serviceWaterPark),
    serviceDino: Boolean(r.serviceDino),
    receiverName: r.receiverName ?? '',
    bookingReceivedAt: r.bookingReceivedAt ?? '',
    remarks: r.remarks ?? '',
    visitDate: r.visitDate ?? '',
    visitTime: r.visitTime ?? '',
    status: r.status ?? 'pending',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function getAllBookings() {
  return load();
}

export function getBookingById(id) {
  const rows = load();
  return rows.find((r) => r.id === Number(id)) ?? null;
}

export function createBooking(record) {
  const rows = load();
  const now = new Date().toISOString();
  const id = nextId(rows);
  const row = {
    id,
    schoolName: String(record.schoolName ?? ''),
    contactName: String(record.contactName ?? ''),
    contactPhone1: String(record.contactPhone1 ?? ''),
    contactPhone2: String(record.contactPhone2 ?? ''),
    studentsCount: Number(record.studentsCount) || 0,
    teachersCount: Number(record.teachersCount) || 0,
    gradeLevel: String(record.gradeLevel ?? ''),
    serviceAQ: record.serviceAQ ? 1 : 0,
    serviceSnow: record.serviceSnow ? 1 : 0,
    serviceWaterPark: record.serviceWaterPark ? 1 : 0,
    serviceDino: record.serviceDino ? 1 : 0,
    receiverName: String(record.receiverName ?? ''),
    bookingReceivedAt: String(record.bookingReceivedAt ?? ''),
    remarks: String(record.remarks ?? ''),
    visitDate: String(record.visitDate ?? ''),
    visitTime: String(record.visitTime ?? ''),
    status: String(record.status ?? 'pending'),
    createdAt: now,
    updatedAt: now,
  };
  rows.unshift(row);
  save(rows);
  return rowToBooking(row);
}

export function updateBooking(id, record) {
  const rows = load();
  const idx = rows.findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const row = {
    ...rows[idx],
    schoolName: String(record.schoolName ?? ''),
    contactName: String(record.contactName ?? ''),
    contactPhone1: String(record.contactPhone1 ?? ''),
    contactPhone2: String(record.contactPhone2 ?? ''),
    studentsCount: Number(record.studentsCount) || 0,
    teachersCount: Number(record.teachersCount) || 0,
    gradeLevel: String(record.gradeLevel ?? ''),
    serviceAQ: record.serviceAQ ? 1 : 0,
    serviceSnow: record.serviceSnow ? 1 : 0,
    serviceWaterPark: record.serviceWaterPark ? 1 : 0,
    serviceDino: record.serviceDino ? 1 : 0,
    receiverName: String(record.receiverName ?? ''),
    bookingReceivedAt: String(record.bookingReceivedAt ?? ''),
    remarks: String(record.remarks ?? ''),
    visitDate: String(record.visitDate ?? ''),
    visitTime: String(record.visitTime ?? ''),
    status: String(record.status ?? 'pending'),
    updatedAt: now,
  };
  rows[idx] = row;
  save(rows);
  return rowToBooking(row);
}

export function deleteBookingById(id) {
  const rows = load();
  const idx = rows.findIndex((r) => r.id === Number(id));
  if (idx === -1) return false;
  rows.splice(idx, 1);
  save(rows);
  return true;
}

export function searchBookings(q) {
  const rows = load();
  if (!q || !String(q).trim()) return rows;
  const term = String(q).trim().toLowerCase();
  return rows.filter(
    (r) =>
      (r.schoolName && r.schoolName.toLowerCase().includes(term)) ||
      (r.contactName && r.contactName.toLowerCase().includes(term)) ||
      (r.contactPhone1 && r.contactPhone1.includes(term)) ||
      (r.contactPhone2 && r.contactPhone2.includes(term)) ||
      (r.remarks && r.remarks.toLowerCase().includes(term))
  );
}
