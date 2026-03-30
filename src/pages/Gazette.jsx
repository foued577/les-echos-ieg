import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Newspaper, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  FileText,
  Image,
  Video,
  Link as LinkIcon,
  Type,
  Layout
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { gazettesAPI } from '../services/api';

export default function Gazette() {
  const [gazettes, setGazettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadGazettes();
  }, []);

  useEffect(() => {
    console.log('🔄 DEBUG: Filters changed, reloading gazettes:', { selectedStatus, searchTerm });
    loadGazettes();
  }, [selectedStatus, searchTerm]);

  const loadGazettes = async () => {
    try {
      console.log('📋 DEBUG: Starting gazettes load...');
      console.log('🔍 DEBUG: Current filters state:', { selectedStatus, searchTerm });
      
      // Construire les filtres
      const filters = {};
      if (selectedStatus && selectedStatus !== 'all') {
        filters.status = selectedStatus;
        console.log('🔍 DEBUG: Adding status filter:', selectedStatus);
      }
      if (searchTerm && searchTerm.trim() !== '') {
        filters.search = searchTerm.trim();
        console.log('🔍 DEBUG: Adding search filter:', searchTerm.trim());
      }

      console.log('🔍 DEBUG: Final filters object:', filters);

      // Appeler l'API
      console.log('📡 DEBUG: Calling gazettesAPI.getAll()...');
      const apiResponse = await gazettesAPI.getAll(filters);
      
      console.log('📡 DEBUG: Raw API response from service:', apiResponse);
      console.log('📊 DEBUG: Response type:', typeof apiResponse);
      console.log('📊 DEBUG: Response keys:', Object.keys(apiResponse || {}));

      // Le backend normalise maintenant avec { success, data }
      // Donc apiResponse devrait être { success: true, data: [...], count }
      let gazettesData = [];
      
      if (apiResponse?.data && Array.isArray(apiResponse.data)) {
        // Format attendu: { success: true, data: [...], count }
        gazettesData = apiResponse.data;
        console.log('📋 DEBUG: Using apiResponse.data, length:', gazettesData.length);
      } else if (Array.isArray(apiResponse)) {
        // Format fallback: direct array
        gazettesData = apiResponse;
        console.log('📋 DEBUG: Using direct array, length:', gazettesData.length);
      } else {
        console.warn('⚠️ WARNING: Unexpected response format:', apiResponse);
        gazettesData = [];
      }

      console.log('📋 DEBUG: Final gazettes data:', gazettesData);
      console.log('📊 DEBUG: Gazettes count:', gazettesData.length);
      
      // Log détaillé de chaque gazette
      gazettesData.forEach((gazette, index) => {
        console.log(`📰 GAZETTE ${index + 1}:`, {
          id: gazette.id,
          title: gazette.title,
          status: gazette.status,
          blocksCount: gazette.blocks?.length || 0,
          createdAt: gazette.createdAt
        });
      });

      // Vérifier le filtrage pour "Tous les statuts"
      if (selectedStatus === 'all') {
        console.log('✅ DEBUG: Filter is "all", showing all gazettes including drafts');
      } else {
        console.log('🔍 DEBUG: Filter applied, showing only:', selectedStatus);
      }

      setGazettes(gazettesData);
      setLoading(false);
      
      console.log('✅ DEBUG: Gazettes loaded and state updated successfully');
      
    } catch (error) {
      console.error('❌ ERROR: Failed to load gazettes!');
      console.error('❌ ERROR Details:', error);
      console.error('❌ ERROR Response:', error.response?.data);
      console.error('❌ ERROR Message:', error.message);
      console.error('❌ ERROR Status:', error.response?.status);
      
      setGazettes([]);
      setLoading(false);
      
      // Afficher un message d'erreur très clair
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement';
      alert(`Erreur de chargement: ${errorMessage}`);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return 'Inconnu';
    }
  };

  const filteredGazettes = gazettes.filter(gazette => {
    const matchesSearch = gazette.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gazette.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || gazette.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif text-gray-900 tracking-tight mb-4">
                La Gazette d'Occitanie
              </h1>
              <p className="text-xl text-gray-600 font-light">
                Créez et partagez vos magazines éditoriaux
              </p>
            </div>
            <Link to={createPageUrl('GazetteEditor')}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Gazette
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une gazette..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillons</option>
                <option value="published">Publiés</option>
                <option value="archived">Archivés</option>
              </select>
            </div>
          </div>
        </section>

        {/* Empty State */}
        {filteredGazettes.length === 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedStatus !== 'all' ? 'Aucune gazette trouvée' : 'Aucune gazette créée'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Commencez par créer votre première gazette éditoriale'
              }
            </p>
            {!searchTerm && selectedStatus === 'all' && (
              <Link to={createPageUrl('GazetteEditor')}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Créer ma première gazette
                </Button>
              </Link>
            )}
          </section>
        )}

        {/* Gazette Grid */}
        {filteredGazettes.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGazettes.map((gazette) => (
              <div key={gazette.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <Newspaper className="w-16 h-16 text-blue-600" />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gazette.status)}`}>
                      {getStatusLabel(gazette.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(gazette.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-serif text-gray-900 mb-2 line-clamp-2">
                    {gazette.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {gazette.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {gazette.sections?.length || 0} sections
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {gazette.views || 0} vues
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={createPageUrl(`GazetteEditor?id=${gazette.id}`)} className="flex-1">
                      <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                    </Link>
                    {gazette.status === 'published' && (
                      <Link to={createPageUrl(`GazetteView?id=${gazette.id}`)} className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
