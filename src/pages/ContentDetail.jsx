import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { teamsAPI, contentsAPI, buildFileUrl } from '@/services/api';
import { getFileUrl } from '../utils';
import { ArrowLeft, ExternalLink, Download, FileText, Link as LinkIcon, File } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ContentDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id && user) loadContent();
  }, [id, user]);

  const loadContent = async () => {
    try {
      console.log('🔍=== LOAD CONTENT DETAIL ===');
      console.log('🆔 Content ID:', id);
      
      const response = await contentsAPI.getById(id);
      
      if (response.success) {
        console.log('✅ Content loaded:', response.data);
        setContent(response.data);
        setError(null);
      } else {
        console.error('❌ Failed to load content:', response);
        setError('Contenu non trouvé');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('💥 Error loading content:', error);
      setError('Erreur lors du chargement du contenu');
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link': return LinkIcon;
      case 'file': return File;
      default: return FileText;
    }
  };

  const handleOpenLink = () => {
    if (content?.url) {
      window.open(content.url, '_blank');
    }
  };

  const handleDownloadFile = () => {
    if (content?.file_url) {
      // Téléchargement direct du fichier avec buildFileUrl
      const fileUrl = buildFileUrl(content.file_url);
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = content.file_name || content.title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">{error || 'Contenu non trouvé'}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
      </div>
    );
  }

  const Icon = getTypeIcon(content.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-500 hover:text-slate-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-stone-500" />
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-slate-900">{content.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span>{content.author_id?.name || 'Auteur inconnu'}</span>
            <span>•</span>
            <span>{format(new Date(content.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
            {content.type && (
              <>
                <span>•</span>
                <span className="capitalize">{content.type}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content based on type */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        {content.type === 'link' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-blue-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-slate-900 mb-2">Lien externe</h3>
                <p className="text-slate-600 mb-4">{content.description || 'Cliquez pour ouvrir le lien'}</p>
                <div className="bg-stone-50 p-3 rounded-lg">
                  <p className="text-sm text-stone-600 truncate">{content.url}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleOpenLink}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir le lien
            </Button>
          </div>
        )}

        {content.type === 'file' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <File className="w-5 h-5 text-green-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-slate-900 mb-2">Fichier</h3>
                <p className="text-slate-600 mb-4">{content.description || 'Cliquez pour télécharger le fichier'}</p>
                <div className="bg-stone-50 p-3 rounded-lg">
                  <p className="text-sm text-stone-600 truncate">{content.file_url || 'Fichier disponible'}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleDownloadFile}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le fichier
            </Button>
          </div>
        )}

        {content.type === 'article' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-purple-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-slate-900 mb-2">Article</h3>
                {content.description && (
                  <p className="text-slate-600 mb-4">{content.description}</p>
                )}
              </div>
            </div>
            <div className="prose prose-stone max-w-none">
              <div className="bg-stone-50 p-6 rounded-lg">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {content.content || 'Aucun contenu disponible'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="pt-4 border-t border-stone-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        {content.team_ids && content.team_ids.length > 0 && (
          <div className="pt-4 border-t border-stone-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Équipes</h4>
            <div className="flex flex-wrap gap-2">
              {content.team_ids.map((team, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                >
                  {team.name || team}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
