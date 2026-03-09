import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  const [showQr, setShowQr] = useState(true);

  return (
    <>
<header className="layout-header no-print">
  <div className="layout-inner">
    <NavLink to="/" className="logo">
      <span className="logo-icon" aria-hidden>🦒</span>
      <span>จองเข้าชม สวนสัตว์เชียงใหม่</span>
    </NavLink>
          <nav>
            <NavLink to="/dashboard">แดชบอร์ด</NavLink>
            <NavLink to="/" end>ฟอร์มจอง</NavLink>
            <NavLink to="/list">รายการจอง</NavLink>
            <NavLink to="/calendar">รายการตามวัน</NavLink>
          </nav>
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
              alt="QR Code สำหรับเข้าเว็บจอง"
              className="site-qr-image"
              onError={() => setShowQr(false)}
            />
          ) : (
            <p className="site-qr-hint">เพิ่มไฟล์ QR ที่ `frontend/public/qr-web.png`</p>
          )}
        </div>
      </div>
    </>
  );
}
