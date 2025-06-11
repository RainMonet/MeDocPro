import React, { useState, useEffect } from 'react'

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

const XCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const LoginPage = ({ onLogin }) => (
  <div className="login-container">
    <div className="login-card">
      <div className="login-header">
        <h1 className="login-title">MeDocPro</h1>
        <p className="login-subtitle">Secure Clinical Documentation System</p>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Enter your username"
            defaultValue="admin"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Enter your password"
            defaultValue="ChangeMe123!"
          />
        </div>
        
        <button type="submit" className="btn btn-primary w-full">
          Sign In
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
        const response = await fetch('http://localhost:5000/health')
        if (response.ok) {
          setBackendStatus('online')
        } else {
          setBackendStatus('offline')
        }
      } catch (error) {
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'templates', label: 'Templates', icon: FileTextIcon },
    { id: 'census', label: 'Patient Census', icon: UsersIcon },
    { id: 'documentation', label: 'Documentation', icon: ClipboardIcon },
    { id: 'reports', label: 'Reports', icon: BarChartIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Clinical Dashboard</h1>
              <p className="text-gray-600">Welcome to your psychiatric documentation workspace</p>
            </div>

            <div className="stats-grid">
              <StatsCard 
                title="Active Templates" 
                value="12" 
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

      case 'templates':
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Template Library</h1>
              <p className="text-gray-600">Manage your clinical documentation templates</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="card">
                <div className="card-content">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Psychiatric Progress Note</h3>
                      <p className="text-sm text-gray-600">Standard SOAP format for progress documentation</p>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Mental Status Examination</h3>
                      <p className="text-sm text-gray-600">Comprehensive mental status assessment template</p>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Treatment Plan</h3>
                      <p className="text-sm text-gray-600">Goal-oriented treatment planning template</p>
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
        )

      default:
        return (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {navItems.find(item => item.id === activeTab)?.label || 'Page'}
              </h1>
              <p className="text-gray-600">This section is under development</p>
            </div>
            
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

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App