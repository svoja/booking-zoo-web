import { NavLink, Outlet } from 'react-router-dom';

export default function QuizFeatureLayout() {
  return (
    <>
      <div className="feature-nav no-print">
        <div className="feature-nav-inner">
          <NavLink to="/features/quiz" end>จัดการ Quiz</NavLink>
        </div>
      </div>
      <Outlet />
    </>
  );
}
