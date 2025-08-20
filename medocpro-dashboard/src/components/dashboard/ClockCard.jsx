import React, { useState, useEffect } from 'react';
import AnalogClock from '../ui/AnalogClock';
import SimpleCalendar from '../ui/SimpleCalendar';

// Theme-aware styling with high contrast accessibility support
const getThemeStyles = (theme = 'dark') => {
  // Detect high contrast mode
  const isHighContrast = window.matchMedia && (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches ||
    window.matchMedia('(-ms-high-contrast: white-on-black)').matches
  );

  if (isHighContrast) {
    return {
      textPrimary: '#000000',
      textSecondary: '#000000', 
      textMuted: '#000000',
      bgPrimary: '#ffffff',
      bgSecondary: '#ffffff',
      bgAccent: '#ffffff',
      borderColor: '#000000',
      primaryColor: '#0000ff',
    };
  }

  return {
    textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
    textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
    textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
    bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
    bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
    bgAccent: theme === 'dark' ? '#374151' : '#ede8df',
    borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
    primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
  };
};

const ClockCard = ({ theme }) => {
  const [currentTheme, setCurrentTheme] = useState(theme || document.documentElement.getAttribute('data-theme') || 'dark');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWideLayout, setIsWideLayout] = useState(false);
  const cardRef = React.useRef(null);

  // Watch for theme and contrast changes
  useEffect(() => {
    const updateTheme = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(newTheme);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Listen for high contrast changes
    const contrastQueries = [
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(-ms-high-contrast: active)'),
      window.matchMedia('(-ms-high-contrast: white-on-black)')
    ];

    const handleContrastChange = () => updateTheme();
    contrastQueries.forEach(query => {
      if (query.addEventListener) {
        query.addEventListener('change', handleContrastChange);
      } else {
        // Fallback for older browsers
        query.addListener(handleContrastChange);
      }
    });

    return () => {
      observer.disconnect();
      contrastQueries.forEach(query => {
        if (query.removeEventListener) {
          query.removeEventListener('change', handleContrastChange);
        } else {
          query.removeListener(handleContrastChange);
        }
      });
    };
  }, []);

  // Update theme when prop changes
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Update current time for header display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Responsive layout detection
  useEffect(() => {
    const observeWidth = () => {
      if (cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth;
        const containerWidth = cardRef.current.parentElement?.offsetWidth || cardWidth;
        
        // Switch to wide layout when container is wide enough (>800px) 
        // and window is narrow enough that Recent Documents would stack below
        setIsWideLayout(containerWidth > 800 && window.innerWidth <= 1200);
      }
    };

    // Create ResizeObserver to watch card size changes
    const resizeObserver = new ResizeObserver(observeWidth);
    
    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
      resizeObserver.observe(cardRef.current.parentElement);
    }

    // Also listen for window resize
    window.addEventListener('resize', observeWidth);
    
    // Initial check
    observeWidth();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', observeWidth);
    };
  }, []);

  const styles = getThemeStyles(currentTheme);

  // Format current time for header
  const formatCurrentTime = () => {
    return currentTime.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrentClock = () => {
    return currentTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div 
      ref={cardRef}
      data-component="clock-card"
      className="clock-card"
      style={{
        backgroundColor: styles.bgPrimary,
        borderRadius: '8px',
        border: `1px solid ${styles.borderColor}`,
        overflow: 'hidden',
        position: 'relative',
        background: `linear-gradient(135deg, ${styles.bgPrimary} 0%, ${styles.bgSecondary} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, ${currentTheme === 'dark' ? '0.05' : '0.1'}), 0 1px 3px rgba(0, 0, 0, ${currentTheme === 'dark' ? '0.2' : '0.1'})`,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: isWideLayout ? 'row' : 'column',
        height: '100%',
        minHeight: isWideLayout ? '300px' : '400px'
      }}
    >
      {/* Gradient top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${styles.primaryColor}, ${currentTheme === 'dark' ? '#10b981' : '#d97706'})`,
        zIndex: 1
      }} />
      
      {/* Header with Analog Clock */}
      <div style={{
        padding: isWideLayout ? '20px 24px' : '20px 20px 16px 20px',
        borderBottom: `1px solid ${styles.borderColor}`,
        background: `linear-gradient(180deg, ${styles.bgPrimary} 0%, ${styles.bgSecondary} 100%)`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Time Information */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: styles.textPrimary,
            marginBottom: '8px'
          }}>
            Current Time
          </h3>
          
          {/* Current date */}
          <div style={{
            fontSize: '13px',
            color: styles.textSecondary,
            marginBottom: '4px'
          }}>
            {formatCurrentTime()}
          </div>
          
          {/* Digital time display */}
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: styles.primaryColor,
            fontFamily: 'monospace'
          }}>
            {formatCurrentClock()}
          </div>
        </div>

        {/* Analog Clock in Header */}
        <div style={{
          width: '80px',
          height: '80px',
          flex: '0 0 80px'
        }}>
          <AnalogClock theme={currentTheme} />
        </div>
      </div>

      {/* Calendar Content (Clock moved to header) */}
      <div style={{
        flex: 1,
        padding: isWideLayout ? '20px 24px' : '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: isWideLayout ? 'none' : `1px solid ${styles.borderColor}`
      }}>
        {/* Calendar - Scaled up to use full available space */}
        <div style={{
          width: '100%',
          maxWidth: '280px',
          height: 'fit-content'
        }}>
          <SimpleCalendar theme={currentTheme} />
        </div>
      </div>

      {/* Footer with timezone info - conditionally rendered */}
      {!isWideLayout && (
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            color: styles.textMuted
          }}>
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
      )}
      
      {/* Wide layout timezone info - integrated into header */}
      {isWideLayout && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '24px',
          fontSize: '11px',
          color: styles.textMuted
        }}>
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>
      )}
    </div>
  );
};

export default ClockCard;