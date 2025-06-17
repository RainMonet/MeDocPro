import React, { useState } from 'react';
import { ThemeProvider, useThemeContext } from './components/ThemeProvider';
import ThemeSettingsModal from './components/ThemeSettingsModal';
import './styles/theme-settings.css';

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5"/>
    <circle cx="17.5" cy="10.5" r=".5"/>
    <circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const ThemeSettingsButton = ({ onClick }) => {
  const { getCurrentThemeData } = useThemeContext();
  const themeData = getCurrentThemeData();

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', marginBottom: '16px',
        border: '1px solid var(--theme-border-light)',
        borderRadius: '8px', background: 'var(--theme-bg-tertiary)',
        color: 'var(--theme-text-primary)', cursor: 'pointer',
        transition: 'all 0.2s ease', width: '100%'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'var(--theme-primary)';
        e.target.style.color = 'var(--theme-text-inverse)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'var(--theme-bg-tertiary)';
        e.target.style.color = 'var(--theme-text-primary)';
      }}
    >
      <PaletteIcon />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>Theme & Display</div>
        <div style={{ fontSize: '11px', opacity: 0.7 }}>{themeData.name}</div>
      </div>
    </button>
  );
};

const Dashboard = () => {
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLargeTextMode } = useThemeContext();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'templates', label: 'Templates', icon: '📝' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📈' }
  ];

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--theme-bg-primary)',
      color: 'var(--theme-text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: isLargeTextMode() ? '320px' : '280px',
        background: 'var(--theme-bg-secondary)',
        borderRight: '1px solid var(--theme-border-light)',
        padding: 'calc(20px * var(--text-scale, 1))',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          fontSize: 'calc(24px * var(--text-scale, 1))',
          fontWeight: '700', color: 'var(--theme-primary)',
          marginBottom: 'calc(32px * var(--text-scale, 1))',
          textAlign: 'center'
        }}>
          MeDocPro
        </div>

        <ThemeSettingsButton onClick={() => setShowThemeSettings(true)} />

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 'calc(12px * var(--text-scale, 1))',
                width: '100%',
                padding: 'calc(12px * var(--text-scale, 1)) calc(16px * var(--text-scale, 1))',
                marginBottom: 'calc(4px * var(--text-scale, 1))',
                border: 'none', borderRadius: '8px',
                background: activeTab === item.id ? 'var(--theme-primary)' : 'transparent',
                color: activeTab === item.id ? 'var(--theme-text-inverse)' : 'var(--theme-text-primary)',
                cursor: 'pointer', transition: 'all 0.2s ease',
                fontSize: 'calc(14px * var(--text-scale, 1))',
                fontWeight: '500', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="card" style={{ marginTop: 'auto' }}>
          <div className="card-content" style={{ padding: 'calc(16px * var(--text-scale, 1))' }}>
            <div style={{
              fontSize: 'calc(14px * var(--text-scale, 1))',
              fontWeight: '500', color: 'var(--theme-text-primary)'
            }}>
              Dr. Sarah Johnson
            </div>
            <div style={{
              fontSize: 'calc(12px * var(--text-scale, 1))',
              color: 'var(--theme-text-secondary)'
            }}>
              Psychiatrist
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1, padding: 'calc(32px * var(--text-scale, 1))',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: 'calc(32px * var(--text-scale, 1))' }}>
          <h1 style={{
            fontSize: 'calc(28px * var(--text-scale, 1))',
            fontWeight: '700',
            marginBottom: 'calc(8px * var(--text-scale, 1))',
            color: 'var(--theme-text-primary)'
          }}>
            Clinical Dashboard
          </h1>
          <p style={{
            fontSize: 'calc(16px * var(--text-scale, 1))',
            color: 'var(--theme-text-secondary)'
          }}>
            Welcome to your psychiatric documentation workspace
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid" style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          marginBottom: 'calc(32px * var(--text-scale, 1))'
        }}>
          {[
            { title: 'Active Templates', value: '12', icon: '📝' },
            { title: 'Patients Today', value: '8', icon: '👥' },
            { title: 'Notes Completed', value: '24', icon: '✅' },
            { title: 'AI Assists', value: '45', icon: '🤖' }
          ].map((stat, index) => (
            <div key={index} className="card">
              <div className="card-content">
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{
                      fontSize: 'calc(32px * var(--text-scale, 1))',
                      fontWeight: '700', color: 'var(--theme-primary)',
                      marginBottom: 'calc(4px * var(--text-scale, 1))'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: 'calc(14px * var(--text-scale, 1))',
                      color: 'var(--theme-text-secondary)', fontWeight: '500'
                    }}>
                      {stat.title}
                    </div>
                  </div>
                  <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="grid" style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
          }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                <p className="card-subtitle">Latest clinical updates</p>
              </div>
              <div className="card-content">
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  gap: 'calc(12px * var(--text-scale, 1))'
                }}>
                  {[
                    { action: 'Progress note completed', patient: 'Patient A-001', time: '2 min ago' },
                    { action: 'Template updated', patient: 'Intake Form v2', time: '15 min ago' },
                    { action: 'Assessment scheduled', patient: 'Patient B-003', time: '1 hour ago' }
                  ].map((activity, index) => (
                    <div key={index} style={{
                      padding: 'calc(12px * var(--text-scale, 1))',
                      background: 'var(--theme-bg-secondary)',
                      borderRadius: '8px', border: '1px solid var(--theme-border-light)'
                    }}>
                      <div style={{
                        fontSize: 'calc(14px * var(--text-scale, 1))',
                        fontWeight: '500', color: 'var(--theme-text-primary)',
                        marginBottom: 'calc(4px * var(--text-scale, 1))'
                      }}>
                        {activity.action}
                      </div>
                      <div style={{
                        fontSize: 'calc(12px * var(--text-scale, 1))',
                        color: 'var(--theme-text-secondary)'
                      }}>
                        {activity.patient} • {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
                <p className="card-subtitle">Common clinical tasks</p>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-2">
                  <button className="btn">📝 New Template</button>
                  <button className="btn btn-secondary">📋 Progress Note</button>
                  <button className="btn btn-secondary">👥 Assessment</button>
                  <button className="btn btn-secondary">📊 Reports</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className="card">
            <div className="card-content" style={{
              textAlign: 'center', padding: 'calc(60px * var(--text-scale, 1))'
            }}>
              <h3 style={{
                fontSize: 'calc(20px * var(--text-scale, 1))',
                fontWeight: '600', color: 'var(--theme-text-primary)',
                marginBottom: 'calc(8px * var(--text-scale, 1))'
              }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
              </h3>
              <p style={{
                fontSize: 'calc(16px * var(--text-scale, 1))',
                color: 'var(--theme-text-secondary)'
              }}>
                Theme system is working! Try switching themes and text sizes.
              </p>
            </div>
          </div>
        )}
      </div>

      <ThemeSettingsModal
        isOpen={showThemeSettings}
        onClose={() => setShowThemeSettings(false)}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
