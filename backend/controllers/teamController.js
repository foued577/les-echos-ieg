const Team = require('../models/Team');
const { validationResult } = require('express-validator');

// Obtenir toutes les équipes de l'utilisateur connecté
const getTeams = async (req, res) => {
  try {
    console.log('🔍=== GET TEAMS START ===');
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role;
    console.log('👤 User ID from token:', userId);
    console.log('👤 User role:', userRole);
    console.log('👤 Full req.user object:', req.user);
    
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    let teams;
    
    // ADMIN peut voir toutes les équipes, utilisateur normal seulement ses équipes
    if (userRole === 'ADMIN') {
      console.log('🔓 Admin user - fetching all teams');
      teams = await Team.find({})
        .populate('members', 'name email avatar')
        .lean();
    } else {
      console.log('🔐 Normal user - fetching user teams only');
      teams = await Team.find({ 
        members: userId
      }).populate('members', 'name email avatar').lean();
    }
    
    console.log('📊 Teams found:', teams.length);
    
    const teamsWithCounts = teams.map(t => ({
      ...t,
      membersCount: Array.isArray(t.members) ? t.members.length : 0,
    }));
    
    res.status(200).json({
      success: true,
      count: teamsWithCounts.length,
      data: teamsWithCounts
    });
  } catch (error) {
    console.error('Erreur getTeams:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir une équipe par ID
const getTeamById = async (req, res) => {
  try {
    console.log('🔍=== GET TEAM BY ID START ===');
    console.log('🆔 Team ID:', req.params.id);
    console.log('👤 User role:', req.user?.role);
    
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email avatar')
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    // Vérifier si l'utilisateur est ADMIN ou membre de l'équipe
    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';
    const isMember = team.members && team.members.some(member => 
      (member._id || member.id || member).toString() === userId.toString()
    );

    console.log('👤 User ID:', userId);
    console.log('🔐 Is admin:', isAdmin);
    console.log('👥 Is member:', isMember);

    if (!isAdmin && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à accéder à cette équipe'
      });
    }

    // Count contents for this team
    const Content = require('../models/Content');
    const contentsCount = await Content.countDocuments({ 
      team_ids: req.params.id,
      status: 'approved'
    });
    
    console.log('📄 Contents count:', contentsCount);

    // Return consistent format with populated members and correct count
    return res.json({
      ...team,
      contentsCount: contentsCount,
      membersCount: Array.isArray(team.members) ? team.members.length : 0,
    });
  } catch (error) {
    console.error('💥 getTeamById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer une équipe
const createTeam = async (req, res) => {
  try {
    console.log('🔨=== CREATE TEAM START ===');
    console.log('📨 Request body:', req.body);
    console.log('👤 Full req.user object:', req.user);
    console.log('👤 req.user.id:', req.user?.id);
    console.log('👤 req.user._id:', req.user?._id);
    console.log('👤 typeof req.user:', typeof req.user);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const { name, description, color, members } = req.body;
    console.log('🎨 Extracted color:', color);
    console.log('👤 Current user ID:', req.user?.id);

    // Ajouter automatiquement le créateur comme membre
    const teamMembers = members || [];
    const userId = req.user?.id || req.user?._id;
    
    console.log('🔍 Team members before adding:', teamMembers);
    console.log('🔍 User ID to add:', userId);
    console.log('🔍 Is user already in members?', teamMembers.includes(userId));
    
    if (userId && !teamMembers.includes(userId)) {
      teamMembers.push(userId);
      console.log('✅ Added creator as member:', userId);
    } else {
      console.log('❌ Could not add creator - user ID missing or already in members');
    }

    console.log('🔍 Final team members:', teamMembers);

    const team = await Team.create({
      name,
      description,
      color,
      members: teamMembers
    });

    console.log('🔍 Created team before populate:', team);

    const populatedTeam = await Team.findById(team._id).populate('members', 'name email avatar');
    console.log('✅ Team created with color:', populatedTeam.color);
    console.log('✅ Team members after populate:', populatedTeam.members);

    res.status(201).json({
      success: true,
      message: 'Équipe créée avec succès',
      data: populatedTeam
    });
  } catch (error) {
    console.error('Erreur createTeam:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour une équipe
const updateTeam = async (req, res) => {
  try {
    console.log('🔨=== UPDATE TEAM START ===');
    console.log('📨 Request body:', req.body);
    console.log('🆔 Team ID:', req.params.id);
    
    // Validation des entrées
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array()
      });
    }

    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    console.log('🎨 Current team color:', team.color);
    console.log('🎨 New color from request:', req.body.color);

    const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('members', 'name email avatar');

    console.log('✅ Team updated with color:', updatedTeam.color);

    res.status(200).json({
      success: true,
      message: 'Équipe mise à jour avec succès',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Erreur updateTeam:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une équipe
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Équipe supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteTeam:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les contenus d'une équipe
const getTeamContents = async (req, res) => {
  try {
    console.log('📄=== GET TEAM CONTENTS START ===');
    console.log('🆔 Team ID:', req.params.teamId);
    console.log('📋 Query params:', req.query);
    
    const { status } = req.query;
    const { teamId } = req.params;
    
    // Construire le filtre
    let filter = { team_ids: teamId };
    
    if (status) {
      filter.status = status;
    }
    
    console.log('🔍 Filter:', filter);
    
    const Content = require('../models/Content');
    const contents = await Content.find(filter)
      .populate('author_id', 'name email avatar')
      .populate('team_ids', 'name')
      .populate('rubrique_id', 'name description color')
      .sort({ created_at: -1 });

    console.log('📋 Team contents found:', contents.length);
    
    // Log first few contents
    contents.slice(0, 3).forEach((content, index) => {
      console.log(`📋 Content ${index + 1}:`, {
        title: content.title,
        status: content.status,
        team_ids: content.team_ids,
        rubrique_id: content.rubrique_id,
        author_name: content.author_id?.name
      });
    });

    res.status(200).json({
      success: true,
      count: contents.length,
      data: contents
    });
  } catch (error) {
    console.error('Erreur getTeamContents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamContents
};
