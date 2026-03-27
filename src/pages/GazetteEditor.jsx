import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Image,
  Video,
  Link as LinkIcon,
  Layout,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Minus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { gazettesAPI } from '../services/api';
import PreviewGazette from '../components/PreviewGazette';

// Block types
const BLOCK_TYPES = {
  TITLE: 'title',
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  LINK: 'link',
  SECTION: 'section',
  QUOTE: 'quote',
  SEPARATOR: 'separator'
};

// Block components
const BlockRenderer = ({ block, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content || '');

  const saveContent = () => {
    onUpdate(block.id, { ...block, content });
    setIsEditing(false);
  };

  // Render content directly, not as a separate function
  switch (block.type) {
    case BLOCK_TYPES.TITLE:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="relative">
            {isEditing ? (
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={saveContent}
                onKeyPress={(e) => e.key === 'Enter' && saveContent()}
                className="text-3xl font-serif text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                placeholder="Titre de la section"
                autoFocus
              />
            ) : (
              <h2 
                onClick={() => setIsEditing(true)}
                className="text-3xl font-serif text-gray-900 cursor-text hover:bg-gray-50 px-2 py-1 rounded"
              >
                {content || 'Cliquez pour ajouter un titre'}
              </h2>
            )}
          </div>
        </div>
      );

    case BLOCK_TYPES.TEXT:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="relative">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={saveContent}
                className="w-full text-gray-700 bg-transparent border border-blue-500 rounded-lg p-3 focus:outline-none resize-none"
                rows={4}
                placeholder="Ajoutez votre texte ici..."
                autoFocus
              />
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="text-gray-700 cursor-text hover:bg-gray-50 p-3 rounded-lg min-h-[100px]"
              >
                {content || 'Cliquez pour ajouter du texte...'}
              </div>
            )}
          </div>
        </div>
      );

    case BLOCK_TYPES.IMAGE:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {content ? (
              // Image preview
              <div className="relative">
                <img 
                  src={content} 
                  alt="Image uploadée"
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
                />
                <button
                  onClick={() => {
                    setContent('');
                    onUpdate(block.id, { ...block, content: '', file: null });
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Upload zone
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    console.log('🖼️ DEBUG: Image file selected:', file);
                    
                    // Create preview URL
                    const imageUrl = URL.createObjectURL(file);
                    console.log('🖼️ DEBUG: Image preview URL:', imageUrl);

                    // Update block with image data
                    setContent(imageUrl);
                    onUpdate(block.id, { ...block, content: imageUrl, file });
                  }}
                  className="hidden"
                  id={`image-upload-${block.id}`}
                />
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Zone pour image</p>
                <button 
                  onClick={() => {
                    console.log('🖼️ DEBUG: Clicking image upload button for block:', block.id);
                    document.getElementById(`image-upload-${block.id}`)?.click();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Ajouter une image
                </button>
              </div>
            )}
          </div>
        </div>
      );

    case BLOCK_TYPES.VIDEO:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {content ? (
              // Video preview
              <div className="relative">
                <video 
                  src={content} 
                  controls
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
                <button
                  onClick={() => {
                    setContent('');
                    onUpdate(block.id, { ...block, content: '', file: null });
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Upload zone
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    console.log('🎥 DEBUG: Video file selected:', file);
                    
                    // Create preview URL
                    const videoUrl = URL.createObjectURL(file);
                    console.log('🎥 DEBUG: Video preview URL:', videoUrl);

                    // Update block with video data
                    setContent(videoUrl);
                    onUpdate(block.id, { ...block, content: videoUrl, file });
                  }}
                  className="hidden"
                  id={`video-upload-${block.id}`}
                />
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Zone pour vidéo</p>
                <button 
                  onClick={() => {
                    console.log('🎥 DEBUG: Clicking video upload button for block:', block.id);
                    document.getElementById(`video-upload-${block.id}`)?.click();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Ajouter une vidéo
                </button>
              </div>
            )}
          </div>
        </div>
      );

    case BLOCK_TYPES.LINK:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Zone pour lien</p>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Plus className="w-4 h-4 mr-2 inline" />
              Ajouter un lien
            </button>
          </div>
        </div>
      );

    case BLOCK_TYPES.SECTION:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">SECTION</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={saveContent}
                onKeyPress={(e) => e.key === 'Enter' && saveContent()}
                className="w-full text-lg font-semibold text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none"
                placeholder="Titre de la section"
                autoFocus
              />
            ) : (
              <h3 
                onClick={() => setIsEditing(true)}
                className="text-lg font-semibold text-gray-900 cursor-text"
              >
                {content || 'Cliquez pour ajouter un titre de section'}
              </h3>
            )}
          </div>
        </div>
      );

    case BLOCK_TYPES.QUOTE:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="border-l-4 border-gray-300 pl-6 italic">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={saveContent}
                className="w-full text-gray-700 bg-transparent border border-gray-300 rounded p-3 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Ajoutez une citation..."
                autoFocus
              />
            ) : (
              <blockquote 
                onClick={() => setIsEditing(true)}
                className="text-gray-700 cursor-text hover:bg-gray-50 p-3 rounded"
              >
                "{content || 'Cliquez pour ajouter une citation...'}"
              </blockquote>
            )}
          </div>
        </div>
      );

    case BLOCK_TYPES.SEPARATOR:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="border-t border-gray-300 my-8">
            <div className="text-center text-sm text-gray-500 mt-2">Séparateur</div>
          </div>
        </div>
      );

    default:
      return (
        <div className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Block Controls */}
          <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
            <button
              onClick={() => onMoveUp(block.id)}
              disabled={isFirst}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onMoveDown(block.id)}
              disabled={isLast}
              className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(block.id)}
              className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Block Content */}
          <div className="text-center text-gray-500">
            <p>Type de bloc inconnu: {block.type}</p>
          </div>
        </div>
      );
  }
};

