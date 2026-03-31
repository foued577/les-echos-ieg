import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Check, AlertCircle } from 'lucide-react';

const ProfileImageUpload = ({ 
  currentAvatar, 
  userName, 
  onImageUpdate, 
  size = 'medium' 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Tailles de l'avatar
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24', 
    large: 'w-32 h-32'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format de fichier non autorisé. Utilisez JPG, JPEG, PNG ou WebP.');
      return;
    }

    // Validation de la taille (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Fichier trop volumineux. Maximum 5MB autorisé.');
      return;
    }

    // Créer l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setError(null);
      setSuccess(false);
    };
    reader.readAsDataURL(file);

    // Uploader l'image
    uploadImage(file);
  };

  const uploadImage = async (file) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const API_BASE_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname.includes('les-echos-ieg-front.onrender.com')
          ? 'https://les-echos-ieg.onrender.com/api'
          : 'http://localhost:5000/api');

      const token = localStorage.getItem('auth_token');
      
      console.log('📸=== UPLOADING PROFILE IMAGE ===');
      console.log('📸 File:', file.name, file.type, file.size);

      const response = await fetch(`${API_BASE_URL}/users/profile/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('📸 Upload response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        setPreview(null);
        
        // Mettre à jour l'avatar dans le state parent
        if (onImageUpdate) {
          onImageUpdate(data.data.avatar_url);
        }

        // Mettre à jour le localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.avatar = data.data.avatar_url;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.message || 'Erreur lors de l\'upload');
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      setError(error.message || 'Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar actuel ou aperçu */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg`}>
          {preview ? (
            <img 
              src={preview} 
              alt="Aperçu" 
              className="w-full h-full object-cover"
            />
          ) : currentAvatar ? (
            <img 
              src={currentAvatar} 
              alt={userName || 'Avatar'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <User className="w-1/2 h-1/2 text-gray-400" />
            </div>
          )}
        </div>

        {/* Bouton d'upload */}
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Changer la photo de profil"
        >
          {isUploading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>

        {/* Bouton pour annuler l'aperçu */}
        {preview && (
          <button
            onClick={clearPreview}
            className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full shadow-lg hover:bg-red-700 transition-colors"
            title="Annuler"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Messages */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg max-w-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg max-w-xs">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Photo de profil mise à jour avec succès !</span>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 max-w-xs">
        <p>Cliquez sur l'appareil photo pour changer votre photo</p>
        <p className="text-xs mt-1">Formats: JPG, PNG, WebP (max 5MB)</p>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
