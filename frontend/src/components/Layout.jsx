import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  const [showQr, setShowQr] = useState(true);

  return (
    <>
      <header className="layout-header no-print">
        <div className="layout-inner">
          <NavLink to="/" className="logo">
            <span className="material-symbols-outlined logo-icon" aria-hidden>pets</span>
            <span>ZOOCLASS</span>
          </NavLink>
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>

      <div className="site-qr-wrap no-print">
        <div className="site-qr">
          <p className="site-qr-title flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined app-icon" aria-hidden>qr_code_2</span>
            <span>สแกน QR เพื่อเข้าเว็บจอง</span>
          </p>
          {showQr ? (
            <img
              src="/qr-web.png"
              alt="คิวอาร์โค้ดสำหรับหน้าเว็บจอง"
              className="site-qr-image"
              onError={() => setShowQr(false)}
            />
          ) : (
            <p className="site-qr-hint">เพิ่มไฟล์ QR ที่ frontend/public/qr-web.png</p>
          )}
        </div>
      </div>
    </>
  );
}
