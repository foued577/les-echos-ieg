const Content = require('../models/Content');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// Dashboard endpoint - Get user's valid proposals with complete relations
const getDashboardContents = async (req, res) => {
  try {
    console.log('📊=== DASHBOARD CONTENTS START ===');
    console.log('📊 User from token:', req.user);
    console.log('📊 User ID:', req.user._id);
    
    const { status } = req.query;
    
    // Get contents with complete relations and proper filtering
    let contents = await Content.find({ author_id: req.user._id })
      .populate({
        path: 'rubrique_id',
        select: 'name description color team_id',
        populate: {
          path: 'team_id',
          select: 'name',
          match: { _id: { $exists: true } } // Only include existing teams
        }
      })
      .populate('author_id', 'name email avatar')
      .sort({ created_at: -1 });

    console.log('📊 Raw contents found:', contents.length);
    
    // Filter to include only contents with valid rubrique and team
    const validContents = contents.filter(content => {
      // Content must have a rubrique
      if (!content.rubrique_id) {
        console.log('🚫 Dashboard filtering - No rubrique:', content.title);
        return false;
      }
      
      // Rubrique must have a valid team (populate already filtered non-existing teams)
      if (!content.rubrique_id.team_id) {
        console.log('🚫 Dashboard filtering - No valid team:', content.title);
        return false;
      }
      
      // Apply status filter if provided
      if (status && content.status !== status) {
        return false;
      }
      
      console.log('✅ Dashboard valid content:', content.title);
      return true;
    });

    console.log('📊 Valid dashboard contents:', validContents.length);
    
    // Log first few valid contents for debugging
    validContents.slice(0, 3).forEach((content, index) => {
      console.log(`📊 Dashboard Content ${index + 1}:`, {
        id: content._id,
        title: content.title,
        status: content.status,
        rubrique_id: content.rubrique_id?._id,
        rubrique_name: content.rubrique_id?.name,
        team_id: content.rubrique_id?.team_id?._id,
        team_name: content.rubrique_id?.team_id?.name,
        created_at: content.created_at
      });
    });

    res.status(200).json({
      success: true,
      count: validContents.length,
      data: validContents
    });
  } catch (error) {
    console.error('Erreur getDashboardContents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

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

    console.log('👤 Raw contents found:', contents.length);
    
    // Filtrage défensif pour exclure les contenus orphelins
    const validContents = contents.filter(content => {
      const hasValidTeam = !content.team_ids || content.team_ids.length === 0 || 
        content.team_ids.some(team => team && team._id);
      const hasValidRubrique = content.rubrique_id && content.rubrique_id._id;
      
      if (!hasValidTeam) {
        console.log('🚫 Filtering orphaned content (invalid team):', {
          title: content.title,
          team_ids: content.team_ids
        });
      }
      
      if (!hasValidRubrique) {
        console.log('🚫 Filtering orphaned content (invalid rubrique):', {
          title: content.title,
          rubrique_id: content.rubrique_id
        });
      }
      
      return hasValidTeam && hasValidRubrique;
    });

    console.log('👤 Valid contents after filtering:', validContents.length);
    
    // Log first few valid contents
    validContents.slice(0, 3).forEach((content, index) => {
      console.log(`👤 Valid Content ${index + 1}:`, {
        title: content.title,
        status: content.status,
        author_id: content.author_id,
        author_id_type: typeof content.author_id,
        author_name: content.author_id?.name
      });
    });

    res.status(200).json({
      success: true,
      count: validContents.length,
      data: validContents
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
    console.log('📋 User role:', req.user?.role);
    
    // Construire le filtre de base
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (rubrique_id) {
      filter.rubrique_id = rubrique_id;
    }

    // Sécurité : filtrer par équipes autorisées pour les non-ADMIN
    const isAdmin = req.user?.role === 'ADMIN';
    
    if (!isAdmin) {
      console.log('🔐 Applying team-based security filter for non-admin user');
      
      // Récupérer les équipes de l'utilisateur
      const Team = require('../models/Team');
      const userId = req.user?._id || req.user?.id;
      
      const userTeams = await Team.find({ 
        members: userId 
      }).select('_id').lean();
      
      const allowedTeamIds = userTeams.map(team => team._id.toString());
      console.log('👥 User teams:', allowedTeamIds);
      
      // Si team_id spécifié, vérifier l'accès
      if (team_id) {
        if (!allowedTeamIds.includes(team_id.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Non autorisé à accéder aux contenus de cette équipe'
          });
        }
        filter.team_ids = team_id;
      } else {
        // Sinon, filtrer par toutes les équipes autorisées
        filter.team_ids = { $in: allowedTeamIds };
      }
    } else {
      console.log('🔓 Admin user - no team filter applied');
      // ADMIN peut voir tout, mais respecte les autres filtres
      if (team_id) {
        filter.team_ids = team_id;
      }
    }

    console.log('📋 Final filter:', filter);

    const contents = await Content.find(filter)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color')
      .sort({ created_at: -1 });

    console.log('📋 Raw contents found:', contents.length);
    
    // Filtrage défensif pour exclure les contenus orphelins
    const validContents = contents.filter(content => {
      const hasValidTeam = !content.team_ids || content.team_ids.length === 0 || 
        content.team_ids.some(team => team && team._id);
      const hasValidRubrique = content.rubrique_id && content.rubrique_id._id;
      
      if (!hasValidTeam) {
        console.log('🚫 Filtering orphaned content (invalid team):', {
          title: content.title,
          team_ids: content.team_ids
        });
      }
      
      if (!hasValidRubrique) {
        console.log('🚫 Filtering orphaned content (invalid rubrique):', {
          title: content.title,
          rubrique_id: content.rubrique_id
        });
      }
      
      return hasValidTeam && hasValidRubrique;
    });

    console.log('📋 Valid contents after filtering:', validContents.length);
    
    // Log first few valid contents with ALL fields
    validContents.slice(0, 3).forEach((content, index) => {
      console.log(`📋 Valid Content ${index + 1}:`, {
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
      count: validContents.length,
      data: validContents
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
    console.log('🔨 File details:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename
    } : 'No file');
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

    // Parser team_ids et tags de manière sécurisée
    let parsedTeamIds = [];
    let parsedTags = [];

    if (Array.isArray(team_ids)) {
      parsedTeamIds = team_ids;
    } else if (typeof team_ids === 'string' && team_ids.trim()) {
      try {
        parsedTeamIds = JSON.parse(team_ids);
      } catch (error) {
        console.log('⚠️ Invalid JSON in team_ids, using empty array');
        parsedTeamIds = [];
      }
    }

    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string' && tags.trim()) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        console.log('⚠️ Invalid JSON in tags, using empty array');
        parsedTags = [];
      }
    }

    // Préparer l'objet de base
    const contentData = {
      title,
      type,
      team_ids: parsedTeamIds,
      rubrique_id,
      tags: parsedTags,
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

      // Ajouter les informations du fichier avec URL Cloudinary
      contentData.file_url = req.file.path; // URL Cloudinary
      contentData.file_name = req.file.originalname;
      contentData.mime_type = req.file.mimetype;
      contentData.cloudinary_public_id = req.file.filename; // important
      contentData.content = req.file.originalname; // Nom du fichier comme content
      
      console.log('📁 File uploaded to Cloudinary:', {
        file_url: contentData.file_url,
        file_name: contentData.file_name,
        mime_type: contentData.mime_type,
        cloudinary_public_id: contentData.cloudinary_public_id
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

    console.log('✅ Content created:', {
      id: newContent._id,
      title: newContent.title,
      type: newContent.type,
      file_url: newContent.file_url,
      cloudinary_public_id: newContent.cloudinary_public_id
    });

    console.log('📋 Content details for debug:', {
      title: newContent.title,
      type: newContent.type,
      file_url: newContent.file_url,
      file_name: newContent.file_name,
      has_file: !!newContent.file_url
    });

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

const downloadContentFile = async (req, res) => {
  try {
    console.log('⬇️ DOWNLOAD START, id =', req.params.id);

    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    console.log('⬇️ Content:', {
      id: content._id,
      title: content.title,
      type: content.type,
      file_url: content.file_url,
      cloudinary_public_id: content.cloudinary_public_id,
      file_name: content.file_name
    });

    // Cas 1 : Cloudinary avec public_id
    if (content.cloudinary_public_id) {
      const url = cloudinary.utils.private_download_url(
        content.cloudinary_public_id,
        null,
        {
          resource_type: 'raw',
          type: 'upload',
          attachment: true,
          expires_at: Math.floor(Date.now() / 1000) + 60
        }
      );

      return res.status(200).json({
        success: true,
        url
      });
    }

    // Cas 2 : URL Cloudinary déjà stockée
    if (content.file_url && content.file_url.includes('res.cloudinary.com')) {
      return res.status(200).json({
        success: true,
        url: content.file_url
      });
    }

    // Cas 3 : ancien fichier local
    if (content.file_url && content.file_url.startsWith('/uploads/')) {
      return res.status(200).json({
        success: true,
        url: `${process.env.BACKEND_URL || 'https://les-echos-ieg.onrender.com'}${content.file_url}` 
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Aucun fichier téléchargeable associé à ce contenu'
    });

  } catch (error) {
    console.error('Erreur downloadContentFile:', error);
    return res.status(500).json({
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
  getMyContents,
  downloadContentFile,
  getDashboardContents
};
