export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

// Utilitaire pour construire les URLs des fichiers uploadés
export function getFileUrl(fileUrl: string | null | undefined): string | null {
    if (!fileUrl) return null;
    
    // Si l'URL est déjà complète (commence par http), la retourner telle quelle
    if (fileUrl.startsWith('http')) {
        return fileUrl;
    }
    
    // Utiliser toujours l'URL du backend pour les fichiers
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    
    // Si l'URL commence par /api/uploads, corriger en /uploads
    if (fileUrl.startsWith('/api/uploads/')) {
        const correctedUrl = fileUrl.replace('/api/uploads', '/uploads');
        return `${backendBaseUrl}${correctedUrl}`;
    }
    
    // Sinon, construire l'URL complète avec le backend
    return `${backendBaseUrl}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}
