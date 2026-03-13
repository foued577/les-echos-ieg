const express = require('express');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Rubrique = require('../models/Rubrique');
const Content = require('../models/Content');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Ajouter le middleware d'authentification pour correspondre au frontend
router.use(authMiddleware);

// Endpoint de test avec authentification
router.get('/test-summary', async (req, res) => {
  try {
    console.log('🔍=== TEST SUMMARY START ===');
    console.log('👤 Authenticated user:', req.user?.email);
    console.log('👤 User role:', req.user?.role);
    
    let teams;
    
    // Sécurité : filtrer par équipes autorisées pour les non-ADMIN
    const isAdmin = req.user?.role === 'ADMIN';
    
    if (isAdmin) {
      console.log('🔓 Admin user - fetching all teams');
      teams = await Team.find({});
    } else {
      console.log('🔐 Normal user - fetching user teams only');
      const userId = req.user?._id || req.user?.id;
      teams = await Team.find({ 
        members: userId 
      });
    }
    
    console.log(`📊 Found ${teams.length} teams`);
    
    // Pour chaque équipe, compter les membres
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const teamId = team._id;
        console.log(`🔍 Processing team: ${team.name} (${teamId})`);
        
        try {
          // Compter les membres
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
          
          console.log(`📊 Team ${team.name}: Members=${membersCount}, Rubriques=${rubriquesCount}, Contents=${contentsCount}`);
          
          const teamData = team.toObject();
          teamData.membersCount = membersCount;
          teamData.rubriquesCount = rubriquesCount;
          teamData.contentsCount = contentsCount;
          
          return teamData;
        } catch (error) {
          console.error(`💥 Error processing team ${team.name}:`, error);
          const teamData = team.toObject();
          teamData.membersCount = 0;
          teamData.rubriquesCount = 0;
          teamData.contentsCount = 0;
          return teamData;
        }
      })
    );

    console.log('✅ Teams with counts loaded:', teamsWithCounts.length);

    res.status(200).json({
      success: true,
      count: teamsWithCounts.length,
      data: teamsWithCounts
    });
  } catch (error) {
    console.error('💥 Error in test-summary:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
});

// GET /api/test/:teamId/members - obtenir les membres d'une équipe
router.get('/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log('🔍=== GET TEAM MEMBERS ===');
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
});

// POST /api/test/:teamId/members - ajouter un membre à une équipe
router.post('/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { user_id, role = 'member' } = req.body;
    
    console.log('🔍=== ADD TEAM MEMBER ===');
    console.log('🆔 Team ID:', teamId);
    console.log('👤 User ID:', user_id);
    console.log('🔑 Role:', role);
    
    // Vérifier si l'utilisateur existe
    const User = require('../models/User');
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
});

// DELETE /api/test/:teamId/members/:memberId - retirer un membre
router.delete('/:teamId/members/:memberId', async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    
    console.log('🔍=== REMOVE TEAM MEMBER ===');
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
});

// GET /api/test/users - obtenir tous les utilisateurs disponibles
router.get('/users', async (req, res) => {
  try {
    console.log('🔍=== GET ALL USERS ===');
    
    const User = require('../models/User');
    const users = await User.find({}).select('_id name email role');
    
    console.log('👥 Users found:', users.length);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('💥 Error in getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/test/users - créer un nouvel utilisateur
router.post('/users', async (req, res) => {
  try {
    console.log('🔍=== CREATE USER ===');
    console.log('👤 User data:', req.body);
    
    const User = require('../models/User');
    const { name, email, role, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, l\'email et le mot de passe sont requis'
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    
    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      role: role || 'MEMBER',
      password
    });
    
    console.log('✅ User created successfully');

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('💥 Error in createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
});

module.exports = router;
