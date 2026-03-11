import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  const [showQr, setShowQr] = useState(true);

  return (
    <>
      <header className="layout-header no-print">
        <div className="layout-inner">
          <NavLink to="/" className="logo">
            <span className="logo-icon" aria-hidden>🦒</span>
            <span>ZOOCLASS</span>
          </NavLink>
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>

      <div className="site-qr-wrap no-print">
        <div className="site-qr">
          <p className="site-qr-title">สแกน QR เพื่อเข้าเว็บจอง</p>
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
