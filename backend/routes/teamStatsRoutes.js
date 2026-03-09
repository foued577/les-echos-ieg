const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getTeamsWithCounts
} = require('../controllers/teamStatsController');

const router = express.Router();

// Routes protégées - toutes nécessitent une authentification
router.use(authMiddleware);

// GET /api/teams/summary - obtenir toutes les équipes avec leurs compteurs
router.get('/summary', getTeamsWithCounts);

module.exports = router;
