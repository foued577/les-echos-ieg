import React from 'react';
import { Calendar, User } from 'lucide-react';
import { APP_NAME, APP_NAME_FULL } from '../constants/app';

const GazetteViewer = ({ gazette, showHeader = true, showFooter = true, className = "" }) => {
  // Helper function for font mapping
  const fontClassMap = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    elegant: "font-serif italic"
  };

  // Get typography with defaults
  const typography = gazette.typography || {
    titleFont: "serif",
    bodyFont: "sans",
    titleSize: "text-4xl",
    bodySize: "text-base",
    titleWeight: "font-bold",
    bodyWeight: "font-normal",
    titleItalic: false,
    bodyItalic: false
  };

  // Helper function to apply typography classes
  const getTypographyClasses = (type, additionalClasses = "") => {
    if (type === 'title') {
      const fontClass = fontClassMap[typography.titleFont] || "font-serif";
      const italicClass = typography.titleItalic ? "italic" : "";
      return `${fontClass} ${typography.titleSize} ${typography.titleWeight} ${italicClass} ${additionalClasses}`;
    } else if (type === 'body') {
      const fontClass = fontClassMap[typography.bodyFont] || "font-sans";
      const italicClass = typography.bodyItalic ? "italic" : "";
      return `${fontClass} ${typography.bodySize} ${typography.bodyWeight} ${italicClass} ${additionalClasses}`;
    }
    return additionalClasses;
  };
  // Render individual block based on type
  const renderBlock = (block, index) => {
    const blockType = block.type || 'text';
    const blockContent = block.content || block.description || '';
    
    switch (blockType) {
      case 'title':
        return (
          <h1 key={index} className={getTypographyClasses('title', 'text-gray-900 text-center mb-8 leading-tight')}>
            {blockContent}
          </h1>
        );
      
      case 'subtitle':
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-serif text-gray-800 text-center mb-6 leading-tight">
            {blockContent}
          </h2>
        );
      
      case 'heading':
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-serif text-gray-900 mb-6 leading-tight">
            {blockContent}
          </h2>
        );
      
      case 'subheading':
        return (
          <h3 key={index} className="text-xl md:text-2xl font-serif text-gray-800 mb-4 leading-tight">
            {blockContent}
          </h3>
        );
      
      case 'paragraph':
        return (
          <p key={index} className={getTypographyClasses('body', 'text-gray-700 leading-relaxed mb-6')}>
            {blockContent}
          </p>
        );
      
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-blue-600 pl-6 py-4 my-8 bg-gray-50 italic text-xl text-gray-700 font-serif">
            "{blockContent}"
          </blockquote>
        );
      
      case 'image':
        if (blockContent.startsWith('http')) {
          return (
            <div key={index} className="my-8">
              <img 
                src={blockContent} 
                alt={block.title || 'Image'} 
                className="w-full rounded-lg shadow-lg"
              />
              {block.title && (
                <p className="text-center text-sm text-gray-600 mt-2 italic">{block.title}</p>
              )}
            </div>
          );
        }
        return null;
      
      case 'url':
        if (blockContent.startsWith('http')) {
          return (
            <div key={index} className="my-6">
              <a 
                href={blockContent} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-lg"
              >
                {block.title || blockContent}
              </a>
            </div>
          );
        }
        return null;
      
      case 'separator':
        return (
          <hr key={index} className="border-gray-300 my-8" />
        );
      
      case 'text':
      default:
        return (
          <div key={index} className="prose prose-lg max-w-none mb-6">
            <div 
              dangerouslySetInnerHTML={{ __html: blockContent }}
              className="text-gray-700 leading-relaxed"
            />
          </div>
        );
    }
  };

  // Parse content sections - try multiple formats
  const blocks = [];
  
  // Try blocks first (new format)
  if (Array.isArray(gazette?.blocks) && gazette.blocks.length > 0) {
    gazette.blocks.forEach((block, index) => {
      blocks.push({
        id: index + 1,
        type: block.type || 'text',
        content: block.content || block.description || '',
        title: block.title || ''
      });
    });
  }
  // Try HTML content with sections (old format)
  else if (gazette?.content && typeof gazette.content === 'string') {
    const sectionMatches = gazette.content.match(/<section[^>]*>([\s\S]*?)<\/section>/g);
    if (sectionMatches) {
      sectionMatches.forEach((section, index) => {
        const titleMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
        const contentMatch = section.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        
        blocks.push({
          id: index + 1,
          type: 'text',
          content: contentMatch ? contentMatch[1] : section.replace(/<[^>]*>/g, ''),
          title: titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : ''
        });
      });
    } else {
      // If no sections found, treat entire content as one block
      blocks.push({
        id: 1,
        type: 'text',
        content: gazette.content,
        title: ''
      });
    }
  }
  // Fallback to empty
  else {
    blocks.push({
      id: 1,
      type: 'text',
      content: 'Aucun contenu disponible pour cette gazette.',
      title: ''
    });
  }

  // Format date helper
  const formatDate = (dateFields) => {
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
  };

  const dateFields = [
    gazette.publication_date,
    gazette.created_at,
    gazette.createdAt,
    gazette.updated_at,
    gazette.updatedAt
  ];

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Article Header */}
      <article className="bg-white rounded-none shadow-sm">
        {/* Header with meta informations */}
        {showHeader && (
          <>
            {/* Meta informations */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(dateFields)}</span>
                </div>
                {gazette.author && (
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{gazette.author}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Title */}
            <header className="text-center mb-12">
              <h1 className={getTypographyClasses('title', 'text-gray-900 leading-tight mb-6 md:text-5xl lg:text-6xl')}>
                {gazette.title}
              </h1>
              {gazette.description && (
                <p className={getTypographyClasses('body', 'text-gray-600 leading-relaxed max-w-3xl mx-auto text-xl md:text-2xl')}>
                  {gazette.description}
                </p>
              )}
            </header>
          </>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {blocks.map((block, index) => renderBlock(block, index))}
        </div>
      </article>

      {/* Footer */}
      {showFooter && (
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">
            <p>
              Gazette publiée le {formatDate(dateFields)}
            </p>
            <p className="mt-2"> {APP_NAME_FULL}</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default GazetteViewer;
