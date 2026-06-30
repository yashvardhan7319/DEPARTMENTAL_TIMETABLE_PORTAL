import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  if (user.role === 'ADMIN')   return <Navigate to="/admin"   replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/faculty" element={
            <ProtectedRoute roles={['FACULTY']}>
              <FacultyDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute roles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        theme="colored"
        toastStyle={{ borderRadius: '12px' }}
      />
    </AuthProvider>
  );
}