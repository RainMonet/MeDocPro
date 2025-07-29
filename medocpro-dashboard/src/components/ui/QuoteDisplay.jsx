import React, { useState, useEffect, useRef } from 'react';
import quotesService from '../../services/quotesService';

const QuoteDisplay = ({ theme = 'dark', onLogin = false }) => {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const styleRef = useRef(null);

  useEffect(() => {
    // Get initial quote on mount
    const quote = onLogin ? quotesService.getLoginQuote() : quotesService.getCurrentQuote();
    if (quote) {
      setCurrentQuote(quote);
      // Fade in animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [onLogin]);

  useEffect(() => {
    // Track window width for responsive behavior
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate if scrolling is needed
  const isSmallScreen = windowWidth < 1024;
  const shouldScroll = currentQuote && isSmallScreen && currentQuote.quote.length > 60;

  // Inject CSS keyframes for scrolling animation
  useEffect(() => {
    if (shouldScroll && !document.getElementById('quote-scroll-keyframes')) {
      const style = document.createElement('style');
      style.id = 'quote-scroll-keyframes';
      style.textContent = `
        @keyframes scrollText {
          0%, 3.6% { 
            transform: translateX(0%); 
          }
          92.7%, 96.4% { 
            transform: translateX(calc(-100% + 200px)); 
          }
          96.4%, 100% {
            transform: translateX(0%);
          }
        }
      `;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    
    // Cleanup when component unmounts or scrolling is no longer needed
    return () => {
      if (!shouldScroll && styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [shouldScroll]);

  const getNextQuote = () => {
    // Fade out
    setIsVisible(false);
    
    // Get new quote and fade in
    setTimeout(() => {
      const newQuote = quotesService.getNewQuote();
      setCurrentQuote(newQuote);
      setIsVisible(true);
    }, 300);
  };

  if (!currentQuote) return null;

  // Hide quote on very small screens (mobile)
  if (windowWidth < 768) {
    return null;
  }

  const displayQuote = currentQuote?.quote || '';

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '4px 8px',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0, // Allow flex items to shrink below their content size
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      overflow: 'hidden' // Prevent overflow
    },
    quoteWrapper: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      position: 'relative',
      marginRight: '8px' // Ensure spacing from author
    },
    quoteText: {
      fontSize: '13px',
      fontStyle: 'italic',
      color: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
      lineHeight: '1.4',
      whiteSpace: 'nowrap',
      ...(shouldScroll ? {
        animation: 'scrollText 55s ease-in-out infinite',
        textOverflow: 'clip',
        width: 'max-content' // Allow text to expand beyond container for scrolling
      } : {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%'
      })
    },
    author: {
      fontSize: '12px',
      fontWeight: '500',
      color: theme === 'dark' ? '#94a3b8' : '#8b7355',
      whiteSpace: 'nowrap',
      flexShrink: 0, // Prevent author from shrinking
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    refreshButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      color: theme === 'dark' ? '#94a3b8' : '#8b7355',
      fontSize: '12px',
      transition: 'all 0.2s ease',
      minWidth: '20px',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0 // Prevent button from shrinking
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.quoteWrapper}>
        <div 
          style={styles.quoteText}
          title={shouldScroll ? `"${currentQuote.quote}" — ${currentQuote.author}` : undefined}
        >
          "{displayQuote}"
        </div>
      </div>
      <div style={styles.author}>
        — {currentQuote.author}
      </div>
      <button
        onClick={getNextQuote}
        style={styles.refreshButton}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(139, 115, 85, 0.1)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.transform = 'scale(1)';
        }}
        title="Get new quote"
      >
        ↻
      </button>
    </div>
  );
};

export default QuoteDisplay;