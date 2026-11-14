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
import TeacherSubjects from './pages/TeacherSubjects';
import TeacherSubjectDetail from './pages/TeacherSubjectDetail';
import TeacherClassDetail from './pages/TeacherClassDetail';
import TeacherAssessmentSubmissions from './pages/TeacherAssessmentSubmissions';
import TeacherStudentDetail from './pages/TeacherStudentDetail';
import TeacherAttemptReview from './pages/TeacherAttemptReview';
import TeacherValidationHub from './pages/TeacherValidationHub';
import TeacherValidationLabeling from './pages/TeacherValidationLabeling';
import TeacherValidationReport from './pages/TeacherValidationReport';
import AdminHome from './pages/AdminHome';
import AdminValidationReport from './pages/AdminValidationReport';
import UsabilitySurvey from './pages/UsabilitySurvey';
import AdminEvaluationDashboard from './pages/AdminEvaluationDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

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
            {/* Student "My Classes" Dashboard & Class Workspace */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <StudentSubjectsHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/classes/:classId"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <SubjectDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/classes/:classId/progress"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <StudentProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/classes/:classId/progress/topics/:id"
              element={
                <ProtectedRoute allowedRole="STUDENT">
                  <TopicProgressDetail />
                </ProtectedRoute>
              }
            />

            {/* Subject-Scoped Student Routes (Backward-Compatible) */}
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
              path="/teacher/subjects"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/subjects/:subjectId"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherSubjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:id"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherClassDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/assessments/:assessmentId/submissions"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherAssessmentSubmissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/students/:studentId"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherStudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/students/:studentId/attempts/:attemptId"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherAttemptReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/validation"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherValidationHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/validation/students/:studentId"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherValidationLabeling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:classId/validation/report"
              element={
                <ProtectedRoute allowedRole="TEACHER">
                  <TeacherValidationReport />
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
            <Route
              path="/admin/validation"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminValidationReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/evaluation"
              element={
                <ProtectedRoute allowedRole="ADMIN">
                  <AdminEvaluationDashboard />
                </ProtectedRoute>
              }
            />

            {/* Super Admin Console */}
            <Route
              path="/super"
              element={
                <ProtectedRoute allowedRole="SUPER_ADMIN">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* In-App Usability Survey (Students & Teachers) */}
            <Route
              path="/feedback/survey"
              element={
                <ProtectedRoute allowedRole={['STUDENT', 'TEACHER']}>
                  <UsabilitySurvey />
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
