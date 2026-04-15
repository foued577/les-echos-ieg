import React, { useState } from 'react';
import { X, Download, Share2, Check, AlertCircle } from 'lucide-react';
import GazetteViewer from './GazetteViewer';
import { APP_NAME } from '../constants/app';

const PreviewGazette = ({ title, description, blocks, onClose }) => {
  const [shareStatus, setShareStatus] = useState('idle'); // idle, copying, success, error
  const [exportStatus, setExportStatus] = useState('idle'); // idle, exporting, success, error

  // Create gazette object for GazetteViewer
  const gazetteData = {
    title,
    description,
    blocks,
    publication_date: new Date().toISOString(),
    author: APP_NAME
  };

  const handleExportPDF = async () => {
    console.log('📄 DEBUG: Starting PDF export for gazette:', { title, blocksCount: blocks.length });
    
    try {
      setExportStatus('exporting');
      
      // Check if gazette has content
      if (!title && blocks.length === 0) {
        console.log('📄 DEBUG: Gazette is empty, showing message');
        setExportStatus('error');
        setTimeout(() => setExportStatus('idle'), 3000);
        return;
      }

      // Generate HTML content for gazette
      const gazetteContent = `
        <header class="gazette-header">
          <h1>${title || 'Gazette sans titre'}</h1>
          <div class="gazette-meta">
            <p>Publié le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>La Gazette d'Occitanie</p>
          </div>
          ${description ? `<div class="gazette-description"><p>${description}</p></div>` : ''}
        </header>
        <main class="gazette-content">
          ${blocks.map(block => {
            switch (block.type) {
              case 'title':
                return `<h1 class="gazette-title">${block.content || 'Titre'}</h1>`;
              case 'text':
                return block.content ? 
                  `<div class="gazette-text">${block.content.replace(/\n/g, '<br>')}</div>` : 
                  `<div class="gazette-empty">Texte à ajouter...</div>`;
              case 'image':
                return block.content ? 
                  `<div class="gazette-image"><img src="${block.content}" alt="Image" /></div>` : 
                  `<div class="gazette-empty">Image à ajouter</div>`;
              case 'video':
                return block.content ? 
                  `<div class="gazette-video-placeholder">🎥 Vidéo disponible: <em>${block.content}</em></div>` : 
                  `<div class="gazette-empty">🎥 Vidéo à ajouter</div>`;
              case 'link':
                return block.content ? 
                  `<div class="gazette-link">🔗 ${block.content}</div>` : 
                  `<div class="gazette-empty">🔗 Lien à ajouter</div>`;
              case 'section':
                return `<div class="gazette-section">
                  <h2>${block.content || 'Section'}</h2>
                </div>`;
              case 'quote':
                return block.content ? 
                  `<div class="gazette-quote">"${block.content}"</div>` : 
                  `<div class="gazette-empty">"Citation à ajouter..."</div>`;
              case 'separator':
                return `<div class="gazette-separator">• • •</div>`;
              default:
                return `<div class="gazette-error">Type de bloc non reconnu: ${block.type}</div>`;
            }
          }).join('')}
        </main>
      `;

      // Create print-friendly HTML document
      const printHTML = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title || 'Gazette'} - ${APP_NAME}</title>
          <style>
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.6;
              color: #1a1a1a;
              background: #fff;
              max-width: 100%;
            }
            
            /* Print-specific styles */
            @media print {
              body {
                font-size: 12pt;
                line-height: 1.5;
                color: #000;
                background: #fff;
              }
              
              @page {
                margin: 2cm;
                size: A4;
              }
              
              /* Avoid page breaks inside important elements */
              h1, h2, .gazette-section {
                page-break-after: avoid;
                page-break-inside: avoid;
              }
              
              .gazette-image {
                page-break-inside: avoid;
                max-width: 100% !important;
              }
              
              /* Ensure proper spacing */
              .gazette-title {
                page-break-after: 20pt;
              }
              
              .gazette-separator {
                page-break-inside: avoid;
              }
            }
            
            /* Screen styles for print preview */
            @media screen {
              body {
                padding: 40px;
                background: #f5f5f5;
              }
              
              .print-container {
                background: #fff;
                padding: 60px;
                max-width: 800px;
                margin: 0 auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-radius: 4px;
              }
            }
            
            /* Typography */
            .gazette-title {
              font-size: 28pt;
              font-weight: 700;
              margin-bottom: 24pt;
              color: #000;
              text-align: center;
              line-height: 1.2;
            }
            
            .gazette-section h2 {
              font-size: 20pt;
              font-weight: 600;
              margin-bottom: 16pt;
              color: #000;
              border-left: 4pt solid #2563eb;
              padding-left: 16pt;
            }
            
            .gazette-text {
              font-size: 12pt;
              margin-bottom: 12pt;
              text-align: justify;
            }
            
            .gazette-description {
              font-size: 14pt;
              font-style: italic;
              color: #666;
              margin-bottom: 24pt;
              text-align: center;
            }
            
            /* Meta information */
            .gazette-header {
              text-align: center;
              margin-bottom: 48pt;
              border-bottom: 1pt solid #ccc;
              padding-bottom: 24pt;
            }
            
            .gazette-meta {
              font-size: 10pt;
              color: #666;
              margin-top: 12pt;
            }
            
            .gazette-meta p {
              margin-bottom: 4pt;
            }
            
            /* Content blocks */
            .gazette-content {
              max-width: 100%;
            }
            
            .gazette-image {
              margin: 24pt 0;
              text-align: center;
            }
            
            .gazette-image img {
              max-width: 100%;
              height: auto;
              border-radius: 4pt;
              box-shadow: 0 2pt 8pt rgba(0,0,0,0.1);
            }
            
            .gazette-video-placeholder {
              border: 1pt dashed #ccc;
              padding: 20pt;
              text-align: center;
              color: #666;
              margin: 16pt 0;
              font-style: italic;
              background: #f9f9f9;
            }
            
            .gazette-link {
              margin: 12pt 0;
              padding: 8pt 12pt;
              background: #f0f7ff;
              border-left: 3pt solid #2563eb;
              font-family: monospace;
              font-size: 10pt;
              word-break: break-all;
            }
            
            .gazette-quote {
              border-left: 3pt solid #ccc;
              padding-left: 20pt;
              margin: 20pt 0;
              font-style: italic;
              font-size: 13pt;
              color: #444;
            }
            
            .gazette-separator {
              text-align: center;
              margin: 32pt 0;
              color: #999;
              font-size: 10pt;
              letter-spacing: 4pt;
            }
            
            .gazette-separator::before {
              content: "• • •";
            }
            
            /* Empty states */
            .gazette-empty {
              color: #999;
              font-style: italic;
              padding: 12pt;
              background: #f9f9f9;
              border: 1pt dashed #ddd;
              margin: 12pt 0;
              text-align: center;
            }
            
            .gazette-error {
              color: #d63384;
              padding: 12pt;
              background: #f8d7da;
              border: 1pt solid #f5c6cb;
              margin: 12pt 0;
              text-align: center;
              font-size: 10pt;
            }
            
            /* Section styling */
            .gazette-section {
              margin: 24pt 0;
              padding: 16pt 0;
            }
            
            /* Footer */
            .print-footer {
              margin-top: 48pt;
              padding-top: 24pt;
              border-top: 1pt solid #ccc;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${gazetteContent}
            <div class="print-footer">
              <p>Généré par ${APP_NAME} - ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les popups.');
      }

      // Write content to new window
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setExportStatus('success');
          setTimeout(() => setExportStatus('idle'), 2000);
        }, 500);
      };

    } catch (error) {
      console.error('📄 ERROR: PDF export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
      
      // Show user-friendly error message
      if (error.message.includes('popup')) {
        alert('Veuillez autoriser les popups pour exporter la gazette en PDF.');
      } else {
        alert('Erreur lors de l\'export PDF: ' + error.message);
      }
    }
  };

  const handleShare = async () => {
    console.log('🔗 DEBUG: Starting share for gazette:', { title, blocksCount: blocks.length });
    
    try {
      setShareStatus('copying');
      
      // Check if gazette has content
      if (!title && blocks.length === 0) {
        console.log('🔗 DEBUG: Gazette is empty, showing message');
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 3000);
        return;
      }

      // Create share URL (current page URL for now, could be updated to actual gazette URL)
      const shareUrl = window.location.href;
      const shareTitle = title || `Gazette ${APP_NAME}`;
      const shareText = description || `Découvrez ma gazette "${shareTitle}" sur ${APP_NAME}`;

      // Try native share API first
      if (navigator.share) {
        console.log('🔗 DEBUG: Using native share API');
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          setShareStatus('success');
          setTimeout(() => setShareStatus('idle'), 2000);
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            throw shareError;
          }
          setShareStatus('idle');
        }
      } else {
        // Fallback to clipboard
        console.log('🔗 DEBUG: Using clipboard fallback');
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 2000);
      }

    } catch (error) {
      console.error('🔗 ERROR: Share failed:', error);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  const hasContent = blocks.length > 0 || title || description;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 text-blue-600">👁️</div>
            <h2 className="text-xl font-serif text-gray-900">Aperçu de la Gazette</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Using GazetteViewer component */}
        <div className="flex-1 overflow-y-auto">
          {hasContent ? (
            <div className="p-8">
              <GazetteViewer 
                gazette={gazetteData} 
                showHeader={true} 
                showFooter={false}
                className=""
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📰</span>
                </div>
                <h3 className="text-2xl font-serif text-gray-900 mb-4">
                  Aucun contenu à prévisualiser
                </h3>
                <p className="text-gray-600 max-w-md">
                  Votre gazette ne contient encore aucun contenu. Ajoutez des blocs pour voir l'aperçu.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {blocks.length} bloc{blocks.length > 1 ? 's' : ''}
            {shareStatus === 'success' && (
              <span className="ml-4 text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Lien copié
              </span>
            )}
            {exportStatus === 'success' && (
              <span className="ml-4 text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Exporté
              </span>
            )}
            {shareStatus === 'error' && (
              <span className="ml-4 text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Erreur partage
              </span>
            )}
            {exportStatus === 'error' && (
              <span className="ml-4 text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Erreur export
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportPDF}
              disabled={exportStatus === 'exporting' || (!title && blocks.length === 0)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                exportStatus === 'exporting' 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : exportStatus === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : exportStatus === 'error'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : (!title && blocks.length === 0)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {exportStatus === 'exporting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Export...</span>
                </>
              ) : exportStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Exporté</span>
                </>
              ) : exportStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Réessayer</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exporter PDF</span>
                </>
              )}
            </button>
            <button 
              onClick={handleShare}
              disabled={shareStatus === 'copying' || (!title && blocks.length === 0)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                shareStatus === 'copying' 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : shareStatus === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : shareStatus === 'error'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : (!title && blocks.length === 0)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {shareStatus === 'copying' ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Copie...</span>
                </>
              ) : shareStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copié</span>
                </>
              ) : shareStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Réessayer</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Partager</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewGazette;
