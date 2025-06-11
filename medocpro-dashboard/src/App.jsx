import React, { useState, useEffect } from 'react'
import apiService from './services/api'

// Simple icon components (replacing Lucide)
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
)

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 21-3-3"/>
  </svg>
)

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
)

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" x2="12" y1="20" y2="10"/>
    <line x1="18" x2="18" y1="20" y2="4"/>
    <line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="m12 1 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'ChangeMe123!'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await apiService.login(formData.username, formData.password)
      console.log('Login successful:', response)
      onLogin(response.user)
    } catch (err) {
      console.error('Login failed:', err)
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">MeDocPro</h1>
          <p className="login-subtitle">Secure Clinical Documentation System</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              name="username"
              className="form-input" 
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              name="password"
              className="form-input" 
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          <strong>Demo Credentials:</strong><br />
          Username: admin<br />
          Password: ChangeMe123!
        </div>
      </div>
    </div>
  )
}

const StatusIndicator = ({ status, label }) => (
  <div className={`status-indicator status-${status}`}>
    <div className="status-dot"></div>
    <span>{label}</span>
  </div>
)

const SystemStatus = () => {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [lastCheck, setLastCheck] = useState(new Date())

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        await apiService.getHealth()
        setBackendStatus('online')
      } catch (error) {
        console.error('Backend health check failed:', error)
        setBackendStatus('offline')
      }
      setLastCheck(new Date())
    }

    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">System Status</h3>
        <p className="card-subtitle">Real-time monitoring of backend services</p>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center">
            <span>Backend API</span>
            <StatusIndicator 
              status={backendStatus} 
              label={backendStatus === 'online' ? 'Connected' : backendStatus === 'offline' ? 'Disconnected' : 'Checking...'} 
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Database</span>
            <StatusIndicator 
              status={backendStatus === 'online' ? 'online' : 'offline'} 
              label={backendStatus === 'online' ? 'Connected' : 'Disconnected'} 
            />
          </div>
          <div className="flex justify-between items-center">
            <span>AI Service</span>
            <StatusIndicator 
              status="warning" 
              label="Available" 
            />
          </div>
        </div>
        <div className="text-sm text-gray-500" style={{ marginTop: '1rem' }}>
          Last checked: {lastCheck.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

const StatsCard = ({ title, value, change, icon: Icon }) => (
  <div className="stat-card">
    <div className="flex justify-between items-start">
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {change && (
          <div className={`stat-change ${change.includes('+') ? 'positive' : 'negative'}`}>
            {change}
          </div>
        )}
      </div>
      <Icon />
    </div>
  </div>
)

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'templates', label: 'Templates', icon: FileTextIcon },
    { id: 'census', label: 'Patient Census', icon: UsersIcon },
    { id: 'documentation', label: 'Documentation', icon: ClipboardIcon },
    { id: 'reports', label: 'Reports', icon: BarChartIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Load templates and categories from backend
  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Load templates and categories
      const [templatesResponse, categoriesResponse] = await Promise.all([
        apiService.getTemplates(),
        apiService.getTemplateCategories()
      ])
      
      setTemplates(templatesResponse.templates || [])
      setCategories(categoriesResponse.categories || {})
      
      console.log('Loaded templates:', templatesResponse.templates)
      console.log('Loaded categories:', categoriesResponse.categories)
      
    } catch (err) {
      console.error('Failed to load templates:', err)
      setError(err.message || 'Failed to load templates')
      
      // Use mock data if backend is not available
      setTemplates([
        {
          id: 1,
          name: 'Psychiatric Progress Note',
          category: 'progress',
          content_preview: 'PROGRESS NOTE\n\nDate: {{date_of_service}}\nPatient: {{patient_name}}...',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: 2,
          name: 'Mental Status Examination',
          category: 'assessment',
          content_preview: 'MENTAL STATUS EXAMINATION\n\nDate: {{date_of_service}}...',
          created_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: 3,
          name: 'Treatment Plan Template',
          category: 'treatment',
          content_preview: 'TREATMENT PLAN\n\nPatient: {{patient_name}}...',
          created_at: new Date().toISOString(),
          is_active: true
        }
      ])
      
      setCategories({
        progress: { name: 'Progress Notes', color: '#10b981' },
        assessment: { name: 'Psychiatric Assessment', color: '#0066cc' },
        treatment: { name: 'Treatment Plans', color: '#8b5cf6' }
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div>
          <div style={{ color: 'var(--gray-600)' }}>Loading clinical templates...</div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <strong>Connection Error:</strong> {error}
          <br />
          <small>Using mock data for demonstration.</small>
        </div>
      )
    }

    switch (activeTab) {
      case 'templates':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Clinical Templates</h1>
              <p className="text-gray-600">Manage your clinical documentation templates</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {templates.map(template => (
                <div key={template.id} className="card">
                  <div className="card-content">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600">
                          {categories[template.category]?.name || template.category} • 
                          Created {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{template.content_preview}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-primary">Use</button>
                        <button className="btn btn-sm btn-secondary">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Clinical Dashboard</h1>
              <p className="text-gray-600">Welcome to your psychiatric documentation workspace</p>
            </div>

            <div className="stats-grid">
              <StatsCard 
                title="Active Templates" 
                value={templates.length.toString()} 
                change="+2 this week"
                icon={FileTextIcon}
              />
              <StatsCard 
                title="Patients Today" 
                value="8" 
                change="+3 vs yesterday"
                icon={UsersIcon}
              />
              <StatsCard 
                title="Notes Completed" 
                value="24" 
                change="+12% this week"
                icon={CheckCircleIcon}
              />
              <StatsCard 
                title="AI Assists" 
                value="45" 
                change="+8 today"
                icon={SettingsIcon}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <SystemStatus />
              
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Quick Actions</h3>
                  <p className="card-subtitle">Common clinical documentation tasks</p>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="btn btn-primary">
                      <FileTextIcon />
                      New Progress Note
                    </button>
                    <button className="btn btn-secondary">
                      <ClipboardIcon />
                      Assessment
                    </button>
                    <button className="btn btn-secondary">
                      <UsersIcon />
                      Patient Lookup
                    </button>
                    <button className="btn btn-secondary">
                      <BarChartIcon />
                      View Reports
                    </button>
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
      <div className="sidebar">
        <div className="nav-brand">MeDocPro</div>
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
            >
              <item.icon />
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      // TODO: Validate token with backend
      setIsLoggedIn(true)
      setUser({ username: 'admin', role: 'administrator' })
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const handleLogout = async () => {
    try {
      await apiService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setIsLoggedIn(false)
    }
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App