import React, { useState, useEffect } from 'react';
import { teamsAPI, contentsAPI, buildFileUrl, buildDownloadUrl } from '@/services/api';
import { getFileUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, FileText, Link as LinkIcon, File, ExternalLink, Eye, User, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Moderation() {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log('Loading data for Moderation...');
      
      const [teamsResponse, contentsResponse] = await Promise.all([
        teamsAPI.getAll(),
        contentsAPI.getAll()
      ]);

      if (teamsResponse.success) {
        const normalizedTeams = teamsResponse.data.map(team => ({
          ...team,
          id: team._id || team.id
        }));
        setTeams(normalizedTeams);
      }

      if (contentsResponse.success) {
        const normalizedContents = contentsResponse.data.map(content => ({
          ...content,
          id: content._id || content.id,
          team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : []
        }));
        setContents(normalizedContents);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data for Moderation:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (contentId) => {
    try {
      const updateData = {
        status: 'approved',
        moderated_by: user.email,
        moderation_date: new Date().toISOString(),
      };
      
      await contentsAPI.update(contentId, updateData);
      toast.success('Contenu approuvé');
      loadData();
    } catch (error) {
      console.error('Error approving content:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    try {
      const updateData = {
        status: 'rejected',
        moderated_by: user.email,
        moderation_date: new Date().toISOString(),
        moderation_comment: comment,
      };
      
      await contentsAPI.update(selectedContent.id, updateData);
      toast.success('Contenu refusé');
      setShowRejectDialog(false);
      setComment('');
      setSelectedContent(null);
      loadData();
    } catch (error) {
      console.error('Error rejecting content:', error);
      toast.error('Erreur lors du refus');
    }
  };

  const openRejectDialog = (content) => {
    setSelectedContent(content);
    setShowRejectDialog(true);
  };

  const openPreview = (content) => {
    console.log('=== MODERATION PREVIEW DEBUG ===');
    console.log('CONTENT:', content);
    console.log('CONTENT TYPE:', content.type);
    console.log('FILE_URL:', content.file_url);
    console.log('FILES ARRAY:', content.files);
    console.log('FILE_NAME:', content.file_name);
    console.log('MIME_TYPE:', content.mime_type);
    
    // Debug spécifique pour les fichiers
    if (content.type === 'file') {
      console.log('=== FILE DEBUG ===');
      console.log('file_url exists?', !!content.file_url);
      console.log('files array exists?', !!content.files);
      console.log('files length:', content.files?.length);
      
      if (content.file_url) {
        console.log('file_url value:', content.file_url);
        console.log('buildFileUrl result:', buildFileUrl(content.file_url));
      }
      
      if (content.files && content.files.length > 0) {
        console.log('files details:', content.files);
      }
      console.log('=== END FILE DEBUG ===');
    }
    
    console.log('=== END DEBUG ===');
    
    setSelectedContent(content);
    setShowPreview(true);
  };

  const getTeam = (teamId) => teams.find(t => t.id === teamId);
  const getCategory = (categoryId) => null;

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link': return LinkIcon;
      case 'file': return File;
      default: return FileText;
    }
  };

  const pendingContents = contents.filter(c => c.status === 'pending_review');
  const approvedContents = contents.filter(c => c.status === 'approved');
  const rejectedContents = contents.filter(c => c.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  const ContentItem = ({ content, showActions = true }) => {
    const Icon = getTypeIcon(content.type);
    const team = getTeam(content.team_id);
    const category = getCategory(content.category_id);

    return (
      <div className="p-4 bg-white border border-stone-200 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-stone-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900">{content.title}</h3>
            {content.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{content.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {content.author_name || 'Anonyme'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(content.created_at), 'dd MMM yyyy', { locale: fr })}
              </span>
              {team && (
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                  {team.name}
                </span>
              )}
              {category && (
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                  {category.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100">
            <Button variant="ghost" size="sm" onClick={() => openPreview(content)} className="text-slate-600">
              <Eye className="w-4 h-4 mr-1" />
              Voir
            </Button>
            {content.type === 'link' && content.url && (
              <Button variant="ghost" size="sm" onClick={() => window.open(content.url, '_blank')} className="text-slate-600">
                <ExternalLink className="w-4 h-4 mr-1" />
                Ouvrir
              </Button>
            )}
            {content.type === 'file' && content.file_url && (
              <Button variant="ghost" size="sm" onClick={() => {
                const fileUrl = buildFileUrl(content.file_url);
                const downloadUrl = buildDownloadUrl(fileUrl);
                
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = content.file_name || content.title || 'document';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }} className="text-slate-600">
                <ExternalLink className="w-4 h-4 mr-1" />
                Télécharger
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => openRejectDialog(content)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Refuser
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleApprove(content.id)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approuver
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-slate-900">Modération</h1>
        <p className="text-slate-500 mt-1">Validez les contenus proposés par les membres</p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-600">{pendingContents.length} en attente</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600">{approvedContents.length} approuvés</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-600">{rejectedContents.length} refusés</span>
        </span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white">
            <Clock className="w-4 h-4 mr-2" />
            En attente ({pendingContents.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Approuvés ({approvedContents.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
            <XCircle className="w-4 h-4 mr-2" />
            Refusés ({rejectedContents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-3">
          {pendingContents.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-stone-300 rounded-xl">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Tout est à jour</p>
              <p className="text-sm text-slate-400 mt-1">Aucun contenu en attente de validation</p>
            </div>
          ) : (
            pendingContents.map((content) => (
              <ContentItem key={content.id} content={content} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-3">
          {approvedContents.length === 0 ? (
            <p className="text-center py-12 text-slate-400">Aucun contenu approuvé</p>
          ) : (
            approvedContents.slice(0, 20).map((content) => (
              <ContentItem key={content.id} content={content} showActions={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-3">
          {rejectedContents.length === 0 ? (
            <p className="text-center py-12 text-slate-400">Aucun contenu refusé</p>
          ) : (
            rejectedContents.slice(0, 20).map((content) => (
              <ContentItem key={content.id} content={content} showActions={false} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRejectDialog(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le contenu</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-3">
              Motif du refus (optionnel)
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Expliquez pourquoi ce contenu est refusé..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => {
        if (!open) {
          setShowPreview(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="font-serif text-xl text-left">{selectedContent.title}</DialogTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {selectedContent.author_name || 'Anonyme'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(selectedContent.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs">
                        {selectedContent.type === 'link' && 'Lien'}
                        {selectedContent.type === 'file' && 'Fichier'}
                        {selectedContent.type === 'article' && 'Article'}
                      </span>
                      {getTeam(selectedContent.team_id) && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs">
                          {getTeam(selectedContent.team_id).name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Content Preview */}
              <div className="py-6">
                {selectedContent.description && (
                  <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                    <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-700">{selectedContent.description}</p>
                  </div>
                )}

                {/* Type-specific content */}
                {selectedContent.type === 'link' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Lien externe
                      </h4>
                      <div className="space-y-2">
                        <p className="text-slate-700 break-all">
                          {selectedContent.url || selectedContent.link || 'URL non disponible'}
                        </p>
                        {(selectedContent.url || selectedContent.link) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(selectedContent.url || selectedContent.link, '_blank')}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ouvrir dans un nouvel onglet
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedContent.type === 'file' && (
                  <div className="space-y-4">
                    {/* Debug info */}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-medium text-yellow-800 mb-2">Debug Info:</h5>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <p>file_url: {selectedContent.file_url ? 'EXISTS' : 'NULL'}</p>
                        <p>files array: {selectedContent.files ? `${selectedContent.files.length} items` : 'NULL'}</p>
                        <p>file_name: {selectedContent.file_name || 'NULL'}</p>
                        <p>mime_type: {selectedContent.mime_type || 'NULL'}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <File className="w-4 h-4" />
                        Fichier joint
                      </h4>
                      <div className="space-y-2">
                        <p className="text-slate-700">
                          <span className="font-medium">Nom:</span> {selectedContent.file_name || selectedContent.title || 'Non spécifié'}
                        </p>
                        {selectedContent.mime_type && (
                          <p className="text-slate-700">
                            <span className="font-medium">Type:</span> {selectedContent.mime_type}
                          </p>
                        )}
                        
                        {/* Bouton pour ouvrir le fichier directement */}
                        {selectedContent.file_url ? (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                console.log('Opening file:', selectedContent.file_url);
                                const fileUrl = buildFileUrl(selectedContent.file_url);
                                console.log('Built URL:', fileUrl);
                                window.open(fileUrl, '_blank');
                              }}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ouvrir le fichier
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                const fileUrl = buildFileUrl(selectedContent.file_url);
                                const downloadUrl = buildDownloadUrl(fileUrl);
                                
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = selectedContent.file_name || selectedContent.title || 'document';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Télécharger
                            </Button>
                          </div>
                        ) : (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">
                              <strong>file_url manquant</strong> - Le fichier ne peut pas être ouvert
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview pour les images et PDFs */}
                    {selectedContent.file_url && (
                      <div className="mt-4">
                        {selectedContent.mime_type?.startsWith('image/') && (
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={buildFileUrl(selectedContent.file_url)} 
                              alt={selectedContent.title}
                              className="w-full h-auto max-h-96 object-contain bg-stone-100"
                            />
                          </div>
                        )}
                        
                        {/* Prévisualisation PDF améliorée */}
                        {selectedContent.mime_type === 'application/pdf' && (
                          <div className="border rounded-lg overflow-hidden">
                            <iframe
                              src={buildFileUrl(selectedContent.file_url)}
                              className="w-full h-96"
                              title="PDF Preview"
                            />
                          </div>
                        )}
                        
                        {/* Fallback pour les PDFs sans mime_type */}
                        {selectedContent.file_url && selectedContent.file_url.endsWith('.pdf') && (
                          <div className="border rounded-lg overflow-hidden">
                            <iframe
                              src={buildFileUrl(selectedContent.file_url)}
                              className="w-full h-96"
                              title="PDF Preview"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Gestion multi-fichiers */}
                    {selectedContent.files && selectedContent.files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-slate-900">Debug Multi-fichiers ({selectedContent.files.length} fichiers):</h4>
                        {selectedContent.files.map((file, index) => (
                          <div key={index} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">File {index + 1}: {file.name}</p>
                                <p className="text-sm text-slate-500">URL: {file.url}</p>
                                <p className="text-sm text-slate-500">{file.type} - {(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <div className="flex gap-2">
                                {/* Ouvrir */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    console.log('Opening multi-file:', file.url);
                                    window.open(file.url, '_blank');
                                  }}
                                  className="text-blue-600 border-blue-200"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Ouvrir
                                </Button>
                                {/* Télécharger */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = file.url;
                                    link.download = file.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="text-green-600 border-green-200"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Télécharger
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Fallback si aucun fichier trouvé */}
                    {!selectedContent.file_url && (!selectedContent.files || selectedContent.files.length === 0) && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Aucun fichier trouvé</h4>
                        <p className="text-red-700 text-sm">
                          Ni file_url ni files[] ne sont disponibles. Vérifiez l'API backend.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedContent.type === 'article' && (
                  <div className="space-y-4">
                    {/* Tags */}
                    {selectedContent.tags && selectedContent.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-stone-100 text-stone-600 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Article content */}
                    <div className="prose prose-slate max-w-none">
                      {selectedContent.content ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
                      ) : selectedContent.article_content ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedContent.article_content }} />
                      ) : selectedContent.body ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedContent.body }} />
                      ) : selectedContent.description ? (
                        <div className="text-slate-700 whitespace-pre-wrap">{selectedContent.description}</div>
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-amber-800 italic">Aucun contenu textuel disponible pour cet article</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback for unknown types */}
                {!['link', 'file', 'article'].includes(selectedContent.type) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-slate-900 mb-2">Type de contenu: {selectedContent.type}</h4>
                      <div className="space-y-2">
                        {selectedContent.description && (
                          <p className="text-slate-700">{selectedContent.description}</p>
                        )}
                        {selectedContent.content && (
                          <div className="prose prose-slate max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
                          </div>
                        )}
                        {!selectedContent.description && !selectedContent.content && (
                          <p className="text-amber-800 italic">Aucun contenu disponible pour ce type</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with actions */}
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Fermer
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setShowPreview(false);
                    openRejectDialog(selectedContent);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Refuser
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setShowPreview(false);
                    handleApprove(selectedContent.id);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approuver
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
