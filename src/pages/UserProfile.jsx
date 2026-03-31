import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileImageUpload from '../components/ProfileImageUpload';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Charger les données utilisateur
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('les-echos-ieg-front.onrender.com')
          ? 'https://les-echos-ieg.onrender.com/api'
          : 'http://localhost:5000/api');

      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.data);
        setFormData({
          name: data.data.name || '',
          email: data.data.email || ''
        });
      } else {
        throw new Error(data.message || 'Erreur lors du chargement du profil');
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Veuillez fournir un email valide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUpdating(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('les-echos-ieg-front.onrender.com')
          ? 'https://les-echos-ieg.onrender.com/api'
          : 'http://localhost:5000/api');

      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.data);
        setFormData({
          name: data.data.name || '',
          email: data.data.email || ''
        });
        
        // Mettre à jour le localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.name = data.data.name;
        currentUser.email = data.data.email;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        toast.success('Profil mis à jour avec succès !');
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpdate = (newAvatarUrl) => {
    if (user) {
      setUser(prev => ({
        ...prev,
        avatar: newAvatarUrl
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Utilisateur non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600 mt-2">Gérez vos informations personnelles et votre photo de profil</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Photo de profil */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Photo de profil</h2>
                  <ProfileImageUpload
                    currentAvatar={user.avatar}
                    userName={user.name}
                    onImageUpdate={handleImageUpdate}
                    size="large"
                  />
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Informations personnelles</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nom */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Votre nom complet"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="votre@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Informations système (lecture seule) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Shield className="w-4 h-4 mr-2" />
                        Rôle
                      </div>
                      <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        Membre depuis
                      </div>
                      <p className="font-medium text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Bouton de sauvegarde */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Enregistrer les modifications
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
