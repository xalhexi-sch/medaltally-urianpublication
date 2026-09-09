import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactElement;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-400">
        Checking Steam session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/link" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
