import React from 'react';
import DOMPurify from 'dompurify';
import { FileText, User, Calendar, Clock, Eye, Bookmark, Share2, Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../styles/newspaper.css';

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
      {/* En-tête de l'article - Style Journal */}
      <header className="mb-8">
        {/* Fil d'Ariane et métadonnées */}
        <div className="flex items-center gap-3 text-sm text-slate-600 mb-6 border-b border-gray-300 pb-3">
          <span className="px-3 py-1 bg-black text-white rounded font-medium tracking-wide uppercase text-xs">
            Article
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {calculateReadingTime(content.content)} de lecture
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {views} vues
          </span>
        </div>

        {/* Titre principal - Style gothique journal */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight mb-4" 
              style={{ fontFamily: "'UnifrakturCook', 'Old English Text MT', serif", letterSpacing: '2px' }}>
            {content.title}
          </h1>
          
          {/* Ligne décorative sous le titre */}
          <div className="w-32 h-1 bg-black mx-auto mb-6"></div>
          
          {/* Sous-titre/chapô */}
          {content.description && (
            <p className="text-xl md:text-2xl leading-relaxed italic text-gray-700 max-w-3xl mx-auto" 
               style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              {content.description}
            </p>
          )}
        </div>

        {/* Métadonnées de l'auteur - Style Journal */}
        <div className="flex items-center justify-between pb-6 border-b-2 border-gray-400">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg"
                 style={{ fontFamily: "'UnifrakturCook', 'Old English Text MT', serif" }}>
              {content.author_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-bold text-black text-lg" 
                 style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                {content.author_name || 'Auteur'}
              </p>
              <p className="text-sm text-gray-600 italic">
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

      {/* Contenu de l'article - Style Journal */}
      <div className="max-w-none">
        <div className="bg-white border-2 border-gray-300 shadow-lg p-8 md:p-16" 
             style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
          {content.content ? (
            <div 
              className="newspaper-article max-w-none text-black"
              style={{ fontSize: '18px', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(content.content || "")
              }}
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 italic">Aucun contenu disponible pour cet article.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer de l'article - Style Journal */}
      <footer className="mt-16 pt-8 border-t-2 border-gray-400">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likes}</span>
              <span style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>J'aime</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-300">
              <MessageCircle className="w-5 h-5" />
              <span style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>Commenter</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>Partager</span>
          </button>
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-600 mr-2" 
                  style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              Tags :
            </span>
            {content.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300"
                style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
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
