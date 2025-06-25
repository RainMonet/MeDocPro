# MeDocPro Dashboard

A modern React-based dashboard for the MeDocPro medical documentation platform, designed specifically for psychiatric practice management with an intuitive user interface and responsive design.

## 🚀 Features

### Core Dashboard Components
- **Responsive Layout**: Mobile-first design with collapsible sidebar navigation
- **Theme Support**: Dark/Light mode toggle with localStorage persistence
- **Statistics Overview**: Real-time metrics cards for practice analytics
- **System Monitoring**: Live backend service status indicators
- **Quick Actions**: Fast access to common clinical documentation tasks
- **Document Management**: Recent documents overview and management

### Architecture Highlights
- **Modular Component Structure**: Fully refactored with extracted, reusable components
- **Clean Code Organization**: Logical component hierarchy and separation of concerns
- **Performance Optimized**: Efficient React patterns and build optimization
- **Mobile Ready**: Responsive design with touch-friendly interactions

## 🏗️ Architecture

### Component Structure

The dashboard follows a clean, modular architecture with components organized by functionality:

```
src/
├── components/
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── SystemStatus.jsx      # Backend service status monitoring
│   │   ├── QuickActions.jsx      # Clinical action buttons
│   │   ├── RecentDocuments.jsx   # Document overview widget
│   │   └── index.js              # Clean exports for dashboard components
│   ├── layout/              # Layout and navigation components
│   │   ├── Header.jsx            # Top navigation bar with user info
│   │   ├── Sidebar.jsx           # Main navigation sidebar
│   │   └── SidebarToggle.jsx     # Mobile-friendly sidebar toggle
│   ├── ui/                  # Reusable UI components
│   │   ├── StatCard.jsx          # Statistics display cards
│   │   └── index.js              # UI component exports
│   └── modals/              # Modal dialog components
│       └── PatientCensusModal.jsx # Patient management modal
├── contexts/                # React context providers
│   └── ThemeProvider.jsx         # Theme management context
├── services/                # API and external service integration
│   └── api.js                    # Backend API communication
└── App.jsx                  # Main application component (refactored)
```

### App.jsx Refactoring

The main App.jsx component has been systematically refactored through multiple phases:

#### Phase 1-3: Initial Component Extraction
- ✅ **StatCard Component**: Statistics display cards
- ✅ **Header Component**: Top navigation with user info and theme toggle
- ✅ **Sidebar Component**: Main navigation with responsive behavior

#### Phase 4: Dashboard Content Extraction (Latest)
- ✅ **SystemStatus Component**: Real-time backend service monitoring
- ✅ **QuickActions Component**: Clinical documentation quick access
- ✅ **RecentDocuments Component**: Document overview and management

**Result**: App.jsx reduced from 247 lines to ~180 lines while maintaining full functionality.

### Key Design Patterns

#### Responsive Design
- **Mobile-First**: Designed for mobile devices with desktop enhancements
- **Sidebar Behavior**: Overlay on mobile, collapsible on desktop
- **Touch-Friendly**: Large touch targets and gesture support

#### State Management
- **Local State**: React hooks for component-level state
- **Theme Persistence**: localStorage integration for user preferences
- **Modal System**: Centralized modal state management

#### Component Communication
- **Props Down**: Data and handlers passed down through component tree
- **Event Bubbling**: Modal actions bubble up to App.jsx coordinator
- **Clean Interfaces**: Well-defined component APIs with PropTypes

## 🛠️ Development

### Prerequisites
- **Node.js 18+** 
- **npm** or **yarn**
- **Modern browser** with ES6+ support

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Commands

```bash
# Development with hot reloading
npm run dev                 # Starts Vite dev server on http://localhost:5173

# Production build
npm run build              # Creates optimized build in dist/

# Preview production build
npm run preview           # Serves production build locally

# Linting
npm run lint              # ESLint code analysis
```

### Environment Configuration

The dashboard automatically detects and adapts to different environments:

- **Development**: Hot reloading, debugging tools, verbose logging
- **Production**: Optimized builds, error boundaries, performance monitoring

### Component Development Guidelines

#### Creating New Components

1. **Location**: Place components in appropriate subdirectories
   - `components/ui/` - Reusable UI elements
   - `components/layout/` - Layout and navigation
   - `components/dashboard/` - Dashboard-specific features

2. **Structure**: Follow established patterns
   ```jsx
   import React from 'react';
   import './ComponentName.css';

   const ComponentName = ({ prop1, prop2, onAction }) => {
     return (
       <div className="component-name">
         {/* Component content */}
       </div>
     );
   };

   export default ComponentName;
   ```

3. **Styling**: Use dedicated CSS files with BEM methodology
4. **Exports**: Add to appropriate index.js files for clean imports

#### Component Standards

- **Functional Components**: Use React hooks for state management
- **PropTypes**: Define prop types for type checking (when applicable)
- **CSS Modules**: Use scoped CSS to prevent style conflicts
- **Accessibility**: Include proper ARIA labels and keyboard navigation

## 🎨 Theming

### Theme System

The dashboard includes a comprehensive theming system:

#### CSS Custom Properties
```css
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #2d3748;
  --border-color: #e2e8f0;
}

:root[data-theme="dark"] {
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --text-primary: #f7fafc;
  --border-color: #4a5568;
}
```

