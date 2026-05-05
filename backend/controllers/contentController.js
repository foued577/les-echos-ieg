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
        select: 'name description color team_ids',
        populate: {
          path: 'team_ids',
          select: 'name'
        }
      })
      .populate('author_id', 'name email avatar')
      .sort({ created_at: -1 });

    console.log('📊 Raw contents found:', contents.length);
    
    // Filter to include only contents with valid rubrique and teams
    const validContents = contents.filter(content => {
      // Content must have a rubrique
      if (!content.rubrique_id) {
        console.log('🚫 Dashboard filtering - No rubrique:', content.title);
        return false;
      }
      
      // Rubrique must have valid teams (array with at least one team)
      const hasValidTeams = Array.isArray(content.rubrique_id.team_ids) && 
        content.rubrique_id.team_ids.length > 0 &&
        content.rubrique_id.team_ids.some(team => team && team._id);
      
      if (!hasValidTeams) {
        console.log('🚫 Dashboard filtering - No valid teams:', {
          title: content.title,
          team_ids: content.rubrique_id.team_ids
        });
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
        team_ids: content.rubrique_id?.team_ids?.map(t => ({ id: t._id, name: t.name })),
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
        rubrique_name: content.rubrique_id?.name,
        file_url: content.file_url,
        files: content.files,
        public_id: content.public_id
      });
    });

    console.log('=== MODERATION CONTENT RESPONSE ===');
    console.log('Total contents for moderation:', validContents.length);
    validContents.forEach((content, index) => {
      if (content.type === 'fichier' || content.type === 'file') {
        console.log(`MODERATION FILE CONTENT ${index + 1}:`, {
          id: content._id,
          title: content.title,
          type: content.type,
          file_url: content.file_url,
          files: content.files,
          public_id: content.public_id,
          cloudinary_public_id: content.cloudinary_public_id
        });
      }
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
    console.log('🔍=== GET CONTENT BY ID ===');
    console.log('🔍 Requested ID:', req.params.id);
    console.log('🔍 USER:', req.user?._id, req.user?.role);
    
    const content = await Content.findById(req.params.id)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color');
    
    console.log('🔍 Content found:', !!content);
    if (content) {
      console.log('🔍 Content type:', content.type);
      console.log('🔍 Files field:', content.files);
      console.log('🔍 Files count:', content.files?.length || 0);
      console.log('🔍 file_url field:', content.file_url);
      console.log('🔍 file_name field:', content.file_name);
      console.log('🔍 All content keys:', Object.keys(content.toObject()));
      console.log('🔍 Full content object:', JSON.stringify(content, null, 2));
    }
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    // Permission validation
    const isAdmin = req.user.role === 'admin';
    const isApproved = content.status === 'approved' || content.status === 'approuve';
    const authorId = content.author_id?._id || content.author_id;
    const isOwner = String(authorId) === String(req.user._id);

    console.log('🔍 PERMISSION CHECK:', { isAdmin, isApproved, isOwner });
    console.log('🔍 Content status:', content.status);
    console.log('🔍 Author ID:', authorId);
    console.log('🔍 User ID:', req.user._id);

    if (!isAdmin && !isApproved && !isOwner) {
      console.log('🔍 ACCESS DENIED - Not admin, not approved, not owner');
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    console.log('🔍 ACCESS GRANTED');
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
    console.log('🔨 Request files:', req.files);
    console.log('🔨 Request file:', req.file);
    console.log('🔨 Files details:', req.files ? req.files.map(f => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: f.path,
      filename: f.filename
    })) : 'No files');
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
      // Pour les fichiers, vérifier qu'au moins un fichier a été uploadé
      const uploadedFiles = req.files || [];
      
      if (uploadedFiles.length === 0 && !req.file) {
        console.log('❌ No files uploaded for type fichier');
        return res.status(400).json({
          success: false,
          message: 'Au moins un fichier est requis pour le type "fichier"'
        });
      }

      // Support multiple files (new feature)
      if (uploadedFiles.length > 0) {
        contentData.files = uploadedFiles.map(file => ({
          name: file.originalname,
          url: file.secure_url || file.path, // ✅ FORCER secure_url
          file_url: file.secure_url || file.path, // ✅ FORCER secure_url
          type: file.mimetype,
          size: file.size,
          cloudinary_public_id: file.filename || file.public_id,
          public_id: file.public_id // ✅ AJOUTER public_id
        }));
        
        // Fallback to legacy format for compatibility
        contentData.file_url = uploadedFiles[0].secure_url || uploadedFiles[0].path; // ✅ FORCER secure_url
        contentData.file_name = uploadedFiles[0].originalname;
        contentData.mime_type = uploadedFiles[0].mimetype;
        contentData.cloudinary_public_id = uploadedFiles[0].filename || uploadedFiles[0].public_id;
        contentData.public_id = uploadedFiles[0].public_id; // ✅ AJOUTER public_id
        contentData.content = uploadedFiles[0].originalname;
        
        console.log('=== FILE HANDLING DEBUG ===');
        console.log('Uploaded files count:', uploadedFiles.length);
        console.log('Files array:', contentData.files);
        console.log('Legacy fallback:', {
          file_url: contentData.file_url,
          file_name: contentData.file_name,
          mime_type: contentData.mime_type,
          public_id: contentData.public_id
        });
      } 
      // Backward compatibility for single file
      else if (req.file) {
        contentData.file_url = req.file.secure_url || req.file.path; // ✅ FORCER secure_url
        contentData.file_name = req.file.originalname;
        contentData.mime_type = req.file.mimetype;
        contentData.cloudinary_public_id = req.file.filename || req.file.public_id;
        contentData.public_id = req.file.public_id; // ✅ AJOUTER public_id
        contentData.content = req.file.originalname;
        
        console.log('=== LEGACY SINGLE FILE DEBUG ===');
        console.log('Single file uploaded:', {
          file_url: contentData.file_url,
          file_name: contentData.file_name,
          mime_type: contentData.mime_type,
          cloudinary_public_id: contentData.cloudinary_public_id,
          public_id: contentData.public_id
        });
      }
      // No files uploaded - block creation
      else {
        console.log('=== NO FILES UPLOADED ===');
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier uploadé pour le contenu de type "fichier"'
        });
      }
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

    console.log('CONTENT FILES BEFORE SAVE:', contentData.files);
    console.log('CONTENT FILE_URL BEFORE SAVE:', contentData.file_url);
    console.log('CONTENT PUBLIC_ID BEFORE SAVE:', contentData.public_id);

    const newContent = await Content.create(contentData);

    console.log('=== CONTENT SAVED - TRUTH LOG ===');
    console.log('CONTENT SAVED:', {
      id: newContent._id,
      type: newContent.type,
      title: newContent.title,
      file_url: newContent.file_url,
      file_name: newContent.file_name,
      mime_type: newContent.mime_type,
      cloudinary_public_id: newContent.cloudinary_public_id,
      files: newContent.files,
      files_count: newContent.files?.length || 0,
      has_files: !!(newContent.files && newContent.files.length > 0),
      has_legacy_file: !!newContent.file_url
    });
    console.log('=== END TRUTH LOG ===');

    console.log('✅ Content created:', {
      id: newContent._id,
      title: newContent.title,
      type: newContent.type,
      file_url: newContent.file_url,
      cloudinary_public_id: newContent.cloudinary_public_id,
      files_count: newContent.files?.length || 0,
      files: newContent.files
    });

    console.log('📋 Content details for debug:', {
      title: newContent.title,
      type: newContent.type,
      file_url: newContent.file_url,
      file_name: newContent.file_name,
      has_file: !!newContent.file_url,
      files_count: newContent.files?.length || 0,
      files: newContent.files
    });

    const populatedContent = await Content.findById(newContent._id)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color');

    console.log('🔍=== DATABASE VERIFICATION ===');
    console.log('🔍 Raw content from DB:', JSON.stringify(populatedContent, null, 2));
    console.log('🔍 Files field:', populatedContent.files);
    console.log('🔍 Files count:', populatedContent.files?.length || 0);
    console.log('🔍 file_url field:', populatedContent.file_url);
    console.log('🔍 file_name field:', populatedContent.file_name);
    console.log('🔍 Content type:', populatedContent.type);
    console.log('🔍 Full content object keys:', Object.keys(populatedContent.toObject()));

    res.status(201).json({
      success: true,
      message: 'Contenu créé avec succès',
      data: populatedContent
    });

  } catch (error) {
    console.error('Erreur updateContent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour un contenu
const updateContent = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("FILES:", req.files);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    // Vérifier que le contenu existe
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
        message: 'Non autorisé à modifier ce contenu'
      });
    }

    let { title, description, type, team_ids, rubrique_id, tags, status, moderated_by, moderation_date, moderation_comment } = req.body;

    // Parser les champs stringifiés depuis FormData
    if (typeof team_ids === "string") {
      team_ids = JSON.parse(team_ids);
    }

    if (typeof tags === "string") {
      tags = JSON.parse(tags);
    }

    // Construire l'objet de mise à jour propre
    const updateData = {
      title,
      description: description || "",
      type,
      rubrique_id,
      team_ids,
      tags
    };

    // Ajouter les champs de modération si présents
    if (status !== undefined) updateData.status = status;
    if (moderated_by !== undefined) updateData.moderated_by = moderated_by;
    if (moderation_date !== undefined) updateData.moderation_date = moderation_date;
    if (moderation_comment !== undefined) updateData.moderation_comment = moderation_comment;

    // Gérer le contenu selon le type
    if (type === 'lien') {
      updateData.content = req.body.url || req.body.content;
    } else if (type === 'article') {
      updateData.content = req.body.content;
    }

    // Gérer l'upload de fichier
    if (req.file) {
      updateData.file_url = req.file.path;
      updateData.file_name = req.file.originalname;
      updateData.mime_type = req.file.mimetype;
    } else if (req.files && req.files.length > 0) {
      // Pour les fichiers multiples
      const newFiles = req.files.map(file => ({
        name: file.originalname,
        url: file.secure_url || file.path,
        file_url: file.secure_url || file.path,
        type: file.mimetype,
        size: file.size,
        cloudinary_public_id: file.filename || file.public_id
      }));
      
      updateData.files = content.files ? [...content.files, ...newFiles] : newFiles;
      // Mettre à jour les champs legacy pour compatibilité
      if (newFiles.length > 0) {
        updateData.file_url = newFiles[0].url;
        updateData.file_name = newFiles[0].name;
        updateData.mime_type = newFiles[0].type;
        updateData.cloudinary_public_id = newFiles[0].cloudinary_public_id;
      }
    }

    // Mettre à jour avec findByIdAndUpdate
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('author_id', 'name email avatar')
     .populate('team_ids', 'name')
     .populate('rubrique_id', 'name description color');

    console.log('Content updated successfully:', updatedContent);

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
