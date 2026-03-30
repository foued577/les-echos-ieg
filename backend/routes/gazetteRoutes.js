const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createGazette,
  getGazettes,
  getGazetteById,
  updateGazette,
  deleteGazette,
  searchUsers
} = require('../controllers/gazetteController');

// Route de test pour vérifier que l'API fonctionne
router.get('/test', (req, res) => {
  console.log('🧪 DEBUG: Gazette API test route called');
  res.json({
    success: true,
    message: '🗞️ Gazette API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      getAll: 'GET /api/gazettes',
      getById: 'GET /api/gazettes/:id',
      create: 'POST /api/gazettes',
      update: 'PUT /api/gazettes/:id',
      delete: 'DELETE /api/gazettes/:id',
      searchUsers: 'GET /api/gazettes/users/search?q=query'
    }
  });
});

// Appliquer le middleware d'authentification à toutes les routes SAUF test
router.use(authMiddleware);

// Routes
router.post('/', createGazette);                              // POST /api/gazettes
router.get('/', getGazettes);                               // GET /api/gazettes
router.get('/:id', getGazetteById);                         // GET /api/gazettes/:id
router.put('/:id', updateGazette);                           // PUT /api/gazettes/:id
router.delete('/:id', deleteGazette);                        // DELETE /api/gazettes/:id
router.get('/users/search', searchUsers);                     // GET /api/gazettes/users/search?q=query

module.exports = router;
