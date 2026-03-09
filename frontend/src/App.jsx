import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BookingForm from './pages/BookingForm';
import BookingList from './pages/BookingList';
import BookingDetail from './pages/BookingDetail';
import BookingEdit from './pages/BookingEdit';
import BookingCalendar from './pages/BookingCalendar';
import PrintLetter from './pages/PrintLetter';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/print/:id" element={<PrintLetter />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<BookingForm />} />
          <Route path="list" element={<BookingList />} />
          <Route path="booking/:id" element={<BookingDetail />} />
          <Route path="booking/:id/edit" element={<BookingEdit />} />
          <Route path="calendar" element={<BookingCalendar />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
