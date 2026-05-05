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
  const [showIframe, setShowIframe] = useState(false);

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
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-500 hover:text-slate-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {/* Bouton supprimer - admin uniquement */}
          {user?.role === 'admin' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDeleteContent}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-3xl md:text-4xl leading-tight text-slate-900 max-w-4xl">
              {content.title}
            </h1>
            <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                {content.author_id?.name || 'Auteur inconnu'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
              </span>
              {content.type && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span className="capitalize bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    {content.type}
                  </span>
                </span>
              )}
              {content.rubrique_id?.name && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                    {content.rubrique_id.name}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {content.tags && content.tags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Teams */}
      {content.team_ids && content.team_ids.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {content.team_ids.map((team, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium"
              >
                {team.name || team}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        {content.type === 'lien' && (
          <div className="rounded-xl border bg-blue-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lien externe</h3>
                <p className="text-gray-600 mb-4 truncate" title={content.content}>
                  {content.content}
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleOpenLink}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir le lien
                  </Button>
                  {content.content && content.content.includes("webikeo") && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowIframe(!showIframe)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      {showIframe ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {showIframe && content.content && content.content.includes("webikeo") && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <iframe
                  src={content.content}
                  className="w-full h-[500px]"
                  title="Aperçu du lien"
                />
              </div>
            )}
          </div>
        )}

        {content.type === 'fichier' && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {(() => {
                    const files = normalizeContentFiles(content);
                    return files.length > 1 ? 'Fichiers' : 'Fichier';
                  })()}
                </h3>
                <p className="text-gray-600 mb-4">{content.description || 'Documents associés'}</p>
                
                <div className="space-y-2">
                  {(() => {
                    const files = normalizeContentFiles(content);
                    
                    if (files.length === 0) {
                      return <p className="text-sm text-gray-500">Aucun fichier associé</p>;
                    } else if (files.length === 1) {
                      return (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{files[0].name}</p>
                              <p className="text-sm text-gray-500">
                                {files[0].type && `${files[0].type} `}
                                {files[0].size > 0 && `(${(files[0].size / 1024).toFixed(1)} KB)`}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOpenFile(0)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ouvrir
                          </Button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-900">
                            {files.length} fichiers disponibles
                          </p>
                          {files.map((file, index) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {file.type && `${file.type} `}
                                    {file.size > 0 && `(${(file.size / 1024).toFixed(1)} KB)`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenFile(index)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Ouvrir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadFile(index)}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Télécharger
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
          </div>
        )}

        {content.type === 'texte' && (
          <div className="prose max-w-none whitespace-pre-line leading-relaxed text-gray-800">
            {content.content}
          </div>
        )}

        {content.type === 'article' && (
          <div className="prose max-w-none">
            <ArticleDisplay content={content} />
          </div>
        )}

        {content.type === 'fichier' && content.file_url?.endsWith('.pdf') && (
          <div className="mt-6 border rounded-lg overflow-hidden">
            <iframe
              src={content.file_url}
              className="w-full h-[500px]"
              title="Aperçu PDF"
            />
          </div>
        )}
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
