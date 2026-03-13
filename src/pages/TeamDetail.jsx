import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { teamsAPI, contentsAPI, buildFileUrl } from '@/services/api';
import { apiClient } from '../lib/apiClient';
import normalizeTeam from "@/services/api";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  ArrowLeft, Users2, FolderOpen, Plus, Settings, UserPlus,
  MoreVertical, Trash2, FileText, Link as LinkIcon, File, ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TeamDetail() {
  const location = useLocation();
  const teamId = new URLSearchParams(location.search).get("id");
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log("🔍=== TEAM ID EXTRACTION ===");
  console.log("🌐 FULL URL:", window.location.href);
  console.log("🔍 location.pathname:", location.pathname);
  console.log("🔍 location.search:", location.search);
  console.log("🆔 TEAM ID =", teamId);
  console.log("🆔 TEAM ID type:", typeof teamId);
  console.log("🆔 TEAM ID is null/undefined:", teamId === null || teamId === undefined);
  
  // 🔥 IMMEDIATE GUARD - Si pas de teamId, ne rien faire
  if (!teamId) {
    console.error("🚫 CRITICAL: No teamId provided! Aborting all operations.");
    console.error("🚫 This prevents GET /api 404 errors!");
    console.error("🚫 URL should be: /TeamDetail?id=TEAM_ID");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Erreur: Équipe non spécifiée</h1>
          <p className="text-slate-600 mb-6">Aucun ID d'équipe trouvé dans l'URL.</p>
          <p className="text-slate-500 text-sm mb-6">URL attendue: /TeamDetail?id=ID_DE_L_EQUIPE</p>
          <button 
            onClick={() => navigate('/teams')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour aux équipes
          </button>
        </div>
      </div>
    );
  }

  const [team, setTeam] = useState(null);
  const [categories, setCategories] = useState([]);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Members derived from team data - ULTRA ROBUST
  const members = useMemo(() => {
    const raw = team?.members;
    if (!Array.isArray(raw)) return [];

    // normalise : si backend renvoie des IDs (string) ou des objets
    return raw
      .map((m) => {
        if (!m) return null;
        if (typeof m === "string") return { _id: m, name: "Utilisateur", email: "", avatar: "" };
        return m; // objet populé
      })
      .filter(Boolean);
  }, [team]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editTeam, setEditTeam] = useState({ name: '', description: '', color: '#64748b' });
  const [newMember, setNewMember] = useState({ user_email: '', role: 'membre' });
  const [newCategory, setNewCategory] = useState({ name: '', color: '#64748b' });
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isArticleOpen, setIsArticleOpen] = useState(false);

  useEffect(() => {
    if (!teamId) {
      console.error("❌ teamId manquant dans l'URL !");
      setLoading(false);
      return;
    }
    if (user) loadData();
  }, [teamId, user]);

  const loadData = async () => {
    if (!teamId) {
      console.error(" Impossible de charger les données sans teamId !");
      console.error(" URL actuelle:", window.location.href);
      console.error(" Search params:", window.location.search);
      console.error(" teamId value:", teamId);
      console.error(" teamId type:", typeof teamId);
      console.error(" ABORTING API CALLS to prevent GET /api 404!");
      setLoading(false);
      return;
    }
    
    try {
      console.log(' Loading team detail for ID:', teamId);
      console.log(' API call will be: GET /api/teams/' + teamId);
      
      const [teamResponse, contentsResponse] = await Promise.all([
        apiClient.get(`/teams/${teamId}`),
        teamsAPI.getTeamContents(teamId, { status: 'approved' })
      ]);

      // apiClient retourne directement les données, pas un objet avec success
      const teamData = teamResponse.data;
      
      if (teamData._id) {
        console.log('🔍=== DIRECT TEAM RESPONSE ===');
        console.log('Team data:', teamData);
        console.log('Team members field:', teamData?.members);
        console.log('Type of members:', typeof teamData?.members);
        console.log('Is array?', Array.isArray(teamData?.members));
        console.log('Members length:', teamData?.members?.length);
        
        setTeam(teamData);
        
        console.log('✅ Team loaded:', teamData);
        console.log('📄 Contents count:', teamData?.contentsCount || 0);
      } else {
        console.error('❌ Failed to load team:', teamData);
        setTeam(null);
      }

      if (contentsResponse.success) {
        console.log('📄 Team contents loaded:', contentsResponse.data.length);
        console.log('📄 Sample content:', contentsResponse.data[0]);
        setContents(contentsResponse.data);
      } else {
        console.error('❌ Failed to load team contents:', contentsResponse);
        setContents([]);
      }

      const membership = (teamData?.members || [])?.find(m => m._id === user.id || m === user.id);
      setUserRole(membership ? 'member' : null);
      setLoading(false);
    } catch (error) {
      console.error('💥 Error loading team detail:', error?.response?.data || error);
      console.error('💥 Error status:', error?.response?.status);
      console.error('💥 Error URL:', error?.config?.url);
      setTeam(null);
      setLoading(false);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log('🗑️=== DELETE CONTENT START ===');
      console.log('🆔 Content ID:', contentId);
      
      const response = await contentsAPI.delete(contentId);
      console.log('✅ Delete response:', response);
      
      if (response.success) {
        toast.success('Contenu supprimé avec succès');
        // Mettre à jour le state local immédiatement (meilleure UX)
        setContents((prevContents) =>
          prevContents.filter((content) => (content._id || content.id) !== contentId)
        );
      } else {
        toast.error('Erreur lors de la suppression du contenu');
      }
    } catch (error) {
      console.error('💥 Error deleting content:', error);
      toast.error('Erreur lors de la suppression du contenu');
    }
  };

  const addMember = async () => {
    if (!teamId) {
      console.error("🚫 Cannot add member: no teamId provided!");
      return;
    }
    
    // TODO: Implement addMember API
    console.log('🔔 addMember not implemented yet');
    setShowAddMember(false);
    setNewMember({ user_email: '', role: 'membre' });
    loadData();
  };

  const removeMember = async (memberId) => {
    if (!teamId) {
      console.error("🚫 Cannot remove member: no teamId provided!");
      return;
    }
    
    // TODO: Implement removeMember API
    console.log('🔔 removeMember not implemented yet');
    loadData();
  };

  const addCategory = async () => {
    if (!teamId) {
      console.error("🚫 Cannot add category: no teamId provided!");
      return;
    }
    
    // Categories not implemented in local service yet
    setShowAddCategory(false);
    setNewCategory({ name: '', color: '#64748b' });
    loadData();
  };

  const deleteCategory = async (categoryId) => {
    if (!teamId) {
      console.error("🚫 Cannot delete category: no teamId provided!");
      return;
    }
    
    // Categories not implemented in local service yet
    loadData();
  };

  const updateTeam = async () => {
    try {
      console.log('🔨 Updating team...');
      
      const teamResponse = await apiClient.put(`/teams/${teamId}`, editTeam);
      const updatedTeam = teamResponse.data;

      if (updatedTeam._id) {
        setTeam(updatedTeam);
        console.log('✅ Team updated:', updatedTeam);
        alert('Équipe mise à jour avec succès!');
      } else {
        console.log('❌ Failed to update team:', updatedTeam);
        alert('Erreur lors de la mise à jour de l\'équipe');
      }
      
      setShowEditTeam(false);
      loadData();
    } catch (error) {
      console.error('💥 Error updating team:', error);
      alert('Erreur lors de la mise à jour de l\'équipe');
    }
  };

  const openEditDialog = () => {
    console.log('🔍 Edit button clicked!');
    console.log('👤 User:', user);
    console.log('👤 User role:', user?.role);
    console.log('👤 UserRole:', userRole);
    console.log('🔐 isAdmin:', isAdmin);
    
    setEditTeam({
      name: team.name || '',
      description: team.description || '',
      color: team.color || '#64748b'
    });
    setShowEditTeam(true);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || userRole === 'admin';

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link':
      case 'lien': 
        return LinkIcon;
      case 'file':
      case 'fichier': 
        return File;
      case 'article':
      default: 
        return FileText;
    }
  };

  const openContent = (content) => {
    const type = content.type || content.content_type;

  if (type === "link" || type === "lien") {
    const url = content.url || content.link || content.content;
    const fullUrl = url?.startsWith("http") ? url : `https://${url}`;
    console.log('🔗 Link opening:', fullUrl);
    if (!url) return console.error("Missing link URL", content);
    window.open(fullUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (type === "file" || type === "fichier") {
    console.log('📁 File content clicked:', content);
    
    if (!content.file_url) {
      console.error("Missing file URL", content);
      alert("⚠️ Fichier non uploadé\n\nCe contenu de type 'fichier' n'a pas de fichier associé.\nLe fichier n'a probablement pas été correctement uploadé lors de la création.\n\nSolution: Recréer ce contenu en uploadant un vrai fichier.");
      return;
    }

    // Construire l'URL du fichier avec buildFileUrl
    const fileUrl = buildFileUrl(content.file_url);
    
    console.log('📁 File URL:', fileUrl);
    console.log('📁 File name:', content.file_name || content.title);

    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = content.file_name || content.title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('📁 File download triggered successfully');
    } catch (error) {
      console.error('❌ File download failed:', error);
      alert('❌ Erreur lors du téléchargement du fichier');
    }
    return;
  }

  if (type === "article") {
    console.log('📝 Article - opening modal');
    setSelectedArticle(content);
    setIsArticleOpen(true);
    return;
  }

  console.warn("Unknown type", type, content);
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Équipe non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Teams')}>
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: team.color || '#64748b' }}
        >
          {team.name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">{team.name}</h1>
          {team.description && <p className="text-slate-500">{team.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contents">
        <TabsList className="bg-stone-100">
          <TabsTrigger value="contents" className="data-[state=active]:bg-white">
            <FolderOpen className="w-4 h-4 mr-2" />
            Contenus ({team?.contentsCount || 0})
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white">
            <Users2 className="w-4 h-4 mr-2" />
            Membres ({members.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="data-[state=active]:bg-white">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          )}
        </TabsList>

        {/* Contents Tab */}
        <TabsContent value="contents" className="mt-6 space-y-6">
          {contents.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-300 rounded-xl">
              <FolderOpen className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <p className="text-slate-500">Aucun contenu publié</p>
              {isAdmin && (
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setShowAddCategory(true)}
                >
                  Créer une rubrique →
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {contents.map((content) => {
                const Icon = getTypeIcon(content.type);
                
                return (
                  <div
                    key={content._id || content.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openContent(content)}
                    onKeyDown={(e) => e.key === "Enter" && openContent(content)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{content.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {content.author_id?.name || 'Anonyme'} • {new Date(content.created_at || content.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bouton Supprimer pour ADMIN ou auteur */}
                      {(user?.role === 'ADMIN' || user?._id === content.author_id?._id) && (
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContent(content._id || content.id);
                          }}
                          title="Supprimer le contenu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Bouton Voir/Ouvrir */}
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openContent(content);
                        }}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {isAdmin && (
              <div className="p-4 border-b border-stone-100 flex justify-end">
                <Button size="sm" onClick={() => setShowAddMember(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            )}
            <div className="divide-y divide-stone-100">
              {members.length === 0 ? (
                <div className="p-8 text-center text-stone-500">
                  <Users2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun membre dans cette équipe</p>
                </div>
              ) : (
                members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-medium text-slate-600">
                          {member.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                        Membre
                      </span>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        {isAdmin && (
          <TabsContent value="settings" className="mt-6">
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden mb-6">
              <div className="p-4 border-b border-stone-100">
                <h3 className="font-medium text-slate-900 mb-4">Informations de l'équipe</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Nom de l'équipe</span>
                    <span className="font-medium text-slate-900">{team.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Description</span>
                    <span className="font-medium text-slate-900">{team.description || 'Non définie'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <Button 
                    onClick={openEditDialog}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                  >
                    Modifier l'équipe
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Rubriques</h3>
                <Button size="sm" onClick={() => setShowAddCategory(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              <div className="p-4 space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-slate-900">{cat.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteCategory(cat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Aucune rubrique</p>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={(open) => {
        if (!open) {
          setShowAddMember(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newMember.user_email}
                onChange={(e) => setNewMember({ ...newMember, user_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select 
                value={newMember.role} 
                onValueChange={(v) => setNewMember({ ...newMember, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="membre">Membre</SelectItem>
                  <SelectItem value="lecteur">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Annuler</Button>
            <Button onClick={addMember} disabled={!newMember.user_email} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={(open) => {
        if (!open) {
          setShowAddCategory(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une rubrique</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Nom de la rubrique"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {['#64748b', '#0f766e', '#1d4ed8', '#7c3aed', '#be185d', '#c2410c', '#ca8a04', '#16a34a'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-transform ${newCategory.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategory({ ...newCategory, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>Annuler</Button>
            <Button onClick={addCategory} disabled={!newCategory.name} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={(open) => {
        if (!open) {
          setShowEditTeam(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'équipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editTeam.name}
                onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                placeholder="Nom de l'équipe"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editTeam.description}
                onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
                placeholder="Description de l'équipe"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2">
                {['#64748b', '#0f766e', '#1d4ed8', '#7c3aed', '#be185d', '#c2410c', '#ca8a04', '#16a34a'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-transform ${editTeam.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditTeam({ ...editTeam, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTeam(false)}>Annuler</Button>
            <Button onClick={updateTeam} disabled={!editTeam.name} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Modal */}
      {isArticleOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-[min(900px,95vw)] max-h-[85vh] overflow-auto p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
              <button 
                onClick={() => setIsArticleOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-gray-700">
              {selectedArticle.content || selectedArticle.body || "Article vide"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
