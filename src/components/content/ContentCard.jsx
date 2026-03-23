import React from 'react';
import { getFileUrl } from '../../utils';
import { buildFileUrl, buildDownloadUrl } from '@/services/api';
import { 
  Link as LinkIcon, 
  FileText, 
  File, 
  ExternalLink, 
  MoreVertical, 
  Eye,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeConfig = {
  link: { icon: LinkIcon, label: 'Lien', gradient: 'from-blue-500 to-cyan-500' },
  file: { icon: File, label: 'Fichier', gradient: 'from-purple-500 to-pink-500' },
  article: { icon: FileText, label: 'Article', gradient: 'from-emerald-500 to-teal-500' },
};

export default function ContentCard({ content, category, onView, showActions = true }) {
  const { user } = useAuth();
  const type = typeConfig[content.type] || typeConfig.article;
  const TypeIcon = type.icon;

  const handleOpen = () => {
    if (content.type === 'link' && content.url) {
      window.open(content.url, '_blank');
    } else if (content.type === 'file' && content.file_url) {
      // Téléchargement direct du fichier avec buildDownloadUrl pour Cloudinary
      const fileUrl = buildFileUrl(content.file_url);
      const downloadUrl = buildDownloadUrl(fileUrl);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = content.file_name || content.title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (onView) {
      onView(content);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await contentsAPI.delete(content._id || content.id);
      
      if (response.success) {
        toast.success('Contenu supprimé avec succès');
        // Recharger la liste ou mettre à jour l'état
        window.location.reload();
      } else {
        toast.error('Erreur lors de la suppression du contenu');
      }
    } catch (error) {
      console.error('Erreur suppression contenu:', error);
      toast.error('Erreur lors de la suppression du contenu');
    }
  };

  const canDelete = user?.role === 'ADMIN' || user?._id === content.author_id?._id;

  return (
    <div className="glass-card rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer"
      onClick={handleOpen}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${type.gradient} shadow-lg shadow-purple-500/10`}>
          <TypeIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {content.title}
              </h3>
              {content.description && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{content.description}</p>
              )}
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
                  <DropdownMenuItem onClick={handleOpen} className="text-slate-300 focus:bg-white/5 focus:text-white">
                    {content.type === 'link' ? <ExternalLink className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {content.type === 'link' ? 'Ouvrir le lien' : 'Voir le contenu'}
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:bg-white/5 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${type.gradient} text-white`}>
              {type.label}
            </span>
            {category && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/10 text-slate-300 border border-white/10">
                {category.name}
              </span>
            )}
            {content.tags?.length > 0 && content.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-xs text-slate-500">
              Par <span className="text-slate-400">{content.author_name || 'Anonyme'}</span>
            </span>
            <span className="text-xs text-slate-600">
              {format(new Date(content.created_date), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}