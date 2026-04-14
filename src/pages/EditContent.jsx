import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { teamsAPI, rubriquesAPI, contentsAPI } from '@/services/api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Link as LinkIcon, FileText, File as FileIcon, Upload, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'sonner';

const typeConfig = {
  link: { icon: LinkIcon, label: 'Lien', description: 'Partager un lien externe' },
  file: { icon: FileIcon, label: 'Fichier', description: 'Uploader un document' },
  article: { icon: FileText, label: 'Article', description: 'Rédiger un article' },
};

export default function EditContent() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
    file_url: '',
    files: [], // Support multiple files
    content: '',
    team_ids: [], // Support multiple teams
    rubrique_id: '',
    tags: [],
    status: '', // Add status to preserve existing status
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (id) {
      loadContent();
    }
    loadTeams();
    loadCategories();
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      console.log('🔄=== LOAD CONTENT FOR EDIT ===');
      console.log('🔄 Content ID:', id);
      
      const content = await contentsAPI.getById(id);
      console.log('🔄 Content loaded:', content);
      
      if (content) {
        setFormData({
          title: content.title || '',
          description: content.description || '',
          type: content.type || 'link',
          url: content.type === 'lien' ? content.content || '' : '',
          file_url: content.file_url || '',
          files: content.files || [],
          content: content.type === 'article' ? content.content : '',
          team_ids: content.team_ids?.map(team => team._id || team) || [],
          rubrique_id: content.rubrique_id?._id || content.rubrique_id || '',
          tags: content.tags || [],
          status: content.status || 'draft', // Preserve existing status
        });
        
        // Set selected files for display
        if (content.files && content.files.length > 0) {
          setSelectedFiles(content.files);
          setFileName(`${content.files.length} fichier(s) sélectionné(s)`);
        } else if (content.file_url) {
          setSelectedFiles([{
            name: content.file_name || 'Fichier',
            url: content.file_url
          }]);
          setFileName(content.file_name || 'Fichier');
        }
        
        setIsEditing(true);
      }
    } catch (error) {
      console.error('🔄 Error loading content:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      const teamsData = response.data || response;
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Erreur lors du chargement des équipes');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await rubriquesAPI.getAll();
      const categoriesData = response.data || response;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erreur lors du chargement des rubriques');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setFileName(`${files.length} fichier(s) sélectionné(s)`);
    
    // Store files directly for FormData
    setSelectedFiles(files);
    setFormData(prev => ({ ...prev, files }));
    setUploading(false);
    toast.success(`${files.length} fichier(s) sélectionné(s) avec succès`);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFormData(prev => ({ ...prev, files: newFiles }));
    setFileName(newFiles.length > 0 ? `${newFiles.length} fichier(s) sélectionné(s)` : '');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.rubrique_id) {
      toast.error('Le titre et la rubrique sont requis');
      return;
    }

    // Validation spécifique selon le type
    if (formData.type === 'lien' && !formData.url.trim()) {
      toast.error('L\'URL est requise pour les liens');
      return;
    }

    if (formData.type === 'article' && !formData.content.trim()) {
      toast.error('Le contenu est requis pour les articles');
      return;
    }

    if (formData.type === 'fichier' && selectedFiles.length === 0) {
      toast.error('Au moins un fichier est requis');
      return;
    }

    try {
      setSubmitting(true);
      console.log('=== UPDATE CONTENT SUBMIT ===');
      console.log('Form data:', formData);
      console.log('Existing status being preserved:', formData.status);

      let response;
      
      if (formData.type === 'fichier') {
        // Create FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('rubrique_id', formData.rubrique_id);
        formDataToSend.append('tags', JSON.stringify(formData.tags));
        formDataToSend.append('team_ids', JSON.stringify(formData.team_ids));
        // IMPORTANT: Preserve existing status, don't force to 'draft'
        formDataToSend.append('status', formData.status || 'draft');
        
        console.log('UPDATE PAYLOAD (FILES):', {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          rubrique_id: formData.rubrique_id,
          tags: formData.tags,
          team_ids: formData.team_ids,
          status: formData.status || 'draft'
        });
        
        // Append all files
        selectedFiles.forEach((file, index) => {
          formDataToSend.append('files', file);
        });
        
        response = await contentsAPI.updateWithFile(id, formDataToSend);
      } else {
        // Regular form data for links and articles
        const contentData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          rubrique_id: formData.rubrique_id,
          tags: formData.tags,
          team_ids: formData.team_ids,
          // IMPORTANT: Preserve existing status, don't force to 'draft'
          status: formData.status || 'draft'
        };

        if (formData.type === 'lien') {
          contentData.content = formData.url;
        } else if (formData.type === 'article') {
          contentData.content = formData.content;
        }

        console.log('UPDATE PAYLOAD (REGULAR):', contentData);

        response = await contentsAPI.update(id, contentData);
      }

      console.log('UPDATED CONTENT RESPONSE:', response.data);

      if (response.success) {
        toast.success('Contenu mis à jour avec succès');
        navigate(`/rubriques/${formData.rubrique_id}`);
      } else {
        toast.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('🔄 Error updating content:', error);
      toast.error('Erreur lors de la mise à jour du contenu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement du contenu...</div>
        </div>
      </div>
    );
  }

  const TypeIcon = typeConfig[formData.type]?.icon || FileText;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/rubriques/${formData.rubrique_id}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la rubrique
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Modifier le contenu</h1>
          <p className="mt-2 text-gray-600">
            Modifiez les informations de votre contenu
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Titre du contenu"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rubrique_id">Rubrique *</Label>
                <Select value={formData.rubrique_id} onValueChange={(value) => handleInputChange('rubrique_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une rubrique" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description du contenu"
                rows={3}
              />
            </div>

            {/* Content Type Selection */}
            <div>
              <Label>Type de contenu *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {Object.entries(typeConfig).map(([type, config]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('type', type)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.type === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <config.icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">{config.label}</div>
                        <div className="text-sm text-gray-500">{config.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Type-specific content */}
            {formData.type === 'lien' && (
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://exemple.com"
                  required
                />
              </div>
            )}

            {formData.type === 'fichier' && (
              <div>
                <Label>Fichiers</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      />
                    </label>
                  </div>
                  {fileName && (
                    <div className="mt-2 text-sm text-gray-600">
                      Fichiers sélectionnés: {fileName}
                    </div>
                  )}
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700 truncate">
                            {file.name || `Fichier ${index + 1}`}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.type === 'article' && (
              <div>
                <Label htmlFor="content">Contenu de l'article *</Label>
                <div className="mt-2">
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => handleInputChange('content', value)}
                    placeholder="Rédigez votre article ici..."
                    theme="snow"
                    style={{ height: '200px' }}
                  />
                </div>
              </div>
            )}

            {/* Teams and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Équipes</Label>
                <Select 
                  value={formData.team_ids} 
                  onValueChange={(value) => handleInputChange('team_ids', value)}
                  multiple
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner des équipes" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex mt-2">
                  <Input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="ml-2"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                to={`/rubriques/${formData.rubrique_id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    Mettre à jour le contenu
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
