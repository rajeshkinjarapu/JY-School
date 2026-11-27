import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import type { Role } from '../types';
import { getCachedRbacMatrix, resolveModuleFromRoutePath, type RbacRole } from '../utils/rbac';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

const MANAGED_STAFF_ROLES: RbacRole[] = ['ADMIN', 'ACCOUNTANT', 'TEACHER', 'TRANSPORT_MANAGER', 'SECURITY'];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [matrix, setMatrix] = useState(getCachedRbacMatrix);

  useEffect(() => {
    const handleRefresh = () => setMatrix(getCachedRbacMatrix());
    window.addEventListener('rbacMatrixUpdated', handleRefresh);
    return () => window.removeEventListener('rbacMatrixUpdated', handleRefresh);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (location.pathname === '/admissions/register') {
      return <Navigate to="/apply" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return children;
  }

  const modKey = resolveModuleFromRoutePath(location.pathname);
  if (modKey && MANAGED_STAFF_ROLES.includes(user.role as RbacRole)) {
    const level = matrix[modKey]?.[user.role as RbacRole];
    if (level === 'None') {
      return <Navigate to="/dashboard" replace />;
    }
    if (level === 'Full' || level === 'Manage' || level === 'View') {
      return children;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
export default ProtectedRoute;
