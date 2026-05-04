import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { teamsAPI, rubriquesAPI, contentsAPI } from '@/services/api';
import { Link } from 'react-router-dom';
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

export default function CreateContent() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
    file_url: '',
    files: [], // Support multiple files
    content: '',
    team_ids: [], // Support multiple teams
    category_id: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      console.log('🔍 Loading data for CreateContent...');
      
      const [teamsResponse, rubriquesResponse] = await Promise.all([
        teamsAPI.getAll(),
        rubriquesAPI.getAll(),
      ]);

      if (Array.isArray(teamsResponse)) {
        const normalizedTeams = teamsResponse.map(team => ({
          ...team,
          id: team._id || team.id
        }));
        setTeams(normalizedTeams);
        console.log('✅ Teams loaded for CreateContent:', normalizedTeams.length);
      } else {
        console.log('❌ Teams API failed or returned unexpected format:', teamsResponse);
      }

      if (rubriquesResponse.success) {
        const normalizedRubriques = rubriquesResponse.data.map(rubrique => ({
          ...rubrique,
          id: rubrique._id || rubrique.id
        }));
        setCategories(normalizedRubriques);
        console.log('✅ Rubriques loaded for CreateContent:', normalizedRubriques.length);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('💥 Error loading data for CreateContent:', error);
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    // Check if rubrique teams intersect with selected teams
    if (!formData.team_ids || formData.team_ids.length === 0) return false;
    
    return c.team_ids && c.team_ids.some(rubriqueTeamId => 
      formData.team_ids.includes(rubriqueTeamId)
    );
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    
    // Store multiple files
    setSelectedFiles(files);
    
    // Update form data with files array
    setFormData({ 
      ...formData, 
      files: files,
      file_url: files[0] // Keep first file for backward compatibility
    });
    
    setFileName(files.length === 1 ? files[0].name : `${files.length} fichiers sélectionnés`);
    setUploading(false);
    
    toast.success(`${files.length} fichier(s) sélectionné(s) avec succès`);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    setFormData({ 
      ...formData, 
      files: newFiles,
      file_url: newFiles.length > 0 ? newFiles[0] : null
    });
    
    setFileName(newFiles.length === 1 ? newFiles[0].name : 
               newFiles.length === 0 ? '' : `${newFiles.length} fichiers sélectionnés`);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const stripHtml = (html) => {
    return html.replace(/<(.|\n)*?>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const handleSubmit = async (status) => {
    setSubmitting(true);
    
    try {
      let response;

      if (formData.type === 'file') {
        // Pour les fichiers, utiliser FormData
        const fd = new FormData();
        fd.append("title", formData.title);
        fd.append("description", formData.description || "");
        fd.append("type", "fichier");
        fd.append("team_ids", JSON.stringify(formData.team_ids || []));
        fd.append("rubrique_id", formData.category_id || '');
        fd.append("tags", JSON.stringify(formData.tags || []));
        fd.append("status", status === 'en_attente' ? 'pending_review' : 'draft');
        
        // Ajouter les fichiers multiples
        if (selectedFiles && selectedFiles.length > 0) {
          selectedFiles.forEach((file, index) => {
            fd.append(`files`, file); // Same field name for all files
          });
          console.log(`📁 Adding ${selectedFiles.length} files to FormData`);
        } else {
          throw new Error('Veuillez sélectionner au moins un fichier');
        }

        console.log('🔨 Creating file content with FormData');
        console.log('📦 FormData contents:');
        // Debug FormData (convert to object for logging)
        const formDataObj = {};
        for (let [key, value] of fd.entries()) {
          if (value instanceof File) {
            formDataObj[key] = `File: ${value.name} (${value.size} bytes)`;
          } else {
            formDataObj[key] = value;
          }
        }
        console.log('📦 FormData object:', formDataObj);
        
        response = await contentsAPI.createWithFile(fd);
      } else {
        // Pour les liens et articles, utiliser JSON normal
        console.log('📝=== BEFORE API CALL DEBUG ===');
        console.log('📝 formData object:', JSON.stringify(formData, null, 2));
        console.log('📝 formData.content value:', formData.content);
        console.log('📝 formData.content type:', typeof formData.content);
        console.log('📝 formData.content length:', formData.content?.length || 0);

        if (formData.type === 'article') {
          const cleanContent = stripHtml(formData.content || '');
          console.log('🧪 Clean article content:', cleanContent);

          if (!cleanContent) {
            setSubmitting(false);
            toast.error('Le contenu de l\'article est requis');
            return;
          }
        }

        const finalContent =
          formData.type === 'link'
            ? formData.url
            : (formData.content || '').trim();

        const contentData = {
          title: formData.title,
          content: finalContent,
          type: formData.type === 'link' ? 'lien' : 'article',
          team_ids: formData.team_ids || [],
          rubrique_id: formData.category_id || null,
          tags: formData.tags || [],
          status: status === 'en_attente' ? 'pending_review' : 'draft'
        };

        console.log('🔨 Creating content:', contentData);
        console.log('📝 Form data type:', formData.type);
        console.log('📝 Form data content:', formData.content);
        console.log('📝 Form data url:', formData.url);
        console.log('📝 Final content field:', contentData.content);
        console.log('📝 Full formData object:', formData);
        console.log('📝 Article content length:', formData.content?.length || 0);
        
        response = await contentsAPI.create(contentData);
      }
      
      if (response.success) {
        setSubmitting(false);
        
        if (status === 'en_attente') {
          toast.success('Contenu soumis pour validation');
        } else {
          toast.success('Brouillon enregistré');
        }
        
        // Force dashboard refresh to show new content
        if (window.refreshDashboard) {
          console.log('🔄 Triggering dashboard refresh after content creation');
          window.refreshDashboard();
        }
        
        window.location.href = createPageUrl('Dashboard');
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('💥 Error creating content:', error);
      setSubmitting(false);
      toast.error(error.message || 'Erreur lors de la création du contenu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">Proposer un contenu</h1>
          <p className="text-slate-500 mt-1">Partagez vos connaissances avec l'équipe</p>
        </div>
      </div>

      {/* Type Selection */}
      <div>
        <Label className="text-slate-700 mb-3 block">Type de contenu</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(typeConfig).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData({ ...formData, type: key })}
              className={`p-4 rounded-xl border text-left transition-all ${
                formData.type === key 
                  ? 'border-slate-800 bg-slate-50' 
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <config.icon className={`w-5 h-5 mb-2 ${formData.type === key ? 'text-slate-800' : 'text-slate-400'}`} />
              <p className="font-medium text-slate-900">{config.label}</p>
              <p className="text-sm text-slate-500 mt-0.5">{config.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700">Équipes *</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-stone-200 rounded-lg p-3">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`team-${team.id}`}
                    checked={formData.team_ids?.includes(team.id.toString()) || false}
                    onChange={(e) => {
                      const teamIds = [...(formData.team_ids || [])];
                      const teamIdString = team.id.toString();
                      if (e.target.checked) {
                        teamIds.push(teamIdString);
                      } else {
                        const index = teamIds.indexOf(teamIdString);
                        if (index > -1) {
                          teamIds.splice(index, 1);
                        }
                      }
                      setFormData({ ...formData, team_ids: teamIds, category_id: '' });
                    }}
                    className="w-4 h-4 text-primary border-stone-300 rounded focus:ring-primary"
                  />
                  <label 
                    htmlFor={`team-${team.id}`}
                    className="text-sm font-medium text-stone-700 cursor-pointer"
                  >
                    {team.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Rubrique</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              disabled={!formData.team_ids || formData.team_ids.length === 0}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner une rubrique" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Titre *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre du contenu"
            className="bg-white text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brève description"
            rows={2}
            className="bg-white"
          />
        </div>

        {/* Type-specific fields */}
        {formData.type === 'link' && (
          <div className="space-y-2">
            <Label className="text-slate-700">URL du lien *</Label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="bg-white"
            />
          </div>
        )}

        {formData.type === 'file' && (
          <div className="space-y-2">
            <Label className="text-slate-700">Fichiers *</Label>
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center bg-white">
              {selectedFiles && selectedFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileIcon className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">
                      {selectedFiles.length} fichier(s) sélectionné(s)
                    </span>
                  </div>
                  
                  {/* List of selected files */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <div className="text-sm text-slate-700 truncate">
                            <div className="font-medium">{file.name}</div>
                            <div className="text-slate-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add more files button */}
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Ajouter des fichiers</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              ) : uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-500">Upload en cours...</span>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">Cliquez pour uploader</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS, PPT... (plusieurs fichiers possibles)</p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {formData.type === 'article' && (
          <div className="space-y-2">
            <Label className="text-slate-700">Contenu *</Label>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => {
                console.log('📝 ReactQuill value:', value);
                setFormData(prev => ({
                  ...prev,
                  content: value
                }));
              }}
              className="bg-white rounded-lg"
            />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-slate-700">Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ajouter un tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="bg-white"
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Ajouter
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 text-sm bg-stone-100 text-stone-700 rounded-full flex items-center gap-1.5">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-slate-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-stone-200">
        <Button
          variant="outline"
          onClick={() => handleSubmit('brouillon')}
          disabled={submitting || !formData.title || !formData.team_ids || formData.team_ids.length === 0}
        >
          Enregistrer en brouillon
        </Button>
        <Button
          onClick={() => handleSubmit('en_attente')}
          disabled={submitting || !formData.title || !formData.team_ids || formData.team_ids.length === 0}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Soumettre pour validation
        </Button>
      </div>
    </div>
  );
}