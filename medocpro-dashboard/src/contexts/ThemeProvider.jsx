import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = {
  clinical: {
    name: 'Clinical Blue',
    description: 'Professional medical interface with calming blue tones',
    primary: '#0066cc',
    secondary: '#4a90e2',
    accent: '#00a86b',
    background: '#ffffff',
    surface: '#f8fafb',
    text: '#1a202c',
    textSecondary: '#4a5568',
    border: '#e2e8f0',
    error: '#e53e3e',
    warning: '#dd6b20',
    success: '#38a169',
    info: '#3182ce'
  },
  dark: {
    name: 'Dark Mode',
    description: 'Reduced eye strain for extended clinical sessions',
    primary: '#4a90e2',
    secondary: '#6ba3f5',
    accent: '#48bb78',
    background: '#1a202c',
    surface: '#2d3748',
    text: '#f7fafc',
    textSecondary: '#a0aec0',
    border: '#4a5568',
    error: '#fc8181',
    warning: '#f6ad55',
    success: '#68d391',
    info: '#63b3ed'
  },  nature: {
    name: 'Nature Green',
    description: 'Therapeutic green palette promoting calm and healing',
    primary: '#38a169',
    secondary: '#48bb78',
    accent: '#0066cc',
    background: '#f7fafc',
    surface: '#edf2f7',
    text: '#1a202c',
    textSecondary: '#4a5568',
    border: '#cbd5e0',
    error: '#e53e3e',
    warning: '#dd6b20',
    success: '#38a169',
    info: '#3182ce'
  },
  contrast: {
    name: 'High Contrast',
    description: 'WCAG AAA compliant for accessibility requirements',
    primary: '#000000',
    secondary: '#333333',
    accent: '#0066cc',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#333333',
    border: '#000000',
    error: '#cc0000',
    warning: '#ff6600',
    success: '#006600',
    info: '#0066cc'
  }
};

const textSizes = {
  'small': { scale: 0.875, name: 'Small (87.5%)' },
  'medium': { scale: 1.0, name: 'Medium (100%)' },
  'large': { scale: 1.125, name: 'Large (112.5%)' },
  'extra-large': { scale: 1.25, name: 'Extra Large (125%)' },
  'huge': { scale: 1.5, name: 'Huge (150%)' }
};export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('clinical');
  const [currentTextSize, setCurrentTextSize] = useState('medium');

  useEffect(() => {
    const savedTheme = localStorage.getItem('medocpro-theme');
    const savedTextSize = localStorage.getItem('medocpro-text-size');
    
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedTextSize && textSizes[savedTextSize]) {
      setCurrentTextSize(savedTextSize);
    }
  }, []);

  useEffect(() => {
    const theme = themes[currentTheme];
    const textSize = textSizes[currentTextSize];
    
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'description') {
        document.documentElement.style.setProperty(`--theme-${key}`, value);
      }
    });
    
    document.documentElement.style.setProperty('--text-scale', textSize.scale);
    document.body.setAttribute('data-theme', currentTheme);
    document.body.setAttribute('data-text-size', currentTextSize);
    
    localStorage.setItem('medocpro-theme', currentTheme);
    localStorage.setItem('medocpro-text-size', currentTextSize);
  }, [currentTheme, currentTextSize]);

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const setTextSize = (sizeName) => {
    if (textSizes[sizeName]) {
      setCurrentTextSize(sizeName);
    }
  };

  const value = {
    currentTheme,
    currentTextSize,
    themes,
    textSizes,
    setTheme,
    setTextSize
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
