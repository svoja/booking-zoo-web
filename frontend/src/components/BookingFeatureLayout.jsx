import { NavLink, Outlet } from 'react-router-dom';

export default function BookingFeatureLayout() {
  return (
    <>
      <div className="feature-nav no-print">
        <div className="feature-nav-inner">
          <NavLink to="/features/booking/form">ฟอร์มจอง</NavLink>
          <NavLink to="/features/booking/list">รายการจอง</NavLink>
          <NavLink to="/features/booking/calendar">ปฏิทินจอง</NavLink>
          <NavLink to="/features/booking/dashboard">ภาพรวมการจอง</NavLink>
        </div>
      </div>
      <Outlet />
    </>
  );
}
