const Rubrique = require('../models/Rubrique');
const { validationResult } = require('express-validator');

// Obtenir toutes les rubriques
const getRubriques = async (req, res) => {
  try {
    const rubriques = await Rubrique.find({})
      .populate('created_by', 'name email avatar');

    // Convert team_ids to strings for frontend compatibility
    const formattedRubriques = rubriques.map(rubrique => ({
      ...rubrique.toObject(),
      team_ids: rubrique.team_ids.map(id => id.toString())
    }));

    res.status(200).json({
      success: true,
      count: formattedRubriques.length,
      data: formattedRubriques
    });
  } catch (error) {
    console.error('Erreur getRubriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir une rubrique par ID
const getRubriqueById = async (req, res) => {
  try {
    const rubrique = await Rubrique.findById(req.params.id)
      .populate('created_by', 'name email avatar');
    
    if (!rubrique) {
      return res.status(404).json({
        success: false,
        message: 'Rubrique non trouvée'
      });
    }

    // Convert team_ids to strings for frontend compatibility
    const formattedRubrique = {
      ...rubrique.toObject(),
      team_ids: rubrique.team_ids.map(id => id.toString())
    };

    res.status(200).json({
      success: true,
      data: formattedRubrique
    });
  } catch (error) {
    console.error('Erreur getRubriqueById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer une rubrique
const createRubrique = async (req, res) => {
  try {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { name, description, team_ids, color } = req.body;

    const rubrique = await Rubrique.create({
      name,
      description,
      team_ids: team_ids || [],
      color: color || '#0f766e',
      created_by: req.user._id
    });

    const populatedRubrique = await Rubrique.findById(rubrique._id)
      .populate('created_by', 'name email avatar');

    // Convert team_ids to strings for frontend compatibility
    const formattedRubrique = {
      ...populatedRubrique.toObject(),
      team_ids: populatedRubrique.team_ids.map(id => id.toString())
    };

    res.status(201).json({
      success: true,
      message: 'Rubrique créée avec succès',
      data: formattedRubrique
    });
  } catch (error) {
    console.error('Erreur createRubrique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour une rubrique
const updateRubrique = async (req, res) => {
  try {
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const rubrique = await Rubrique.findById(req.params.id);
    
    if (!rubrique) {
      return res.status(404).json({
        success: false,
        message: 'Rubrique non trouvée'
      });
    }

    const updatedRubrique = await Rubrique.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('created_by', 'name email avatar');

    // Convert team_ids to strings for frontend compatibility
    const formattedRubrique = {
      ...updatedRubrique.toObject(),
      team_ids: updatedRubrique.team_ids.map(id => id.toString())
    };

    res.status(200).json({
      success: true,
      message: 'Rubrique mise à jour avec succès',
      data: formattedRubrique
    });
  } catch (error) {
    console.error('Erreur updateRubrique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une rubrique
const deleteRubrique = async (req, res) => {
  try {
    const rubrique = await Rubrique.findById(req.params.id);
    
    if (!rubrique) {
      return res.status(404).json({
        success: false,
        message: 'Rubrique non trouvée'
      });
    }

    await rubrique.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Rubrique supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteRubrique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  getRubriques,
  getRubriqueById,
  createRubrique,
  updateRubrique,
  deleteRubrique
};
