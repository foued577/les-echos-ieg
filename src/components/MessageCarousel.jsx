import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Info, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const MessageCarousel = ({ messages, interval = 5000, showDots = true, showArrows = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);

  // Reset to first message if messages change
  useEffect(() => {
    setCurrentIndex(0);
  }, [messages]);

  // Auto-rotation logic
  useEffect(() => {
    if (!isPaused && messages && messages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, messages, interval]);

  const handlePrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? messages.length - 1 : prevIndex - 1
      );
      setIsTransitioning(false);
    }, 150);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handleDotClick = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  // No messages or empty array
  if (!messages || messages.length === 0) {
    return null;
  }

  // Single message - static display
  if (messages.length === 1) {
    const message = messages[0];
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center py-3 px-4">
          <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
            <div className="text-blue-600">
              {getIcon('news')}
            </div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Actualité
            </span>
          </div>
          <div className="flex-1">
            <span className="text-gray-800 font-medium">
              {message.icon && <span className="mr-2">{message.icon}</span>}
              {message.content}
            </span>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple messages - carousel
  const currentMessage = messages[currentIndex];

  return (
    <div 
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center py-3 px-4">
        {/* Icône et label */}
        <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
          <div className="text-blue-600">
            {getIcon('news')}
          </div>
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Actualités
          </span>
        </div>

        {/* Contenu du message avec transition */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className={`transition-all duration-300 ease-in-out ${
              isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
            }`}
          >
            <span className="text-gray-800 font-medium">
              {currentMessage.icon && <span className="mr-2">{currentMessage.icon}</span>}
              {currentMessage.content}
            </span>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
          {/* Flèches de navigation */}
          {showArrows && messages.length > 1 && (
            <div className="flex space-x-1">
              <button
                onClick={handlePrevious}
                className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                aria-label="Message précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                aria-label="Message suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Indicateurs dots */}
          {showDots && messages.length > 1 && (
            <div className="flex space-x-1">
              {messages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-blue-600 w-6' 
                      : 'bg-blue-300 hover:bg-blue-400'
                  }`}
                  aria-label={`Aller au message ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Indicateur de pause */}
          <div className="flex-shrink-0">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              isPaused ? 'bg-orange-400' : 'bg-blue-400 animate-pulse'
            }`}></div>
          </div>
        </div>
      </div>

      {/* Progress bar optionnelle */}
      <div className="h-1 bg-blue-100 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{
            width: isPaused ? '100%' : '0%',
            animation: isPaused ? 'none' : `progress ${interval}ms linear`
          }}
        />
      </div>

      {/* Styles pour l'animation de progression */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default MessageCarousel;
