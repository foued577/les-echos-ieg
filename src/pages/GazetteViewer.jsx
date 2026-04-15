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

  // Parse content sections - try multiple formats
  const sections = [];
  console.log('=== PARSING GAZETTE CONTENT ===');
  console.log('Gazette blocks:', gazette.blocks);
  console.log('Gazette content:', gazette.content);
  
  // Try blocks first (new format)
  if (Array.isArray(gazette.blocks) && gazette.blocks.length > 0) {
    console.log('Using blocks format');
    gazette.blocks.forEach((block, index) => {
      sections.push({
        id: index + 1,
        title: block.title || `Section ${index + 1}`,
        content: block.content || block.description || '',
        type: block.type || 'text'
      });
    });
  }
  // Try HTML content with sections (old format)
  else if (gazette.content && typeof gazette.content === 'string') {
    console.log('Using HTML content format');
    const sectionMatches = gazette.content.match(/<section[^>]*>([\s\S]*?)<\/section>/g);
    if (sectionMatches) {
      console.log('Found HTML sections:', sectionMatches.length);
      sectionMatches.forEach((section, index) => {
        const titleMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        const contentMatch = section.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        
        sections.push({
          id: index + 1,
          title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : `Section ${index + 1}`,
          content: contentMatch ? contentMatch[1] : section.replace(/<[^>]*>/g, '')
        });
      });
    } else {
      console.log('No HTML sections found, using content as single section');
      // If no sections found, treat entire content as one section
      sections.push({
        id: 1,
        title: gazette.title || 'Contenu',
        content: gazette.content
      });
    }
  }
  // Fallback to empty
  else {
    console.log('No content found, using empty section');
    sections.push({
      id: 1,
      title: 'Aucun contenu',
      content: 'Aucun contenu disponible pour cette gazette.'
    });
  }
  
  console.log('Final sections:', sections);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple et propre */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Consultation de Gazette</h1>
                <p className="text-sm text-gray-500">Lecture seule</p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal de la gazette */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête de la gazette */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{gazette.title}</h1>
              {gazette.description && (
                <p className="text-gray-600 mb-4">{gazette.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
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
            
            {gazette.cover_image && (
              <div className="ml-6">
                <img
                  src={gazette.cover_image}
                  alt={gazette.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sections de contenu */}
        {sections.length > 0 ? (
          sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">Aucun contenu disponible pour cette gazette.</p>
          </div>
        )}

        {/* Pied de page */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Gazette créée le {
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
          {(() => {
            const updateDateFields = [
              gazette.updated_at,
              gazette.updatedAt
            ];
            
            for (const dateField of updateDateFields) {
              if (dateField) {
                try {
                  const date = new Date(dateField);
                  if (!isNaN(date.getTime())) {
                    return <p>Dernière modification le {date.toLocaleDateString('fr-FR')}</p>;
                  }
                } catch (error) {
                  console.log('Invalid update date field:', dateField);
                }
              }
            }
            
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default GazetteViewer;
