# ระบบจองเข้าชม สวนสัตว์เชียงใหม่ (Zoo Booking Web)

ระบบบันทึกการจองแบบผสมผสาน (Hybrid) สำหรับโครงการให้บริการความรู้ สวนสัตว์เชียงใหม่

## โครงสร้าง

- **frontend/** — React (Vite), ฟอร์มจอง + รายการจอง + รายการตามวัน + หน้ารายละเอียด + หน้ารูปแบบจดหมายสำหรับพิมพ์
- **backend/** — Node.js + Express, เก็บข้อมูลในไฟล์ JSON (ไม่ต้องติดตั้ง DB แยก)

## การรัน (พัฒนา)

### Backend

```bash
cd backend
npm install
npm run dev
```

API จะรันที่ `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173`

(Frontend ใช้ Vite proxy ไปที่ `/api` → `http://localhost:3001`)

## Push ขึ้น Server / Deploy

### 1) สร้าง Repo และ Push (Git)

```bash
git init
git add .
git commit -m "Initial: zoo booking web"
git remote add origin https://github.com/svoja/booking-zoo-web.git
git branch -M main
git push -u origin main
```

### 2) รันบน Server (หนึ่งเครื่องรันทั้งเว็บ + API)

**ตำแหน่งบน Ubuntu:** แนะนำ `/opt/zoo-booking-web`

```bash
sudo git clone https://github.com/svoja/booking-zoo-web.git /opt/zoo-booking-web
cd /opt/zoo-booking-web
# ถ้ารันด้วย user ปกติ (ไม่ใช่ root) ให้โอนเจ้าของโฟลเดอร์
# sudo chown -R $USER:$USER /opt/zoo-booking-web

npm install
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..
export NODE_ENV=production
npm start
```

(บน Windows ใช้ `set NODE_ENV=production` แทน `export`)

- แอปจะรันที่พอร์ต **3001** (หรือตามตัวแปร `PORT` ที่เซิร์ฟเวอร์กำหนด)
- เปิดเบราว์เซอร์ที่ `http://<IP หรือ domain>:3001` จะได้ทั้งหน้าเว็บและ API

หมายเหตุ: ข้อมูลจองเก็บใน `backend/bookings.json` ควรสำรองไฟล์นี้เป็นระยะ

## ฟีเจอร์

- ฟอร์มจอง: ข้อมูลโรงเรียน, ผู้ประสานงาน (2 เบอร์), จำนวน น.ร./ครู, ระดับชั้น, บริการ AQ / Snow / สวนน้ำ / Dino, ผู้รับจอง, วันที่รับจอง, วันที่/เวลาไปเยือน, หมายเหตุ
- รายการจอง: ค้นหา, แก้ไข, ลบ, ดูรายละเอียด
- รายการตามวัน: เลือกเดือน/ปี ดูว่าวันไหนมีโรงเรียนไหนมาบ้าง (เตือนเกิน 4 โรงเรียน/วัน หรือเกิน 200 คน/โรงเรียน)
- พิมพ์เอกสาร: Template จดหมายขอเข้าร่วมโครงการ สำหรับปริ้นให้ลูกค้า

## Docker Compose (App + MySQL + phpMyAdmin)

This repository now includes Docker setup with 3 services:
- `app`: Node.js backend + built frontend (served by Express) at `http://localhost:3001`
- `mysql`: MySQL 8.4 at `localhost:3306`
- `phpmyadmin`: phpMyAdmin at `http://localhost:8080`

### Start

```bash
docker compose up -d --build
```

### Stop

```bash
docker compose down
```

### Stop and remove MySQL data volume

```bash
docker compose down -v
```

### Default credentials

- MySQL root user: `root`
- MySQL root password: `root_password`
- App database: `zoo_booking`
- App user: `zoo_user`
- App password: `zoo_password`

Note: current backend code in this commit stores booking data in JSON (`backend/bookings.json`). MySQL and phpMyAdmin are provisioned and ready, but backend MySQL integration is not wired yet.
