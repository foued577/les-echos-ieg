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
    
    // Si l'URL commence par /uploads, construire l'URL complète
    if (fileUrl.startsWith('/uploads/')) {
        // En production, toujours utiliser l'origine de l'URL courante
        // Cela évite les problèmes avec VITE_API_URL qui peut contenir /api
        if (window.location.hostname !== 'localhost') {
            return `${window.location.origin}${fileUrl}`;
        }
        
        // En développement, utiliser VITE_API_URL ou localhost
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const backendBaseUrl = apiBaseUrl.replace('/api', '');
        return `${backendBaseUrl}${fileUrl}`;
    }
    
    // Sinon, retourner l'URL telle quelle
    return fileUrl;
}