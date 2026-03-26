import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { teamsAPI } from '@/services/api';
import { Plus, Search, Users2, ChevronRight, Trash2, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', color: '#64748b' });
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log('🔍 Loading teams...');
      setLoading(true);
      
      const teamsData = await teamsAPI.getAll();
      
      const normalizedTeams = Array.isArray(teamsData)
        ? teamsData.map((team) => ({
            ...team,
            id: team._id || team.id,
          }))
        : [];
      
      console.log('✅ Teams page loaded:', normalizedTeams);
      setTeams(normalizedTeams);
    } catch (error) {
      console.error('💥 Error loading teams page:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    try {
      console.log('🔨 Creating team...');
      
      const teamResponse = await teamsAPI.create({
        ...newTeam,
        created_by: user.id,
        members: [user.id]
      });

      if (teamResponse.success) {
        const newTeamData = teamResponse.data;
        setTeams([...teams, newTeamData]);
        console.log('✅ Team created:', newTeamData);
      } else {
        console.log('❌ Failed to create team:', teamResponse);
      }
      
      setShowCreateDialog(false);
      setNewTeam({ name: '', description: '', color: '#64748b' });
      loadData();
    } catch (error) {
      console.error('💥 Error creating team:', error);
    }
  };

  const deleteTeam = async () => {
    if (teamToDelete) {
      try {
        await teamsAPI.delete(teamToDelete.id);
        setShowDeleteDialog(false);
        setTeamToDelete(null);
        loadData();
        // Show success message
        alert(`L'équipe "${teamToDelete.name}" a été supprimée avec succès.`);
        
        // Trigger dashboard refresh to clear orphaned content
        if (window.refreshDashboard) {
          console.log('🔄 Triggering dashboard refresh after team deletion');
          window.refreshDashboard();
        }
      } catch (error) {
        console.error('💥 Error deleting team:', error);
        alert('Erreur lors de la suppression de l\'équipe.');
      }
    }
  };

  const confirmDeleteTeam = (team) => {
    setTeamToDelete(team);
    setShowDeleteDialog(true);
  };

  const loadAvailableUsers = async () => {
    try {
      console.log('🔍 Loading available users...');
      const response = await teamsAPI.getUsers();
      
      if (response.success) {
        console.log('✅ Available users loaded:', response.data);
        setAvailableUsers(response.data);
      } else {
        console.error('❌ Failed to load users:', response);
      }
    } catch (error) {
      console.error('💥 Error loading users:', error);
    }
  };

  const openEditDialog = (team) => {
    setEditTeam({
      ...team,
      id: team._id || team.id
    });
    loadTeamMembers(team._id || team.id);
    loadAvailableUsers();
    setShowEditDialog(true);
  };

  const updateTeam = async () => {
    if (editTeam) {
      try {
        console.log('🔨 Updating team...');
        console.log('🎨 New color:', editTeam.color);
        console.log('👥 Current team members:', teamMembers);
        
        // Extract member IDs from teamMembers
        const memberIds = teamMembers.map(member => 
          member.user_id?._id || member.user_id || member._id
        ).filter(Boolean);
        
        console.log('👥 Member IDs to send:', memberIds);
        
        const teamResponse = await teamsAPI.update(editTeam.id, {
          name: editTeam.name,
          description: editTeam.description,
          color: editTeam.color,
          members: memberIds
        });

        if (teamResponse.success) {
          console.log('✅ Team updated:', teamResponse.data);
          console.log('🎨 Updated team color:', teamResponse.data.color);
          alert('Équipe mise à jour avec succès!');
          setShowEditDialog(false);
          setEditTeam(null);
          loadData(); // Refresh all teams data
        } else {
          console.log('❌ Failed to update team:', teamResponse);
          alert('Erreur lors de la mise à jour de l\'équipe');
        }
      } catch (error) {
        console.error('💥 Error updating team:', error);
        alert('Erreur lors de la mise à jour de l\'équipe');
      }
    }
  };

  const loadTeamMembers = async (teamId) => {
    try {
      console.log('🔍 Loading team members...');
      const response = await teamsAPI.getTeamMembers(teamId);
      
      if (response.success) {
        console.log('✅ Team members loaded:', response.data);
        setTeamMembers(response.data);
      } else {
        console.error('❌ Failed to load team members:', response);
      }
    } catch (error) {
      console.error('💥 Error loading team members:', error);
    }
  };

  const addTeamMember = async (userId) => {
    if (!editTeam) return;
    
    try {
      console.log('🔨 Adding team member...');
      
      const response = await teamsAPI.addTeamMember(editTeam.id, userId);
      
      if (response.success) {
        console.log('✅ Team member added:', response.data);
        loadTeamMembers(editTeam.id);
        loadData(); // Refresh teams data to update counters
        alert('Membre ajouté avec succès!');
      } else {
        console.log('❌ Failed to add team member:', response);
        alert('Erreur lors de l\'ajout du membre');
      }
    } catch (error) {
      console.error('💥 Error adding team member:', error);
      alert('Erreur lors de l\'ajout du membre');
    }
  };

  const removeTeamMember = async (memberId) => {
    if (!editTeam) return;
    
    try {
      console.log('🗑️ Removing team member...');
      
      const response = await teamsAPI.removeTeamMember(editTeam.id, memberId);
      
      if (response.success) {
        console.log('✅ Team member removed:', response.data);
        loadTeamMembers(editTeam.id);
        loadData(); // Refresh teams data to update counters
        alert('Membre retiré avec succès!');
      } else {
        console.log('❌ Failed to remove team member:', response);
        alert('Erreur lors du retrait du membre');
      }
    } catch (error) {
      console.error('💥 Error removing team member:', error);
      alert('Erreur lors du retrait du membre');
    }
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // Debug temporaire
  console.log('Teams state in Teams.jsx:', teams);
  console.log('Filtered teams:', filteredTeams);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">Équipes</h1>
          <p className="text-slate-500 mt-1">Espaces de travail collaboratifs</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'admin') && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle équipe
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-stone-200"
        />
      </div>

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-300 rounded-xl">
          <Users2 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <p className="text-stone-500">Aucune équipe trouvée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTeams.map((team) => {
            return (
              <div key={team._id || team.id} className="group relative">
                <div className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: team.color || '#64748b' }}
                  >
                    {team.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-slate-500 truncate">{team.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>{team.membersCount || 0} membre{(team.membersCount || 0) > 1 ? 's' : ''}</span>
                      <span>{team.rubriquesCount || 0} rubrique{(team.rubriquesCount || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={createPageUrl(`TeamDetail?id=${team._id}`)}
                      className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'admin') && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditDialog(team);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            confirmDeleteTeam(team);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une équipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Ex: Marketing, IT, RH..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="Description de l'équipe"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {['#64748b', '#0f766e', '#1d4ed8', '#7c3aed', '#be185d', '#c2410c'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-transform ${newTeam.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTeam({ ...newTeam, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={createTeam}
              disabled={!newTeam.name}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'équipe</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Êtes-vous sûr de vouloir supprimer l'équipe <strong>"{teamToDelete?.name}"</strong> ?
            </p>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Cette action supprimera également toutes les rubriques et tous les contenus associés à cette équipe.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={deleteTeam}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'équipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editTeam?.name || ''}
                onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                placeholder="Nom de l'équipe"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editTeam?.description || ''}
                onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
                placeholder="Description de l'équipe"
                rows={3}
              />
            </div>
            
            {/* Team Members Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Membres de l'équipe</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddMemberDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un membre
                </Button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Aucun membre dans cette équipe</p>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white text-sm font-medium">
                          {member.user_id?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {member.user_id?.name || 'Utilisateur inconnu'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {member.user_id?.email || 'Email inconnu'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-700">
                          {member.role === 'admin' ? 'Admin' : 'Membre'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {['#64748b', '#0f766e', '#1d4ed8', '#7c3aed', '#be185d', '#c2410c', '#ca8a04', '#16a34a'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-transform ${editTeam?.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditTeam({ ...editTeam, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={updateTeam}
              disabled={!editTeam?.name}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
            >
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 mb-4">
              Sélectionnez un utilisateur à ajouter à l'équipe <strong>"{editTeam?.name}"</strong>
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Aucun utilisateur disponible</p>
              ) : (
                availableUsers
                  .filter(user => !teamMembers.some(member => member.user_id._id === user._id))
                  .map((user) => (
                    <div 
                      key={user._id} 
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => {
                        addTeamMember(user._id);
                        setShowAddMemberDialog(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white text-sm font-medium">
                          {user.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-700">
                          {user.role === 'ADMIN' ? 'Admin' : 'Utilisateur'}
                        </span>
                        <Plus className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}