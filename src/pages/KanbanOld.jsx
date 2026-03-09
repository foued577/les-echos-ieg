import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Link as LinkIcon, File, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

export default function Kanban() {
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contents, setContents] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [teamsData, contentsData] = await Promise.all([
      base44.teams.getAll(),
      base44.contents.getAll(),
    ]);

    setTeams(teamsData);
    setCategories([]); // Categories not implemented yet
    setContents(contentsData.filter(c => c.status === 'published'));
    setLoading(false);
  };

  const filteredCategories = selectedTeam === 'all' 
    ? categories 
    : categories.filter(c => c.team_id === selectedTeam);

  const getContentsForCategory = (categoryId) => 
    contents.filter(c => c.category_id === categoryId);

  const uncategorizedContents = contents.filter(c => 
    !c.category_id && (selectedTeam === 'all' || c.team_id === selectedTeam)
  );

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link': return LinkIcon;
      case 'file': return File;
      default: return FileText;
    }
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

        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Toutes les équipes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les équipes</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-6 px-6 pb-4">
        <div className="flex gap-4 min-w-max">
          {filteredCategories.map((category) => {
            const categoryContents = getContentsForCategory(category.id);
            
            return (
              <div key={category.id} className="w-72 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: category.color || '#64748b' }}
                  />
                  <h3 className="font-medium text-slate-700">{category.name}</h3>
                  <span className="text-xs text-slate-400 ml-auto">{categoryContents.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px] bg-stone-100/50 rounded-xl p-2">
                  {categoryContents.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">Aucun contenu</p>
                  ) : (
                    categoryContents.map((content) => (
                      <ContentCard key={content.id} content={content} />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {uncategorizedContents.length > 0 && (
            <div className="w-72 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-medium text-slate-700">Non catégorisé</h3>
                <span className="text-xs text-slate-400 ml-auto">{uncategorizedContents.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px] bg-stone-100/50 rounded-xl p-2">
                {uncategorizedContents.map((content) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
            </div>
          )}

          {filteredCategories.length === 0 && uncategorizedContents.length === 0 && (
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
                  <DialogTitle className="font-serif text-2xl font-semibold text-slate-900">
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
                
                {selectedContent.type === 'article' && selectedContent.article_content && (
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedContent.article_content }}
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