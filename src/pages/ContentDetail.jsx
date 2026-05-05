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

// Utility function to normalize files from content (new + legacy format)
export function normalizeContentFiles(content) {
  console.log('=== NORMALIZE CONTENT FILES DEBUG ===');
  console.log('Content received:', content);
  
  const result = [];

  // Nouveau format multi-fichiers
  if (Array.isArray(content.files) && content.files.length > 0) {
    console.log('Using new files format, count:', content.files.length);
    content.files.forEach((file, index) => {
      if (file && file.url) {
        result.push({
          id: file._id || `${content._id}-file-${index}`,
          name: file.name || `Fichier ${index + 1}`,
          url: file.url,
          type: file.type || '',
          size: file.size || 0
        });
      }
    });
  }

  // Ancien format fichier unique
  if (result.length === 0 && content.file_url) {
    console.log('Using legacy format');
    result.push({
      id: `${content._id}-legacy-file`,
      name: content.file_name || 'Fichier',
      url: content.file_url,
      type: content.mime_type || '',
      size: 0
    });
  }

  console.log('Normalized files result:', result);
  console.log('=== END NORMALIZE DEBUG ===');
  return result;
}

export default function ContentDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContentFiles, setSelectedContentFiles] = useState([]);
  const [filesModalOpen, setFilesModalOpen] = useState(false);

  const handleFileContentClick = (content) => {
    console.log('=== HANDLE FILE CONTENT CLICK DEBUG ===');
    const files = normalizeContentFiles(content);
    console.log('FILES COUNT:', files.length);
    console.log('FILES DETAILS:', files);

    if (!files.length) {
      alert("Ce contenu n'a aucun fichier associé.");
      return;
    }

    if (files.length === 1) {
      console.log('Opening single file directly');
      window.open(files[0].url, '_blank', 'noopener,noreferrer');
      return;
    }

    console.log('Opening files modal for multiple files');
    setSelectedContentFiles(files);
    setFilesModalOpen(true);
  };

  useEffect(() => {
    if (id && user) loadContent();
  }, [id, user]);

  const loadContent = async () => {
    try {
      console.log('🔍=== LOAD CONTENT DETAIL ===');
      console.log('🆔 Content ID:', id);
      
      setLoading(true);
      setError(null);

      const response = await contentsAPI.getById(id);
      console.log('🔍 RAW CONTENT RESPONSE:', response);

      // Enhanced normalization for all possible formats
      const loadedContent =
        response?._id ? response :
        response?.content?._id ? response.content :
        response?.data?._id ? response.data :
        response?.data?.content?._id ? response.data.content :
        null;

      if (!loadedContent || !loadedContent._id) {
        console.error("Invalid content response:", response);
        setError("Contenu non trouvé");
        return;
      }

      console.log('✅ Final loaded content:', loadedContent);
      setContent(loadedContent);
      console.log('🔍 All content keys:', Object.keys(loadedContent || {}));
      console.log('🔍 Full content object:', JSON.stringify(loadedContent, null, 2));
      setError(null);
    } catch (error) {
      console.error('❌ Failed to load content:', error.response?.data || error);
      console.log('🔍 Error response status:', error.response?.status);
      console.log('🔍 Error response data:', error.response?.data);
      console.log('🔍 Error message:', error.message);
      setError('Contenu non trouvé');
    } finally {
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
    if (content?.content) {
      window.open(content.content, '_blank');
    }
  };

  const handleDownloadFile = (fileIndex = 0) => {
    console.log('=== DOWNLOAD FILE DEBUG ===');
    const files = normalizeContentFiles(content);
    console.log('Available files for download:', files);
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
    const files = normalizeContentFiles(content);
    console.log('Available files for opening:', files);
    console.log('Requested file index:', fileIndex);
    
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
                    const files = normalizeContentFiles(content);
                    return files.length > 1 ? 'Fichiers' : 'Fichier';
                  })()}
                </h3>
                <p className="text-slate-600 mb-4">{content.description || 'Cliquez pour accéder au(x) fichier(s)'}</p>
                
                <div className="bg-stone-50 p-3 rounded-lg">
                  {(() => {
                    const files = normalizeContentFiles(content);
                    console.log('DISPLAY DEBUG - Files count:', files.length);
                    console.log('DISPLAY DEBUG - Files:', files);
                    
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
                      // Afficher TOUS les fichiers directement
                      return (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-stone-900 mb-2">
                            {files.length} fichiers disponibles
                          </p>
                          {files.map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border border-stone-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900 truncate">{file.name}</p>
                                <p className="text-xs text-stone-500">
                                  {file.type && `${file.type} `}
                                  {file.size > 0 && `(${(file.size / 1024).toFixed(1)} KB)`}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenFile(index)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-2"
                                  title="Ouvrir le fichier"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadFile(index)}
                                  className="text-green-600 border-green-200 hover:bg-green-50 h-8 px-2"
                                  title="Télécharger le fichier"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => handleFileContentClick(content)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {(() => {
                const files = normalizeContentFiles(content);
                if (files.length === 0) return 'Aucun fichier';
                if (files.length === 1) return 'Ouvrir le fichier';
                return 'Voir tous les fichiers';
              })()}
            </Button>
          </div>
        )}

        {content.type === 'article' && (
          <ArticleDisplay content={content} />
        )}

        {content.type === 'texte' && (
          <div className="mt-4 text-gray-800 whitespace-pre-line">
            {content.content}
          </div>
        )}

        {content.type === 'fichier' && content.file_url?.endsWith('.pdf') && (
          <iframe
            src={content.file_url}
            className="w-full h-[600px] mt-4"
            title="Aperçu PDF"
          />
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

        {/* Content */}
        <div className="mt-6">
          {content.type === 'lien' && (
            <div>
              <h3 className="font-semibold mb-2">Lien</h3>
              <a
                href={content.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {content.content}
              </a>
            </div>
          )}

          {content.type === 'fichier' && (
            <div>
              <h3 className="font-semibold mb-2">Fichier</h3>
              <a
                href={content.file_url || content.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Télécharger le fichier
              </a>
            </div>
          )}

          {content.type === 'texte' && (
            <div className="whitespace-pre-line text-gray-800">
              {content.content}
            </div>
          )}

          {content.type === 'lien' && content.content.includes("webikeo") && (
            <iframe
              src={content.content}
              className="w-full h-[500px] mt-4 border"
            />
          )}
        </div>
      </div>

      {/* Files Modal */}
      {filesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Fichiers du contenu
              </h3>
              <button
                onClick={() => setFilesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedContentFiles.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
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
