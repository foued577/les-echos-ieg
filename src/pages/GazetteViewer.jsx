import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Calendar, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { gazettesAPI } from '../services/api';

const GazetteViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gazette, setGazette] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGazette = async () => {
      try {
        setLoading(true);
        console.log('=== LOADING GAZETTE FOR VIEWING ===');
        console.log('Gazette ID:', id);
        
        const response = await gazettesAPI.getById(id);
        console.log('=== PUBLIC GAZETTE RESPONSE DEBUG ===');
        console.log('Full API response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response || {}));
        console.log('Response.data:', response.data);
        console.log('Response.data type:', typeof response.data);
        console.log('Response.data keys:', Object.keys(response.data || {}));
        
        if (response.data && response.data.data) {
          console.log('Response.data.data found:', response.data.data);
          console.log('Response.data.data keys:', Object.keys(response.data.data || {}));
        }
        
        // Check for specific fields
        const gazetteData = response.data?.data || response.data;
        console.log('Gazette data to use:', gazetteData);
        console.log('Title:', gazetteData?.title);
        console.log('Description:', gazetteData?.description);
        console.log('Blocks:', gazetteData?.blocks);
        console.log('Content:', gazetteData?.content);
        console.log('CreatedAt:', gazetteData?.createdAt);
        console.log('Created_at:', gazetteData?.created_at);
        console.log('Publication_date:', gazetteData?.publication_date);
        
        if (response && response.data) {
          setGazette(gazetteData);
        } else {
          setError('Gazette non trouvée');
        }
      } catch (error) {
        console.error('Error loading gazette:', error);
        setError('Erreur lors du chargement de la gazette');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGazette();
    }
  }, [id]);

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lien copié dans le presse-papiers');
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  // Render individual block based on type
  const renderBlock = (block, index) => {
    const blockType = block.type || 'text';
    const blockContent = block.content || block.description || '';
    
    switch (blockType) {
      case 'title':
        return (
          <h1 key={index} className="text-4xl md:text-5xl font-serif text-gray-900 text-center mb-8 leading-tight">
            {blockContent}
          </h1>
        );
      
      case 'subtitle':
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-serif text-gray-800 text-center mb-6 leading-tight">
            {blockContent}
          </h2>
        );
      
      case 'heading':
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-serif text-gray-900 mb-6 leading-tight">
            {blockContent}
          </h2>
        );
      
      case 'subheading':
        return (
          <h3 key={index} className="text-xl md:text-2xl font-serif text-gray-800 mb-4 leading-tight">
            {blockContent}
          </h3>
        );
      
      case 'paragraph':
        return (
          <p key={index} className="text-lg text-gray-700 leading-relaxed mb-6 font-serif">
            {blockContent}
          </p>
        );
      
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-blue-600 pl-6 py-4 my-8 bg-gray-50 italic text-xl text-gray-700 font-serif">
            "{blockContent}"
          </blockquote>
        );
      
      case 'image':
        if (blockContent.startsWith('http')) {
          return (
            <div key={index} className="my-8">
              <img 
                src={blockContent} 
                alt={block.title || 'Image'} 
                className="w-full rounded-lg shadow-lg"
              />
              {block.title && (
                <p className="text-center text-sm text-gray-600 mt-2 italic">{block.title}</p>
              )}
            </div>
          );
        }
        return null;
      
      case 'url':
        if (blockContent.startsWith('http')) {
          return (
            <div key={index} className="my-6">
              <a 
                href={blockContent} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-lg"
              >
                {block.title || blockContent}
              </a>
            </div>
          );
        }
        return null;
      
      case 'separator':
        return (
          <hr key={index} className="border-gray-300 my-8" />
        );
      
      case 'text':
      default:
        return (
          <div key={index} className="prose prose-lg max-w-none mb-6">
            <div 
              dangerouslySetInnerHTML={{ __html: blockContent }}
              className="text-gray-700 leading-relaxed"
            />
          </div>
        );
    }
  };

  // Parse content sections - try multiple formats
  const blocks = [];
  console.log('=== PARSING GAZETTE CONTENT ===');
  console.log('Gazette blocks:', gazette?.blocks);
  console.log('Gazette content:', gazette?.content);
  
  // Try blocks first (new format)
  if (Array.isArray(gazette?.blocks) && gazette.blocks.length > 0) {
    console.log('Using blocks format');
    gazette.blocks.forEach((block, index) => {
      blocks.push({
        id: index + 1,
        type: block.type || 'text',
        content: block.content || block.description || '',
        title: block.title || ''
      });
    });
  }
  // Try HTML content with sections (old format)
  else if (gazette?.content && typeof gazette.content === 'string') {
    console.log('Using HTML content format');
    const sectionMatches = gazette.content.match(/<section[^>]*>([\s\S]*?)<\/section>/g);
    if (sectionMatches) {
      console.log('Found HTML sections:', sectionMatches.length);
      sectionMatches.forEach((section, index) => {
        const titleMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        const contentMatch = section.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        
        blocks.push({
          id: index + 1,
          type: 'text',
          content: contentMatch ? contentMatch[1] : section.replace(/<[^>]*>/g, ''),
          title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : ''
        });
      });
    } else {
      console.log('No HTML sections found, using content as single block');
      // If no sections found, treat entire content as one block
      blocks.push({
        id: 1,
        type: 'text',
        content: gazette.content,
        title: ''
      });
    }
  }
  // Fallback to empty
  else {
    console.log('No content found, using empty block');
    blocks.push({
      id: 1,
      type: 'text',
      content: 'Aucun contenu disponible pour cette gazette.',
      title: ''
    });
  }
  
  console.log('Final blocks:', blocks);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la gazette...</p>
        </div>
      </div>
    );
  }

  if (error || !gazette) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Erreur</h2>
            <p className="text-red-600 mb-4">{error || 'Gazette non trouvée'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header minimal et élégant */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Partager</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal - Style editorial premium */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Article Header */}
        <article className="bg-white rounded-none shadow-sm">
          {/* Meta informations */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {(() => {
                    // Try different date fields in order of preference
                    const dateFields = [
                      gazette.publication_date,
                      gazette.created_at,
                      gazette.createdAt,
                      gazette.updated_at,
                      gazette.updatedAt
                    ];
                    
                    for (const dateField of dateFields) {
                      if (dateField) {
                        try {
                          const date = new Date(dateField);
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString('fr-FR');
                          }
                        } catch (error) {
                          console.log('Invalid date field:', dateField);
                        }
                      }
                    }
                    
                    return 'Date non disponible';
                  })()}
                </span>
              </div>
              {gazette.author && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{gazette.author}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Title */}
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight mb-6">
              {gazette.title}
            </h1>
            {gazette.description && (
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-serif italic">
                {gazette.description}
              </p>
            )}
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">
            <p>
              Gazette publiée le {
                (() => {
                  const dateFields = [
                    gazette.created_at,
                    gazette.createdAt,
                    gazette.updated_at,
                    gazette.updatedAt
                  ];
                  
                  for (const dateField of dateFields) {
                    if (dateField) {
                      try {
                        const date = new Date(dateField);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('fr-FR');
                        }
                      } catch (error) {
                        console.log('Invalid footer date field:', dateField);
                      }
                    }
                  }
                  
                  return 'Date non disponible';
                })()
              }
            </p>
            <p className="mt-2">© Les Échos IEG - Gazette Éditoriale</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GazetteViewer;
