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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="mb-8">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-stone-900">Connexion</h1>
          <p className="mt-2 text-stone-600">Accédez à votre espace IEG</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
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
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-stone-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-stone-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-stone-600">
            Pas encore de compte ?{' '}
            <Link to={createPageUrl('Signup')} className="font-medium text-stone-900 hover:text-stone-700">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
