import React, { useState, useEffect } from 'react';
import { teamsAPI, contentsAPI, rubriquesAPI } from '@/services/api';
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
import { toast } from 'sonner';

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
      console.log('🔍 Loading data for Moderation...');
      
      const [teamsResponse, contentsResponse] = await Promise.all([
        teamsAPI.getAll(),
        contentsAPI.getAll() // Load ALL contents, not just pending_review
      ]);

      if (teamsResponse.success) {
        const normalizedTeams = teamsResponse.data.map(team => ({
          ...team,
          id: team._id || team.id
        }));
        setTeams(normalizedTeams);
        console.log('✅ Teams loaded for Moderation:', normalizedTeams.length);
      }

      if (contentsResponse.success) {
        const normalizedContents = contentsResponse.data.map(content => ({
          ...content,
          id: content._id || content.id,
          team_ids: content.team_ids ? content.team_ids.map(id => id.toString()) : []
        }));
        setContents(normalizedContents);
        console.log('✅ Contents loaded for Moderation:', normalizedContents.length);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('💥 Error loading data for Moderation:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (contentId) => {
    try {
      console.log('✅=== APPROVE START ===');
      console.log('✅ Content ID:', contentId);
      console.log('✅ User:', user);
      
      const updateData = {
        status: 'approved',
        moderated_by: user.email,
        moderation_date: new Date().toISOString(),
      };
      
      console.log('✅ Update data:', updateData);
      
      const response = await contentsAPI.update(contentId, updateData);
      console.log('✅ API Response:', response);
      
      toast.success('Contenu approuvé');
      loadData();
    } catch (error) {
      console.error('💥 Error approving content:', error);
      console.error('💥 Error response:', error.response?.data);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    try {
      console.log('❌=== REJECT START ===');
      console.log('❌ Selected content:', selectedContent);
      console.log('❌ User:', user);
      console.log('❌ Comment:', comment);
      
      const updateData = {
        status: 'rejected',
        moderated_by: user.email,
        moderation_date: new Date().toISOString(),
        moderation_comment: comment,
      };
      
      console.log('❌ Update data:', updateData);
      
      const response = await contentsAPI.update(selectedContent.id, updateData);
      console.log('❌ API Response:', response);
      
      toast.success('Contenu refusé');
      setShowRejectDialog(false);
      setComment('');
      setSelectedContent(null);
      loadData();
    } catch (error) {
      console.error('💥 Error rejecting content:', error);
      console.error('💥 Error response:', error.response?.data);
      toast.error('Erreur lors du refus');
    }
  };

  const openRejectDialog = (content) => {
    setSelectedContent(content);
    setShowRejectDialog(true);
  };

  const openPreview = (content) => {
    setSelectedContent(content);
    setShowPreview(true);
  };

  const getTeam = (teamId) => teams.find(t => t.id === teamId);
  const getCategory = (categoryId) => null; // Categories not implemented yet

  const getTypeIcon = (type) => {
    switch(type) {
      case 'link': return LinkIcon;
      case 'file': return File;
      default: return FileText;
    }
  };

  const pendingContents = contents.filter(c => c.status === 'pending_review');
  const approvedContents = contents.filter(c => c.status === 'approved'); // Fix: changed from 'published' to 'approved'
  const rejectedContents = contents.filter(c => c.status === 'rejected');

  console.log('📊 Content counts:', {
    total: contents.length,
    pending: pendingContents.length,
    approved: approvedContents.length,
    rejected: rejectedContents.length
  });

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
            
            {showActions && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100">
                {content.type === 'link' && content.url && (
                  <Button variant="ghost" size="sm" onClick={() => window.open(content.url, '_blank')} className="text-slate-600">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ouvrir
                  </Button>
                )}
                {content.type === 'file' && content.file_url && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://les-echos-ieg.onrender.com/api';
                    const backendBaseUrl = apiBaseUrl.replace('/api', '');
                    const fileUrl = `${backendBaseUrl}${content.file_url}`;
                    
                    const link = document.createElement('a');
                    link.href = fileUrl;
                    link.download = content.file_name || content.title || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }} className="text-slate-600">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Télécharger
                  </Button>
                )}
                {content.type === 'article' && (
                  <Button variant="ghost" size="sm" onClick={() => openPreview(content)} className="text-slate-600">
                    <Eye className="w-4 h-4 mr-1" />
                    Prévisualiser
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
        </div>
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

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => {
        if (!open) {
          setShowPreview(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">{selectedContent.title}</DialogTitle>
              </DialogHeader>
              <div 
                className="prose prose-slate max-w-none py-4"
                dangerouslySetInnerHTML={{ __html: selectedContent.article_content }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}