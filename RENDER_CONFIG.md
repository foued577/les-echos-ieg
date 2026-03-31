# Les Échos D'IEG - Configuration Render

## Variables d'environnement requises

### Backend (Web Service)
- **Type** : Web Service
- **Root Directory** : `backend`
- **Build Command** : `npm install`
- **Start Command** : `npm start`

Variables à configurer :
```
MONGO_URI=votre_chaine_mongodb_atlas
JWT_SECRET=votre_secret_jwt_min_32_caracteres
FRONTEND_URL=https://les-echos-ieg.onrender.com
NODE_ENV=production
PORT=5000
```

### Frontend (Static Site)
- **Type** : Static Site
- **Root Directory** : (vide)
- **Build Command** : `npm install && npm run build`
- **Publish Directory** : `dist`

Variables à configurer :
```
VITE_API_URL=https://les-echos-ieg-api.onrender.com/api
```

## Rewrite Rule pour React Router

Dans le Static Site frontend, ajouter :
- **Source** : `/*`
- **Destination** : `/index.html`
- **Action** : Rewrite

## Points de configuration appliqués

### Backend (server.js)
- ✅ Écoute sur `0.0.0.0` pour Render
- ✅ Variable `FRONTEND_URL` cohérente pour CORS
- ✅ Logs de production sans localhost
- ✅ Arrêt gracieux avec SIGTERM

### Frontend (apiClient.js)
- ✅ Utilisation de `import.meta.env.VITE_API_URL`
- ✅ Fallback localhost pour développement

## Déploiement

1. Pousser le code sur GitHub
2. Créer le Web Service backend
3. Créer le Static Site frontend
4. Configurer les variables d'environnement
5. Ajouter la rewrite rule pour React Router
