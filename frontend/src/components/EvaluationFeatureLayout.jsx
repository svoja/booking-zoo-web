import { NavLink, Outlet } from 'react-router-dom';

export default function EvaluationFeatureLayout() {
  return (
    <>
      <div className="feature-nav no-print">
        <div className="feature-nav-inner">
          <NavLink to="/features/evaluation" end>จัดการแบบประเมิน</NavLink>
          <NavLink to="/features/evaluation/results">ผลประเมินทั้งหมด</NavLink>
        </div>
      </div>
      <Outlet />
    </>
  );
}
