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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Back button - positioned absolutely */}
      <div className="absolute top-6 left-6">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </Link>
      </div>

      {/* Main container */}
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            Les Échos de IEG
          </h1>
          <p className="text-gray-600 text-lg">
            Connexion
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full h-12 px-4 border-gray-200 focus:border-gray-400 focus:ring-gray-400/20 transition-colors rounded-lg"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                className="w-full h-12 px-4 pr-12 border-gray-200 focus:border-gray-400 focus:ring-gray-400/20 transition-colors rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <Link 
              to={createPageUrl('Signup')} 
              className="font-medium text-gray-900 hover:text-gray-700 underline transition-colors"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
