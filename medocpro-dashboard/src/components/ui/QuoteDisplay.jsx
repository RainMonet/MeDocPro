import React, { useState, useEffect } from 'react';
import quotesService from '../../services/quotesService';

const QuoteDisplay = ({ theme = 'dark', onLogin = false }) => {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get initial quote on mount
    const quote = onLogin ? quotesService.getLoginQuote() : quotesService.getCurrentQuote();
    if (quote) {
      setCurrentQuote(quote);
      // Fade in animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [onLogin]);

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

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 69, 19, 0.1)',
      border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(139, 69, 19, 0.3)'}`,
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '0 auto',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out'
    },
    quoteText: {
      fontSize: '13px',
      fontStyle: 'italic',
      color: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
      flex: 1,
      lineHeight: '1.4'
    },
    author: {
      fontSize: '12px',
      fontWeight: '500',
      color: theme === 'dark' ? '#94a3b8' : '#8b7355',
      whiteSpace: 'nowrap'
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
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.quoteText}>
        "{currentQuote.quote}"
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