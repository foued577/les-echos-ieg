import React, { useState, useEffect } from 'react';
import { teamsAPI, rubriquesAPI, contentsAPI } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Link as LinkIcon, File, ExternalLink, Users, Calendar, Tag, Folder, X, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_ICONS = {
  article: FileText,
  link: LinkIcon,
  file: File,
};

const TYPE_LABELS = {
  article: 'Article',
  link: 'Lien',
  file: 'Fichier',
};

const getTypeIcon = (type) => {
  return TYPE_ICONS[type] || FileText;
};

export default function Explorer() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [contents, setContents] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (user && teams.length > 0 && rubriques.length > 0 && contents.length > 0) {
      // Re-filter when team selection changes
      if (selectedTeam !== 'all') {
        const filteredRubriques = rubriques.filter(rubrique => 
          rubrique.team_ids && rubrique.team_ids.includes(selectedTeam)
        );
        const filteredContents = contents.filter(content => 
          content.team_ids && content.team_ids.includes(selectedTeam)
        );
        console.log(`🔄 Filtered by team ${selectedTeam}:`, {
          rubriques: filteredRubriques.length,
          contents: filteredContents.length
        });
      }
    }
  }, [selectedTeam, teams, rubriques, contents]);

  const loadData = async () => {
    try {
      console.log('🔍 Loading data for Explorer...');
      
      // Load all data in parallel
      const [teamsResponse, rubriquesResponse, contentsResponse] = await Promise.all([
        teamsAPI.getAll(),
        rubriquesAPI.getAll(),
        contentsAPI.getAll({ status: 'approved' })
      ]);

      console.log('📊 API responses:', {
        teams: teamsResponse.success,
        rubriques: rubriquesResponse.success,
        contents: contentsResponse.success
      });

      // Process teams
      if (teamsResponse.success) {
        const normalizedTeams = teamsResponse.data.map(team => ({
          ...team,
          id: team._id || team.id
        }));
        setTeams(normalizedTeams);
        console.log('✅ Teams loaded:', normalizedTeams.length);
      }

      // Process rubriques
      if (rubriquesResponse.success) {
        const normalizedRubriques = rubriquesResponse.data.map(rubrique => ({
          ...rubrique,
          id: rubrique._id || rubrique.id
        }));
        setRubriques(normalizedRubriques);
        console.log('✅ Rubriques loaded:', normalizedRubriques.length);
        console.log('📁 Sample rubrique:', normalizedRubriques[0]);
        console.log('🔍 ALL rubrique fields:', Object.keys(normalizedRubriques[0] || {}));
      }

      // Process contents
      if (contentsResponse.success) {
        const normalizedContents = contentsResponse.data.map(content => ({
          ...content,
          id: content._id || content.id,
          team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : []
        }));
        setContents(normalizedContents);
        console.log('✅ Contents loaded:', normalizedContents.length);
        console.log('📄 Sample content:', normalizedContents[0]);
        console.log('🔍 ALL content fields:', Object.keys(normalizedContents[0] || {}));
      }
      
      // DEBUG: Log sample data after loading
      setTimeout(() => {
        console.log("🔍=== DEBUG SAMPLE DATA ===");
        console.log("sample content:", contents?.[0]);
        console.log("sample rubrique:", rubriques?.[0]);
        
        // Check if contents have rubrique fields
        if (contents && contents.length > 0) {
          console.log("🔍 Contents rubrique field analysis:");
          contents.slice(0, 3).forEach((content, index) => {
            console.log(`  Content ${index} "${content.title}":`, {
              hasRubriqueField: hasRubriqueField(content),
              rubriqueId: content.rubriqueId,
              rubrique_id: content.rubrique_id,
              rubrique: content.rubrique,
              detectedRubriqueId: getRubriqueId(content)
            });
          });
        }
        
        console.log("🔍=== END DEBUG ===");
      }, 1000);
      
      setLoading(false);
    } catch (error) {
      console.error('💥 Error loading data for Explorer:', error);
      setLoading(false);
    }
  };

  // Get filtered data based on team selection
  const getFilteredRubriques = () => {
    let filteredRubriques = [];
    
    if (selectedTeam === 'all') {
      filteredRubriques = [...rubriques];
      
      // Add "Uncategorized" rubrique if there are contents without team_ids
      const hasUncategorizedContents = contents.some(content => 
        !content.team_ids || content.team_ids.length === 0
      );
      
      if (hasUncategorizedContents) {
        filteredRubriques.push({
          id: 'uncategorized',
          name: 'Non classés',
          description: 'Contenus sans équipe assignée',
          color: '#94a3b8',
          team_ids: []
        });
      }
    } else {
      filteredRubriques = rubriques.filter(rubrique => 
        rubrique.team_ids && rubrique.team_ids.includes(selectedTeam)
      );
    }
    
    return filteredRubriques;
  };

  // Robust function to get rubriqueId from content
  const getRubriqueId = (content) => {
    // Handle populated rubrique_id object
    if (content.rubrique_id && typeof content.rubrique_id === 'object') {
      return content.rubrique_id._id?.toString() || content.rubrique_id.id?.toString();
    }
    
    // Handle string rubrique_id
    return content.rubriqueId ?? 
           content.rubrique_id ?? 
           content.rubrique?.id ?? 
           content.rubrique?._id ?? 
           content.rubrique ?? 
           null;
  };

  // Safe ID comparison with string conversion
  const sameId = (a, b) => {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return String(a) === String(b);
  };

  // Check if content has any rubrique field
  const hasRubriqueField = (content) => {
    return content.rubriqueId !== undefined ||
           content.rubrique_id !== undefined ||
           content.rubrique !== undefined;
  };

  const getFilteredContents = () => {
    if (selectedTeam === 'all') {
      return contents;
    }
    return contents.filter(content => 
      content.team_ids && content.team_ids.includes(selectedTeam)
    );
  };

  const getContentsByRubrique = (rubriqueId) => {
    const filteredContents = getFilteredContents();
    const rubrique = rubriques.find(r => r.id === rubriqueId);
    console.log(`🔍 Getting contents for rubrique: ${rubrique?.name} (${rubriqueId})`);
    
    const matchingContents = filteredContents.filter(content => {
      const matchesSearch = content.title.toLowerCase().includes(search.toLowerCase()) ||
                           (content.content && content.content.toLowerCase().includes(search.toLowerCase()));
      
      // DEBUG: Log rubriqueId detection for first few items
      if (filteredContents.indexOf(content) < 3) {
        const detectedRubriqueId = getRubriqueId(content);
        console.log(`🔍 Content "${content.title}":`, {
          detectedRubriqueId,
          rubriqueId: content.rubriqueId,
          rubrique_id: content.rubrique_id,
          rubrique_id_type: typeof content.rubrique_id,
          rubrique_id__id: content.rubrique_id?._id,
          rubrique: content.rubrique,
          targetRubriqueId: rubriqueId,
          sameId: sameId(detectedRubriqueId, rubriqueId)
        });
      }
      
      // If "All teams" selected, show contents without team_ids in "Uncategorized"
      if (selectedTeam === 'all' && (!content.team_ids || content.team_ids.length === 0)) {
        return rubrique.name === "Non classés" && matchesSearch;
      }
      
      // Use robust rubriqueId detection and comparison
      const contentRubriqueId = getRubriqueId(content);
      const belongsToRubrique = sameId(contentRubriqueId, rubriqueId);
      
      if (belongsToRubrique) {
        console.log(`  ✅ Content matches: ${content.title} (detected: ${contentRubriqueId})`);
      }
      
      return matchesSearch && belongsToRubrique;
    });
    
    console.log(`  📊 Found ${matchingContents.length} contents for ${rubrique?.name}`);
    return matchingContents;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-sans text-3xl font-semibold text-foreground tracking-tight">
          Explorer
        </h1>
        <p className="text-muted-foreground mt-2">
          Parcourez les contenus organisés par rubriques
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-xs">
          <select 
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full p-2 border rounded-lg bg-card"
          >
            <option value="all">Toutes les équipes</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded-lg bg-card"
          />
        </div>
      </div>

      {/* Rubriques Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getFilteredRubriques().map((rubrique) => {
          const rubriqueContents = getContentsByRubrique(rubrique.id);
          
          return (
            <div key={rubrique.id} className="apple-card">
              {/* Rubrique Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: rubrique.color || '#64748b' }}
                  >
                    {rubrique.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{rubrique.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {rubriqueContents.length} contenu{rubriqueContents.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {rubrique.description && (
                  <p className="text-sm text-muted-foreground">{rubrique.description}</p>
                )}
              </div>

              {/* Contents List */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {rubriqueContents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun contenu dans cette rubrique
                  </p>
                ) : (
                  rubriqueContents.map((content) => {
                    const Icon = getTypeIcon(content.type);
                    const handleContentClick = (content) => {
                      console.log('🔍=== CONTENT CLICK DEBUG ===');
                      console.log('Content clicked:', content);
                      console.log('Content keys:', Object.keys(content));
                      console.log('author_id:', content.author_id);
                      console.log('team_ids:', content.team_ids);
                      console.log('Content type:', typeof content);
                      console.log('🔍=== END DEBUG ===');
                      setSelectedContent(content);
                    };
                    return (
                      <div
                        key={content.id}
                        className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleContentClick(content)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {content.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(content.created_at), 'dd MMM yyyy', { locale: fr })}
                            </p>
                            {content.author_name && (
                              <p className="text-xs text-muted-foreground">
                                par {content.author_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        
        {getFilteredRubriques().length === 0 && (
          <div className="col-span-full apple-card p-12 text-center">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {selectedTeam === 'all' 
                ? 'Aucune rubrique disponible' 
                : 'Aucune rubrique pour cette équipe'
              }
            </p>
          </div>
        )}
      </div>

      {/* Content Detail Dialog */}
      {selectedContent && (
        <>
          {console.log('🔍=== DIALOG RENDER DEBUG ===')}
          {console.log('selectedContent:', selectedContent)}
          {console.log('selectedContent.author_id:', selectedContent.author_id)}
          {console.log('selectedContent.team_ids:', selectedContent.team_ids)}
          {console.log('🔍=== END DIALOG DEBUG ===')}
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedContent.title || 'Titre inconnu'}
                  </h2>
                  <button
                    onClick={() => setSelectedContent(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    {selectedContent.author_id?.name || 'Auteur inconnu'}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {selectedContent.created_at && format(new Date(selectedContent.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Tag className="w-4 h-4" />
                    {selectedContent.type || 'Type inconnu'}
                  </div>
                  
                  {selectedContent.tags && selectedContent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedContent.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {selectedContent.team_ids && selectedContent.team_ids.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {selectedContent.team_ids.map(team => team.name || team).join(', ')}
                    </div>
                  )}
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">{selectedContent.content}</p>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedContent(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
