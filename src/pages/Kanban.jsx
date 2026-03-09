import React, { useState, useEffect } from 'react';
import { teamsAPI, contentsAPI } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Link as LinkIcon, File, ExternalLink, Users, Calendar, Tag } from 'lucide-react';
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

export default function Kanban() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [contents, setContents] = useState([]);
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
      
      const [teamsResponse, contentsResponse] = await Promise.all([
        teamsAPI.getAll(),
        contentsAPI.getAll({ status: 'approved' }) // Only approved contents
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

  const getContentsByColumn = (column) => {
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

  const handleContentClick = (content) => {
    if (content.type === 'link' && content.url) {
      window.open(content.url, '_blank');
    } else if (content.type === 'file' && content.file_url) {
      window.open(content.file_url, '_blank');
    } else {
      setSelectedContent(content);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  const ContentCard = ({ content }) => {
    const Icon = getTypeIcon(content.type);
    
    return (
      <div 
        onClick={() => handleContentClick(content)}
        className="p-3 bg-white border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-900 group-hover:text-slate-700 line-clamp-2">
              {content.title}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {content.author_name || 'Anonyme'} • {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          {content.type === 'link' && (
            <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
          )}
        </div>
        {content.tags?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {content.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 text-xs bg-stone-100 text-stone-500 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">Explorer</h1>
          <p className="text-slate-500 mt-1">Parcourez les contenus par rubrique</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Rechercher un contenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white"
          />
        </div>
      </div>

      {/* Kanban Board - Style exact comme avant */}
      <div className="overflow-x-auto -mx-6 px-6 pb-4">
        <div className="flex gap-4 min-w-max">
          {['À faire', 'En cours', 'À relire', 'Terminé'].map((column) => {
            const columnContents = getContentsByColumn(column);
            
            return (
              <div key={column} className="w-72 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h3 className="font-medium text-slate-700">{column}</h3>
                  <span className="text-xs text-slate-400 ml-auto">{columnContents.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px] bg-stone-100/50 rounded-xl p-2">
                  {columnContents.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">Aucun contenu</p>
                  ) : (
                    columnContents.map((content) => (
                      <ContentCard key={content.id} content={content} />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {contents.length === 0 && (
            <div className="w-full text-center py-16 border border-dashed border-stone-300 rounded-xl">
              <FileText className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-500">Aucun contenu publié</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Preview Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={(open) => {
        if (!open) {
          setSelectedContent(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <div className="space-y-3">
                  <DialogTitle className="font-serif text-2xl font-semibold text-slate-900 flex items-center gap-2">
                    {React.createElement(getTypeIcon(selectedContent.type), { className: "w-5 h-5" })}
                    {selectedContent.title}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{selectedContent.author_name || 'Anonyme'}</span>
                    <span>•</span>
                    <span>{format(new Date(selectedContent.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  {selectedContent.tags?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedContent.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-stone-100 text-stone-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </DialogHeader>
              <div className="mt-6">
                {selectedContent.description && (
                  <p className="text-slate-600 mb-6 text-lg leading-relaxed">{selectedContent.description}</p>
                )}
                
                {selectedContent.type === 'article' && selectedContent.content && (
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                  />
                )}

                {selectedContent.type === 'file' && selectedContent.file_url && (
                  <Button onClick={() => window.open(selectedContent.file_url, '_blank')} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                    Télécharger le fichier
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