#### Theme Toggle
- **Persistent**: Theme preference saved to localStorage
- **System Integration**: Respects system dark/light mode preferences
- **Smooth Transitions**: Animated theme switching

### Responsive Breakpoints

```css
/* Mobile First Approach */
.component {
  /* Mobile styles (default) */
}

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

## 🔌 API Integration

### Backend Communication

The dashboard communicates with the MeDocPro backend API:

```javascript
// services/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.medocpro.com' 
  : 'http://localhost:5000';

export const apiClient = {
  get: (endpoint) => fetch(`${API_BASE_URL}${endpoint}`),
  post: (endpoint, data) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
};
```

### Authentication Integration
- **JWT Tokens**: Secure authentication with the backend
- **Role-Based Access**: Different UI elements based on user permissions
- **Session Management**: Automatic token refresh and logout

## 📱 Mobile Support

### Responsive Features
- **Touch Navigation**: Optimized for touch interactions
- **Viewport Scaling**: Proper mobile viewport configuration
- **Offline Support**: Basic offline functionality (planned)

### Mobile-Specific Behaviors
- **Sidebar**: Overlay mode with backdrop blur
- **Touch Gestures**: Swipe gestures for navigation
- **Performance**: Optimized for mobile performance

## 🧪 Testing

### Component Testing
```bash
# Run component tests (when configured)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Manual Testing Checklist
- [ ] Theme switching works correctly
- [ ] Sidebar responsive behavior on mobile/desktop
- [ ] All modal interactions function properly
- [ ] Statistics cards display correctly
- [ ] Quick actions trigger appropriate modals
- [ ] Recent documents section renders properly

## 🚀 Production Deployment

### Build Optimization
- **Vite**: Fast build tool with optimized bundling
- **Tree Shaking**: Automatic removal of unused code
- **Asset Optimization**: Minification and compression
- **Code Splitting**: Automatic code splitting for better loading

### Performance Features
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for performance optimization  
- **Efficient Rendering**: Minimal re-renders through proper state management

### Deployment Steps
```bash
# Build for production
npm run build

# The dist/ folder contains the production build
# Deploy dist/ contents to your web server
```

## 📋 Component Reference

### Dashboard Components

#### SystemStatus
Real-time backend service monitoring with status indicators.

**Props**: None (self-contained)
**Features**: 
- Live service status (API, Database, AI Service)
- Last checked timestamp
- Status badge styling

#### QuickActions  
Quick access buttons for common clinical documentation tasks.

**Props**:
- `onModalOpen(modalType)`: Handler for modal triggering

**Features**:
- Clinical action buttons (Notes, Assessments, Treatment Plans)
- Modal integration
- Accessible button design

#### RecentDocuments
Overview of recently accessed documents.

**Props**: None (currently static, will integrate with API)
**Features**:
- Document listing with icons and timestamps
- Document type indicators

### Layout Components

#### Header
Top navigation bar with user information and theme controls.

**Props**:
- `user`: User object with name and role
- `theme`: Current theme ('light' or 'dark')
- `onToggleTheme()`: Theme toggle handler

#### Sidebar
Main navigation sidebar with responsive behavior.

**Props**:
- `onModalOpen(modalType)`: Modal trigger handler
- `expanded`: Boolean for expanded state
- `isMobile`: Boolean for mobile detection
- `onToggle()`: Sidebar toggle handler

#### SidebarToggle
Mobile-friendly hamburger menu button.

**Props**:
- `onClick()`: Click handler
- `theme`: Current theme for icon styling

### UI Components

#### StatCard
Reusable statistics display card with trend indicators.

**Props**:
- `value`: Main statistic value
- `label`: Description label
- `change`: Change indicator text
- `trend`: Trend direction ('positive', 'negative', 'neutral')

## 🔄 Changelog

### Phase 4 Refactoring (Current)
- ✅ Extracted SystemStatus component
- ✅ Extracted QuickActions component  
- ✅ Extracted RecentDocuments component
- ✅ Created dashboard component index
- ✅ Reduced App.jsx complexity (247 → ~180 lines)
- ✅ Improved code organization and maintainability

### Phase 1-3 Refactoring
- ✅ Extracted StatCard component
- ✅ Extracted Header component with theme integration
- ✅ Extracted Sidebar component with responsive behavior
- ✅ Established component architecture patterns

### Roadmap
- 🔄 Enhanced API integration for real-time data
- 🔄 Advanced modal system with reusable components
- 🔄 Mobile overlay component extraction
- 🔄 Component unit testing implementation
- 🔄 Performance monitoring and optimization
- 🔄 Progressive Web App (PWA) features

## 🤝 Contributing

### Development Workflow
1. **Component Development**: Create new components following established patterns
2. **Code Style**: Follow existing conventions and ESLint rules
3. **Testing**: Ensure components work across different screen sizes
4. **Documentation**: Update README.md for significant changes

### Code Standards
- **ES6+ Features**: Use modern JavaScript features
- **Component Props**: Use descriptive prop names and document interfaces
- **CSS Organization**: Use component-specific CSS files
- **Accessibility**: Include proper ARIA labels and semantic HTML

---

**Built with ❤️ for healthcare professionals using React 18 + Vite**
