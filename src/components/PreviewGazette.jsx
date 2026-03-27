import React from 'react';
import { X, Eye, Download, Share2, Calendar, User } from 'lucide-react';

const PreviewGazette = ({ title, description, blocks, onClose }) => {
  const renderBlockContent = (block) => {
    switch (block.type) {
      case 'title':
        return (
          <h1 className="text-4xl font-serif text-gray-900 mb-6 leading-tight">
            {block.content || 'Titre de la gazette'}
          </h1>
        );

      case 'text':
        return (
          <div className="prose prose-lg max-w-none text-gray-700 mb-6 leading-relaxed">
            {block.content ? (
              <div dangerouslySetInnerHTML={{ __html: block.content.replace(/\n/g, '<br>') }} />
            ) : (
              <p className="text-gray-400 italic">Texte à ajouter...</p>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="mb-8">
            {block.content ? (
              <img 
                src={block.content} 
                alt="Image de la gazette"
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <p>Image à ajouter</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="mb-8">
            {block.content ? (
              <video 
                src={block.content} 
                controls
                className="w-full rounded-lg shadow-lg max-h-96"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎥</span>
                  </div>
                  <p>Vidéo à ajouter</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'link':
        return (
          <div className="mb-6">
            {block.content ? (
              <a 
                href={block.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline font-medium"
              >
                <span>{block.content}</span>
                <Share2 className="w-4 h-4" />
              </a>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <p>Lien à ajouter</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'section':
        return (
          <div className="mb-8">
            <div className="border-l-4 border-blue-500 pl-8">
              {block.content ? (
                <h2 className="text-2xl font-serif text-gray-900 mb-4">
                  {block.content}
                </h2>
              ) : (
                <h2 className="text-2xl font-serif text-gray-400 italic mb-4">
                  Section à ajouter
                </h2>
              )}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {/* Section content would go here */}
              </div>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="mb-6">
            <blockquote className="border-l-4 border-gray-300 pl-6 italic text-gray-700 text-lg">
              {block.content ? (
                <p>"{block.content}"</p>
              ) : (
                <p className="text-gray-400">"Citation à ajouter..."</p>
              )}
            </blockquote>
          </div>
        );

      case 'separator':
        return (
          <div className="my-12 border-t border-gray-300">
            <div className="text-center text-sm text-gray-500 mt-2">• • •</div>
          </div>
        );

      default:
        return (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800">Type de bloc non reconnu: {block.type}</p>
          </div>
        );
    }
  };

  const hasContent = blocks.length > 0 || title || description;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-serif text-gray-900">Aperçu de la Gazette</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {hasContent ? (
            <article className="p-8">
              {/* Header */}
              <header className="text-center mb-12">
                <h1 className="text-4xl font-serif text-gray-900 mb-4 leading-tight">
                  {title || 'Titre de la Gazette'}
                </h1>
                {description && (
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    {description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>La Gazette d'Occitanie</span>
                  </div>
                </div>
              </header>

              {/* Content */}
              <div className="max-w-3xl mx-auto">
                {blocks.map((block, index) => (
                  <div key={block.id || index}>
                    {renderBlockContent(block)}
                  </div>
                ))}
              </div>
            </article>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📰</span>
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-4">
                  Aucun contenu à prévisualiser
                </h3>
                <p className="text-gray-600 max-w-md">
                  Votre gazette ne contient encore aucun contenu. Ajoutez des blocs pour voir l'aperçu.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {blocks.length} bloc{blocks.length > 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exporter PDF</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewGazette;
