import React, { useState, useEffect, useContext, createContext } from 'react';

const ThemeContext = createContext();

const THEMES = {
  clinical: {
    name: 'Clinical Blue',
    description: 'Professional blue theme optimized for medical environments',
    colors: ['#0066cc', '#667eea', '#10b981', '#f8f9fa'],
    cssVars: {
      '--theme-primary': '#0066cc',
      '--theme-primary-dark': '#0052a3',
      '--theme-bg-primary': '#ffffff',
      '--theme-bg-secondary': '#f8f9fa',
      '--theme-bg-tertiary': '#f1f5f9',
      '--theme-surface': '#ffffff',
      '--theme-text-primary': '#1a365d',
      '--theme-text-secondary': '#64748b',
      '--theme-text-muted': '#94a3b8',
      '--theme-text-inverse': '#ffffff',
      '--theme-border-light': '#e2e8f0',
      '--theme-border-medium': '#cbd5e0',
      '--theme-accent': '#10b981',
      '--theme-warning': '#f59e0b',
      '--theme-error': '#ef4444',
      '--theme-success': '#10b981'
    }
  },
  dark: {
    name: 'Dark Mode',
    description: 'Reduced eye strain for extended sessions',
    colors: ['#4a90e2', '#8b5cf6', '#34d399', '#1e293b'],
    cssVars: {
      '--theme-primary': '#4a90e2',
      '--theme-primary-dark': '#2563eb',
      '--theme-bg-primary': '#0f172a',
      '--theme-bg-secondary': '#1e293b',
      '--theme-bg-tertiary': '#334155',
      '--theme-surface': '#1e293b',
      '--theme-text-primary': '#f1f5f9',
      '--theme-text-secondary': '#cbd5e0',
      '--theme-text-muted': '#94a3b8',
      '--theme-text-inverse': '#0f172a',
      '--theme-border-light': '#334155',
      '--theme-border-medium': '#475569',
      '--theme-accent': '#34d399',
      '--theme-warning': '#f59e0b',
      '--theme-error': '#ef4444',
      '--theme-success': '#34d399'
    }
  },
  nature: {
    name: 'Nature Green',
    description: 'Calming green palette for therapeutic environments',
    colors: ['#059669', '#0d9488', '#6366f1', '#f0fdf4'],
    cssVars: {
      '--theme-primary': '#059669',
      '--theme-primary-dark': '#047857',
      '--theme-bg-primary': '#ffffff',
      '--theme-bg-secondary': '#f0fdf4',
      '--theme-bg-tertiary': '#ecfdf5',
      '--theme-surface': '#ffffff',
      '--theme-text-primary': '#1a365d',
      '--theme-text-secondary': '#64748b',
      '--theme-text-muted': '#94a3b8',
      '--theme-text-inverse': '#ffffff',
      '--theme-border-light': '#e2e8f0',
      '--theme-border-medium': '#cbd5e0',
      '--theme-accent': '#6366f1',
      '--theme-warning': '#f59e0b',
      '--theme-error': '#ef4444',
      '--theme-success': '#059669'
    }
  },
  contrast: {
    name: 'High Contrast',
    description: 'Maximum accessibility compliance',
    colors: ['#000000', '#4b5563', '#059669', '#ffffff'],
    cssVars: {
      '--theme-primary': '#000000',
      '--theme-primary-dark': '#000000',
      '--theme-bg-primary': '#ffffff',
      '--theme-bg-secondary': '#ffffff',
      '--theme-bg-tertiary': '#f9fafb',
      '--theme-surface': '#ffffff',
      '--theme-text-primary': '#000000',
      '--theme-text-secondary': '#374151',
      '--theme-text-muted': '#94a3b8',
      '--theme-text-inverse': '#ffffff',
      '--theme-border-light': '#000000',
      '--theme-border-medium': '#000000',
      '--theme-accent': '#059669',
      '--theme-warning': '#f59e0b',
      '--theme-error': '#ef4444',
      '--theme-success': '#10b981'
    }
  }
};

const TEXT_SIZES = {
  small: { name: 'Small', scale: 0.875, description: '87.5% - Compact text' },
  medium: { name: 'Medium', scale: 1, description: '100% - Standard text' },
  large: { name: 'Large', scale: 1.125, description: '112.5% - Enhanced readability' },
  'extra-large': { name: 'X-Large', scale: 1.25, description: '125% - Large text' },
  huge: { name: 'Huge', scale: 1.5, description: '150% - Maximum accessibility' }
};

const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(() => 
    localStorage.getItem('medocpro-theme') || 'clinical'
  );
  const [currentTextSize, setCurrentTextSize] = useState(() => 
    localStorage.getItem('medocpro-text-size') || 'medium'
  );

  const applyTheme = (themeName) => {
    const theme = THEMES[themeName];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    document.body.setAttribute('data-theme', themeName);
    document.body.classList.add('theme-transition');
    setTimeout(() => document.body.classList.remove('theme-transition'), 300);
  };

  const applyTextSize = (size) => {
    const textSize = TEXT_SIZES[size];
    if (!textSize) return;

    document.documentElement.style.setProperty('--text-scale', textSize.scale.toString());
    document.body.setAttribute('data-text-size', size);
  };

  const setTheme = (themeName) => {
    if (!THEMES[themeName]) return;
    setCurrentTheme(themeName);
    applyTheme(themeName);
    localStorage.setItem('medocpro-theme', themeName);
  };

  const setTextSize = (size) => {
    if (!TEXT_SIZES[size]) return;
    setCurrentTextSize(size);
    applyTextSize(size);
    localStorage.setItem('medocpro-text-size', size);
  };

  useEffect(() => {
    applyTheme(currentTheme);
    applyTextSize(currentTextSize);
  }, []);

  return {
    currentTheme,
    currentTextSize,
    setTheme,
    setTextSize,
    themes: THEMES,
    textSizes: TEXT_SIZES,
    getCurrentThemeData: () => THEMES[currentTheme],
    getCurrentTextSizeData: () => TEXT_SIZES[currentTextSize],
    isLargeTextMode: () => ['large', 'extra-large', 'huge'].includes(currentTextSize),
    isDarkMode: () => currentTheme === 'dark'
  };
};

export const ThemeProvider = ({ children }) => {
  const themeState = useTheme();
  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export { THEMES, TEXT_SIZES };