// Block Type Selector
const BlockTypeSelector = ({ onAddBlock }) => {
  const blockTypes = [
    { type: BLOCK_TYPES.TITLE, icon: Heading1, label: 'Titre', color: 'text-blue-600' },
    { type: BLOCK_TYPES.TEXT, icon: FileText, label: 'Texte', color: 'text-gray-600' },
    { type: BLOCK_TYPES.IMAGE, icon: Image, label: 'Image', color: 'text-green-600' },
    { type: BLOCK_TYPES.VIDEO, icon: Video, label: 'Vidéo', color: 'text-purple-600' },
    { type: BLOCK_TYPES.LINK, icon: LinkIcon, label: 'Lien', color: 'text-orange-600' },
    { type: BLOCK_TYPES.SECTION, icon: Layout, label: 'Section', color: 'text-indigo-600' },
    { type: BLOCK_TYPES.QUOTE, icon: Quote, label: 'Citation', color: 'text-pink-600' },
    { type: BLOCK_TYPES.SEPARATOR, icon: Minus, label: 'Séparateur', color: 'text-gray-400' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      {blockTypes.map(({ type, icon: Icon, label, color }) => (
        <button
          key={type}
          onClick={() => {
            console.log('🔥 DEBUG: Clicked block type:', type);
            onAddBlock(type);
          }}
          className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
        >
          <Icon className={`w-6 h-6 ${color}`} />
          <span className="text-xs text-gray-600">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default function GazetteEditor() {
  const navigate = useNavigate();
  const [gazette, setGazette] = useState({
    title: '',
    description: '',
    status: 'draft',
    blocks: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Load gazette data if editing
    const urlParams = new URLSearchParams(window.location.search);
    const gazetteId = urlParams.get('id');
    
    if (gazetteId) {
      // Load existing gazette
      console.log('Loading gazette:', gazetteId);
    }
  }, []);

  const addBlock = (type) => {
    console.log('🔥 DEBUG: Adding block of type:', type);
    console.log('🔥 DEBUG: Current blocks:', gazette.blocks);
    
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      order: gazette.blocks.length
    };
    
    console.log('🔥 DEBUG: New block created:', newBlock);
    
    setGazette(prev => {
      const updated = {
        ...prev,
        blocks: [...prev.blocks, newBlock]
      };
      console.log('🔥 DEBUG: Updated gazette state:', updated);
      return updated;
    });
  };

  const updateBlock = (blockId, updatedBlock) => {
    setGazette(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId ? updatedBlock : block
      )
    }));
  };

  const removeBlock = (blockId) => {
    setGazette(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  };

  const moveBlock = (blockId, direction) => {
    setGazette(prev => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex(block => block.id === blockId);
      
      if (direction === 'up' && index > 0) {
        [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
      } else if (direction === 'down' && index < blocks.length - 1) {
        [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
      }
      
      return { ...prev, blocks };
    });
  };

  const saveGazette = async () => {
    setSaving(true);
    try {
      console.log('🗞️ DEBUG: Saving gazette with payload:', gazette);
      
      // Validation basique
      if (!gazette.title.trim()) {
        alert('Le titre est requis');
        setSaving(false);
        return;
      }

      // Préparer le payload pour l'API
      const payload = {
        title: gazette.title.trim(),
        description: gazette.description.trim(),
        status: gazette.status,
        blocks: gazette.blocks
      };

      console.log('📤 DEBUG: Sending payload to API:', payload);

      // Appeler l'API de création
      const response = await gazettesAPI.create(payload);
      
      console.log('✅ DEBUG: Gazette saved successfully:', response);
      console.log('📋 DEBUG: Response data:', response.data);

      setSaving(false);
      
      // Rediriger vers la liste des gazettes
      navigate('/gazette');
      
    } catch (error) {
      console.error('❌ ERROR: Failed to save gazette:', error);
      console.error('❌ ERROR Details:', error.response?.data || error.message);
      
      setSaving(false);
      
      // Afficher un message d'erreur clair
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const previewGazette = () => {
    console.log('🔍 DEBUG: Opening preview for gazette:', gazette);
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Gazette')}>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-serif text-gray-900">
                  {gazette.title || 'Nouvelle Gazette'}
                </h1>
                <p className="text-sm text-gray-600">
                  {gazette.description || 'Créez votre magazine éditorial'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={previewGazette}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
              <button 
                onClick={saveGazette}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            {/* Gazette Info */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la Gazette
                  </label>
                  <input
                    type="text"
                    value={gazette.title}
                    onChange={(e) => setGazette(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Donnez un titre à votre gazette..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={gazette.description}
                    onChange={(e) => setGazette(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Décrivez votre gazette..."
                  />
                </div>
              </div>
            </section>

            {/* Blocks Editor */}
            <section className="space-y-4">
              {gazette.blocks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Commencez à créer votre gazette
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez des blocs de contenu pour construire votre magazine
                  </p>
                </div>
              ) : (
                gazette.blocks.map((block, index) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    onUpdate={updateBlock}
                    onRemove={removeBlock}
                    onMoveUp={() => moveBlock(block.id, 'up')}
                    onMoveDown={() => moveBlock(block.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === gazette.blocks.length - 1}
                  />
                ))
              )}
            </section>

            {/* Add Block Section */}
            <section className="mt-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Ajouter un bloc</h3>
                </div>
                <BlockTypeSelector onAddBlock={addBlock} />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Structure</h3>
              <div className="space-y-2">
                {gazette.blocks.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun bloc ajouté</p>
                ) : (
                  gazette.blocks.map((block, index) => (
                    <div key={block.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-400">{index + 1}.</span>
                      <span className="text-gray-700 capitalize">{block.type}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>Statut: <span className="font-medium">{gazette.status === 'draft' ? 'Brouillon' : 'Publié'}</span></p>
                  <p>Blocs: <span className="font-medium">{gazette.blocks.length}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewGazette
          title={gazette.title}
          description={gazette.description}
          blocks={gazette.blocks}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
