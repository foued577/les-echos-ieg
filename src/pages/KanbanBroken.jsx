import React, { useState, useEffect } from 'react';
import { teamsAPI, contentsAPI } from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Kanban</h1>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher du contenu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">{column}</h3>
            <div className="space-y-3">
              {getContentsByColumn(column).map((content) => (
                <div
                  key={content.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {React.createElement(getTypeIcon(content.type), { className: "w-4 h-4 text-blue-600 mt-1" })}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                      <p className="text-sm text-gray-500 truncate">{content.content}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {content.team_ids && content.team_ids.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {content.team_ids.map(teamId => getTeamById(teamId)?.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {content.tags && content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {content.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {content.tags.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{content.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedContent && (
        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(getTypeIcon(selectedContent.type), { className: "w-5 h-5" })}
                {selectedContent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contenu</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedContent.content}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Type</h4>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                    {TYPE_LABELS[selectedContent.type]}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statut</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {selectedContent.status}
                  </span>
                </div>
              </div>

              {selectedContent.team_ids && selectedContent.team_ids.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Équipes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.team_ids.map(teamId => {
                      const team = getTeamById(teamId);
                      return team ? (
                        <span key={teamId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {team.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
