import React, { useState, useRef, useEffect } from 'react';
import apiService from '../../services/api';

const AIChatbotModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your local AI assistant powered by Ollama Mistral. I can help with:\n\n• General questions and discussions\n• Clinical terminology (educational only)\n• Technology and software questions\n• MeDocPro system assistance\n\nReady to chat! Mistral is excellent for reasoning and detailed responses.\n\nHow can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isShimmering, setIsShimmering] = useState(false);
  const [isCpuOnly, setIsCpuOnly] = useState(false);
  const [showCpuWarning, setShowCpuWarning] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const shimmerIntervalRef = useRef(null);

  // Theme-aware styling
  const getThemeStyles = () => ({
    textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
    textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
    textMuted: theme === 'dark' ? '#94a3b8' : '#8b7355',
    bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
    bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
    bgTertiary: theme === 'dark' ? '#374151' : '#ede8df',
    bgHover: theme === 'dark' ? '#475569' : '#d4c4a8',
    borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
    primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
    successColor: theme === 'dark' ? '#10b981' : '#6b8e23',
    errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
  });

  const styles = getThemeStyles();

  // Detect CPU-only setup
  const detectCpuOnly = async () => {
    try {
      // Check system capabilities through the backend
      const response = await fetch(`${apiService.baseURL}/api/ai-system-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Check if GPU is available or if running on CPU only
        const cpuOnly = !data.gpu_available || data.device_type === 'cpu' || data.compute_type === 'cpu';
        setIsCpuOnly(cpuOnly);
        
        // Show warning on first open if CPU only
        if (cpuOnly && !localStorage.getItem('cpu_warning_shown')) {
          setShowCpuWarning(true);
          localStorage.setItem('cpu_warning_shown', 'true');
        }
      } else {
        // Fallback: assume CPU only if we can't detect
        setIsCpuOnly(true);
        if (!localStorage.getItem('cpu_warning_shown')) {
          setShowCpuWarning(true);
          localStorage.setItem('cpu_warning_shown', 'true');
        }
      }
    } catch (error) {
      // Fallback: assume CPU only on error
      setIsCpuOnly(true);
      if (!localStorage.getItem('cpu_warning_shown')) {
        setShowCpuWarning(true);
        localStorage.setItem('cpu_warning_shown', 'true');
      }
    }
  };

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when modal opens and start shimmer interval
  useEffect(() => {
    if (isOpen) {
      // Detect system capabilities
      detectCpuOnly();
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Start shimmer effect every 5 minutes (300000ms)
      shimmerIntervalRef.current = setInterval(() => {
        setIsShimmering(true);
        // Stop shimmer after 2 seconds
        setTimeout(() => {
          setIsShimmering(false);
        }, 2000);
      }, 300000); // 5 minutes
      
      // Cleanup interval when modal closes
      return () => {
        if (shimmerIntervalRef.current) {
          clearInterval(shimmerIntervalRef.current);
        }
      };
    }
  }, [isOpen]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message and clear input
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsLoading(true);

    try {
      // Call the local LLM API
      const response = await fetch(`${apiService.baseURL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: currentMessage,
          conversation_history: messages.slice(-10) // Send last 10 messages for context
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response || 'I apologize, but I couldn\'t generate a response.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Create detailed error message with setup instructions
      let errorContent = `I apologize, but I encountered an error: ${error.message}`;
      
      // Add helpful setup instructions for common issues
      if (error.message.includes('not found') || error.message.includes('404')) {
        errorContent += `\n\n🛠️ Quick Setup Guide:\n1. Make sure Ollama is running: 'ollama serve'\n2. Your mistral:latest model should work: 'ollama run mistral:latest'\n3. Or install another model: 'ollama pull mistral:7b'\n4. Try the chat again`;
      } else if (error.message.includes('not accessible') || error.message.includes('503')) {
        errorContent += `\n\n🛠️ Troubleshooting:\n1. Start Ollama service: 'ollama serve'\n2. Check if running: 'ollama list'\n3. Test your Mistral model: 'ollama run mistral:latest'`;
      } else if (error.message.includes('timeout')) {
        errorContent += `\n\n⏱️ The AI is taking too long to respond. Try:\n1. A shorter, simpler question\n2. Restarting Ollama: 'ollama serve'\n3. Your Mistral model should be fine, just might be a heavy query`;
      }

      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation
  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Hello! I\'m your local AI assistant powered by Ollama Mistral. I can help with:\n\n• General questions and discussions\n• Clinical terminology (educational only)\n• Technology and software questions\n• MeDocPro system assistance\n\nReady to chat! Mistral is excellent for reasoning and detailed responses.\n\nHow can I help you today?',
        timestamp: new Date()
      }
    ]);
    setError('');
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content"
        style={{
          width: '90%',
          maxWidth: '800px',
          height: '85vh',
          maxHeight: '700px',
          backgroundColor: styles.bgPrimary,
          borderRadius: '12px',
          border: `1px solid ${styles.borderColor}`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${styles.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: styles.bgSecondary
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600',
              color: styles.textPrimary
            }}>
              AI Assistant Chat
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.875rem',
              color: styles.textSecondary
            }}>
              Powered by local Ollama LLM
            </p>
          </div>
          
          {/* Disclaimer Message */}
          <div style={{
            padding: '6px 12px',
            margin: '0 16px',
            backgroundColor: styles.bgTertiary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: styles.textSecondary,
            fontWeight: '500',
            whiteSpace: 'nowrap',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            ...(isShimmering && {
              animation: 'disclaimerShimmer 2s ease-in-out',
              boxShadow: `0 0 10px ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(139, 69, 19, 0.3)'}`
            })
          }}>
            Please double-check AI output for errors / hallucinations.
            {/* Shimmer overlay */}
            {isShimmering && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                animation: 'shimmerSweep 2s ease-in-out',
                pointerEvents: 'none'
              }} />
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {isCpuOnly && (
              <button
                onClick={() => setShowCpuWarning(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${styles.errorColor}`,
                  borderRadius: '6px',
                  color: styles.errorColor,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `${styles.errorColor}15`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                title="Click for CPU performance information"
              >
                CPU Only
              </button>
            )}
            <button
              onClick={handleClearChat}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                color: styles.textSecondary,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = styles.bgHover;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Clear Chat
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                color: styles.textSecondary,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = styles.bgHover;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: message.type === 'user' 
                  ? styles.primaryColor 
                  : message.isError 
                    ? styles.errorColor 
                    : styles.bgTertiary,
                color: message.type === 'user' || message.isError 
                  ? '#ffffff' 
                  : styles.textPrimary,
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: styles.textMuted,
                marginTop: '4px',
                marginLeft: message.type === 'user' ? '0' : '16px',
                marginRight: message.type === 'user' ? '16px' : '0'
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: styles.textSecondary
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${styles.borderColor}`,
                borderTop: `2px solid ${styles.primaryColor}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>AI is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${styles.borderColor}`,
          backgroundColor: styles.bgSecondary
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              style={{
                flex: 1,
                minHeight: '44px',
                maxHeight: '120px',
                padding: '12px 16px',
                borderRadius: '22px',
                border: `1px solid ${styles.borderColor}`,
                backgroundColor: styles.bgPrimary,
                color: styles.textPrimary,
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = styles.primaryColor;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = styles.borderColor;
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                padding: '12px 20px',
                backgroundColor: (!inputMessage.trim() || isLoading) 
                  ? styles.borderColor 
                  : styles.primaryColor,
                color: '#ffffff',
                border: 'none',
                borderRadius: '22px',
                cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                minWidth: '80px'
              }}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
          
          {error && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: `${styles.errorColor}15`,
              border: `1px solid ${styles.errorColor}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: styles.errorColor
            }}>
              Error: {error}
            </div>
          )}
        </div>

        {/* CPU Performance Warning Modal */}
        {showCpuWarning && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}
          onClick={() => setShowCpuWarning(false)}>
            <div style={{
              backgroundColor: styles.bgPrimary,
              borderRadius: '12px',
              border: `2px solid ${styles.errorColor}`,
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: styles.errorColor,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  ⚠
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: styles.textPrimary
                }}>
                  CPU-Only Performance Notice
                </h3>
              </div>
              
              <div style={{
                color: styles.textPrimary,
                fontSize: '0.9rem',
                lineHeight: '1.5',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '0 0 12px 0' }}>
                  <strong>Your system is running the AI model on CPU only</strong> (no GPU acceleration detected).
                </p>
                
                <div style={{ marginBottom: '12px' }}>
                  <strong>Expected Performance:</strong>
                  <ul style={{ margin: '8px 0 0 20px', paddingLeft: '0' }}>
                    <li style={{ marginBottom: '4px' }}>⏱️ <strong>Response Time:</strong> 30 seconds to 2+ minutes per response</li>
                    <li style={{ marginBottom: '4px' }}>🔄 <strong>Processing:</strong> Significantly slower than GPU</li>
                    <li style={{ marginBottom: '4px' }}>💭 <strong>Complex Queries:</strong> May take 3-5+ minutes</li>
                    <li style={{ marginBottom: '4px' }}>🖥️ <strong>System Load:</strong> High CPU usage during responses</li>
                  </ul>
                </div>
                
                <div style={{
                  backgroundColor: styles.bgTertiary,
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${styles.borderColor}`,
                  fontSize: '0.85rem'
                }}>
                  <strong>💡 Tips for Better Performance:</strong><br />
                  • Keep queries short and focused<br />
                  • Be patient during processing<br />
                  • Avoid multiple rapid requests<br />
                  • Consider shorter conversations
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowCpuWarning(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: styles.primaryColor,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.9';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes disclaimerShimmer {
            0% { 
              transform: scale(1); 
              filter: brightness(1);
            }
            25% { 
              transform: scale(1.02); 
              filter: brightness(1.1);
            }
            50% { 
              transform: scale(1.03); 
              filter: brightness(1.15);
            }
            75% { 
              transform: scale(1.02); 
              filter: brightness(1.1);
            }
            100% { 
              transform: scale(1); 
              filter: brightness(1);
            }
          }
          
          @keyframes shimmerSweep {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default AIChatbotModal;