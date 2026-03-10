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
    
    // Si l'URL commence par /uploads, construire l'URL complète avec la base du backend sans /api
    if (fileUrl.startsWith('/uploads/')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const backendBaseUrl = apiBaseUrl.replace('/api', '');
        return `${backendBaseUrl}${fileUrl}`;
    }
    
    // Sinon, retourner l'URL telle quelle
    return fileUrl;
}