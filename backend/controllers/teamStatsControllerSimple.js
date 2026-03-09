const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');

// Version simplifiée pour diagnostic
const getTeamsWithCounts = async (req, res) => {
  try {
    console.log('🔍=== GET TEAMS WITH COUNTS START ===');
    
    // Récupérer toutes les équipes
    const teams = await Team.find({});
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
          
          console.log(`👥 Members count for ${team.name}: ${membersCount}`);
          
          const teamData = team.toObject();
          teamData.membersCount = membersCount;
          teamData.rubriquesCount = 0; // Temporairement à 0
          teamData.contentsCount = 0; // Temporairement à 0
          
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
    console.error('💥 Error in getTeamsWithCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};

module.exports = {
  getTeamsWithCounts
};
