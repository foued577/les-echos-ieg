# 🚀 Les Échos de IEG - Déploiement sur Render

Application web complète prête pour le déploiement sur Render avec architecture MERN moderne.

## 📋 Architecture de Déploiement

### Backend (API REST)
- **Type** : Web Service
- **Runtime** : Node.js 18+
- **Base de données** : MongoDB Atlas
- **Port** : 5000 (écoute sur `0.0.0.0`)

### Frontend (SPA)
- **Type** : Static Site
- **Runtime** : Vite + React
- **Routing** : React Router avec rewrite rule

---

## ⚙️ Configuration Appliquée

### ✅ Backend - `server.js`
```javascript
// Écoute sur 0.0.0.0 pour Render
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`✅ Frontend autorisé: ${allowedOrigin}`);
});

// CORS dynamique avec FRONTEND_URL
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
```

### ✅ Frontend - `apiClient.js`
```javascript
// URL API dynamique avec VITE_API_URL
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
```

---

## 🎯 Instructions Déploiement Render

### 1️⃣ Backend Service

**Configuration :**
- **Type** : Web Service
- **Name** : `les-echos-ieg-api`
- **Root Directory** : `backend`
- **Branch** : `main`
- **Build Command** : `npm install`
- **Start Command** : `npm start`

**Variables d'environnement :**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=votre_secret_jwt_minimum_32_caracteres
FRONTEND_URL=https://les-echos-ieg.onrender.com
NODE_ENV=production
PORT=5000
```

### 2️⃣ Frontend Service

**Configuration :**
- **Type** : Static Site
- **Name** : `les-echos-ieg`
- **Root Directory** : (vide)
- **Branch** : `main`
- **Build Command** : `npm install && npm run build`
- **Publish Directory** : `dist`

**Variables d'environnement :**
```
VITE_API_URL=https://les-echos-ieg-api.onrender.com/api
```

### 3️⃣ Rewrite Rule (React Router)

Dans le Static Site frontend, ajouter :
- **Source** : `/*`
- **Destination** : `/index.html`
- **Action** : Rewrite

---

## 🔧 Validation Locale

Avant de déployer, testez localement :

```bash
# Backend
cd backend
npm install
npm start

# Frontend (nouveau terminal)
npm install
npm run dev
```

Vérifiez que :
- ✅ Le backend écoute sur `0.0.0.0:5000`
- ✅ Le frontend utilise `VITE_API_URL`
- ✅ Les routes React fonctionnent

---

## 📁 Fichiers de Configuration

- `backend/server.js` - Serveur Express configuré pour Render
- `src/lib/apiClient.js` - Client HTTP avec URL dynamique
- `vite.config.js` - Build Vite avec support env vars
- `render.yaml` - Configuration automatique Render
- `RENDER_CONFIG.md` - Documentation complète

---

## 🚀 Déploiement Automatisé (Optionnel)

Vous pouvez utiliser `render.yaml` pour un déploiement automatique :

1. Poussez `render.yaml` à la racine
2. Connectez votre repo GitHub à Render
3. Render détectera automatiquement la configuration

---

## 🔍 Points Critiques

### ✅ Sécurité
- JWT secrets dans variables d'environnement
- CORS restrictif avec FRONTEND_URL
- Helmet pour headers sécurisés

### ✅ Performance
- Build Vite optimisé
- Static files servis par Express
- MongoDB Atlas scalable

### ✅ Monitoring
- Logs de production structurés
- Arrêt gracieux avec SIGTERM
- Erreurs détaillées en dev

---

## 🎉 Déploiement Terminé

Une fois déployé :
1. Backend : `https://les-echos-ieg-api.onrender.com`
2. Frontend : `https://les-echos-ieg.onrender.com`
3. API Docs : `https://les-echos-ieg-api.onrender.com/`

**L'application est maintenant prête pour la production !** 🚀
