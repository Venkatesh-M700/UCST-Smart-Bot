import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Route } from '@/types/route';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  onNavigate: (route: Route) => void;
}

export function ProtectedRoute({ children, requireAdmin, onNavigate }: ProtectedRouteProps) {
  const { isAuthed, isAdmin } = useAuth();

  if (!isAuthed) {
    onNavigate('login');
    return null;
  }

  if (requireAdmin && !isAdmin) {
    onNavigate('chatbot');
    return null;
  }

  return <>{children}</>;
}

interface PublicOnlyRouteProps {
  children: ReactNode;
  onNavigate: (route: Route) => void;
  redirectTo?: Route;
}

export function PublicOnlyRoute({ children, onNavigate, redirectTo = 'chatbot' }: PublicOnlyRouteProps) {
  const { isAuthed } = useAuth();

  if (isAuthed) {
    onNavigate(redirectTo);
    return null;
  }

  return <>{children}</>;
}
