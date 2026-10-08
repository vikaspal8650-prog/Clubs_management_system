import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * RoleRoute Component
 * Specialized role-based authorization guard wrapper
 */
export const RoleRoute = ({ children, allowedRoles = [] }) => {
  return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
};

export default RoleRoute;
