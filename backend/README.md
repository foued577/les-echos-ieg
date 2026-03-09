# Les Échos de IEG - Backend

Backend complet pour l'application Les Échos de IEG avec Node.js, Express, MongoDB Atlas et authentification JWT.

## 🚀 Stack Technique

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB Atlas** - Base de données cloud
- **Mongoose** - ODM MongoDB
- **JWT** - Authentification par token
- **bcrypt** - Hashage des mots de passe
- **dotenv** - Gestion des variables d'environnement
- **cors** - Partage de ressources entre origines
- **helmet** - Sécurité des headers
- **express-rate-limit** - Limitation des requêtes

## 📁 Structure du projet

```
backend/
│── server.js                 # Point d'entrée principal
│── config/
│   └── db.js               # Configuration MongoDB
│── models/                  # Schémas Mongoose
│   ├── User.js
│   ├── Team.js
│   ├── Rubrique.js
│   └── Content.js
│── routes/                  # Routes API
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── teamRoutes.js
│   ├── rubriqueRoutes.js
│   └── contentRoutes.js
│── middleware/              # Middleware personnalisés
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│── controllers/             # Logique métier
│   ├── authController.js
│   ├── userController.js
│   ├── teamController.js
│   ├── rubriqueController.js
│   └── contentController.js
│── package.json
│── .env.example
│── README.md
```

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd les-echos-ieg/backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp env.example .env
```

4. **Configurer MongoDB Atlas**
- Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
- Créer un nouveau cluster
- Ajouter votre adresse IP dans la liste blanche
- Créer un utilisateur de base de données
- Copier la chaîne de connexion dans `.env`

5. **Configurer le JWT Secret**
```bash
# Générer une clé secrète forte
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

6. **Démarrer le serveur**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Obtenir l'utilisateur actuel

### Utilisateurs (Admin uniquement)
- `GET /api/users` - Lister tous les utilisateurs
- `GET /api/users/:id` - Obtenir un utilisateur
- `PUT /api/users/:id` - Mettre à jour un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Équipes
- `GET /api/teams` - Lister toutes les équipes (publique)
- `GET /api/teams/:id` - Obtenir une équipe (publique)
- `POST /api/teams` - Créer une équipe (Admin/Editor)
- `PUT /api/teams/:id` - Mettre à jour une équipe (Admin/Editor)
- `DELETE /api/teams/:id` - Supprimer une équipe (Admin)

### Rubriques
- `GET /api/rubriques` - Lister toutes les rubriques (publique)
- `GET /api/rubriques/:id` - Obtenir une rubrique (publique)
- `POST /api/rubriques` - Créer une rubrique (Admin/Editor)
- `PUT /api/rubriques/:id` - Mettre à jour une rubrique (Admin/Editor)
- `DELETE /api/rubriques/:id` - Supprimer une rubrique (Admin)

### Contenus
- `GET /api/contents` - Lister tous les contenus (publique)
- `GET /api/contents/:id` - Obtenir un contenu (publique)
- `POST /api/contents` - Créer un contenu (authentifié)
- `PUT /api/contents/:id` - Mettre à jour un contenu (propriétaire/Admin)
- `DELETE /api/contents/:id` - Supprimer un contenu (propriétaire/Admin)

## 🔐 Rôles et Permissions

### ADMIN
- ✅ Gestion complète des utilisateurs
- ✅ Gestion complète des équipes
- ✅ Gestion complète des rubriques
- ✅ Suppression de tous les contenus
- ✅ Accès à toutes les fonctionnalités

### EDITOR
- ✅ Création et modification d'équipes
- ✅ Création et modification de rubriques
- ✅ Création, modification et suppression de ses contenus
- ❌ Gestion des utilisateurs
- ❌ Suppression des contenus des autres

### MEMBER
- ✅ Création de contenus
- ✅ Modification et suppression de ses contenus
- ❌ Gestion des équipes et rubriques
- ❌ Gestion des utilisateurs

## 📝 Exemples de requêtes

### Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "MEMBER"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Créer un contenu
```bash
curl -X POST http://localhost:5000/api/contents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -d '{
    "title": "Mon premier contenu",
    "content": "Contenu de mon article...",
    "type": "article",
    "rubrique_id": "64a1b2c3d4e5f6789012345",
    "team_ids": ["64a1b2c3d4e5f6789012346"],
    "tags": ["javascript", "nodejs"]
  }'
```

## 🚀 Déploiement sur Render

1. **Préparer le déploiement**
```bash
# Ajouter les dépendances de production
npm install --production
```

2. **Créer un service web sur Render**
- Aller sur [Render Dashboard](https://dashboard.render.com)
- Cliquer sur "New +" → "Web Service"
- Connecter votre repository GitHub
- Configurer le service :
  - **Name**: les-echos-ieg-backend
  - **Runtime**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Instance Type**: Free (pour commencer)

3. **Configurer les variables d'environnement sur Render**
- Dans les settings du service, ajouter les variables :
  - `MONGODB_URI`: Votre chaîne de connexion MongoDB Atlas
  - `JWT_SECRET`: Votre clé secrète JWT
  - `FRONTEND_URL`: URL de votre frontend déployé
  - `NODE_ENV`: production

4. **Déployer**
- Render déploiera automatiquement votre code
- L'API sera accessible à l'URL fournie par Render

## 🔒 Sécurité

- **Helmet**: Protection contre les vulnérabilités web
- **Rate Limiting**: Limitation des requêtes (100 req/15min)
- **JWT**: Tokens sécurisés avec expiration
- **bcrypt**: Hashage des mots de passe
- **CORS**: Configuration stricte des origines
- **Validation**: Validation des entrées avec express-validator

## 🐛 Débogage

- Mode développement avec logs détaillés
- Gestion centralisée des erreurs
- Stack traces en développement uniquement

## 📞 Support

Pour toute question ou problème, contactez l'équipe IEG.

---

**🚀 Les Échos de IEG Backend - Prêt à décoller !**
