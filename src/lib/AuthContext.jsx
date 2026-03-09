import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('currentUser');
      
      console.log('🔍 Checking auth on startup...');
      console.log('🔑 Token found:', !!token);
      console.log('👤 User data found:', !!userData);

      if (token && userData) {
        // Set authenticated immediately to avoid redirect loops
        setIsAuthenticated(true);
        
        // Try to get role from JWT token first
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔑 JWT payload:', tokenPayload);
          
          const parsedUserData = JSON.parse(userData);
          const userWithRole = {
            ...parsedUserData,
            role: tokenPayload.role || parsedUserData.role
          };
          
          console.log('👤 Final user data:', userWithRole);
          setUser(userWithRole);
        } catch (tokenError) {
          console.log('⚠️ Could not decode JWT, using localStorage data');
          setUser(JSON.parse(userData));
        }
        
        // Then verify with backend
        console.log('🔐 Verifying token with backend...');
        const response = await authAPI.getMe();
        console.log('📥 Backend verification response:', response);
        
        if (response.success) {
          console.log('✅ Token valid, user confirmed:', response.data);
          setUser(response.data);
        } else {
          // Token invalide, nettoyer le stockage
          console.log('❌ Token invalid, cleaning storage');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('currentUser');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('⚠️ No token or user data found');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('💥 Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('currentUser');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      console.log('🔐 Auth API response:', response);
      
      if (response.success) {
        const { data } = response;
        
        // Stocker le token et les données utilisateur
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('currentUser', JSON.stringify({
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar
        }));
        
        console.log('💾 Token stored:', data.token.substring(0, 20) + '...');
        console.log('👤 User stored:', { id: data._id, name: data.name, role: data.role });
        
        setUser({
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar
        });
        setIsAuthenticated(true);
        
        console.log('✅ AuthContext state updated:', { 
          isAuthenticated: true, 
          user: { id: data._id, name: data.name, role: data.role }
        });
        
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  };

  const signup = async (name, email, password, role = 'MEMBER') => {
    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        role
      });

      if (response.success) {
        // Auto-login après inscription
        return await login(email, password);
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur lors de l\'inscription' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading,
      login,
      signup,
      logout,
      navigateToLogin,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
