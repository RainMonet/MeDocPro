import React, { useState } from 'react';

const LoginForm = ({ onLogin, theme = 'dark' }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = {
    textPrimary: theme === 'dark' ? '#f1f5f9' : '#2d1810',
    textSecondary: theme === 'dark' ? '#cbd5e1' : '#5d4d3a',
    bgPrimary: theme === 'dark' ? '#1e293b' : '#faf8f3',
    bgSecondary: theme === 'dark' ? '#0f172a' : '#f4f1eb',
    borderColor: theme === 'dark' ? '#475569' : '#d4c4a8',
    primaryColor: theme === 'dark' ? '#3b82f6' : '#8b4513',
    errorColor: theme === 'dark' ? '#ef4444' : '#a0522d'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any non-empty credentials
      if (credentials.username.trim() && credentials.password.trim()) {
        localStorage.setItem('token', 'authenticated-token');
        onLogin();
      } else {
        setError('Please enter both username and password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setCredentials({ username: 'demo@medocpro.com', password: 'demo123' });
    setTimeout(() => {
      localStorage.setItem('token', 'authenticated-token');
      onLogin();
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: styles.bgSecondary,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: styles.bgPrimary,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4285f4 0%, #1565c0 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            M
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: styles.textPrimary,
            marginBottom: '8px'
          }}>
            MeDocPro
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: styles.textSecondary
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            background: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
            border: `1px solid ${styles.errorColor}`,
            borderRadius: '8px',
            color: styles.errorColor,
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: styles.textPrimary,
              marginBottom: '6px'
            }}>
              Username or Email
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                background: styles.bgSecondary,
                color: styles.textPrimary,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: styles.textPrimary,
              marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${styles.borderColor}`,
                borderRadius: '6px',
                background: styles.bgSecondary,
                color: styles.textPrimary,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: styles.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              marginBottom: '12px'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Login */}
        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: styles.textSecondary,
            border: `1px solid ${styles.borderColor}`,
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Use Demo Account
        </button>

        <p style={{
          marginTop: '20px',
          fontSize: '12px',
          color: styles.textSecondary,
          textAlign: 'center'
        }}>
          Demo credentials: demo@medocpro.com / demo123
        </p>
      </div>
    </div>
  );
};

export default LoginForm;