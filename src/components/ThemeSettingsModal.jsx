import React, { useState, useEffect } from 'react';
import { useThemeContext } from './ThemeProvider';

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ColorSwatch = ({ colors }) => (
  <div style={{
    display: 'flex', gap: '4px', marginBottom: '12px', height: '20px',
    borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  }}>
    {colors.map((color, index) => (
      <div key={index} style={{ flex: 1, backgroundColor: color }} />
    ))}
  </div>
);

const ThemeOption = ({ themeKey, theme, isActive, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(themeKey)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: `2px solid ${isActive ? 'var(--theme-primary)' : 'var(--theme-border-light)'}`,
        borderRadius: '12px', padding: '16px', cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isActive ? 'var(--theme-primary)' : 'var(--theme-bg-primary)',
        color: isActive ? 'var(--theme-text-inverse)' : 'var(--theme-text-primary)',
        transform: (isActive || isHovered) ? 'translateY(-4px)' : 'none',
        boxShadow: (isActive || isHovered) ? '0 10px 25px rgba(0,0,0,0.15)' : 'none',
        position: 'relative'
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          width: '24px', height: '24px', background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white'
        }}>✓</div>
      )}
      <ColorSwatch colors={theme.colors} />
      <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '16px' }}>
        {theme.name}
      </div>
      <div style={{ fontSize: '12px', lineHeight: '1.4', opacity: isActive ? 0.9 : 0.7 }}>
        {theme.description}
      </div>
    </div>
  );
};

const TextSizeControl = ({ currentSize, onSizeChange, textSizes }) => {
  const sizeKeys = Object.keys(textSizes);
  const currentIndex = sizeKeys.indexOf(currentSize);
  
  return (
    <div style={{
      marginBottom: '32px', padding: '20px',
      background: 'var(--theme-bg-secondary)',
      borderRadius: '12px', border: '1px solid var(--theme-border-light)'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px'
      }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--theme-text-primary)' }}>
          Text Size
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => currentIndex > 0 && onSizeChange(sizeKeys[currentIndex - 1])}
            disabled={currentIndex === 0}
            style={{
              background: 'var(--theme-bg-primary)', border: '1px solid var(--theme-border-light)',
              color: 'var(--theme-text-secondary)', width: '36px', height: '36px',
              borderRadius: '8px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '600', opacity: currentIndex === 0 ? 0.4 : 1
            }}
          >A-</button>
          
          <div style={{
            background: 'var(--theme-bg-tertiary)', border: '1px solid var(--theme-border-light)',
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
            color: 'var(--theme-text-secondary)', minWidth: '140px', textAlign: 'center'
          }}>
            {textSizes[currentSize].name} ({Math.round(textSizes[currentSize].scale * 100)}%)
          </div>
          
          <button
            onClick={() => currentIndex < sizeKeys.length - 1 && onSizeChange(sizeKeys[currentIndex + 1])}
            disabled={currentIndex === sizeKeys.length - 1}
            style={{
              background: 'var(--theme-bg-primary)', border: '1px solid var(--theme-border-light)',
              color: 'var(--theme-text-secondary)', width: '36px', height: '36px',
              borderRadius: '8px', cursor: currentIndex === sizeKeys.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '600', opacity: currentIndex === sizeKeys.length - 1 ? 0.4 : 1
            }}
          >A+</button>
        </div>
      </div>
      <div style={{
        fontSize: '12px', color: 'var(--theme-text-muted)',
        textAlign: 'center', fontStyle: 'italic'
      }}>
        {textSizes[currentSize].description}
      </div>
    </div>
  );
};

const ThemeSettingsModal = ({ isOpen, onClose }) => {
  const { currentTheme, currentTextSize, setTheme, setTextSize, themes, textSizes } = useThemeContext();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: 'var(--theme-surface)', borderRadius: '16px',
        maxWidth: '800px', maxHeight: '90vh', width: '100%', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column',
        border: '1px solid var(--theme-border-light)'
      }}>
        <div style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%)',
          color: 'var(--theme-text-inverse)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
              Theme & Display Settings
            </h2>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>
              Customize your clinical workspace appearance
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px', padding: '8px', cursor: 'pointer',
            color: 'inherit', display: 'flex', alignItems: 'center'
          }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
          <TextSizeControl
            currentSize={currentTextSize}
            onSizeChange={setTextSize}
            textSizes={textSizes}
          />

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '16px', fontWeight: '600',
              color: 'var(--theme-text-primary)', marginBottom: '16px'
            }}>
              Clinical Color Theme
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}>
              {Object.entries(themes).map(([themeKey, theme]) => (
                <ThemeOption
                  key={themeKey}
                  themeKey={themeKey}
                  theme={theme}
                  isActive={currentTheme === themeKey}
                  onSelect={setTheme}
                />
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--theme-bg-tertiary)',
            border: '1px solid var(--theme-border-light)',
            borderLeft: '4px solid var(--theme-primary)',
            borderRadius: '0 8px 8px 0', padding: '20px'
          }}>
            <div style={{
              fontWeight: '600', color: 'var(--theme-text-primary)',
              marginBottom: '8px', fontSize: '14px'
            }}>
              Accessibility & Clinical Compliance
            </div>
            <div style={{
              fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.5'
            }}>
              All themes maintain WCAG 2.1 AA compliance. Text scaling supports various accessibility needs.
            </div>
          </div>
        </div>

        <div style={{
          padding: '20px 32px', borderTop: '1px solid var(--theme-border-light)',
          background: 'var(--theme-bg-secondary)', display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            background: 'var(--theme-primary)', color: 'var(--theme-text-inverse)',
            border: 'none', padding: '8px 16px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '500'
          }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettingsModal;
