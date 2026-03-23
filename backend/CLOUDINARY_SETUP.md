# Configuration Cloudinary pour le stockage persistant

## Problèmes résolus

### 1. Fichiers qui disparaissent au redémarrage ✅
**Cause** : Stockage local sur Render (temporaire)  
**Solution** : Stockage persistant sur Cloudinary

### 2. PDF qui s'affichent au lieu de se télécharger ✅  
**Cause** : URLs Cloudinary sans `fl_attachment`  
**Solution** : `buildDownloadUrl()` ajoute `/fl_attachment/`

### 3. Erreur 401 Unauthorized ✅
**Cause** : Fichiers uploadés avec `type: 'authenticated'` (privés)  
**Solution** : `type: 'upload'` pour rendre les fichiers publics

### 4. Erreur 401 sur fl_attachment ✅
**Cause** : Cloudinary bloque les transformations non signées (Strict Transformations)  
**Solution** : 
1. **Désactiver Strict Transformations** dans Cloudinary > Settings > Security
2. **Uploader PDFs en `raw`** au lieu de `image`

## Solution implémentée
- Stockage des fichiers sur Cloudinary (persistant)
- URLs Cloudinary sauvegardées en base de données
- Debug complet pour diagnostiquer les uploads
- Téléchargement forcé avec `fl_attachment` pour les PDF

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
- Le frontend utilise `buildDownloadUrl(fileUrl)` pour les fichiers Cloudinary
- Nouveauté: Ajout automatique de `fl_attachment` pour forcer le téléchargement
- **PDFs/Documents** : Upload en `raw` → URLs `/raw/upload/` → `/raw/upload/fl_attachment/`
- **Images** : Upload en `auto` → URLs `/image/upload/` → `/image/upload/fl_attachment/`
- **Important**: `type: 'upload'` rend les fichiers publics (évite 401)

### Configuration Cloudinary avancée
```javascript
// backend/config/cloudinary.js
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    const isDocument = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                       'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.mimetype);
    
    return {
      folder: 'les-echos-ieg-files',
      resource_type: isPdf || isDocument ? 'raw' : 'auto', // PDFs et documents en 'raw'
      type: 'upload', // ✅ PUBLIC
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    };
  }
});
```

### Exemples d'URL

#### URL Cloudinary standard (affichage)
```
Images: https://res.cloudinary.com/dt0gn8fbc/image/upload/v1774264650/les-echos-ieg-files/document.jpg
PDFs:   https://res.cloudinary.com/dt0gn8fbc/raw/upload/v1774264650/les-echos-ieg-files/document.pdf
```

#### URL Cloudinary avec téléchargement forcé
```
Images: https://res.cloudinary.com/dt0gn8fbc/image/upload/fl_attachment/v1774264650/les-echos-ieg-files/document.jpg
PDFs:   https://res.cloudinary.com/dt0gn8fbc/raw/upload/fl_attachment/v1774264650/les-echos-ieg-files/document.pdf
```

### Debug
- Logs détaillés dans la console backend et frontend
- Vérification de l'existence des fichiers
- Traçabilité complète des uploads/accès

## Fichiers modifiés

- `backend/config/cloudinary.js` - Configuration Cloudinary
- `backend/routes/contentRoutes.js` - Storage Cloudinary
- `backend/controllers/contentController.js` - URL Cloudinary
- `backend/server.js` - Debug middleware
- `src/services/api.js` - Nouveau: `buildDownloadUrl()`
- `src/pages/TeamDetail.jsx` - Debug frontend et téléchargement Cloudinary
- `src/components/content/ContentCard.jsx` - Téléchargement Cloudinary
- `src/pages/Kanban.jsx` - Téléchargement Cloudinary
- `src/pages/KanbanOld.jsx` - Téléchargement Cloudinary
- `src/pages/Moderation.jsx` - Téléchargement Cloudinary
- `src/pages/ContentDetail.jsx` - Téléchargement Cloudinary
- `src/components/moderation/ModerationCard.jsx` - Téléchargement Cloudinary

## Test

1. Uploader un fichier de type "fichier"
2. Vérifier les logs backend pour l'URL Cloudinary
3. Vérifier en base que `file_url` contient l'URL Cloudinary
4. Tester le téléchargement du fichier (PDF doit se télécharger, pas s'afficher)
5. Redémarrer le serveur et vérifier que l'accès fonctionne toujours

## Dépannage

### Erreur 401 Unauthorized
**Symptôme** : L'URL avec `fl_attachment` retourne 401  
**Cause** : Fichiers uploadés avec `type: 'authenticated'` (privés)  
**Solution** : Vérifier que `backend/config/cloudinary.js` contient :
```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'les-echos-ieg-files',
    resource_type: 'auto',
    type: 'upload', // ✅ PUBLIC
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  }
});
```

### Erreur 401 sur transformation fl_attachment
**Symptôme** : L'URL `/image/upload/fl_attachment/` retourne 401  
**Cause** : Cloudinary bloque les transformations non signées (Strict Transformations activé)  
**Solution** : 
1. **Dans Cloudinary Dashboard** :
   - Settings → Security → Strict Transformations → **OFF**
   - Ou : Product environment settings → Security → Transformations → **OFF**
2. **Configuration backend** : Upload PDFs en `raw` (déjà fait)
3. **URLs correctes** : Utiliser `/raw/upload/fl_attachment/` pour les PDFs

### Après correction
1. Redéployer le backend
2. **Re-uploader les fichiers** (les anciens resteront privés/incorrects)
3. Tester avec un nouveau fichier

## Problème spécifique résolu

### Avant
```
PDF Cloudinary → Affichage dans l'onglet → Erreur "Échec de chargement du document PDF"
```

### Après
```
PDF Cloudinary → fl_attachment → Téléchargement direct → Fonctionne parfaitement
