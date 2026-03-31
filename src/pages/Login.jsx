import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { createPageUrl } from '../utils';
import { APP_NAME } from '../config/app';
import { ArrowLeft, Eye, EyeOff, Check, X, Mail, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  console.log('=== LOGIN COMPONENT LOADED ===');
  
  // États
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Refs pour animations et focus
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const formRef = useRef(null);
  
  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Animation d'entrée
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Focus intelligent sur email au chargement
  useEffect(() => {
    if (emailRef.current && !loading) {
      emailRef.current.focus();
    }
  }, [loading]);

  // Validation en temps réel
  useEffect(() => {
    const errors = {};
    
    // Validation email
    if (email && !isValidEmail(email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    // Validation mot de passe
    if (password && password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setFieldErrors(errors);
    
    // Validation globale du formulaire
    const valid = email && password && isValidEmail(email) && password.length >= 6 && !loading;
    setIsFormValid(valid);
  }, [email, password, loading]);

  // Validation email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Gestion des changements
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError(''); // Effacer l'erreur générale
    
    // Passer au mot de passe si email valide
    if (isValidEmail(value) && passwordRef.current) {
      setTimeout(() => passwordRef.current.focus(), 100);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(''); // Effacer l'erreur générale
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      console.log('🔐=== LOGIN START ===');
      console.log('🔐 Login attempt with:', { email, password: '***', rememberMe });
      
      const result = await login(email, password);
      console.log('📥 Login result:', result);
      
      if (result.success) {
        console.log('✅=== LOGIN SUCCESS ===');
        
        // Sauvegarder préférence "se souvenir de moi"
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('lastEmail', email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('lastEmail');
        }
        
        // Redirection intelligente
        const from = location.state?.from?.pathname || '/';
        console.log('🚀=== REDIRECTING TO ===', from);
        
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } else {
        console.log('❌=== LOGIN FAILED ===');
        setError(result.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('💥=== LOGIN ERROR ===');
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // Gestion touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isFormValid) {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center px-4 overflow-hidden">
      {/* Background décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-200/20 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className={`absolute top-6 left-6 transition-all duration-700 ${isAnimating ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}>
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="hover:bg-white/80 transition-all duration-300 shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </Link>
      </div>

      {/* Main container */}
      <div 
        ref={formRef}
        className={`w-full max-w-[420px] transition-all duration-1000 transform ${isAnimating ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
      >
        {/* Card principale */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Header */}
          <div className={`text-center mb-8 transition-all duration-700 delay-100 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-gray-600 text-lg font-light">
              Bon retour parmi nous
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
            {/* Message d'erreur général */}
            <div className={`transition-all duration-500 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              {error && (
                <div className="bg-red-50/80 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className={`space-y-2 transition-all duration-700 delay-200 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Email
              </label>
              <div className="relative">
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                  className={`w-full h-12 px-4 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 rounded-xl ${
                    fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                  } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {email && !fieldErrors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Check className="w-5 h-5 text-green-500 transition-all duration-300" />
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1 animate-fade-in">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className={`space-y-2 transition-all duration-700 delay-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className={`w-full h-12 px-4 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 rounded-xl ${
                    fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                  } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-all duration-300 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1 animate-fade-in">{fieldErrors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className={`flex items-center justify-between transition-all duration-700 delay-400 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  Se souvenir de moi
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className={`transition-all duration-700 delay-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Se connecter
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className={`text-center mt-8 pt-6 border-t border-gray-100 transition-all duration-700 delay-600 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <p className="text-gray-600 text-sm">
              Pas encore de compte ?{' '}
              <Link 
                to={createPageUrl('Signup')} 
                className="font-medium text-blue-600 hover:text-blue-700 underline transition-colors duration-300"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer additionnel */}
        <div className={`text-center mt-6 transition-all duration-700 delay-700 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <p className="text-xs text-gray-500">
            En vous connectant, vous acceptez nos{' '}
            <Link to="/terms" className="text-gray-700 hover:text-gray-900 underline transition-colors">
              conditions d'utilisation
            </Link>
            {' '}et notre{' '}
            <Link to="/privacy" className="text-gray-700 hover:text-gray-900 underline transition-colors">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>

      {/* Styles pour animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
