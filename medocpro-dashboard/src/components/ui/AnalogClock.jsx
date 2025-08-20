import React, { useState, useEffect } from 'react';

// Theme-aware styles with high contrast accessibility support
const getThemeStyles = (theme) => {
  // Detect high contrast mode
  const isHighContrast = window.matchMedia && (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches ||
    window.matchMedia('(-ms-high-contrast: white-on-black)').matches
  );

  if (isHighContrast) {
    return {
      clockFace: '#ffffff',      // Pure white background
      border: '#000000',         // Pure black border
      hourMarkers: '#000000',    // Black hour markers
      minuteMarkers: '#000000',  // Black minute markers
      hourHand: '#000000',       // Black hour hand
      minuteHand: '#000000',     // Black minute hand
      secondHand: '#0000ff',     // Blue second hand for distinction
      centerPivot: '#000000',    // Black center
      shadow: 'rgba(0, 0, 0, 0.8)'
    };
  }

  return {
    // Light theme (antique book)
    light: {
      clockFace: '#faf8f3',      // Warm cream background
      border: '#8b4513',         // Rich saddle brown border
      hourMarkers: '#a0522d',    // Sienna hour markers
      minuteMarkers: '#bc8f8f',  // Rosy brown minute markers
      hourHand: '#654321',       // Dark brown hour hand
      minuteHand: '#8b4513',     // Saddle brown minute hand
      secondHand: '#d2b48c',     // Tan second hand
      centerPivot: '#654321',    // Dark brown center
      shadow: 'rgba(139, 69, 19, 0.3)'
    },
    // Dark theme
    dark: {
      clockFace: '#1e293b',      // Rich dark slate
      border: '#3b82f6',         // Professional blue border
      hourMarkers: '#64748b',    // Slate hour markers
      minuteMarkers: '#475569',  // Darker slate minute markers
      hourHand: '#f1f5f9',       // Soft white hour hand
      minuteHand: '#cbd5e1',     // Light slate minute hand
      secondHand: '#3b82f6',     // Blue second hand
      centerPivot: '#f1f5f9',    // White center
      shadow: 'rgba(59, 130, 246, 0.3)'
    }
  };
};

const AnalogClock = ({ theme = 'dark', showDigitalTime = false }) => {
  const [time, setTime] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState(theme);

  // Update theme when prop changes or document theme changes
  useEffect(() => {
    const detectTheme = () => {
      const docTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setCurrentTheme(theme || docTheme);
    };

    detectTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(detectTheme);
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

    const handleContrastChange = () => detectTheme();
    contrastQueries.forEach(query => {
      if (query.addEventListener) {
        query.addEventListener('change', handleContrastChange);
      } else {
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
  }, [theme]);

  // Update time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Get current theme colors
  const themeStyles = getThemeStyles(currentTheme);
  const colors = themeStyles[currentTheme] || themeStyles;

  // Time calculations
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // Hand rotation calculations
  const secondHandRotation = seconds * 6;
  const minuteHandRotation = minutes * 6 + seconds * 0.1;
  const hourHandRotation = (hours % 12) * 30 + minutes * 0.5;

  // Format digital time if shown
  const digitalTime = time.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '100%', // Maintains 1:1 aspect ratio
        borderRadius: '12px',
        backgroundColor: colors.clockFace,
        border: `2px solid ${colors.border}`,
        boxShadow: `0 4px 12px ${colors.shadow}`,
        overflow: 'hidden'
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        viewBox="0 0 200 200"
        aria-label={`Analog clock showing ${digitalTime}`}
      >
        {/* Clock Face */}
        <circle 
          cx="100" 
          cy="100" 
          r="95" 
          fill={colors.clockFace}
          stroke={colors.border}
          strokeWidth="3"
        />

        {/* Hour Markers */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`hour-marker-${i}`}
            x1="100"
            y1="15"
            x2="100"
            y2="25"
            stroke={colors.hourMarkers}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}

        {/* Minute Markers */}
        {Array.from({ length: 60 }).map((_, i) => (
          i % 5 !== 0 && (
            <line
              key={`minute-marker-${i}`}
              x1="100"
              y1="15"
              x2="100"
              y2="20"
              stroke={colors.minuteMarkers}
              strokeWidth="1"
              strokeLinecap="round"
              transform={`rotate(${i * 6} 100 100)`}
            />
          )
        ))}


        {/* Hour Hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="60"
          stroke={colors.hourHand}
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${hourHandRotation} 100 100)`}
        />

        {/* Minute Hand */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="35"
          stroke={colors.minuteHand}
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${minuteHandRotation} 100 100)`}
        />

        {/* Second Hand */}
        <line
          x1="100"
          y1="110"
          x2="100"
          y2="30"
          stroke={colors.secondHand}
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${secondHandRotation} 100 100)`}
        />
        
        {/* Center Pivot */}
        <circle 
          cx="100" 
          cy="100" 
          r="4" 
          fill={colors.centerPivot}
        />
      </svg>

      {/* Digital Time Display (optional) */}
      {showDigitalTime && (
        <div 
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.clockFace,
            color: colors.hourMarkers,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 2px 4px ${colors.shadow}`
          }}
        >
          {digitalTime}
        </div>
      )}
    </div>
  );
};

export default AnalogClock;