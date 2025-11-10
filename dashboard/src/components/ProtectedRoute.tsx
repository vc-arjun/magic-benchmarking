'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGate } from './AuthGate';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authenticate } = useAuth();

  if (!isAuthenticated) {
    return <AuthGate onAuthenticate={authenticate} />;
  }

  return <>{children}</>;
};

