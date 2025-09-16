import React, { useState, useEffect } from 'react';
import './QuoteTicker.css';

const QuoteTicker = ({ showInHeader = false }) => {
  const [quotes, setQuotes] = useState([]);
  const [newQuote, setNewQuote] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState('normal');

  // Default inspirational quotes
  const defaultQuotes = [
    { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
    { text: "Healing is a matter of time, but it is sometimes also a matter of opportunity.", author: "Hippocrates" },
    { text: "To care for others, we must first care for ourselves.", author: "Anonymous" },
    { text: "Medicine is not only a science; it is also an art.", author: "Paracelsus" },
    { text: "The good physician treats the disease; the great physician treats the patient who has the disease.", author: "William Osler" }
  ];

  // Load quotes and settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      console.log('🎯 Loading QuoteTicker settings from localStorage...');
      
      const savedQuotes = localStorage.getItem('quoteTicker_quotes');
      const savedEnabled = localStorage.getItem('quoteTicker_enabled');
      const savedSpeed = localStorage.getItem('quoteTicker_scrollSpeed');
      
      console.log('📚 Saved settings found:', {
        quotes: !!savedQuotes,
        enabled: savedEnabled,
        speed: savedSpeed
      });
      
      if (savedQuotes) {
        try {
          const parsed = JSON.parse(savedQuotes);
          setQuotes(parsed.length > 0 ? parsed : defaultQuotes);
        } catch (e) {
          console.error('❌ Failed to parse saved quotes, using defaults');
          setQuotes(defaultQuotes);
        }
      } else {
        setQuotes(defaultQuotes);
      }
      
      if (savedEnabled !== null) {
        const enabledValue = savedEnabled === 'true';
        console.log('✅ Setting enabled to:', enabledValue);
        setIsEnabled(enabledValue);
      }
      
      if (savedSpeed) {
        console.log('🏃 Setting speed to:', savedSpeed);
        setScrollSpeed(savedSpeed);
      } else {
        console.log('🏃 No saved speed found, using default: normal');
        setScrollSpeed('normal');
      }
    };

    // Load immediately
    loadSettings();
    
    // Also load after a short delay to handle any timing issues
    const timeoutId = setTimeout(loadSettings, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Save quotes to localStorage
  useEffect(() => {
    if (quotes.length > 0) {
      localStorage.setItem('quoteTicker_quotes', JSON.stringify(quotes));
    }
  }, [quotes]);

  // Save enabled state
  useEffect(() => {
    localStorage.setItem('quoteTicker_enabled', isEnabled.toString());
  }, [isEnabled]);

  // Save scroll speed
  useEffect(() => {
    console.log('💾 Saving scroll speed to localStorage:', scrollSpeed);
    localStorage.setItem('quoteTicker_scrollSpeed', scrollSpeed);
  }, [scrollSpeed]);

  // Additional check to ensure scroll speed is properly loaded
  useEffect(() => {
    const checkScrollSpeed = () => {
      const currentStoredSpeed = localStorage.getItem('quoteTicker_scrollSpeed');
      if (currentStoredSpeed && currentStoredSpeed !== scrollSpeed) {
        console.log('🔄 Scroll speed sync correction - stored:', currentStoredSpeed, 'state:', scrollSpeed);
        setScrollSpeed(currentStoredSpeed);
      }
    };

    // Check periodically for the first few seconds
    const intervals = [100, 500, 1000, 2000].map(delay => 
      setTimeout(checkScrollSpeed, delay)
    );

    return () => intervals.forEach(clearTimeout);
  }, [scrollSpeed]);

  // Listen for storage changes to sync state across components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'quoteTicker_enabled') {
        setIsEnabled(e.newValue === 'true');
      }
      if (e.key === 'quoteTicker_quotes') {
        try {
          const updatedQuotes = JSON.parse(e.newValue || '[]');
          setQuotes(updatedQuotes.length > 0 ? updatedQuotes : defaultQuotes);
        } catch (error) {
          console.error('Failed to parse updated quotes:', error);
        }
      }
      if (e.key === 'quoteTicker_scrollSpeed') {
        setScrollSpeed(e.newValue || 'normal');
      }
    };

    const handleCustomSettingsChange = (e) => {
      const { enabled, quotes: updatedQuotes, scrollSpeed: newScrollSpeed } = e.detail;
      setIsEnabled(enabled);
      if (updatedQuotes && updatedQuotes.length > 0) {
        setQuotes(updatedQuotes);
      }
      if (newScrollSpeed) {
        setScrollSpeed(newScrollSpeed);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('quoteTickerSettingsChange', handleCustomSettingsChange);
    
    // Also check for updates periodically in case storage events don't fire
    const interval = setInterval(() => {
      const currentEnabled = localStorage.getItem('quoteTicker_enabled');
      if (currentEnabled !== null && (currentEnabled === 'true') !== isEnabled) {
        setIsEnabled(currentEnabled === 'true');
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('quoteTickerSettingsChange', handleCustomSettingsChange);
      clearInterval(interval);
    };
  }, [isEnabled, defaultQuotes]);

  // Auto-rotate quotes every 15 seconds
  useEffect(() => {
    if (!isEnabled || quotes.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [quotes.length, isEnabled]);

  const addQuote = () => {
    if (!newQuote.trim()) return;
    
    const quote = {
      text: newQuote.trim(),
      author: newAuthor.trim() || 'Anonymous',
      id: Date.now()
    };
    
    setQuotes(prev => [...prev, quote]);
    setNewQuote('');
    setNewAuthor('');
  };

  const removeQuote = (index) => {
    setQuotes(prev => prev.filter((_, i) => i !== index));
    if (currentQuoteIndex >= quotes.length - 1) {
      setCurrentQuoteIndex(0);
    }
  };

  const resetToDefaults = () => {
    setQuotes(defaultQuotes);
    setCurrentQuoteIndex(0);
  };

  // Function to refresh to a random quote with elegant fade transition
  const refreshQuote = () => {
    if (quotes.length <= 1 || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Slow fade out current quote
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * quotes.length);
      } while (newIndex === currentQuoteIndex && quotes.length > 1);
      setCurrentQuoteIndex(newIndex);
      
      // Slow fade back in with new quote
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  };

  // Function to get animation duration based on speed setting and quote length
  const getAnimationStyle = (quoteText, authorText) => {
    const totalLength = quoteText.length + authorText.length;
    
    // Base durations for different quote lengths
    let longDuration, mediumDuration, shortDuration;
    
    switch (scrollSpeed) {
      case 'very-slow':
        longDuration = 60;  // Was 25s
        mediumDuration = 45; // Was 20s  
        shortDuration = 12;  // Was 6s
        break;
      case 'slow':
        longDuration = 45;  // Was 25s
        mediumDuration = 30; // Was 20s
        shortDuration = 9;   // Was 6s
        break;
      case 'normal':
        longDuration = 25;  // Original
        mediumDuration = 20; // Original
        shortDuration = 6;   // Original
        break;
      case 'fast':
        longDuration = 15;  // Faster than original
        mediumDuration = 12; // Faster than original
        shortDuration = 4;   // Faster than original
        break;
      case 'very-fast':
        longDuration = 8;   // Much faster
        mediumDuration = 6;  // Much faster
        shortDuration = 2;   // Much faster
        break;
      default:
        longDuration = 25;
        mediumDuration = 20;
        shortDuration = 6;
    }

    if (totalLength > 80) {
      return `scroll-text ${longDuration}s linear infinite`;
    } else if (totalLength > 50) {
      return `scroll-text ${mediumDuration}s linear infinite`;
    } else {
      return `quote-fade-cycle ${shortDuration}s ease-in-out infinite`;
    }
  };

  if (!isEnabled) return null;

  const currentQuote = quotes[currentQuoteIndex];

  // Header mode - horizontal quote display with manage-style button
  if (showInHeader) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: '600px',
        position: 'relative',
        paddingBottom: '0' // Remove bottom padding to align with header
      }}>
        {/* Quote Display in Header with Scrolling and Fade Transition */}
        {isVisible && currentQuote && (
          <div style={{
            flex: 1,
            textAlign: 'center',
            minWidth: 0,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div 
              onClick={refreshQuote}
              style={{
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                animation: getAnimationStyle(currentQuote.text, currentQuote.author),
                paddingRight: currentQuote.text.length + currentQuote.author.length > 50 ? '20px' : '0', // Only add padding for scrolling quotes
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out',
                cursor: quotes.length > 1 ? 'pointer' : 'default',
                textDecoration: quotes.length > 1 ? 'underline' : 'none',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
                textDecorationColor: 'var(--text-muted)'
              }}
              title={quotes.length > 1 ? 'Click to refresh quote' : ''}
            >
              "{currentQuote.text}"
              <span style={{
                color: 'var(--text-muted)',
                fontSize: '12px',
                marginLeft: '8px',
                fontWeight: '500'
              }}>
                — {currentQuote.author}
              </span>
            </div>
          </div>
        )}
        
        {/* Hide/Show Button */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setIsVisible(!isVisible)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {isVisible ? 'Hide' : 'Quote'}
          </button>
        </div>
      </div>
    );
  }

  // Original bottom-right floating mode (when not in header)
  return (
    <>
      {/* Quote Display */}
      {isVisible && currentQuote && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          maxWidth: '350px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-primary)',
          border: '2px solid var(--color-primary)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          animation: 'slideInUp 0.5s ease-out'
        }}>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
          
          <div style={{
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.5',
            marginBottom: '8px',
            paddingRight: '20px'
          }}>
            "{currentQuote.text}"
          </div>
          
          <div style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
            textAlign: 'right',
            fontWeight: '500'
          }}>
            — {currentQuote.author}
          </div>
          
          {quotes.length > 1 && (
            <div style={{
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'center',
              gap: '4px'
            }}>
              {quotes.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: index === currentQuoteIndex ? 'var(--color-primary)' : 'var(--text-muted)',
                    opacity: index === currentQuoteIndex ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Show quote button if hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '8px 12px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          💭 Show Quote
        </button>
      )}
    </>
  );
};

