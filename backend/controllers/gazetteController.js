const Gazette = require('../models/Gazette');
const authMiddleware = require('../middleware/authMiddleware');

// Créer une gazette
const createGazette = async (req, res) => {
  try {
    console.log('🗞️ DEBUG: Creating gazette with payload:', req.body);
    
    const { title, description, status = 'draft', blocks = [] } = req.body;
    const userId = req.user.id;
    const userTeams = req.user.teams || [];

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        message: 'Le titre est requis',
        error: 'MISSING_TITLE'
      });
    }

    // Créer la gazette
    const gazette = new Gazette({
      title: title.trim(),
      description: description?.trim() || '',
      status,
      blocks: blocks.map((block, index) => ({
        ...block,
        order: index
      })),
      author_id: userId,
      team_ids: userTeams
    });

    const savedGazette = await gazette.save();
    
    // Populate les références
    await savedGazette.populate([
      { path: 'author_id', select: 'name email' },
      { path: 'team_ids', select: 'name' }
    ]);

    console.log('✅ DEBUG: Gazette saved successfully:', savedGazette);
    
    // Normaliser la réponse pour le frontend
    const gazetteResponse = {
      ...savedGazette.toObject(),
      id: savedGazette._id.toString() // Convertir _id en id string
    };
    
    console.log('📤 DEBUG: Normalized response for frontend:', gazetteResponse);
    
    res.status(201).json({
      success: true,
      message: 'Gazette créée avec succès',
      data: gazetteResponse
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to create gazette:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la gazette',
      error: error.message
    });
  }
};

// Récupérer toutes les gazettes de l'utilisateur
const getGazettes = async (req, res) => {
  try {
    console.log('📋 DEBUG: Loading gazettes for user:', req.user.id);
    
    const userId = req.user.id;
    const userTeams = req.user.teams || [];
    const { status, search } = req.query;

    // Construire le filtre
    let filter = {
      author_id: userId,
      team_ids: { $in: userTeams }
    };

    // Filtre par statut
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Recherche textuelle
    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const gazettes = await Gazette.find(filter)
      .populate('author_id', 'name email')
      .populate('team_ids', 'name')
      .sort({ createdAt: -1 });

    console.log('✅ DEBUG: Gazettes loaded:', gazettes.length, 'items');
    
    // Normaliser la réponse pour le frontend (_id -> id)
    const normalizedGazettes = gazettes.map(gazette => ({
      ...gazette.toObject(),
      id: gazette._id.toString() // Convertir _id en id string
    }));
    
    console.log('📤 DEBUG: Normalized gazettes for frontend:', normalizedGazettes);
    
    res.json({
      success: true,
      message: 'Gazettes récupérées avec succès',
      data: normalizedGazettes,
      count: normalizedGazettes.length
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to load gazettes:', error);
    res.status(500).json({
      message: 'Erreur lors du chargement des gazettes',
      error: error.message
    });
  }
};

// Récupérer une gazette par ID
const getGazetteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userTeams = req.user.teams || [];

    const gazette = await Gazette.findOne({
      _id: id,
      author_id: userId,
      team_ids: { $in: userTeams }
    })
      .populate('author_id', 'name email')
      .populate('team_ids', 'name');

    if (!gazette) {
      return res.status(404).json({
        message: 'Gazette non trouvée',
        error: 'GAZETTE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Gazette récupérée avec succès',
      data: {
        ...gazette.toObject(),
        id: gazette._id.toString() // Convertir _id en id string
      }
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to get gazette:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la gazette',
      error: error.message
    });
  }
};

// Mettre à jour une gazette
const updateGazette = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, blocks } = req.body;
    const userId = req.user.id;
    const userTeams = req.user.teams || [];

    const gazette = await Gazette.findOne({
      _id: id,
      author_id: userId,
      team_ids: { $in: userTeams }
    });

    if (!gazette) {
      return res.status(404).json({
        message: 'Gazette non trouvée',
        error: 'GAZETTE_NOT_FOUND'
      });
    }

    // Mise à jour
    gazette.title = title?.trim() || gazette.title;
    gazette.description = description?.trim() || gazette.description;
    gazette.status = status || gazette.status;
    if (blocks) {
      gazette.blocks = blocks.map((block, index) => ({
        ...block,
        order: index
      }));
    }

    const updatedGazette = await gazette.save();
    await updatedGazette.populate([
      { path: 'author_id', select: 'name email' },
      { path: 'team_ids', select: 'name' }
    ]);

    console.log('✅ DEBUG: Gazette updated:', updatedGazette);

    // Normaliser la réponse pour le frontend (_id -> id)
    const normalizedGazette = {
      ...updatedGazette.toObject(),
      id: updatedGazette._id.toString() // Convertir _id en id string
    };
    
    console.log('📤 DEBUG: Normalized updated gazette for frontend:', normalizedGazette);

    res.json({
      success: true,
      message: 'Gazette mise à jour avec succès',
      data: normalizedGazette
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to update gazette:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la gazette',
      error: error.message
    });
  }
};

// Supprimer une gazette
const deleteGazette = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userTeams = req.user.teams || [];

    const gazette = await Gazette.findOne({
      _id: id,
      author_id: userId,
      team_ids: { $in: userTeams }
    });

    if (!gazette) {
      return res.status(404).json({
        message: 'Gazette non trouvée',
        error: 'GAZETTE_NOT_FOUND'
      });
    }

    await Gazette.findByIdAndDelete(id);

    console.log('✅ DEBUG: Gazette deleted:', id);

    res.json({
      message: 'Gazette supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to delete gazette:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la gazette',
      error: error.message
    });
  }
};

module.exports = {
  createGazette,
  getGazettes,
  getGazetteById,
  updateGazette,
  deleteGazette
};
