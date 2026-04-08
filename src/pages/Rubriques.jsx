import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { rubriquesAPI, teamsAPI, contentsAPI } from '@/services/api';
import { Plus, Search, FolderOpen, Edit2, Trash2, Tag, Hash, Users, Calendar, Edit, FileText, Newspaper, TrendingUp, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

// Utility functions for rubrique types and colors
const getRubriqueType = (rubrique) => {
  const name = rubrique.name.toLowerCase();
  if (name.includes('veille') || name.includes('actualité') || name.includes('news')) return 'veille';
  if (name.includes('pédagogie') || name.includes('formation') || name.includes(' apprentissage')) return 'pedagogie';
  if (name.includes('législatif') || name.includes('juridique') || name.includes('droit')) return 'legislatif';
  if (name.includes('entreprise') || name.includes('business') || name.includes('commercial')) return 'entreprise';
  return 'default';
};

const getRubriqueTypeInfo = (type) => {
  const types = {
    veille: {
      icon: Newspaper,
      emoji: '📰',
      label: 'Veille',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6'
    },
    pedagogie: {
      icon: FileText,
      emoji: '📚',
      label: 'Pédagogie',
      color: '#10b981',
      bgColor: '#f0fdf4',
      borderColor: '#10b981'
    },
    legislatif: {
      icon: Tag,
      emoji: '⚖️',
      label: 'Législatif',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#f59e0b'
    },
    entreprise: {
      icon: TrendingUp,
      emoji: '💼',
      label: 'Entreprise',
      color: '#8b5cf6',
      bgColor: '#faf5ff',
      borderColor: '#8b5cf6'
    },
    default: {
      icon: FolderOpen,
      emoji: '📁',
      label: 'Autre',
      color: '#6b7280',
      bgColor: '#f9fafb',
      borderColor: '#6b7280'
    }
  };
  
  return types[type] || types.default;
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const fetchRubriqueStats = async (rubriquesList) => {
  try {
    const statsPromises = rubriquesList.map(async (rubrique) => {
      try {
        // Get all contents for this rubrique using correct field name
        const contentsResponse = await contentsAPI.getAll({ rubrique_id: rubrique._id });
        const contents = contentsResponse.data || [];
        
        // Get recent contents (last 3)
        const recentContents = contents
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        
        return {
          [rubrique._id]: {
            totalContents: contents.length,
            recentContents: recentContents,
            lastUpdated: contents.length > 0 ? 
              new Date(Math.max(...contents.map(c => new Date(c.created_at)))) : 
              new Date(rubrique.created_at)
          }
        };
      } catch (error) {
        console.error(`Error fetching stats for rubrique ${rubrique._id}:`, error);
        return {
          [rubrique._id]: {
            totalContents: 0,
            recentContents: [],
            lastUpdated: new Date(rubrique.created_at)
          }
        };
      }
    });
    
    const statsResults = await Promise.all(statsPromises);
    const stats = statsResults.reduce((acc, stat) => ({ ...acc, ...stat }), {});
    setRubriqueStats(stats);
    
    console.log('Rubrique stats loaded:', stats);
  } catch (error) {
    console.error('Error fetching rubrique stats:', error);
  }
};

export default function Rubriques() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [rubriqueStats, setRubriqueStats] = useState({});
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
        // Populate teams in rubriques
        const rubriquesWithTeams = await Promise.all(
          rubriquesResponse.data.map(async (rubrique) => {
            try {
              const populatedRubrique = await rubriquesAPI.getById(rubrique._id);
              return populatedRubrique.data || rubrique;
            } catch (error) {
              console.error(`Error populating teams for rubrique ${rubrique._id}:`, error);
              return rubrique;
            }
          })
        );
        
        setRubriques(rubriquesWithTeams);
        console.log('✅ Rubriques loaded with teams:', rubriquesWithTeams.length);
        
        // Fetch content statistics for each rubrique
        await fetchRubriqueStats(rubriquesWithTeams);
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
        
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48">
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

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-500">Chargement des rubriques...</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRubriques.map(rubrique => {
            const type = getRubriqueType(rubrique);
            const typeInfo = getRubriqueTypeInfo(type);
            const stats = rubriqueStats[rubrique._id] || {
              totalContents: 0,
              recentContents: [],
              lastUpdated: new Date(rubrique.created_at)
            };
            
            return (
              <div
                key={rubrique._id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Header with type badge */}
                <div 
                  className="h-2"
                  style={{ 
                    background: `linear-gradient(to right, ${typeInfo.bgColor}, ${typeInfo.borderColor}20)`
                  }}
                />
                
                <div className="p-6">
                  {/* Type and title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: typeInfo.color }}
                      >
                        <typeInfo.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                            {rubrique.name}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: typeInfo.bgColor,
                                  color: typeInfo.color
                                }}>
                            {typeInfo.emoji} {typeInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {rubrique.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {canCreateEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(rubrique)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(user?.role === 'ADMIN' || user?.role === 'admin') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(rubrique)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content Statistics */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Contenus</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-gray-900">{stats.totalContents}</div>
                      <div className="text-sm text-gray-500">
                        {stats.totalContents === 0 ? 'Aucun contenu' : 
                         stats.totalContents === 1 ? '1 contenu' : 
                         `${stats.totalContents} contenus`}
                      </div>
                    </div>
                  </div>

                  {/* Recent Contents Preview */}
                  {stats.recentContents.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Derniers contenus</span>
                      </div>
                      <div className="space-y-2">
                        {stats.recentContents.slice(0, 3).map((content, index) => (
                          <div key={content._id} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            <span className="text-gray-600 truncate flex-1">
                              {content.title}
                            </span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatDate(new Date(content.created_at))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Information */}
                  {rubrique.team_ids && rubrique.team_ids.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Équipe(s) associée(s)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rubrique.team_ids.map((teamId, index) => {
                          const team = Array.isArray(teamId) ? teamId : 
                                    (typeof teamId === 'object' && teamId.name) ? teamId :
                                    teams.find(t => t._id === teamId || t.id === teamId);
                          
                          if (!team || !team.name) return null;
                          
                          return (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full"
                            >
                              {team.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer with metadata and action */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {rubrique.team_ids?.length || 0} équipe(s)
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(new Date(rubrique.created_at))}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/rubriques/${rubrique._id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voir les contenus
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
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
