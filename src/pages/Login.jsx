import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { createPageUrl } from '../utils';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  console.log('🔥=== LOGIN COMPONENT LOADED ===');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐=== LOGIN START ===');
      console.log('🔐 Login attempt with:', { email, password: '***' });
      
      const result = await login(email, password);
      console.log('📥 Login result:', result);
      
      if (result.success) {
        console.log('✅=== LOGIN SUCCESS ===');
        console.log('🔑 Token in localStorage:', localStorage.getItem('auth_token'));
        console.log('👤 User in localStorage:', localStorage.getItem('currentUser'));
        
        // Attendre un peu pour s'assurer que l'état est mis à jour
        setTimeout(() => {
          console.log('🚀=== REDIRECTING ===');
          console.log('🔑 Final token check:', localStorage.getItem('auth_token'));
          console.log('👤 Final user check:', localStorage.getItem('currentUser'));
          window.location.replace('/');
        }, 500);
      } else {
        console.log('❌=== LOGIN FAILED ===');
        console.log('❌ Login failed:', result.message);
        setError(result.message || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('💥=== LOGIN ERROR ===');
      console.error('💥 Login error:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px)`,
        }} />
      </div>
      
      {/* Floating accent elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-50 rounded-full filter blur-3xl opacity-20" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-stone-100 rounded-full filter blur-3xl opacity-30" />
      
      {/* Main content */}
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <div className="mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="group hover:bg-white/80 transition-all duration-200">
              <ArrowLeft className="w-5 h-5 text-stone-600 group-hover:text-stone-900 transition-colors" />
            </Button>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-stone-200/60 rounded-2xl shadow-xl shadow-stone-900/10 p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Logo/Brand */}
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-bold text-stone-900 tracking-tight">
                Les Échos de IEG
              </h1>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-stone-300 to-transparent mx-auto" />
            </div>
            
            {/* Login title */}
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-semibold text-stone-800">
                Connexion
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                Accédez à votre espace éditorial
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl backdrop-blur-sm">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="h-12 px-4 bg-stone-50/50 border-stone-200/60 focus:border-stone-400 focus:ring-stone-400/20 transition-all duration-200 rounded-xl"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••"
                    required
                    className="h-12 px-4 pr-12 bg-stone-50/50 border-stone-200/60 focus:border-stone-400 focus:ring-stone-400/20 transition-all duration-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-stone-900/20 hover:shadow-stone-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-stone-200/60">
            <p className="text-stone-600 text-sm">
              Pas encore de compte ?{' '}
              <Link 
                to={createPageUrl('Signup')} 
                className="font-medium text-stone-900 hover:text-stone-700 underline decoration-2 underline-offset-4 decoration-stone-900/50 hover:decoration-stone-700 transition-all duration-200"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="mt-8 text-center">
          <p className="text-stone-500 text-xs">
            Plateforme éditoriale • IEG
          </p>
        </div>
      </div>
    </div>
  );
}
