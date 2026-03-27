const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createGazette,
  getGazettes,
  getGazetteById,
  updateGazette,
  deleteGazette
} = require('../controllers/gazetteController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes
router.post('/', createGazette);                              // POST /api/gazettes
router.get('/', getGazettes);                               // GET /api/gazettes
router.get('/:id', getGazetteById);                         // GET /api/gazettes/:id
router.put('/:id', updateGazette);                           // PUT /api/gazettes/:id
router.delete('/:id', deleteGazette);                        // DELETE /api/gazettes/:id

module.exports = router;
