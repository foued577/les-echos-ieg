import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { contentsAPI } from '@/services/api';
import { 
  FileText, 
  Link as LinkIcon, 
  File, 
  Calendar,
  User,
  Tag,
  Search,
  Filter,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_ICONS = {
  article: FileText,
  lien: LinkIcon,
  fichier: File,
};

const TYPE_LABELS = {
  article: 'Article',
  lien: 'Lien',
  fichier: 'Fichier',
};

const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-700',
    icon: Edit
  },
  pending_review: {
    label: 'En attente',
    color: 'bg-orange-100 text-orange-700',
    icon: Clock
  },
  approved: {
    label: 'Approuvé',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle
  },
  rejected: {
    label: 'Refusé',
    color: 'bg-red-100 text-red-700',
    icon: XCircle
  }
};

export default function Contents() {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadMyContents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading contents for user:', user?.id);
      console.log('Is admin:', isAdmin);
      
      let response;
      
      if (isAdmin) {
        // Admin: Use global API to see all contents
        console.log('👨‍💼 Loading all contents for admin');
        response = await contentsAPI.getAll();
      } else {
        // Simple user: Use personal API to see only their own contents
        console.log('👤 Loading personal contents for simple user');
        response = await contentsAPI.getMy();
      }
      
      if (response.success) {
        setContents(response.data || []);
      } else {
        // Gérer le cas où la réponse est directe sans wrapper
        setContents(response || []);
      }
      
      console.log('Contents loaded:', response.data?.length || response?.length || 0);
    } catch (error) {
      console.error('Error loading contents:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      loadMyContents();
    }
  }, [user, loadMyContents]);

  const filteredAndSortedContents = contents
    .filter(content => {
      const matchesSearch = content.title?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
      const matchesType = typeFilter === 'all' || content.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleViewContent = (content) => {
    console.log('🔍 DEBUG: Viewing content:', content);
    console.log('🔍 DEBUG: TYPE CONTENT:', content.type);
    
    // Normaliser le type pour éviter les problèmes de casse
    const type = content.type?.toLowerCase();
    console.log('🔍 DEBUG: NORMALIZED TYPE:', type);
    
    switch (type) {
      case 'lien':
        const linkUrl = content.content || content.url || content.link || content.file_url;
        if (linkUrl && linkUrl.trim() !== '') {
          window.open(linkUrl.trim(), '_blank', 'noopener,noreferrer');
        } else {
          alert('Ce lien ne contient pas d\'URL valide.');
        }
        break;
        
      case 'fichier':
        const fileUrl = content.file_url || content.url || content.secure_url;
        if (fileUrl && fileUrl.trim() !== '') {
          window.open(fileUrl.trim(), '_blank', 'noopener,noreferrer');
        } else {
          alert('Ce fichier n\'a pas d\'URL valide.');
        }
        break;
        
      case 'article':
        // Ouvrir la modale de prévisualisation pour les articles
        console.log('🔍 DEBUG: Opening article preview for:', content.title);
        setSelectedArticle(content);
        setShowArticleModal(true);
        break;
        
      default:
        console.warn('⚠️ Type non géré:', content.type);
        console.warn('⚠️ Content object:', content);
        // Plus d'alerte - juste un warning dans la console
        break;
    }
  };

  const openArticlePreview = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const closeArticleModal = () => {
    setShowArticleModal(false);
    setSelectedArticle(null);
  };

  const handleDownloadFile = (content) => {
    if (content.file_url && content.file_name) {
      const link = document.createElement('a');
      link.href = content.file_url;
      link.download = content.file_name;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement de vos contenus...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes contenus</h1>
              <p className="text-gray-600">
                Gérez et consultez tous vos contenus proposés
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau contenu
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{contents.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Brouillons</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {contents.filter(c => c.status === 'draft').length}
                    </p>
                  </div>
                  <Edit className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {contents.filter(c => c.status === 'pending_review').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approuvés</p>
                    <p className="text-2xl font-bold text-green-600">
                      {contents.filter(c => c.status === 'approved').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un contenu..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="draft">Brouillons</SelectItem>
                    <SelectItem value="pending_review">En attente</SelectItem>
                    <SelectItem value="approved">Approuvés</SelectItem>
                    <SelectItem value="rejected">Refusés</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="lien">Liens</SelectItem>
                    <SelectItem value="fichier">Fichiers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Plus récents</SelectItem>
                    <SelectItem value="created_at-asc">Plus anciens</SelectItem>
                    <SelectItem value="title-asc">Titre A-Z</SelectItem>
                    <SelectItem value="title-desc">Titre Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contents List */}
        <div className="space-y-4">
          {filteredAndSortedContents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {search || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Aucun contenu trouvé' 
                    : 'Vous n\'avez pas encore de contenu'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {search || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Commencez par proposer votre premier contenu'}
                </p>
                {!search && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Proposer un contenu
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedContents.map((content) => {
              const TypeIcon = TYPE_ICONS[content.type] || FileText;
              const StatusConfig = STATUS_CONFIG[content.status] || STATUS_CONFIG.draft;
              const StatusIcon = StatusConfig.icon;
              
              return (
                <Card key={content._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {content.title}
                            </h3>
                            {content.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {content.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={StatusConfig.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {StatusConfig.label}
                              </Badge>
                              <Badge variant="outline">
                                {TYPE_LABELS[content.type]}
                              </Badge>
                              {content.rubrique_id?.name && (
                                <Badge variant="outline">
                                  {content.rubrique_id.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {content.content && content.type === 'article' && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {content.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(content.created_at), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                          {content.updated_at && content.updated_at !== content.created_at && (
                            <div className="flex items-center gap-1">
                              <Edit className="w-4 h-4" />
                              Modifié le {format(new Date(content.updated_at), 'dd MMM yyyy', { locale: fr })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewContent(content)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {content.type === 'fichier' && content.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(content)}
                            className="text-gray-500 hover:text-green-600"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Article Preview Modal */}
      <Dialog open={showArticleModal} onOpenChange={setShowArticleModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {selectedArticle?.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeArticleModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedArticle && (
            <div className="space-y-6">
              {/* En-tête article */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={STATUS_CONFIG[selectedArticle.status]?.color}>
                    {STATUS_CONFIG[selectedArticle.status]?.icon && (
                      React.createElement(STATUS_CONFIG[selectedArticle.status].icon, { className: "w-3 h-3 mr-1" })
                    )}
                    {STATUS_CONFIG[selectedArticle.status]?.label}
                  </Badge>
                  <Badge variant="outline">
                    {TYPE_LABELS[selectedArticle.type]}
                  </Badge>
                  {selectedArticle.rubrique_id?.name && (
                    <Badge variant="outline">
                      {selectedArticle.rubrique_id.name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Auteur: {selectedArticle.author?.name || 'Inconnu'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Créé le {format(new Date(selectedArticle.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  {selectedArticle.updated_at && selectedArticle.updated_at !== selectedArticle.created_at && (
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      <span>Modifié le {format(new Date(selectedArticle.updated_at), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedArticle.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedArticle.description}
                  </p>
                </div>
              )}

              {/* Contenu complet */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contenu de l'article</h3>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedArticle.content}
                  </div>
                </div>
              </div>

              {/* Métadonnées additionnelles */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Métadonnées</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 font-mono text-xs">{selectedArticle._id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2">{selectedArticle.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span>
                    <span className="ml-2">{selectedArticle.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Auteur ID:</span>
                    <span className="ml-2 font-mono text-xs">{selectedArticle.author_id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
