import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
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
    </>
  );
}
