import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { gazettesAPI } from '../services/api';
import GazetteViewer from '../components/GazetteViewer';

const GazettePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gazette, setGazette] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGazette = async () => {
      try {
        setLoading(true);
        console.log('=== LOADING GAZETTE FOR PUBLIC VIEW ===');
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

      {/* Contenu principal - Utilisation du composant commun */}
      <div className="px-4 py-12">
        <GazetteViewer 
          gazette={gazette} 
          showHeader={true} 
          showFooter={true}
          className=""
        />
      </div>
    </div>
  );
};

export default GazettePage;
