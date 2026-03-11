import React from 'react';
import { getFileUrl } from '../../utils';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link as LinkIcon, FileText, File, CheckCircle, XCircle, ExternalLink, Eye, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const typeConfig = {
  link: { icon: LinkIcon, label: 'Lien', gradient: 'from-blue-500 to-cyan-500' },
  file: { icon: File, label: 'Fichier', gradient: 'from-purple-500 to-pink-500' },
  article: { icon: FileText, label: 'Article', gradient: 'from-emerald-500 to-teal-500' },
};

export default function ModerationCard({ content, team, category, onApprove, onReject }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [comment, setComment] = useState('');

  const type = typeConfig[content.type] || typeConfig.article;
  const TypeIcon = type.icon;

  const handleReject = () => {
    onReject(content.id, comment);
    setShowRejectDialog(false);
    setComment('');
  };

  return (
    <>
      <div className="glass-card rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-all">
        <div className="flex items-start gap-5">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${type.gradient} shadow-lg shadow-purple-500/10`}>
            <TypeIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-xl text-white">{content.title}</h3>
                {content.description && (
                  <p className="text-slate-400 mt-2">{content.description}</p>
                )}
              </div>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full bg-gradient-to-r ${type.gradient} text-white whitespace-nowrap`}>
                {type.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {team && (
                <span className="px-3 py-1 text-sm rounded-full bg-white/10 text-slate-300 border border-white/10">
                  {team.name}
                </span>
              )}
              {category && (
                <span className="px-3 py-1 text-sm rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {category.name}
                </span>
              )}
              {content.tags?.map((tag, i) => (
                <span key={i} className="px-3 py-1 text-sm rounded-full bg-white/5 text-slate-400 border border-white/5">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/10 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-slate-300">{content.author_name || 'Anonyme'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(content.created_date), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              {content.type === 'link' && content.url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(content.url, '_blank')}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              )}
              {content.type === 'file' && content.file_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://les-echos-ieg.onrender.com/api';
                    const backendBaseUrl = apiBaseUrl.replace('/api', '');
                    const fileUrl = `${backendBaseUrl}${content.file_url}`;
                    
                    const link = document.createElement('a');
                    link.href = fileUrl;
                    link.download = content.file_name || content.title || 'document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              )}
              {content.type === 'article' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(true)}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
              )}
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Refuser
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                onClick={() => onApprove(content.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Refuser le contenu</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-400 mb-3">
              Motif du refus (optionnel) - sera visible par l'auteur
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Expliquez pourquoi ce contenu est refusé..."
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="border-white/10 text-white hover:bg-white/5">
              Annuler
            </Button>
            <Button className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0" onClick={handleReject}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{content.title}</DialogTitle>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content.article_content }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}