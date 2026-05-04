const Gazette = require('../models/Gazette');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Créer une gazette
const createGazette = async (req, res) => {
  try {
    console.log('🗞️ DEBUG: Creating gazette with payload:', req.body);
    
    const { title, description, status = 'draft', blocks = [], assigned_users = [] } = req.body;
    const userId = req.user.id;

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
      team_ids: [],
      assigned_users
    });

    const savedGazette = await gazette.save();
    
    // Populate les références
    await savedGazette.populate([
      { path: 'author_id', select: 'name email' },
      { path: 'assigned_users', select: 'name email' },
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
    const { status, search } = req.query;

    // Construire le filtre avec contrôle d'accès
    let filter = {
      $or: [
        { author_id: userId },
        { assigned_users: userId }
      ]
    };

    // Filtre par statut
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Recherche textuelle
    if (search && search.trim() !== '') {
      filter.$and = [
        filter.$or ? { $or: filter.$or } : {},
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete filter.$or;
    }

    const gazettes = await Gazette.find(filter)
      .populate('author_id', 'name email')
      .populate('assigned_users', 'name email')
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

    const gazette = await Gazette.findOne({
      _id: id,
      $or: [
        { author_id: userId },
        { assigned_users: userId }
      ]
    })
      .populate('author_id', 'name email')
      .populate('assigned_users', 'name email')
      .populate('team_ids', 'name');

    if (!gazette) {
      return res.status(404).json({
        message: 'Gazette non trouvée ou accès non autorisé',
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
    const { title, description, status, blocks, assigned_users } = req.body;
    const userId = req.user.id;

    const gazette = await Gazette.findOne({
      _id: id,
      $or: [
        { author_id: userId },
        { assigned_users: userId }
      ]
    });

    if (!gazette) {
      return res.status(404).json({
        message: 'Gazette non trouvée ou accès non autorisé',
        error: 'GAZETTE_NOT_FOUND'
      });
    }

    // Seul le créateur peut modifier les utilisateurs assignés
    if (assigned_users && gazette.author_id.toString() !== userId) {
      return res.status(403).json({
        message: 'Seul le créateur peut modifier les utilisateurs assignés',
        error: 'INSUFFICIENT_PERMISSIONS'
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
    if (assigned_users !== undefined) {
      gazette.assigned_users = assigned_users;
    }

    const updatedGazette = await gazette.save();
    await updatedGazette.populate([
      { path: 'author_id', select: 'name email' },
      { path: 'assigned_users', select: 'name email' },
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

    console.log('DELETE DEBUG: Gazette ID:', id);
    console.log('DELETE DEBUG: User ID:', userId);

    // Vérifier si l'ID est valide
    if (!id || id === 'undefined') {
      return res.status(400).json({
        message: 'ID de gazette invalide',
        error: 'INVALID_ID'
      });
    }

    // Trouver la gazette avec vérification des permissions
    const gazette = await Gazette.findOne({
      _id: id,
      author_id: userId  // Seul le créateur peut supprimer
    });

    if (!gazette) {
      console.log('DELETE DEBUG: Gazette not found or no permission');
      return res.status(404).json({
        message: 'Gazette non trouvée ou accès non autorisé',
        error: 'GAZETTE_NOT_FOUND'
      });
    }

    console.log('DELETE DEBUG: Gazette found, deleting:', gazette._id);

    // Supprimer la gazette trouvée (pas besoin de findByIdAndDelete)
    await Gazette.deleteOne({ _id: gazette._id });

    console.log('DELETE DEBUG: Gazette deleted successfully');

    res.json({
      success: true,
      message: 'Gazette supprimée avec succès'
    });

  } catch (error) {
    console.error('DELETE ERROR: Failed to delete gazette:', error);
    
    // Gérer les erreurs spécifiques à MongoDB
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'ID de gazette invalide',
        error: 'INVALID_ID_FORMAT'
      });
    }
    
    res.status(500).json({
      message: 'Erreur lors de la suppression de la gazette',
      error: error.message
    });
  }
};

// Rechercher des utilisateurs pour l'assignation
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        message: 'La requête de recherche est requise',
        error: 'MISSING_QUERY'
      });
    }

    // Rechercher des utilisateurs (sauf soi-même)
    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email')
    .limit(10);

    res.json({
      success: true,
      message: 'Utilisateurs trouvés',
      data: users
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to search users:', error);
    res.status(500).json({
      message: 'Erreur lors de la recherche d\'utilisateurs',
      error: error.message
    });
  }
};

// Dupliquer une gazette
const duplicateGazette = async (req, res) => {
  try {
    console.log('📋 DEBUG: Duplicating gazette with ID:', req.params.id);
    
    // Récupérer la gazette originale
    const original = await Gazette.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ 
        success: false,
        message: "Gazette introuvable" 
      });
    }

    console.log('📋 DEBUG: Original gazette found:', original.title);

    // Créer la copie avec les mêmes données
    const copy = new Gazette({
      title: `${original.title} - Copie`,
      description: original.description || "",
      blocks: original.blocks || [],
      status: "draft",
      author_id: req.user._id,
      team_ids: original.team_ids || [],
      assigned_users: original.assigned_users || []
    });

    const savedCopy = await copy.save();
    
    // Populate les références
    await savedCopy.populate([
      { path: 'author_id', select: 'name email' },
      { path: 'assigned_users', select: 'name email' },
      { path: 'team_ids', select: 'name' }
    ]);

    console.log('✅ DEBUG: Gazette duplicated successfully:', savedCopy.title);

    res.status(201).json({
      success: true,
      message: 'Gazette dupliquée avec succès',
      data: {
        ...savedCopy.toObject(),
        id: savedCopy._id.toString() // Convertir _id en id string
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Error duplicating gazette:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la duplication',
      error: error.message
    });
  }
};

module.exports = {
  createGazette,
  getGazettes,
  getGazetteById,
  updateGazette,
  deleteGazette,
  searchUsers,
  duplicateGazette
};
