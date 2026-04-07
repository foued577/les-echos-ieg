import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Info, AlertCircle } from 'lucide-react';

const NewsTicker = ({ message, icon = 'news' }) => {
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef(null);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && tickerRef.current) {
        const contentWidth = contentRef.current.scrollWidth;
        const containerWidth = tickerRef.current.clientWidth;
        setIsOverflowing(contentWidth > containerWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => window.removeEventListener('resize', checkOverflow);
  }, [message]);

  const getIcon = () => {
    switch (icon) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  if (!message) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center py-3 px-4">
        {/* Icône et label */}
        <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
          <div className="text-blue-600">
            {getIcon()}
          </div>
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Actualité
          </span>
        </div>

        {/* Conteneur du ticker */}
        <div 
          ref={tickerRef}
          className="flex-1 overflow-hidden relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {isOverflowing ? (
            <div className="relative h-6 flex items-center">
              {/* Animation CSS pour le défilement */}
              <div
                className={`whitespace-nowrap inline-block ${isPaused ? 'animation-paused' : ''}`}
                style={{
                  animation: isOverflowing ? 'scroll-left 20s linear infinite' : 'none',
                  paddingLeft: isOverflowing ? '100%' : '0'
                }}
                ref={contentRef}
              >
                <span className="text-gray-800 font-medium">
                  {message.icon && <span className="mr-2">{message.icon}</span>}
                  {message.content}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-6 flex items-center">
              <span className="text-gray-800 font-medium">
                {message.icon && <span className="mr-2">{message.icon}</span>}
                {message.content}
              </span>
            </div>
          )}
        </div>

        {/* Indicateur visuel subtil */}
        <div className="flex-shrink-0 ml-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Styles CSS pour l'animation */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animation-paused {
          animation-play-state: paused !important;
        }

        /* Assurer que le texte ne se coupe pas */
        .whitespace-nowrap {
          white-space: nowrap;
        }

        /* Animation fluide et élégante */
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
