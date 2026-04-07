const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

// Configuration de l'application
const APP_NAME = "Les Échos D'IEG";

// Charger les variables d'environnement AU DÉBUT
dotenv.config();

// Vérifier les variables requises
if (!process.env.MONGO_URI) {
  console.error('❌ ERREUR: MONGO_URI n\'est pas défini dans le fichier .env');
  console.error('Veuillez créer un fichier .env avec MONGO_URI configuré');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ ERREUR: JWT_SECRET n\'est pas défini dans le fichier .env');
  console.error('Veuillez créer un fichier .env avec JWT_SECRET configuré');
  process.exit(1);
}

// Connexion à la base de données
connectDB();

const app = express();

// Middleware de sécurité
app.use(helmet());

// Middleware de rate limiting (désactivé pour le debug)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limiter chaque IP à 100 requêtes par windowMs
//   message: {
//     success: false,
//     message: 'Trop de requêtes, veuillez réessayer plus tard'
//   }
// });
// app.use('/api/', limiter);

const allowedOrigin = 
  process.env.FRONTEND_URL === 'https://les-echos-ieg-front.onrender.com' 
    ? 'https://les-echos-ieg-front.onrender.com'
    : process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🌐 CORS: Allowed origin:', allowedOrigin);

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Fichiers statiques avec debug
const fs = require('fs');

// Debug middleware pour les uploads
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  const exists = fs.existsSync(filePath);
  console.log('🔍 File access debug:');
  console.log('  URL:', req.originalUrl);
  console.log('  Path:', req.path);
  console.log('  Full path:', filePath);
  console.log('  Exists:', exists);
  
  if (exists) {
    next();
  } else {
    console.log('❌ File not found, returning 404');
    res.status(404).json({
      success: false,
      message: 'Fichier non trouvé',
      debug: {
        url: req.originalUrl,
        path: req.path,
        fullPath: filePath,
        exists: exists
      }
    });
  }
}, express.static(path.join(__dirname, 'uploads')));

// Alias pour compatibilité avec les URLs existantes
app.use('/api/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  const exists = fs.existsSync(filePath);
  console.log('🔍 API File access debug:');
  console.log('  URL:', req.originalUrl);
  console.log('  Path:', req.path);
  console.log('  Full path:', filePath);
  console.log('  Exists:', exists);
  
  if (exists) {
    next();
  } else {
    console.log('❌ API File not found, returning 404');
    res.status(404).json({
      success: false,
      message: 'Fichier non trouvé',
      debug: {
        url: req.originalUrl,
        path: req.path,
        fullPath: filePath,
        exists: exists
      }
    });
  }
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/teams', require('./routes/teamStatsRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/test', require('./routes/testRoutes'));
app.use('/api/rubriques', require('./routes/rubriqueRoutes'));
app.use('/api/contents', require('./routes/contentRoutes'));
app.use('/api/gazettes', require('./routes/gazetteRoutes'));
app.use('/api/dashboard-messages', require('./routes/dashboardMessageRoutes'));

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `🚀 ${APP_NAME} Backend API est en ligne!`,
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      teams: '/api/teams',
      rubriques: '/api/rubriques',
      contents: '/api/contents',
      gazettes: '/api/gazettes'
    }
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Frontend autorisé: ${allowedOrigin}`);
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

module.exports = app;
