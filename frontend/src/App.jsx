import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import DetectionPage from './pages/DetectionPage';
import WeatherPage from './pages/WeatherPage';
import MandiPage from './pages/MandiPage';

function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return children;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/predict" element={
          <ProtectedRoute><PredictionPage /></ProtectedRoute>
        } />
        <Route path="/detect" element={
          <ProtectedRoute><DetectionPage /></ProtectedRoute>
        } />
        <Route path="/weather" element={
          <ProtectedRoute><WeatherPage /></ProtectedRoute>
        } />
        <Route path="/mandi" element={
          <ProtectedRoute><MandiPage /></ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
