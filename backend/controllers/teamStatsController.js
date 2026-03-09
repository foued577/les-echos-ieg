const Team = require('../models/Team');
const User = require('../models/User');
const Content = require('../models/Content');
const Rubrique = require('../models/Rubrique');
const TeamMember = require('../models/TeamMember');

// Obtenir les statistiques complètes pour toutes les équipes
const getTeamsWithCounts = async (req, res) => {
  try {
    console.log('🔍=== GET TEAMS WITH COUNTS START ===');
    
    const teams = await Team.find({});
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const teamId = team._id;
        
        // Compter les membres via la table pivot
        const membersCount = await TeamMember.countDocuments({ 
          team_id: teamId 
        });
        
        // Compter les rubriques liées à cette équipe
        const rubriquesCount = await Rubrique.countDocuments({ 
          team_ids: { $in: [teamId] }
        });
        
        // Compter les contenus approuvés liés à cette équipe
        const contentsCount = await Content.countDocuments({ 
          team_ids: { $in: [teamId] },
          status: 'approved'
        });
        
        console.log(`📊 Team ${team.name}:`, {
          members: membersCount,
          rubriques: rubriquesCount,
          contents: contentsCount
        });
        
        const teamData = team.toObject();
        teamData.membersCount = membersCount;
        teamData.rubriquesCount = rubriquesCount;
        teamData.contentsCount = contentsCount;
        
        return teamData;
      })
    );

    console.log('✅ Teams with counts loaded:', teamsWithCounts.length);

    res.status(200).json({
      success: true,
      count: teamsWithCounts.length,
      data: teamsWithCounts
    });
  } catch (error) {
    console.error('💥 Error in getTeamsWithCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les membres d'une équipe spécifique
const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log('🔍=== GET TEAM MEMBERS START ===');
    console.log('🆔 Team ID:', teamId);
    
    const teamMembers = await TeamMember.find({ 
      team_id: teamId 
    })
      .populate('user_id', 'name email avatar role')
      .populate('team_id', 'name');
    
    console.log('👥 Team members found:', teamMembers.length);

    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (error) {
    console.error('💥 Error in getTeamMembers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Ajouter un membre à une équipe
const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { user_id, role = 'member' } = req.body;
    
    console.log('🔍=== ADD TEAM MEMBER START ===');
    console.log('🆔 Team ID:', teamId);
    console.log('👤 User ID:', user_id);
    console.log('🔑 Role:', role);
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'équipe existe
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }
    
    // Vérifier si le membre existe déjà
    const existingMember = await TeamMember.findOne({ 
      team_id: teamId, 
      user_id: user_id 
    });
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà membre de cette équipe'
      });
    }
    
    // Créer le membre
    const teamMember = await TeamMember.create({
      team_id: teamId,
      user_id: user_id,
      role: role
    });
    
    console.log('✅ Member added successfully');

    res.status(201).json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    console.error('💥 Error in addTeamMember:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Retirer un membre d'une équipe
const removeTeamMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    
    console.log('🔍=== REMOVE TEAM MEMBER START ===');
    console.log('🆔 Team ID:', teamId);
    console.log('👤 Member ID:', memberId);
    
    const result = await TeamMember.deleteOne({ 
      _id: memberId,
      team_id: teamId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Membre non trouvé'
      });
    }
    
    console.log('✅ Member removed successfully');

    res.status(200).json({
      success: true,
      message: 'Membre retiré avec succès'
    });
  } catch (error) {
    console.error('💥 Error in removeTeamMember:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  getTeamsWithCounts,
  getTeamMembers,
  addTeamMember,
  removeTeamMember
};
