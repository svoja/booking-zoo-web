import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import BookingFeatureLayout from './components/BookingFeatureLayout';
import EvaluationFeatureLayout from './components/EvaluationFeatureLayout';
import QuizFeatureLayout from './components/QuizFeatureLayout';
import BookingForm from './pages/BookingForm';
import BookingList from './pages/BookingList';
import BookingDetail from './pages/BookingDetail';
import BookingEdit from './pages/BookingEdit';
import BookingCalendar from './pages/BookingCalendar';
import BookingEvaluations from './pages/BookingEvaluations';
import EvaluationStaff from './pages/EvaluationStaff';
import PrintLetter from './pages/PrintLetter';
import Dashboard from './pages/Dashboard';
import SystemHome from './pages/SystemHome';
import QuizStaff from './pages/QuizStaff';
import QuizStudent from './pages/QuizStudent';
import QuizPublicResults from './pages/QuizPublicResults';
import QuizSessionStudent from './pages/QuizSessionStudent';
import QuizSessionPublicResults from './pages/QuizSessionPublicResults';
import BookingEvaluationForm from './pages/BookingEvaluationForm';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SystemHome />} />

          <Route path="features/booking" element={<BookingFeatureLayout />}>
            <Route index element={<Navigate to="form" replace />} />
            <Route path="form" element={<BookingForm />} />
            <Route path="list" element={<BookingList />} />
            <Route path="booking/:id" element={<BookingDetail />} />
            <Route path="booking/:id/edit" element={<BookingEdit />} />
            <Route path="calendar" element={<BookingCalendar />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="print/:id" element={<PrintLetter />} />
          </Route>

          <Route path="features/evaluation" element={<EvaluationFeatureLayout />}>
            <Route index element={<EvaluationStaff />} />
            <Route path="results" element={<BookingEvaluations />} />
          </Route>

          <Route path="features/quiz" element={<QuizFeatureLayout />}>
            <Route index element={<QuizStaff />} />
          </Route>

          <Route path="dashboard" element={<Navigate to="/features/booking/dashboard" replace />} />
          <Route path="calendar" element={<Navigate to="/features/booking/calendar" replace />} />
          <Route path="list" element={<Navigate to="/features/booking/list" replace />} />
          <Route path="features/booking/evaluations" element={<Navigate to="/features/evaluation" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="/quiz/:id" element={<QuizStudent />} />
        <Route path="/quiz/:id/results" element={<QuizPublicResults />} />
        <Route path="/quiz/session/:token" element={<QuizSessionStudent />} />
        <Route path="/quiz/session/:token/results" element={<QuizSessionPublicResults />} />
        <Route path="/evaluation/booking/:id" element={<BookingEvaluationForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
