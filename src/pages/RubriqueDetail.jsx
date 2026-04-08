import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { contentsAPI, rubriquesAPI } from '@/services/api';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Search, 
  Filter,
  Plus,
  Eye,
  Download,
  Edit,
  Trash2,
  Link as LinkIcon,
  File
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RubriqueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rubrique, setRubrique] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (id) {
      loadRubriqueAndContents();
    }
  }, [id]);

  const loadRubriqueAndContents = async () => {
    try {
      setLoading(true);
      
      // Load rubrique details
      const rubriqueResponse = await rubriquesAPI.getById(id);
      if (rubriqueResponse.success) {
        setRubrique(rubriqueResponse.data);
      }
      
      // Load contents for this rubrique
      const contentsResponse = await contentsAPI.getAll({ rubrique_id: id });
      let loadedContents = [];
      
      if (contentsResponse.success) {
        loadedContents = contentsResponse.data || [];
      } else {
        // Handle case where API returns data directly without success wrapper
        loadedContents = contentsResponse || [];
      }
      
      setContents(loadedContents);
      
      // DEBUG LOGS
      console.log('RUBRIQUE CONTENTS:', loadedContents);
      console.log('RUBRIQUE ID:', id);
      console.log('TOTAL CONTENTS:', loadedContents.length);
      
    } catch (error) {
      console.error('Error loading rubrique details:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesType = typeFilter === 'all' || content.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending_review': return 'text-orange-600 bg-orange-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'pending_review': return 'En attente';
      case 'rejected': return 'Rejeté';
      default: return 'Brouillon';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lien': return LinkIcon;
      case 'fichier': return File;
      default: return FileText;
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement de la rubrique...</div>
        </div>
      </div>
    );
  }

  if (!rubrique) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Rubrique non trouvée</div>
          <Button onClick={() => navigate('/rubriques')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux rubriques
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/rubriques')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux rubriques
              </Button>
              
              <div className="ml-6">
                <h1 className="text-xl font-semibold text-gray-900">{rubrique.name}</h1>
                <p className="text-sm text-gray-500">{rubrique.description}</p>
              </div>
            </div>
            
            {rubrique.team_ids && rubrique.team_ids.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rubrique.color }}></div>
                <span className="text-sm text-gray-600">
                  {rubrique.team_ids.length} équipe(s) associée(s)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{contents.length}</div>
              <div className="text-sm text-gray-500">Total contenus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {contents.filter(c => c.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Approuvés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {contents.filter(c => c.status === 'pending_review').length}
              </div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {contents.filter(c => c.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-500">Rejetés</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les contenus..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="pending_review">En attente</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="lien">Liens</SelectItem>
                <SelectItem value="fichier">Fichiers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Contenus ({filteredContents.length})
            </h2>
          </div>
          
          {filteredContents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">
                {search || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Aucun contenu trouvé' 
                  : 'Aucun contenu dans cette rubrique'}
              </div>
              <div className="text-gray-400 text-sm">
                {search && 'Essayez une autre recherche'}
                {statusFilter !== 'all' && 'Essayez un autre filtre de statut'}
                {typeFilter !== 'all' && 'Essayez un autre filtre de type'}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredContents.map((content) => {
                const TypeIcon = getTypeIcon(content.type);
                
                return (
                  <div key={content._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{content.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
                                {getStatusLabel(content.status)}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {content.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // DEBUG LOGS
                            console.log('CONTENT CLICKED:', content);
                            console.log('CONTENT TYPE:', content.type);
                            console.log('CONTENT FIELDS:', Object.keys(content));
                            console.log('ALL CONTENT DATA:', JSON.stringify(content, null, 2));
                            
                            if (content.type === 'lien') {
                              // Pour les liens, l'URL est stockée dans le champ 'content'
                              const linkUrl = content.content || content.url || content.link || content.file_url;
                              console.log('LINK URL FOUND:', linkUrl);
                              if (linkUrl && linkUrl.trim() !== '') {
                                window.open(linkUrl.trim(), '_blank', 'noopener,noreferrer');
                              } else {
                                console.error('No URL found for link content:', content);
                                // Afficher une notification à l'utilisateur
                                alert('Ce lien ne contient pas d\'URL valide. Vérifiez le contenu du lien.');
                              }
                            } else if (content.type === 'fichier') {
                              // Pour les fichiers, utiliser file_url ou cloudinary URLs
                              const fileUrl = content.file_url || content.url || content.secure_url;
                              console.log('FILE URL FOUND:', fileUrl);
                              if (fileUrl && fileUrl.trim() !== '') {
                                window.open(fileUrl.trim(), '_blank', 'noopener,noreferrer');
                              } else {
                                console.error('No file URL found for file content:', content);
                                alert('Ce fichier n\'a pas d\'URL valide. Vérifiez le fichier.');
                              }
                            } else if (content.type === 'article') {
                              // Pour les articles, l'URL peut être dans 'content' s'il s'agit d'un lien
                              const articleUrl = content.content || content.url || content.link;
                              console.log('ARTICLE URL FOUND:', articleUrl);
                              if (articleUrl && articleUrl.trim() !== '') {
                                // Vérifier si c'est une URL valide
                                if (articleUrl.startsWith('http://') || articleUrl.startsWith('https://')) {
                                  window.open(articleUrl.trim(), '_blank', 'noopener,noreferrer');
                                } else {
                                  // Si ce n'est pas une URL, c'est probablement du contenu texte
                                  console.log('Article content is text, not URL');
                                  alert('Cet article est du contenu texte, pas un lien.');
                                }
                              } else {
                                console.error('No URL found for article content:', content);
                                alert('Cet article n\'a pas d\'URL valide.');
                              }
                            } else {
                              console.error('Unknown content type:', content.type);
                              alert('Type de contenu inconnu: ' + content.type);
                            }
                          }}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {content.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = content.file_url;
                              link.download = content.file_name || 'fichier';
                              link.click();
                            }}
                            className="text-gray-500 hover:text-green-600"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {content.author_id?.name || 'Utilisateur inconnu'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(content.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RubriqueDetail;
