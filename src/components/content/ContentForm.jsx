import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getFileUrl } from '../../utils';
import { teamsAPI, rubriquesAPI } from '@/services/api';
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
import { Link, FileText, File, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactQuill from 'react-quill';

const typeConfig = {
  link: { icon: Link, label: 'Lien', description: 'Partager un lien externe', gradient: 'from-blue-500 to-cyan-500' },
  file: { icon: File, label: 'Fichier', description: 'Uploader un document', gradient: 'from-purple-500 to-pink-500' },
  article: { icon: FileText, label: 'Article', description: 'Rédiger un article', gradient: 'from-emerald-500 to-teal-500' },
};

export default function ContentForm({ teams, categories, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
    file_url: '',
    article_content: '',
    team_id: '',
    category_id: '',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const filteredCategories = categories.filter(c => c.team_id === formData.team_id);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);
    
    const { file_url } = await contentsAPI.createWithFile({ file });
    setFormData({ ...formData, file_url });
    setUploading(false);
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

  const handleSubmit = (status) => {
    onSubmit({ ...formData, status });
  };

  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <div className="glass-card rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Type de contenu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(typeConfig).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData({ ...formData, type: key })}
              className={`relative p-5 rounded-xl border-2 transition-all text-left overflow-hidden ${
                formData.type === key 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              {formData.type === key && (
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <config.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-white">{config.label}</p>
              <p className="text-sm text-slate-400 mt-1">{config.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">Informations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Équipe *</Label>
            <Select 
              value={formData.team_id} 
              onValueChange={(value) => setFormData({ ...formData, team_id: value, category_id: '' })}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sélectionner une équipe" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} className="text-slate-300 focus:bg-white/5 focus:text-white">
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Rubrique</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              disabled={!formData.team_id}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white disabled:opacity-50">
                <SelectValue placeholder="Sélectionner une rubrique" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-slate-300 focus:bg-white/5 focus:text-white">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Titre *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre du contenu"
            maxLength={200}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brève description du contenu"
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Type-specific fields */}
        {formData.type === 'link' && (
          <div className="space-y-2">
            <Label className="text-slate-300">URL du lien *</Label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
        )}

        {formData.type === 'file' && (
          <div className="space-y-2">
            <Label className="text-slate-300">Fichier *</Label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
              {formData.file_url ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <File className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{fileName}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => {
                      setFormData({ ...formData, file_url: '' });
                      setFileName('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : uploading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  <span className="text-sm text-slate-400">Upload en cours...</span>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-white font-medium">Cliquez pour uploader</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOC, XLS, PPT...</p>
                  <input
                    type="file"
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
            <Label className="text-slate-300">Contenu de l'article *</Label>
            <div className="[&_.ql-toolbar]:bg-white/5 [&_.ql-toolbar]:border-white/10 [&_.ql-container]:bg-white/5 [&_.ql-container]:border-white/10 [&_.ql-editor]:text-white [&_.ql-editor]:min-h-[200px]">
              <ReactQuill
                theme="snow"
                value={formData.article_content}
                onChange={(content) => setFormData({ ...formData, article_content: content })}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-slate-300">Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ajouter un tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            <Button type="button" variant="outline" onClick={addTag} className="border-white/10 text-white hover:bg-white/5">
              Ajouter
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-2">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleSubmit('brouillon')}
          disabled={isLoading || !formData.title || !formData.team_id}
          className="border-white/10 text-white hover:bg-white/5"
        >
          Enregistrer en brouillon
        </Button>
        <Button
          onClick={() => handleSubmit('en_attente')}
          disabled={isLoading || !formData.title || !formData.team_id}
          className="gradient-btn border-0 text-white"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Soumettre pour validation
        </Button>
      </div>
    </div>
  );
}