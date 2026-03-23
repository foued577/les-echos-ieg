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

### 4. Erreur ERR_INVALID_RESPONSE sur raw/fl_attachment ✅
**Cause** : PDFs uploadés en `raw` + transformation `fl_attachment` (non supporté)  
**Solution** : 
1. **Uploader PDFs en `image`** (pas `raw`)
2. **Ne jamais transformer** les URLs `raw/upload/`
3. **Activer PDF delivery** dans Cloudinary Security

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
- **PDFs/Images** : Upload en `image` → URLs `/image/upload/` → `/image/upload/fl_attachment/`
- **Documents** : Upload en `raw` → URLs `/raw/upload/` → **pas de transformation** (URL brute)
- **Important**: `type: 'upload'` rend les fichiers publics (évite 401)

### Configuration Cloudinary avancée
```javascript
// backend/config/cloudinary.js
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const path = require('path');
    const ext = path.extname(file.originalname).toLowerCase();
    
    const isPdf = ext === '.pdf';
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    const isDocument = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip'].includes(ext);
    
    const sanitizeFilename = (name) => {
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
        .replace(/[^a-zA-Z0-9-_]/g, '-') // Caractères autorisés
        .replace(/-+/g, '-') // Évite les doubles tirets
        .replace(/^-|-$/g, ''); // Enlève les tirets de début/fin
    };
    
    const baseName = sanitizeFilename(path.basename(file.originalname, ext));
    
    return {
      folder: 'les-echos-ieg-files',
      resource_type: isPdf || isImage ? 'image' : 'raw', // PDFs et images en 'image', autres en 'raw'
      type: 'upload', // ✅ PUBLIC
      public_id: `${Date.now()}-${baseName}${ext}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']
    };
  }
});
```

### Exemples d'URL

#### URL Cloudinary standard (affichage)
```
Images: https://res.cloudinary.com/dt0gn8fbc/image/upload/v1774264650/les-echos-ieg-files/document.jpg
PDFs:   https://res.cloudinary.com/dt0gn8fbc/image/upload/v1774264650/les-echos-ieg-files/document.pdf
Docs:   https://res.cloudinary.com/dt0gn8fbc/raw/upload/v1774264650/les-echos-ieg-files/document.docx
```

#### URL Cloudinary avec téléchargement forcé
```
Images: https://res.cloudinary.com/dt0gn8fbc/image/upload/fl_attachment/v1774264650/les-echos-ieg-files/document.jpg
PDFs:   https://res.cloudinary.com/dt0gn8fbc/image/upload/fl_attachment/v1774264650/les-echos-ieg-files/document.pdf
Docs:   https://res.cloudinary.com/dt0gn8fbc/raw/upload/v1774264650/les-echos-ieg-files/document.docx (pas de transformation)
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

### Erreur ERR_INVALID_RESPONSE sur transformation fl_attachment
**Symptôme** : L'URL `/raw/upload/fl_attachment/` retourne ERR_INVALID_RESPONSE  
**Cause** : Les fichiers `raw` ne supportent pas les transformations comme `fl_attachment`  
**Solution** : 
1. **Configuration backend** : Upload PDFs en `image` (déjà fait)
2. **buildDownloadUrl** : Ne jamais transformer les URLs `raw/upload/` (déjà fait)
3. **Cloudinary Security** : Activer "Allow delivery of PDF and ZIP files"

### Configuration Cloudinary Security
**Dans Cloudinary Dashboard** :
1. **Settings** → **Security**
2. Chercher **"PDF and ZIP files delivery"**
3. **Activer** "Allow delivery of PDF and ZIP files"
4. **Save**

### Après correction
1. Redéployer le backend
2. **Re-uploader les PDFs** (les anciens resteront en `raw`)
3. Tester avec un nouveau PDF (doit être en `/image/upload/fl_attachment/`)

## Problème spécifique résolu

### Avant
```
PDF Cloudinary → Affichage dans l'onglet → Erreur "Échec de chargement du document PDF"
```

### Après
```
PDF Cloudinary → resource_type:'image' → /image/upload/fl_attachment/ → Téléchargement direct → Fonctionne parfaitement
Documents Cloudinary → resource_type:'raw' → /raw/upload/ (pas de transformation) → Accès direct → Fonctionne parfaitement
```
