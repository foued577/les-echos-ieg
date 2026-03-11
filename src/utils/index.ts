export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

// Utilitaire pour construire les URLs des fichiers uploadés
export function getFileUrl(fileUrl: string | null | undefined): string | null {
    console.log('🔗 getFileUrl input:', fileUrl);
    
    if (!fileUrl) return null;
    
    // Si l'URL est déjà complète (commence par http), la retourner telle quelle
    if (fileUrl.startsWith('http')) {
        console.log('🔗 getFileUrl output (already complete):', fileUrl);
        return fileUrl;
    }
    
    // Si l'URL commence par /api/uploads, corriger en /uploads
    if (fileUrl.startsWith('/api/uploads/')) {
        const correctedUrl = fileUrl.replace('/api/uploads', '/uploads');
        console.log('🔗 Corrected /api/uploads to /uploads:', correctedUrl);
        
        // En production, toujours utiliser l'origine de l'URL courante
        if (window.location.hostname !== 'localhost') {
            const finalUrl = `${window.location.origin}${correctedUrl}`;
            console.log('🔗 getFileUrl output (production corrected):', finalUrl);
            return finalUrl;
        }
        
        // En développement, utiliser VITE_API_URL ou localhost
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const backendBaseUrl = apiBaseUrl.replace('/api', '');
        const finalUrl = `${backendBaseUrl}${correctedUrl}`;
        console.log('🔗 getFileUrl output (development corrected):', finalUrl);
        return finalUrl;
    }
    
    // Si l'URL commence par /uploads, construire l'URL complète
    if (fileUrl.startsWith('/uploads/')) {
        // En production, toujours utiliser l'origine de l'URL courante
        // Cela évite les problèmes avec VITE_API_URL qui peut contenir /api
        if (window.location.hostname !== 'localhost') {
            const finalUrl = `${window.location.origin}${fileUrl}`;
            console.log('🔗 getFileUrl output (production):', finalUrl);
            return finalUrl;
        }
        
        // En développement, utiliser VITE_API_URL ou localhost
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const backendBaseUrl = apiBaseUrl.replace('/api', '');
        const finalUrl = `${backendBaseUrl}${fileUrl}`;
        console.log('🔗 getFileUrl output (development):', finalUrl);
        return finalUrl;
    }
    
    // Sinon, retourner l'URL telle quelle
    console.log('🔗 getFileUrl output (fallback):', fileUrl);
    return fileUrl;
}