export const QuoteTickerSettings = ({ onClose }) => {
  const [quotes, setQuotes] = useState([]);
  const [newQuote, setNewQuote] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState('normal');

  // Load data on mount
  useEffect(() => {
    console.log('🛠️ Loading QuoteTicker Settings modal data...');
    
    const savedQuotes = localStorage.getItem('quoteTicker_quotes');
    const savedEnabled = localStorage.getItem('quoteTicker_enabled');
    const savedSpeed = localStorage.getItem('quoteTicker_scrollSpeed');
    
    console.log('⚙️ Settings modal found:', {
      quotes: !!savedQuotes,
      enabled: savedEnabled,
      speed: savedSpeed
    });
    
    if (savedQuotes) {
      try {
        setQuotes(JSON.parse(savedQuotes));
      } catch (e) {
        console.error('❌ Settings modal: Failed to parse saved quotes');
        setQuotes([]);
      }
    }
    
    if (savedEnabled !== null) {
      const enabledValue = savedEnabled === 'true';
      console.log('⚙️ Settings modal: Setting enabled to:', enabledValue);
      setIsEnabled(enabledValue);
    }
    
    if (savedSpeed) {
      console.log('⚙️ Settings modal: Setting speed to:', savedSpeed);
      setScrollSpeed(savedSpeed);
    } else {
      console.log('⚙️ Settings modal: No saved speed, using default: normal');
      // Explicitly set to normal if no speed is saved
      setScrollSpeed('normal');
    }
  }, []);

  const addQuote = () => {
    if (!newQuote.trim()) return;
    
    const quote = {
      text: newQuote.trim(),
      author: newAuthor.trim() || 'Anonymous',
      id: Date.now()
    };
    
    const updatedQuotes = [...quotes, quote];
    setQuotes(updatedQuotes);
    localStorage.setItem('quoteTicker_quotes', JSON.stringify(updatedQuotes));
    
    // Dispatch custom event to notify other components immediately
    window.dispatchEvent(new CustomEvent('quoteTickerSettingsChange', {
      detail: { enabled: isEnabled, quotes: updatedQuotes, scrollSpeed: scrollSpeed }
    }));
    
    setNewQuote('');
    setNewAuthor('');
  };

  const removeQuote = (index) => {
    const updatedQuotes = quotes.filter((_, i) => i !== index);
    setQuotes(updatedQuotes);
    localStorage.setItem('quoteTicker_quotes', JSON.stringify(updatedQuotes));
    
    // Dispatch custom event to notify other components immediately
    window.dispatchEvent(new CustomEvent('quoteTickerSettingsChange', {
      detail: { enabled: isEnabled, quotes: updatedQuotes, scrollSpeed: scrollSpeed }
    }));
  };

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('quoteTicker_enabled', newEnabled.toString());
    
    // Dispatch custom event to notify other components immediately
    window.dispatchEvent(new CustomEvent('quoteTickerSettingsChange', {
      detail: { enabled: newEnabled, quotes: quotes, scrollSpeed: scrollSpeed }
    }));
  };

  const handleSpeedChange = (newSpeed) => {
    console.log('🎛️ Settings modal: Speed changed to:', newSpeed);
    setScrollSpeed(newSpeed);
    localStorage.setItem('quoteTicker_scrollSpeed', newSpeed);
    console.log('💾 Settings modal: Speed saved to localStorage');
    
    // Dispatch custom event to notify other components immediately
    window.dispatchEvent(new CustomEvent('quoteTickerSettingsChange', {
      detail: { enabled: isEnabled, quotes: quotes, scrollSpeed: newSpeed }
    }));
    console.log('📡 Settings modal: Speed change event dispatched');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          // Theme-consistent scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border-color) var(--bg-tertiary)',
          // Ensure rounded corners are preserved with overflow
          overflowClipMargin: 'content-box'
        }}
        onClick={(e) => e.stopPropagation()}
        className="quote-ticker-modal"
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: '18px'
          }}>
            Quote Ticker Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Enable/Disable Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              Enable Quote Ticker
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Show inspirational quotes on the dashboard
            </div>
          </div>
          <div
            onClick={toggleEnabled}
            style={{
              width: '44px',
              height: '24px',
              backgroundColor: isEnabled ? 'var(--color-primary)' : 'var(--text-muted)',
              borderRadius: '12px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '2px',
              left: isEnabled ? '22px' : '2px',
              transition: 'left 0.2s'
            }} />
          </div>
        </div>

        {/* Scroll Speed Control */}
        {isEnabled && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                Scrolling Speed
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                How fast quotes scroll across the screen
              </div>
            </div>
            <select
              value={scrollSpeed}
              onChange={(e) => handleSpeedChange(e.target.value)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="very-slow">Very Slow</option>
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
              <option value="very-fast">Very Fast</option>
            </select>
          </div>
        )}

        {isEnabled && (
          <>
            {/* Add New Quote */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}>
                Add New Quote
              </h4>
              
              <textarea
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="Enter your favorite quote..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '8px'
                }}
              />
              
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Author (optional)"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              />
              
              <button
                onClick={addQuote}
                disabled={!newQuote.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: newQuote.trim() ? 'pointer' : 'not-allowed',
                  opacity: newQuote.trim() ? 1 : 0.5
                }}
              >
                Add Quote
              </button>
            </div>

            {/* Quote List */}
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}>
                Current Quotes ({quotes.length})
              </h4>
              
              <div>
                {quotes.map((quote, index) => (
                  <div
                    key={quote.id || index}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontStyle: 'italic',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        marginBottom: '4px'
                      }}>
                        "{quote.text}"
                      </div>
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '11px'
                      }}>
                        — {quote.author}
                      </div>
                    </div>
                    <button
                      onClick={() => removeQuote(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginLeft: '8px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {quotes.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    padding: '20px'
                  }}>
                    No quotes added yet. Add your first quote above!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuoteTicker;