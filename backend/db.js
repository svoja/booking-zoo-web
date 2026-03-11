import mysql from 'mysql2/promise';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const legacyBookingPath = join(__dirname, 'bookings.json');

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

function loadLegacyBookings() {
  if (!existsSync(legacyBookingPath)) return [];
  try {
    const raw = JSON.parse(readFileSync(legacyBookingPath, 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function rowToBooking(row) {
  return {
    id: Number(row.id),
    schoolName: row.schoolName ?? '',
    contactName: row.contactName ?? '',
    contactPhone1: row.contactPhone1 ?? '',
    contactPhone2: row.contactPhone2 ?? '',
    studentsCount: Number(row.studentsCount) || 0,
    teachersCount: Number(row.teachersCount) || 0,
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
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  };
}

function normalizeInput(record = {}) {
  return {
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
  };
}

async function migrateLegacyBookingsIfNeeded() {
  const [[countRow]] = await pool.query('SELECT COUNT(*) AS count FROM bookings');
  if (Number(countRow.count) > 0) return;

  const legacy = loadLegacyBookings();
  if (legacy.length === 0) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const row of legacy) {
      const normalized = normalizeInput(row);
      const createdAt = String(row.createdAt ?? new Date().toISOString());
      const updatedAt = String(row.updatedAt ?? createdAt);

      await conn.execute(
        `INSERT INTO bookings (
          id, schoolName, contactName, contactPhone1, contactPhone2,
          studentsCount, teachersCount, gradeLevel,
          serviceAQ, serviceSnow, serviceWaterPark, serviceDino,
          receiverName, bookingReceivedAt, remarks, visitDate, visitTime,
          status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(row.id) || null,
          normalized.schoolName,
          normalized.contactName,
          normalized.contactPhone1,
          normalized.contactPhone2,
          normalized.studentsCount,
          normalized.teachersCount,
          normalized.gradeLevel,
          normalized.serviceAQ,
          normalized.serviceSnow,
          normalized.serviceWaterPark,
          normalized.serviceDino,
          normalized.receiverName,
          normalized.bookingReceivedAt,
          normalized.remarks,
          normalized.visitDate,
          normalized.visitTime,
          normalized.status,
          createdAt,
          updatedAt,
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
}

export async function initializeBookingDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      schoolName TEXT NOT NULL,
      contactName VARCHAR(255) NOT NULL DEFAULT '',
      contactPhone1 VARCHAR(50) NOT NULL DEFAULT '',
      contactPhone2 VARCHAR(50) NOT NULL DEFAULT '',
      studentsCount INT NOT NULL DEFAULT 0,
      teachersCount INT NOT NULL DEFAULT 0,
      gradeLevel VARCHAR(255) NOT NULL DEFAULT '',
      serviceAQ TINYINT(1) NOT NULL DEFAULT 0,
      serviceSnow TINYINT(1) NOT NULL DEFAULT 0,
      serviceWaterPark TINYINT(1) NOT NULL DEFAULT 0,
      serviceDino TINYINT(1) NOT NULL DEFAULT 0,
      receiverName VARCHAR(255) NOT NULL DEFAULT '',
      bookingReceivedAt VARCHAR(30) NOT NULL DEFAULT '',
      remarks TEXT NOT NULL,
      visitDate VARCHAR(30) NOT NULL DEFAULT '',
      visitTime VARCHAR(30) NOT NULL DEFAULT '',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      createdAt VARCHAR(30) NOT NULL,
      updatedAt VARCHAR(30) NOT NULL,
      INDEX idx_bookings_status (status),
      INDEX idx_bookings_booking_date (bookingReceivedAt),
      INDEX idx_bookings_visit_date (visitDate)
    )
  `);

  await migrateLegacyBookingsIfNeeded();
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeBookingDb();
  }
  return initPromise;
}

export async function getAllBookings() {
  await ensureInitialized();
  const [rows] = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
  return rows.map(rowToBooking);
}

export async function getBookingById(id) {
  await ensureInitialized();
  const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
  if (!rows[0]) return null;
  return rowToBooking(rows[0]);
}

export async function createBooking(record) {
  await ensureInitialized();
  const normalized = normalizeInput(record);
  const now = new Date().toISOString();

  const [result] = await pool.execute(
    `INSERT INTO bookings (
      schoolName, contactName, contactPhone1, contactPhone2,
      studentsCount, teachersCount, gradeLevel,
      serviceAQ, serviceSnow, serviceWaterPark, serviceDino,
      receiverName, bookingReceivedAt, remarks, visitDate, visitTime,
      status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalized.schoolName,
      normalized.contactName,
      normalized.contactPhone1,
      normalized.contactPhone2,
      normalized.studentsCount,
      normalized.teachersCount,
      normalized.gradeLevel,
      normalized.serviceAQ,
      normalized.serviceSnow,
      normalized.serviceWaterPark,
      normalized.serviceDino,
      normalized.receiverName,
      normalized.bookingReceivedAt,
      normalized.remarks,
      normalized.visitDate,
      normalized.visitTime,
      normalized.status,
      now,
      now,
    ]
  );

  return getBookingById(result.insertId);
}

export async function updateBooking(id, record) {
  await ensureInitialized();
  const existing = await getBookingById(id);
  if (!existing) return null;

  const normalized = normalizeInput(record);
  const now = new Date().toISOString();

  await pool.execute(
    `UPDATE bookings SET
      schoolName = ?,
      contactName = ?,
      contactPhone1 = ?,
      contactPhone2 = ?,
      studentsCount = ?,
      teachersCount = ?,
      gradeLevel = ?,
      serviceAQ = ?,
      serviceSnow = ?,
      serviceWaterPark = ?,
      serviceDino = ?,
      receiverName = ?,
      bookingReceivedAt = ?,
      remarks = ?,
      visitDate = ?,
      visitTime = ?,
      status = ?,
      updatedAt = ?
     WHERE id = ?`,
    [
      normalized.schoolName,
      normalized.contactName,
      normalized.contactPhone1,
      normalized.contactPhone2,
      normalized.studentsCount,
      normalized.teachersCount,
      normalized.gradeLevel,
      normalized.serviceAQ,
      normalized.serviceSnow,
      normalized.serviceWaterPark,
      normalized.serviceDino,
      normalized.receiverName,
      normalized.bookingReceivedAt,
      normalized.remarks,
      normalized.visitDate,
      normalized.visitTime,
      normalized.status,
      now,
      Number(id),
    ]
  );

  return getBookingById(id);
}

export async function deleteBookingById(id) {
  await ensureInitialized();
  const [result] = await pool.execute('DELETE FROM bookings WHERE id = ?', [Number(id)]);
  return Number(result.affectedRows) > 0;
}

export async function searchBookings(q) {
  await ensureInitialized();
  const term = String(q ?? '').trim();
  if (!term) return getAllBookings();
  const like = `%${term}%`;

  const [rows] = await pool.execute(
    `SELECT * FROM bookings
     WHERE schoolName LIKE ?
        OR contactName LIKE ?
        OR contactPhone1 LIKE ?
        OR contactPhone2 LIKE ?
        OR remarks LIKE ?
     ORDER BY id DESC`,
    [like, like, like, like, like]
  );

  return rows.map(rowToBooking);
}
