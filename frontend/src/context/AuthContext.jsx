import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { ROLES, ROLE_ROUTES } from '../constants/roles';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authRequestVersion = useRef(0);

  // Restore only a server-validated session on refresh.
  useEffect(() => {
    let mounted = true;
    const requestVersion = authRequestVersion.current;
    const handleInvalidSession = () => {
      authRequestVersion.current += 1;
      if (mounted) { setUser(null); setLoading(false); }
    };
    window.addEventListener('ccms:session-invalid', handleInvalidSession);
    authService.fetchCurrentUser().then((currentUser) => {
      if (mounted && requestVersion === authRequestVersion.current) setUser(currentUser || null);
    }).catch(() => {
      if (mounted && requestVersion === authRequestVersion.current) setUser(null);
    }).finally(() => { if (mounted && requestVersion === authRequestVersion.current) setLoading(false); });
    return () => { mounted = false; window.removeEventListener('ccms:session-invalid', handleInvalidSession); };
  }, []);

  /**
   * Log in user
   */
  const login = useCallback(async (email, password) => {
    authRequestVersion.current += 1;
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register a new student
   */
  const registerStudent = useCallback(async (studentData) => {
    setLoading(true);
    try {
      const newStudent = await authService.registerStudent(studentData);
      return newStudent;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out user and destroy persistent session
   */
  const logout = useCallback(async () => {
    authRequestVersion.current += 1;
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper authorization checks
  const isAuthenticated = Boolean(user);
  const isDSW = user?.role === ROLES.DSW;
  const isHOD = user?.role === ROLES.HOD;
  const isFaculty = user?.role === ROLES.FACULTY_INCHARGE;
  const isStudent = user?.role === ROLES.STUDENT;
  const isCoordinator = Boolean(user?.coordinatorOfClubs?.length);

  const hasRole = useCallback(
    (requiredRole) => {
      if (!user) return false;
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(user.role);
      }
      return user.role === requiredRole;
    },
    [user]
  );

  const getHomeRouteForRole = useCallback(
    (roleToRoute = user?.role) => {
      return roleToRoute ? ROLE_ROUTES[roleToRoute] || '/login' : '/login';
    },
    [user?.role]
  );

  /**
   * Update active user session profile in AuthContext
   */
  const updateUserProfile = useCallback((updatedUserData) => {
    setUser((prev) => {
      if (!prev) return updatedUserData;
      const newUser = { ...prev, ...updatedUserData };
      // The API has already persisted this profile; keep the in-memory session in sync.
      return newUser;
    });
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    isDSW,
    isHOD,
    isFaculty,
    isStudent,
    isCoordinator,
    hasRole,
    login,
    registerStudent,
    logout,
    getHomeRouteForRole,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
