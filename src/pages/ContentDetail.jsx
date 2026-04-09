import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { teamsAPI, contentsAPI, buildFileUrl, buildDownloadUrl } from '@/services/api';
import { getFileUrl } from '../utils';
import { ArrowLeft, ExternalLink, Download, FileText, Link as LinkIcon, File, Trash2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import ArticleDisplay from '@/components/ArticleDisplay';

export default function ContentDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilesModal, setShowFilesModal] = useState(false);

  // Utility function to get files from content (new + legacy format)
  const getContentFiles = (content) => {
    console.log('=== GET CONTENT FILES DEBUG ===');
    console.log('Content received:', content);
    
    if (Array.isArray(content?.files) && content.files.length > 0) {
      const files = content.files
        .filter((f) => f && f.url)
        .map((f) => ({
          name: f.name || 'Fichier',
          url: f.url,
          type: f.type || '',
          size: f.size || 0
        }));
      
      console.log('Using new files format:', files);
      return files;
    }

    if (content?.file_url) {
      const legacyFile = [{
        name: content.file_name || 'Fichier',
        url: content.file_url,
        type: content.mime_type || '',
        size: 0
      }];
      
      console.log('Using legacy format:', legacyFile);
      return legacyFile;
    }

    console.log('No files found');
    return [];
  };

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
        console.log('🔍 Content type:', response.data?.type);
        console.log('🔍 Files field:', response.data?.files);
        console.log('🔍 Files count:', response.data?.files?.length || 0);
        console.log('🔍 file_url field:', response.data?.file_url);
        console.log('🔍 file_name field:', response.data?.file_name);
        console.log('🔍 All content keys:', Object.keys(response.data || {}));
        console.log('🔍 Full content object:', JSON.stringify(response.data, null, 2));
        
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

  const handleDownloadFile = (fileIndex = 0) => {
    console.log('=== DOWNLOAD FILE DEBUG ===');
    
    const files = getContentFiles(content);
    console.log('Available files:', files);
    console.log('Requested file index:', fileIndex);
    
    if (!files.length) {
      console.error('No files available for download');
      alert("Ce contenu de type fichier n'a aucun fichier associé.");
      return;
    }
    
    if (fileIndex >= files.length) {
      console.error('File index out of range:', fileIndex, 'Available:', files.length);
      alert('Fichier non disponible');
      return;
    }
    
    const file = files[fileIndex];
    console.log('Downloading file:', file);
    
    const fileUrl = buildFileUrl(file.url);
    const downloadUrl = buildDownloadUrl(fileUrl);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name || content.title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFile = (fileIndex = 0) => {
    console.log('=== OPEN FILE DEBUG ===');
    
    const files = getContentFiles(content);
    console.log('Available files:', files);
    
    if (!files.length) {
      console.error('No files available for opening');
      alert("Ce contenu de type fichier n'a aucun fichier associé.");
      return;
    }
    
    if (fileIndex >= files.length) {
      console.error('File index out of range:', fileIndex, 'Available:', files.length);
      alert('Fichier non disponible');
      return;
    }
    
    const file = files[fileIndex];
    console.log('Opening file:', file);
    
    const fileUrl = buildFileUrl(file.url);
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFileClick = () => {
    const files = getContentFiles(content);
    
    if (!files.length) {
      alert("Ce contenu de type fichier n'a aucun fichier associé.");
      return;
    }
    
    if (files.length === 1) {
      // Single file - open directly
      handleOpenFile(0);
      return;
    }
    
    // Multiple files - show modal
    setSelectedFiles(files);
    setShowFilesModal(true);
  };

  const handleDeleteContent = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log('🗑️=== DELETE CONTENT START ===');
      console.log('🆔 Content ID:', id);
      
      const response = await contentsAPI.delete(id);
      console.log('✅ Delete response:', response);
      
      if (response.success) {
        toast.success('Contenu supprimé avec succès');
        navigate(-1);
      } else {
        toast.error('Erreur lors de la suppression du contenu');
      }
    } catch (error) {
      console.error('💥 Error deleting content:', error);
      toast.error('Erreur lors de la suppression du contenu');
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
      <div className="flex items-center justify-between">
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
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDeleteContent}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </Button>
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
                <h3 className="font-medium text-slate-900 mb-2">
                  {(() => {
                    const files = getContentFiles(content);
                    return files.length > 1 ? 'Fichiers' : 'Fichier';
                  })()}
                </h3>
                <p className="text-slate-600 mb-4">{content.description || 'Cliquez pour accéder au(x) fichier(s)'}</p>
                
                <div className="bg-stone-50 p-3 rounded-lg">
                  {(() => {
                    const files = getContentFiles(content);
                    if (files.length === 0) {
                      return <p className="text-sm text-stone-600">Aucun fichier associé</p>;
                    } else if (files.length === 1) {
                      return (
                        <div>
                          <p className="text-sm font-medium text-stone-900">{files[0].name}</p>
                          <p className="text-xs text-stone-500">
                            {files[0].type && `${files[0].type} `}
                            {files[0].size > 0 && `(${(files[0].size / 1024).toFixed(1)} KB)`}
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div>
                          <p className="text-sm font-medium text-stone-900">{files.length} fichiers</p>
                          <p className="text-xs text-stone-500">Cliquez pour voir la liste complète</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleFileClick}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {(() => {
                const files = getContentFiles(content);
                return files.length === 1 ? 'Ouvrir le fichier' : 'Voir les fichiers';
              })()}
            </Button>
          </div>
        )}

        {content.type === 'article' && (
          <ArticleDisplay content={content} />
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

      {/* Files Modal */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Fichiers du contenu
              </h3>
              <button
                onClick={() => setShowFilesModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{file.name}</p>
                    <p className="text-xs text-stone-500">
                      {file.type && `${file.type} `}
                      {file.size > 0 && `(${(file.size / 1024).toFixed(1)} KB)`}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFile(index)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Ouvrir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadFile(index)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
