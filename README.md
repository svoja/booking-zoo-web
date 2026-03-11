# Zoo Booking Web

ระบบจัดการการจองเข้าชม + Quiz + แบบประเมินหลังเข้าชม

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL 8
- Deploy: Docker Compose

## Development

```bash
# backend
npm --prefix backend install
npm --prefix backend run dev

# frontend
npm --prefix frontend install
npm --prefix frontend run dev
```

## Production (Docker)

1) สร้างไฟล์ env จาก template

```bash
cp .env.production.example .env
```

2) แก้ค่าความลับใน `.env`

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- (ถ้าต้องแชร์ลิงก์) `VITE_PUBLIC_BASE_URL`
- (ถ้า API ต้องรับข้ามโดเมน) `CORS_ORIGIN`

3) Build/Run

```bash
docker compose up -d --build
```

4) ดู log

```bash
docker compose logs -f app mysql
```

## Notes

- MySQL ไม่เปิดพอร์ตออกภายนอกในค่าเริ่มต้น (ปลอดภัยกว่า)
- phpMyAdmin ถูกตั้งเป็น profile `admin` (ไม่รันโดย default)
  - เปิดใช้เมื่อจำเป็นเท่านั้น:

```bash
docker compose --profile admin up -d phpmyadmin
```

## Main URLs

- App/API: `http://<host>:3001`
- phpMyAdmin (เมื่อเปิด profile admin): `http://<host>:8080`
