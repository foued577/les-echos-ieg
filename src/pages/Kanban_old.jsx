import React, { useState, useEffect } from 'react';
import { teamsAPI, contentsAPI } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { getFileUrl } from '../utils';
import { Search, FileText, Link, File, Tag, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const KANBAN_COLUMNS = ['À faire', 'En cours', 'À relire', 'Terminé'];

const TYPE_ICONS = {
  article: FileText,
  link: Link,
  file: File,
};

const TYPE_LABELS = {
  article: 'Article',
  link: 'Lien',
  file: 'Fichier',
};

export default function Kanban() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [contents, setContents] = useState([]);
  const [kanbanData, setKanbanData] = useState({});
  const [search, setSearch] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log('🔍 Loading data for Kanban...');
      
      // Load approved contents for Kanban
      const [teamsResponse, contentsResponse] = await Promise.all([
        teamsAPI.getAll(),
        contentsAPI.getAll({ status: 'approved' })
      ]);

      if (teamsResponse.success) {
        const normalizedTeams = teamsResponse.data.map(team => ({
          ...team,
          id: team._id || team.id
        }));
        setTeams(normalizedTeams);
        console.log('✅ Teams loaded for Kanban:', normalizedTeams.length);
      }

      if (contentsResponse.success) {
        const normalizedContents = contentsResponse.data.map(content => ({
          ...content,
          id: content._id || content.id,
          team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : []
        }));
        setContents(normalizedContents);
        console.log('✅ Contents loaded for Kanban:', normalizedContents.length);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('💥 Error loading data for Kanban:', error);
      setLoading(false);
    }
  };

    // Group contents by status (simplified Kanban)
  const getContentsByColumn = (column) => {
    // Map Kanban columns to content status
    const statusMap = {
      'À faire': 'approved',
      'En cours': 'in_progress', 
      'À relire': 'review',
      'Terminé': 'completed'
    };
    
    const targetStatus = statusMap[column] || 'approved';
    
    return contents.filter(content => {
      const matchesSearch = content.title.toLowerCase().includes(search.toLowerCase()) ||
                           (content.content && content.content.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = content.status === targetStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getTeamById = (teamId) => {
    return teams.find(team => team.id === teamId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">Kanban</h1>
          <p className="text-slate-500 mt-1">Gestion des tâches et contenus approuvés</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher un contenu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white border-stone-200"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnContents = filteredContents(getContentsForColumn(column));
          const Icon = TYPE_ICONS[columnContents[0]?.type] || FileText;
          
          return (
            <div key={column} className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-900">{column}</h3>
                <span className="bg-stone-200 text-stone-700 text-xs px-2 py-1 rounded-full">
                  {columnContents.length}
                </span>
              </div>
              
              <div 
                className="space-y-2 min-h-[200px] rounded-lg border-2 border-dashed border-stone-200 p-2 transition-colors"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column)}
              >
                {columnContents.map((content) => {
                  const { team, rubrique } = getContentInfo(content);
                  const TypeIcon = TYPE_ICONS[content.type] || FileText;
                  
                  return (
                    <div
                      key={content.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, content.id)}
                      onClick={() => setSelectedContent(content)}
                      className="bg-white border border-stone-200 rounded-lg p-3 cursor-move hover:border-stone-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <TypeIcon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm truncate">
                            {content.title}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="bg-stone-100 px-2 py-0.5 rounded">
                          {TYPE_LABELS[content.type]}
                        </span>
                        {team && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {team.name}
                          </span>
                        )}
                      </div>
                      
                      {rubrique && (
                        <div className="mt-2">
                          <span 
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: `${rubrique.color}20`,
                              color: rubrique.color
                            }}
                          >
                            <Tag className="w-3 h-3" />
                            {rubrique.name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {columnContents.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-sm">
                    Glissez-déposez des contenus ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Detail Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContent && (() => {
            const { team, rubrique } = getContentInfo(selectedContent);
            const TypeIcon = TYPE_ICONS[selectedContent.type] || FileText;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5 text-slate-500" />
                    {selectedContent.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="bg-stone-100 px-2 py-1 rounded">
                      {TYPE_LABELS[selectedContent.type]}
                    </span>
                    {team && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {team.name}
                      </span>
                    )}
                    {rubrique && (
                      <span 
                        className="px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${rubrique.color}20`,
                          color: rubrique.color
                        }}
                      >
                        {rubrique.name}
                      </span>
                    )}
                  </div>
                  
                  {selectedContent.description && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                      <p className="text-slate-600">{selectedContent.description}</p>
                    </div>
                  )}
                  
                  {selectedContent.type === 'link' && selectedContent.url && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Lien</h4>
                      <a 
                        href={selectedContent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {selectedContent.url}
                      </a>
                    </div>
                  )}
                  
                  {selectedContent.type === 'file' && selectedContent.file_url && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Fichier</h4>
                      <Button 
                        onClick={() => {
                          const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://les-echos-ieg.onrender.com/api';
                          const backendBaseUrl = apiBaseUrl.replace('/api', '');
                          const fileUrl = `${backendBaseUrl}${selectedContent.file_url}`;
                          
                          const link = document.createElement('a');
                          link.href = fileUrl;
                          link.download = selectedContent.file_name || selectedContent.title || 'document';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                      >
                        Télécharger le fichier
                      </Button>
                    </div>
                  )}
                  
                  {selectedContent.type === 'article' && selectedContent.article_content && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Contenu</h4>
                      <div 
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedContent.article_content }}
                      />
                    </div>
                  )}
                  
                  {selectedContent.tags && selectedContent.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.tags.map((tag, index) => (
                          <span key={index} className="bg-stone-100 text-stone-700 px-2 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
