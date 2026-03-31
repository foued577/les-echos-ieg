import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ 
  src, 
  alt, 
  size = 'medium', 
  className = '',
  showFallback = true,
  fallbackText = null 
}) => {
  // Tailles prédéfinies
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-10 h-10',
    medium: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24',
    '3xl': 'w-32 h-32'
  };

  const finalSize = sizeClasses[size] || sizeClasses.medium;
  const baseClasses = 'rounded-full object-cover flex-shrink-0';
  const combinedClasses = `${baseClasses} ${finalSize} ${className}`.trim();

  // Si pas de source et pas de fallback autorisé
  if (!src && !showFallback) {
    return null;
  }

  // Si pas de source mais fallback autorisé
  if (!src && showFallback) {
    return (
      <div className={`${combinedClasses} bg-gray-200 flex items-center justify-center`}>
        {fallbackText ? (
          <span className="text-gray-500 font-medium text-sm">
            {fallbackText.charAt(0).toUpperCase()}
          </span>
        ) : (
          <User className="w-1/2 h-1/2 text-gray-400" />
        )}
      </div>
    );
  }

  // Si source disponible
  return (
    <img
      src={src}
      alt={alt || 'Avatar'}
      className={combinedClasses}
      onError={(e) => {
        // En cas d'erreur de chargement, montrer le fallback si autorisé
        if (showFallback) {
          e.target.style.display = 'none';
          const fallback = e.target.nextSibling;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }
      }}
      onLoad={(e) => {
        // Cacher le fallback si l'image charge correctement
        const fallback = e.target.nextSibling;
        if (fallback) {
          fallback.style.display = 'none';
        }
        e.target.style.display = 'block';
      }}
    />
  );
};

export default Avatar;
