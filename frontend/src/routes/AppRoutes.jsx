import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { Login } from '../pages/auth/Login';
import { RegisterStudent } from '../pages/auth/RegisterStudent';
import { DswDashboard } from '../pages/dsw/DswDashboard';
import { HodDashboard } from '../pages/hod/HodDashboard';
import { FacultyDashboard } from '../pages/faculty/FacultyDashboard';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { AttendanceMark } from '../pages/attendance/AttendanceMark';
import { Unauthorized } from '../pages/common/Unauthorized';
import { NotFound } from '../pages/common/NotFound';

export const AppRoutes = () => {
  const { user, isAuthenticated, getHomeRouteForRole } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterStudent />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/attendance/mark" element={<AttendanceMark />} />

      {/* Root Redirection */}
      <Route
        path="/"
        element={
          isAuthenticated && user ? (
            <Navigate to={getHomeRouteForRole(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Protected University Administrative & Student Portals */}
      <Route element={<AppLayout />}>
        {/* DSW Route */}
        <Route
          path="/dsw"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DSW]}>
              <DswDashboard />
            </ProtectedRoute>
          }
        />

        {/* HOD Route */}
        <Route
          path="/hod"
          element={
            <ProtectedRoute allowedRoles={[ROLES.HOD]}>
              <HodDashboard />
            </ProtectedRoute>
          }
        />

        {/* Faculty Incharge Route */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={[ROLES.FACULTY_INCHARGE]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Route (Student & Student Coordinator) */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
