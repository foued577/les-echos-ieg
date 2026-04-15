import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { gazettesAPI } from '../services/api';
import GazetteViewer from '../components/GazetteViewer';
import { APP_NAME } from '../constants/app';

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
    console.log('🔗 SHARE CLICKED - Starting share process');
    console.log('🔗 GAZETTE DATA:', { title: gazette?.title, description: gazette?.description });
    
    try {
      const shareUrl = window.location.href;
      console.log('🔗 SHARE URL:', shareUrl);
      
      const shareTitle = gazette?.title || `Gazette ${APP_NAME}`;
      const shareText = gazette?.description || `Découvrez cette gazette sur ${APP_NAME}`;
      
      console.log('🔗 SHARE DATA:', { title: shareTitle, text: shareText, url: shareUrl });
      
      // Try native share API first
      if (navigator.share) {
        console.log('🔗 USING NATIVE SHARE API');
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          console.log('🔗 NATIVE SHARE SUCCESS - Silent feedback');
          // Silent success - native share provides its own feedback
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.log('🔗 NATIVE SHARE FAILED, FALLBACK TO CLIPBOARD');
            throw shareError;
          } else {
            console.log('🔗 USER CANCELLED NATIVE SHARE - Silent');
          }
        }
      } else {
        console.log('🔗 NATIVE SHARE NOT AVAILABLE, USING CLIPBOARD');
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
        console.log('🔗 CLIPBOARD COPY SUCCESS - Silent feedback');
        // Silent success - clipboard copy is immediate
      }
    } catch (error) {
      console.error('🔗 SHARE ERROR:', error);
      // Silent error handling - no intrusive alerts
      console.log('🔗 Share failed silently - user can try again');
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
              onClick={() => navigate('/Gazette')}
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
