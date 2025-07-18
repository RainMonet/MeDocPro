import React, { useState, useEffect } from 'react';
import quotesService from '../../services/quotesService';

const QuoteDisplay = ({ theme = 'dark', onLogin = false }) => {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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

  // Determine if we should show a shortened version
  const isSmallScreen = windowWidth < 1024;
  const shouldTruncate = isSmallScreen && currentQuote.quote.length > 60;
  const displayQuote = shouldTruncate ? currentQuote.quote.substring(0, 60) + '...' : currentQuote.quote;

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
    quoteText: {
      fontSize: '13px',
      fontStyle: 'italic',
      color: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
      flex: 1,
      lineHeight: '1.4',
      minWidth: 0, // Allow text to shrink
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
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
      <div 
        style={styles.quoteText}
        title={shouldTruncate ? `"${currentQuote.quote}" — ${currentQuote.author}` : undefined}
      >
        "{displayQuote}"
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