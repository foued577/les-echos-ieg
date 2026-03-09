const Content = require('../models/Content');
const { validationResult } = require('express-validator');

// Obtenir les contenus de l'utilisateur connecté
const getMyContents = async (req, res) => {
  try {
    console.log('👤=== GET MY CONTENTS START ===');
    console.log('👤 User from token:', req.user);
    console.log('👤 User ID:', req.user._id);
    
    const { status } = req.query;
    
    // Construire le filtre pour l'utilisateur
    let filter = { author_id: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    console.log('👤 Filter:', filter);
    
    const contents = await Content.find(filter)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color')
      .sort({ created_at: -1 });

    console.log('👤 My contents found:', contents.length);
    
    // Log first few contents
    contents.slice(0, 3).forEach((content, index) => {
      console.log(`👤 My Content ${index + 1}:`, {
        title: content.title,
        status: content.status,
        author_id: content.author_id,
        author_id_type: typeof content.author_id,
        author_name: content.author_id?.name
      });
    });

    res.status(200).json({
      success: true,
      count: contents.length,
      data: contents
    });
  } catch (error) {
    console.error('Erreur getMyContents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir tous les contenus
const getContents = async (req, res) => {
  try {
    const { status, team_id, rubrique_id } = req.query;
    
    console.log('📋=== GET CONTENTS START ===');
    console.log('📋 Query params:', { status, team_id, rubrique_id });
    console.log('📋 User from token:', req.user);
    
    // Construire le filtre
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (team_id) {
      filter.team_ids = team_id;
    }
    
    if (rubrique_id) {
      filter.rubrique_id = rubrique_id;
    }

    const contents = await Content.find(filter)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color')
      .sort({ created_at: -1 });

    console.log('📋 Contents found:', contents.length);
    
    // Log first few contents with ALL fields
    contents.slice(0, 3).forEach((content, index) => {
      console.log(`📋 Content ${index + 1}:`, {
        title: content.title,
        status: content.status,
        author_id: content.author_id,
        author_id_type: typeof content.author_id,
        author_name: content.author_id?.name,
        team_ids: content.team_ids,
        team_ids_type: typeof content.team_ids,
        rubrique_id: content.rubrique_id,
        rubrique_id_type: typeof content.rubrique_id,
        rubrique_name: content.rubrique_id?.name
      });
    });

    res.status(200).json({
      success: true,
      count: contents.length,
      data: contents
    });
  } catch (error) {
    console.error('Erreur getContents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir un contenu par ID
const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color');
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Erreur getContentById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer un contenu
const createContent = async (req, res) => {
  try {
    console.log('🔨=== CREATE CONTENT START ===');
    console.log('🔨 Request body:', req.body);
    console.log('🔨 Request file:', req.file);
    console.log('🔨 User from token:', req.user);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { title, content, type, team_ids, rubrique_id, tags, status } = req.body;

    console.log('📝 Creating content with:', { title, type, team_ids, rubrique_id, tags, status });

    // Préparer l'objet de base
    const contentData = {
      title,
      type,
      team_ids: team_ids ? JSON.parse(team_ids) : [],
      rubrique_id,
      tags: tags ? JSON.parse(tags) : [],
      author_id: req.user._id,
      status: status || 'draft'
    };

    // Gérer selon le type
    if (type === "fichier") {
      // Pour les fichiers, vérifier qu'un fichier a été uploadé
      if (!req.file) {
        console.log('❌ File missing for type fichier');
        return res.status(400).json({
          success: false,
          message: 'Un fichier est requis pour le type "fichier"'
        });
      }

      // Ajouter les informations du fichier
      contentData.file_url = `/uploads/${req.file.filename}`;
      contentData.file_name = req.file.originalname;
      contentData.mime_type = req.file.mimetype;
      contentData.content = req.file.originalname; // Nom du fichier comme content
      
      console.log('📁 File uploaded:', {
        file_url: contentData.file_url,
        file_name: contentData.file_name,
        mime_type: contentData.mime_type
      });
    } else {
      // Pour les liens et articles, utiliser le content normal
      if (!content) {
        console.log('❌ Content missing for non-file type');
        return res.status(400).json({
          success: false,
          message: 'Le contenu est requis pour ce type'
        });
      }
      contentData.content = content;
    }

    const newContent = await Content.create(contentData);

    console.log('✅ Content created:', newContent._id);

    const populatedContent = await Content.findById(newContent._id)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color');

    res.status(201).json({
      success: true,
      message: 'Contenu créé avec succès',
      data: populatedContent
    });
  } catch (error) {
    console.error('Erreur createContent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour un contenu
const updateContent = async (req, res) => {
  try {
    console.log('🔄=== UPDATE CONTENT START ===');
    console.log('🔄 Params ID:', req.params.id);
    console.log('🔄 Request body:', req.body);
    console.log('🔄 User from token:', req.user);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const content = await Content.findById(req.params.id);
    console.log('🔄 Content found:', !!content);
    
    if (!content) {
      console.log('❌ Content not found');
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    // Vérifier les permissions
    if (req.user.role !== 'ADMIN' && content.author_id.toString() !== req.user._id.toString()) {
      console.log('❌ Permission denied - User role:', req.user.role, 'Author:', content.author_id, 'User:', req.user._id);
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce contenu'
      });
    }

    console.log('✅ Permission granted - Updating content...');

    const updatedContent = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color');

    console.log('✅ Content updated successfully');

    res.status(200).json({
      success: true,
      message: 'Contenu mis à jour avec succès',
      data: updatedContent
    });
  } catch (error) {
    console.error('Erreur updateContent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer un contenu
const deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    // Vérifier les permissions
    if (req.user.role !== 'ADMIN' && content.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce contenu'
      });
    }

    await content.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Contenu supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteContent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  getContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  getMyContents
};
