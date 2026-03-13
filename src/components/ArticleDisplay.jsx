import React from 'react';
import DOMPurify from 'dompurify';
import { FileText, User, Calendar, Clock, Eye, Bookmark, Share2, Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ArticleDisplay({ content }) {
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);
  const [likes, setLikes] = React.useState(content.likes || 0);
  const [views, setViews] = React.useState(content.views || 0);

  // Calcul du temps de lecture estimé
  const calculateReadingTime = (text) => {
    if (!text) return '1 min';
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  // Fonction pour partager l'article
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content.title,
        text: content.description || '',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Fonction pour aimer l'article
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  // Fonction pour bookmark
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <article className="max-w-4xl mx-auto">
      {/* En-tête de l'article */}
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
            Article
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {calculateReadingTime(content.content)} de lecture
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {views} vues
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6 font-serif">
          {content.title}
        </h1>

        {content.description && (
          <p className="text-xl text-slate-600 leading-relaxed mb-6 font-light">
            {content.description}
          </p>
        )}

        {/* Métadonnées de l'auteur */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {content.author_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-medium text-slate-900">{content.author_name || 'Auteur'}</p>
              <p className="text-sm text-slate-500">
                Publié le {format(new Date(content.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Actions sociales */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likes}</span>
            </button>
            
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenu de l'article */}
      <div className="max-w-none">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 md:p-12">
          {content.content ? (
            <div 
              className="article-html max-w-none text-[16px] leading-8 text-gray-800
                       [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
                       [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5
                       [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                       [&_p]:mb-4
                       [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                       [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                       [&_li]:mb-1
                       [&_a]:text-blue-600 [&_a]:underline
                       [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300
                       [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
                       [&_img]:rounded-lg [&_img]:my-4"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(content.content || "")
              }}
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun contenu disponible pour cet article.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer de l'article */}
      <footer className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likes}</span>
              <span>J'aime</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span>Commenter</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Partager</span>
          </button>
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </footer>

      </article>
  );
}
