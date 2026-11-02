import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentSubjectsHome from './pages/StudentSubjectsHome';
import SubjectDashboard from './pages/SubjectDashboard';
import TakeAssessment from './pages/TakeAssessment';
import AttemptResult from './pages/AttemptResult';
import StudentProgress from './pages/StudentProgress';
import TopicProgressDetail from './pages/TopicProgressDetail';
import TeacherHome from './pages/TeacherHome';
import AdminHome from './pages/AdminHome';

/**
 * Main application router wiring:
 * - Public: /, /login, /signup
 * - Protected:
 *    /student (STUDENT role)
 *    /teacher (TEACHER role)
 *    /admin   (ADMIN role)
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Role-Based Portals */}
            {/* Student "My Subjects" Dashboard */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <StudentSubjectsHome />
                </ProtectedRoute>
              }
            />

            {/* Subject-Scoped Student Routes */}
            <Route
              path="/student/subjects/:subjectId"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <SubjectDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects/:subjectId/assessments/:id/take"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <TakeAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects/:subjectId/attempts/:id/result"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <AttemptResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects/:subjectId/progress"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <StudentProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects/:subjectId/progress/topics/:id"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <TopicProgressDetail />
                </ProtectedRoute>
              }
            />

            {/* Legacy / Direct Student Routes (backward-compatible) */}
            <Route
              path="/student/assessments/:id/take"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <TakeAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attempts/:id/result"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <AttemptResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/progress"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <StudentProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/progress/topics/:id"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <TopicProgressDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherHome />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminHome />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
