import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { rubriquesAPI, teamsAPI } from '@/services/api';
import { Plus, Search, FolderOpen, Edit2, Trash2, Tag, Hash, Users, Calendar, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function Rubriques() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRubrique, setEditingRubrique] = useState(null);
  const [newRubrique, setNewRubrique] = useState({
    name: '',
    description: '',
    color: '#0f766e',
    team_ids: []
  });
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rubriqueToDelete, setRubriqueToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching rubriques and teams...');
      console.log('👤 Current user:', user);
      
      const [rubriquesResponse, teamsResponse] = await Promise.all([
        rubriquesAPI.getAll(),
        teamsAPI.getAll()
      ]);
      
      console.log('📥 Rubriques response:', rubriquesResponse);
      console.log('📥 Teams response:', teamsResponse);
      
      if (rubriquesResponse.success) {
        setRubriques(rubriquesResponse.data);
        console.log('✅ Rubriques loaded:', rubriquesResponse.data.length);
      }
      
      // teamsAPI.getAll() returns directly an array
      if (Array.isArray(teamsResponse)) {
        // Normalize team IDs
        const normalizedTeams = teamsResponse.map(team => ({
          ...team,
          id: team._id || team.id
        }));
        setTeams(normalizedTeams);
        console.log('✅ Teams loaded and normalized:', normalizedTeams.length);
        console.log('📋 Teams details:', normalizedTeams);
      } else {
        console.log('❌ Teams API failed or returned unexpected format:', teamsResponse);
        setTeams([]); // Ensure teams is set to empty array on failure
      }
    } catch (error) {
      console.error('💥 Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRubrique = async () => {
    try {
      if (!newRubrique.name || newRubrique.team_ids.length === 0) {
        return;
      }

      const response = await rubriquesAPI.create(newRubrique);
      
      if (response.success) {
        setRubriques([...rubriques, response.data]);
        resetForm();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating rubrique:', error);
    }
  };

  const updateRubrique = async () => {
    try {
      const response = await rubriquesAPI.update(editingRubrique._id, newRubrique);
      
      if (response.success) {
        setRubriques(rubriques.map(r => 
          r._id === editingRubrique._id ? response.data : r
        ));
        resetForm();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating rubrique:', error);
    }
  };

  const deleteRubrique = async (id) => {
    try {
      const response = await rubriquesAPI.delete(id);
      
      if (response.success) {
        setRubriques(rubriques.filter(r => r._id !== id));
        setShowDeleteDialog(false);
        setRubriqueToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting rubrique:', error);
    }
  };

  const confirmDelete = (rubrique) => {
    setRubriqueToDelete(rubrique);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setNewRubrique({
      name: '',
      description: '',
      color: '#0f766e',
      team_ids: []
    });
    setEditingRubrique(null);
  };

  const openEditDialog = (rubrique) => {
    setEditingRubrique(rubrique);
    setNewRubrique({
      name: rubrique.name,
      description: rubrique.description,
      color: rubrique.color,
      team_ids: rubrique.team_ids.map(t => t._id || t)
    });
    setIsDialogOpen(true);
  };

  const handleTeamToggle = (teamId, checked) => {
    setNewRubrique(prev => ({
      ...prev,
      team_ids: checked 
        ? [...prev.team_ids, teamId]
        : prev.team_ids.filter(id => id !== teamId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRubrique) {
      updateRubrique();
    } else {
      createRubrique();
    }
  };

  const canCreateEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR' || user?.role === 'admin' || user?.role === 'editor';
  
  console.log('🔍 Rubriques - User:', user);
  console.log('🔍 Rubriques - User role:', user?.role);
  console.log('🔍 Rubriques - Can create/edit:', canCreateEdit);

  const filteredRubriques = rubriques.filter(rubrique => {
    const matchesSearch = rubrique.name.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || 
      (rubrique.team_ids && rubrique.team_ids.includes(selectedTeam));
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rubriques</h1>
          <p className="text-gray-600">Gérez les rubriques de contenu</p>
        </div>
        
        {canCreateEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une rubrique
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRubrique ? 'Modifier la rubrique' : 'Créer une rubrique'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <Input
                    value={newRubrique.name}
                    onChange={(e) => setNewRubrique({...newRubrique, name: e.target.value})}
                    placeholder="Nom de la rubrique"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={newRubrique.description}
                    onChange={(e) => setNewRubrique({...newRubrique, description: e.target.value})}
                    placeholder="Description de la rubrique"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Couleur</label>
                  <Input
                    type="color"
                    value={newRubrique.color}
                    onChange={(e) => setNewRubrique({...newRubrique, color: e.target.value})}
                    className="h-10 w-20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Équipes</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {teams.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Aucune équipe disponible</p>
                    ) : (
                      teams.map(team => (
                        <div key={team._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={team._id}
                            checked={newRubrique.team_ids.includes(team._id)}
                            onCheckedChange={(checked) => handleTeamToggle(team._id, checked)}
                          />
                          <label htmlFor={team._id} className="text-sm">
                            {team.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!newRubrique.name || newRubrique.team_ids.length === 0}
                  >
                    {editingRubrique ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative max-w-sm flex-1">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-stone-200"
          />
        </div>
        <div className="w-48">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="bg-white border-stone-200">
              <SelectValue placeholder="Filtrer par équipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les équipes</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team._id} value={team._id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Chargement...</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRubriques.map(rubrique => (
            <div key={rubrique._id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: rubrique.color }}
                    />
                    <h3 className="font-semibold text-lg">{rubrique.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{rubrique.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {rubrique.team_ids?.length || 0} équipe(s)
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(rubrique.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {canCreateEdit && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(rubrique)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {(user?.role === 'ADMIN' || user?.role === 'admin') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(rubrique)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la rubrique</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Êtes-vous sûr de vouloir supprimer la rubrique <strong>"{rubriqueToDelete?.name}"</strong> ?
            </p>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Les contenus dans cette rubrique ne seront pas supprimés mais ne seront plus catégorisés.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => deleteRubrique(rubriqueToDelete._id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
