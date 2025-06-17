import React, { useState, useContext, createContext, useEffect } from 'react'

// Theme Context
const ThemeContext = createContext()

const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('medocpro-theme')
    return savedTheme || 'light'
  })

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    // Save theme preference
    localStorage.setItem('medocpro-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Icon Components
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
)

const TemplatesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
)

const PatientsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const DocumentationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)

const ReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/>
    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

// Login Component
const LoginPage = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'ChangeMe123!') {
        onLogin()
      } else {
        alert('Invalid credentials')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">MeDocPro</h1>
          <p className="login-subtitle">Psychiatric Documentation Platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? <div className="loading"></div> : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: <code>admin</code></p>
          <p>Password: <code>ChangeMe123!</code></p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component
const Dashboard = () => {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'templates', label: 'Templates', icon: TemplatesIcon },
    { id: 'patients', label: 'Patient Census', icon: PatientsIcon },
    { id: 'documentation', label: 'Documentation', icon: DocumentationIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ]

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div className="main-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="main-title">MeDocPro</h1>
                  <h2 className="page-title">Clinical Dashboard</h2>
                  <p className="page-subtitle">Welcome to your psychiatric documentation workspace</p>
                </div>
                <div className="header-actions">
                  <button 
                    className="theme-toggle-header"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    <div className="toggle-track">
                      <div className="toggle-thumb">
                        <div className="toggle-icon">
                          {theme === 'light' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="5"/>
                              <path d="m12 1 0 6m0 6 0 6M4.22 4.22l4.24 4.24m8.49 8.49 4.24 4.24M1 12l6 0m6 0 6 0M4.22 19.78l4.24-4.24m8.49-8.49 4.24-4.24"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="content-wrapper">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">12</div>
                  <div className="stat-label">Active Templates</div>
                  <div className="stat-change positive">+2 this week</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">8</div>
                  <div className="stat-label">Patients Today</div>
                  <div className="stat-change positive">+1 vs yesterday</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">24</div>
                  <div className="stat-label">Notes Completed</div>
                  <div className="stat-change positive">12% this week</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">45</div>
                  <div className="stat-label">AI Assists</div>
                  <div className="stat-change positive">+8 today</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Enhanced System Status */}
                <div className="system-status">
                  <h3>System Status</h3>
                  <p>Real-time monitoring of backend services</p>
                  
                  <div className="status-grid">
                    <div className="status-item">
                      <span className="status-label">Backend API</span>
                      <div className="status-badge connected">
                        <div className="status-dot"></div>
                        Connected
                      </div>
                    </div>
                    
                    <div className="status-item">
                      <span className="status-label">Database</span>
                      <div className="status-badge connected">
                        <div className="status-dot"></div>
                        Connected
                      </div>
                    </div>
                    
                    <div className="status-item">
                      <span className="status-label">AI Service</span>
                      <div className="status-badge available">
                        <div className="status-dot"></div>
                        Available
                      </div>
                    </div>
                  </div>
                  
                  <div className="last-checked">
                    Last checked: 8:57:26 AM
                  </div>
                </div>

                {/* Enhanced Quick Actions */}
                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <p>Common clinical documentation tasks</p>
                  
                  <div className="action-grid">
                    <a href="#" className="action-button">
                      <div className="action-icon">
                        📝
                      </div>
                      <div className="action-text">New Progress Note</div>
                    </a>
                    
                    <a href="#" className="action-button">
                      <div className="action-icon">
                        📋
                      </div>
                      <div className="action-text">Assessment</div>
                    </a>
                    
                    <a href="#" className="action-button">
                      <div className="action-icon">
                        👥
                      </div>
                      <div className="action-text">Patient Lookup</div>
                    </a>
                    
                    <a href="#" className="action-button">
                      <div className="action-icon">
                        📊
                      </div>
                      <div className="action-text">View Reports</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'templates':
        return (
          <div>
            <div className="main-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="main-title">MeDocPro</h1>
                  <h2 className="page-title">Template Library</h2>
                  <p className="page-subtitle">Psychiatric documentation templates with AI assistance</p>
                </div>
                <div className="header-actions">
                  <button 
                    className="theme-toggle-header"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    <div className="toggle-track">
                      <div className="toggle-thumb">
                        <div className="toggle-icon">
                          {theme === 'light' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="5"/>
                              <path d="m12 1 0 6m0 6 0 6M4.22 4.22l4.24 4.24m8.49 8.49 4.24 4.24M1 12l6 0m6 0 6 0M4.22 19.78l4.24-4.24m8.49-8.49 4.24-4.24"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="content-wrapper">
              <div className="grid grid-cols-3 gap-6">
                <div className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">Initial Assessment</h3>
                        <p className="text-sm text-gray-600">Comprehensive psychiatric intake evaluation</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">Progress Note</h3>
                        <p className="text-sm text-gray-600">Standard therapy session documentation</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">Mental Status Exam</h3>
                        <p className="text-sm text-gray-600">Structured mental status evaluation</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">Treatment Plan</h3>
                        <p className="text-sm text-gray-600">Goal-oriented treatment planning template</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">Discharge Summary</h3>
                        <p className="text-sm text-gray-600">Comprehensive discharge documentation</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">Crisis Assessment</h3>
                        <p className="text-sm text-gray-600">Emergency psychiatric evaluation</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <div className="main-header">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="main-title">MeDocPro</h1>
                  <h2 className="page-title">{navItems.find(item => item.id === activeTab)?.label || 'Page'}</h2>
                  <p className="page-subtitle">This section is under development</p>
                </div>
                <div className="header-actions">
                  <button 
                    className="theme-toggle-header"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    <div className="toggle-track">
                      <div className="toggle-thumb">
                        <div className="toggle-icon">
                          {theme === 'light' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="5"/>
                              <path d="m12 1 0 6m0 6 0 6M4.22 4.22l4.24 4.24m8.49 8.49 4.24 4.24M1 12l6 0m6 0 6 0M4.22 19.78l4.24-4.24m8.49-8.49 4.24-4.24"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="content-wrapper">
              <div className="card">
                <div className="card-content">
                  <div className="text-center py-8">
                    <ClipboardIcon />
                    <h3 className="text-lg font-semibold mt-4 mb-2">Coming Soon</h3>
                    <p className="text-gray-600">This feature is being developed for the next release.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="dashboard">
      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <HamburgerIcon />
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-content">
          {/* Navigation */}
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <a
                key={item.id}
                href="#"
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab(item.id)
                }}
                title={item.label}
              >
                <item.icon />
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'content-expanded' : 'content-collapsed'}`}>
        {renderContent()}
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

// Main App
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  return (
    <ThemeProvider>
      <div className="App">
        {isLoggedIn ? (
          <Dashboard />
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </div>
    </ThemeProvider>
  )
}

export default App