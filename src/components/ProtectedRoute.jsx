import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const ProtectedRoute = ({ children }) => {
  console.log('🛡️=== PROTECTED ROUTE COMPONENT LOADED ===');
  const { isAuthenticated, loading } = useAuth();

  // Vérifier d'abord le localStorage pour éviter les redirections infinies
  const hasToken = localStorage.getItem('auth_token');
  const hasUser = localStorage.getItem('currentUser');

  console.log('🛡️=== PROTECTED ROUTE CHECK ===');
  console.log('🛡️ hasToken:', !!hasToken);
  console.log('🛡️ hasUser:', !!hasUser);
  console.log('🛡️ isAuthenticated:', isAuthenticated);
  console.log('🛡️ loading:', loading);
  console.log('🛡️ localStorage content:', {
    auth_token: localStorage.getItem('auth_token'),
    currentUser: localStorage.getItem('currentUser')
  });

  // Si pas de token ou user, rediriger vers login
  if (!hasToken || !hasUser) {
    console.log('🚪=== REDIRECTING TO LOGIN ===');
    console.log('🚪 Reason:', !hasToken ? 'No token' : 'No user data');
    return <Navigate to="/login" replace />;
  }

  // Si authentification en cours, attendre
  if (loading) {
    console.log('⏳=== AUTH LOADING ===');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  console.log('✅=== ACCESS GRANTED ===');
  return children;
};

export default ProtectedRoute;
