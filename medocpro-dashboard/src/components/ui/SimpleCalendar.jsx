import React, { useState, useEffect } from 'react';

// Simple calendar component with line work styling similar to analog clock
const SimpleCalendar = ({ theme = 'dark' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState(theme);

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
        background: '#ffffff',      // Pure white background
        border: '#000000',          // Pure black border
        dayText: '#000000',         // Black text
        todayBg: '#0000ff',         // Blue today background
        todayText: '#ffffff',       // White today text
        headerText: '#000000',      // Black header
        gridLines: '#000000',       // Black grid lines
        weekdayText: '#000000',     // Black weekdays
        shadow: 'rgba(0, 0, 0, 0.8)' // Black shadow
      };
    }

    return {
      light: {
        background: '#faf8f3',      // Warm cream background
        border: '#8b4513',          // Rich saddle brown border
        dayText: '#2d1810',         // Dark coffee brown text
        todayBg: '#8b4513',         // Saddle brown today background
        todayText: '#faf8f3',       // Cream today text
        headerText: '#654321',      // Dark brown header
        gridLines: '#d4c4a8',       // Light brown grid lines
        weekdayText: '#8b7355',     // Muted brown weekdays
        shadow: 'rgba(139, 69, 19, 0.3)' // Saddle brown shadow
      },
      dark: {
        background: '#1e293b',      // Rich dark slate
        border: '#3b82f6',          // Professional blue border
        dayText: '#f1f5f9',         // Soft white text
        todayBg: '#3b82f6',         // Blue today background
        todayText: '#ffffff',       // White today text
        headerText: '#cbd5e1',      // Light slate header
        gridLines: '#475569',       // Slate grid lines
        weekdayText: '#94a3b8',     // Muted slate weekdays
        shadow: 'rgba(59, 130, 246, 0.3)' // Blue shadow
      }
    };
  };

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

  const themeStyles = getThemeStyles(currentTheme);
  const colors = themeStyles[currentTheme] || themeStyles;

  // Calendar logic
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before the month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div 
      style={{
        width: '100%',
        backgroundColor: colors.background,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: `0 4px 12px ${colors.shadow}`
      }}
    >
      {/* Month/Year Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: '600',
        color: colors.headerText,
        borderBottom: `1px solid ${colors.gridLines}`,
        paddingBottom: '8px'
      }}>
        {monthNames[month]} {year}
      </div>

      {/* Weekday Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        marginBottom: '4px',
        width: '100%'
      }}>
        {weekdayNames.map((weekday) => (
          <div
            key={weekday}
            style={{
              textAlign: 'center',
              fontSize: '9px',
              fontWeight: '500',
              color: colors.weekdayText,
              padding: '1px',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0 // Allow flex shrinking
            }}
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        width: '100%'
      }}>
        {calendarDays.map((day, index) => (
          <div
            key={index}
            style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: isToday(day) ? '600' : '400',
              color: isToday(day) ? colors.todayText : colors.dayText,
              backgroundColor: isToday(day) ? colors.todayBg : 'transparent',
              border: `1px solid ${colors.gridLines}`,
              borderRadius: '2px',
              transition: 'all 0.2s ease',
              cursor: day ? 'pointer' : 'default',
              minWidth: 0, // Allow shrinking
              minHeight: '16px', // Minimum height for very narrow screens
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              if (day && !isToday(day)) {
                e.target.style.backgroundColor = `${colors.border}20`;
              }
            }}
            onMouseLeave={(e) => {
              if (day && !isToday(day)) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalendar;