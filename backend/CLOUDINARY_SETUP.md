# Configuration Cloudinary pour le stockage persistant

## Problème résolu
Les fichiers uploadés étaient stockés localement sur le serveur Render et disparaissaient au redémarrage du service.

## Solution implémentée
- Stockage des fichiers sur Cloudinary (persistant)
- URLs Cloudinary sauvegardées en base de données
- Debug complet pour diagnostiquer les uploads

## Variables d'environnement à configurer

### Dans Render Dashboard
Ajouter ces variables dans Environment Variables:

```
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key  
CLOUDINARY_API_SECRET=votre_api_secret
```

### En local (backend/.env)
```
# Cloudinary (pour le stockage persistant des fichiers)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

## Comment obtenir les identifiants Cloudinary

1. Créer un compte sur https://cloudinary.com
2. Dans le dashboard, récupérer:
   - Cloud name
   - API Key  
   - API Secret
3. Configurer les variables d'environnement ci-dessus

## Fonctionnement

### Upload
- Les fichiers sont uploadés directement sur Cloudinary
- L'URL Cloudinaire est sauvegardée en base: `content.file_url`
- Plus de stockage local sur le serveur

### Téléchargement
- Le frontend utilise `buildFileUrl(content.file_url)`
- Si l'URL est Cloudinary: utilisation directe
- Si l'URL est locale: fallback vers le backend

### Debug
- Logs détaillés dans la console backend et frontend
- Vérification de l'existence des fichiers
- Traçabilité complète des uploads/accès

## Fichiers modifiés

- `backend/config/cloudinary.js` - Configuration Cloudinary
- `backend/routes/contentRoutes.js` - Storage Cloudinary
- `backend/controllers/contentController.js` - URL Cloudinary
- `backend/server.js` - Debug middleware
- `src/pages/TeamDetail.jsx` - Debug frontend

## Test

1. Uploader un fichier de type "fichier"
2. Vérifier les logs backend pour l'URL Cloudinary
3. Vérifier en base que `file_url` contient l'URL Cloudinary
4. Tester le téléchargement du fichier
5. Redémarrer le serveur et vérifier que l'accès fonctionne toujours
