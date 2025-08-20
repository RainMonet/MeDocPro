# MeDocPro AI Agent Interface Documentation

> **Version:** 1.0.0  
> **Compatible with:** Perplexity Comet, Selenium, Puppeteer, Playwright, and other browser automation tools  
> **Last Updated:** January 2025  

## Overview

MeDocPro's Clinical Workspace is fully optimized for browser-based AI agent automation. This document provides comprehensive guidance for AI systems to interact with the application programmatically, with a focus on future-proofing and semantic accessibility.

## 🚀 Quick Start for AI Agents

### Global API Access
```javascript
// Access the AI-friendly API (automatically available when page loads)
const api = window.MeDocProAI;

// Get current workspace state
const state = await api.getWorkspaceState();

// Get all patients
const patients = await api.getPatients();

// Click an element
await api.clickElement('#patient-census-section');
```

### Key Selectors for Automation
```javascript
const SELECTORS = {
  // Main workspace
  workspace: '#clinical-workspace',
  
  // Navigation and stats
  totalPatients: '#stat-total-patients',
  admissions: '#stat-admissions',
  followUps: '#stat-followups',
  discharges: '#stat-discharges',
  
  // Main sections
  patientCensus: '#patient-census-section',
  batchDocuments: '#batch-documentation-section',
  recentDocuments: '#recent-documents-section',
  
  // Patient rows (NEW - SOLVES YOUR SELECTION ISSUE)
  allPatientRows: '[data-ai-component="patient-row"]',
  specificPatient: '[data-ai-patient-name*="John"]', // partial name match
  patientByRoom: '[data-ai-patient-room="101A"]',
  patientById: '[data-ai-patient-id="123"]',
  selectedPatients: '[data-ai-selected="true"]',
  admissionPatients: '[data-ai-workflow-type="admission"]',
  
  // Action buttons
  dailyInfoButton: '[data-ai-action="enter-daily-info"]',
  generateDocsButton: '[data-ai-action="generate-documents"]',
  
  // Modals
  dailyInfoModal: '#daily-info-modal',
  previewModal: '#preview-document-modal'
};
```

## 📋 Core Capabilities

### 1. Patient Management
- **View patient census**: Get complete list with workflow states
- **Search patients**: By name, room number, or workflow type
- **Update workflows**: Change patient status (admission/follow-up/discharge)
- **Access daily information**: View and edit clinical notes

### 2. Document Generation  
- **Batch generation**: Create documents for multiple patients
- **Template selection**: Choose from available clinical templates
- **AI enhancement**: Optional LLM-powered content improvement
- **Export options**: PDF, Word, plain text, email formats

### 3. Clinical Workflow
- **Daily information entry**: Add/edit clinical notes per patient
- **Workflow management**: Track patient progression through care stages
- **Template management**: Access and customize clinical document templates

### 4. Data Access
- **Real-time census**: Current patient count and statistics
- **Historical data**: 7-day averages and trends
- **Document history**: Recently generated clinical documents

## 🎯 Semantic Element Structure

### Data Attributes for AI Identification

All interactive elements use standardized `data-ai-*` attributes:

```html
<!-- Component identification -->
data-ai-component="component-name"

<!-- Action identification -->  
data-ai-action="action-name"

<!-- Element type -->
data-ai-element="element-type"

<!-- Current state -->
data-ai-state="current-state"

<!-- Data values -->
data-ai-value="current-value"
```

### Element Hierarchy

```
#clinical-workspace [main]
├── #workspace-header [header]
│   ├── #workspace-title-section
│   │   ├── #workspace-title
│   │   └── #workspace-datetime
│   │       ├── #current-date
│   │       └── #current-time [clickable - toggles format]
│   └── .workspace-stat-cards
│       ├── #stat-total-patients [clickable - shows tooltip]
│       ├── #stat-admissions [clickable - shows tooltip]  
│       ├── #stat-followups [clickable - shows tooltip]
│       └── #stat-discharges [clickable - shows tooltip]
├── #main-content [section]
│   ├── #patient-census-section
│   │   └── [PatientCensusCard component with patient rows]
│   └── #batch-documentation-section
│       └── [BatchDocumentationCard component]
├── #secondary-content [section]
│   ├── #clock-section
│   └── #recent-documents-section
├── #daily-info-modal [modal]
└── #preview-document-modal [modal]
```

## 🔧 AI Agent API Reference

### Core Methods

#### `getWorkspaceState()`
Returns complete workspace context including patient counts, available templates, and system status.

```javascript
const state = await api.getWorkspaceState();
// Returns: { success: true, workspace: { patients: {...}, templates: {...} } }
```

#### `getPatients(filters = {})`
Retrieve patient list with optional filtering.

```javascript
// Get all patients
const allPatients = await api.getPatients();

// Get only admission patients  
const admissions = await api.getPatients({ workflow: 'admission' });

// Search by name
const johnDoe = await api.getPatients({ search: 'John Doe' });
```

#### `getPatient(identifier)`
Get detailed information for a specific patient.

```javascript
// By ID, name, or room number
const patient = await api.getPatient('101A'); // room number
const patient = await api.getPatient('John Doe'); // patient name
const patient = await api.getPatient(123); // patient ID
```

#### `selectPatient(identifier)`
Select a patient in the UI for batch operations (SOLVES YOUR ISSUE).

```javascript
// Select by patient name (partial match supported)
await api.selectPatient('John Doe');
await api.selectPatient('John'); // Partial match works

// Select by patient ID
await api.selectPatient(123);

// Select by room number
await api.selectPatient('101A');

// The method will find and click the patient row automatically
```

#### `selectPatients(criteria)`
Select multiple patients based on various criteria.

```javascript
// Select all admission patients
await api.selectPatients({ workflow: 'admission' });

// Select patients with high priority
await api.selectPatients({ priorityColor: 'red' });

// Select completed patients
await api.selectPatients({ completed: true });

// Select by name pattern with delay between selections
await api.selectPatients({ 
  nameContains: 'Smith', 
  delay: 500 // 500ms delay between clicks
});

// Combine multiple criteria
await api.selectPatients({ 
  workflow: 'admission', 
  completed: false, 
  priorityColor: 'red' 
});
```

#### `getAvailablePatients()`
Get list of all patients currently visible in the UI.

```javascript
const patients = api.getAvailablePatients();
// Returns: [{ id, name, room, workflow, selected, completed }, ...]
```

#### `updatePatientWorkflow(patientId, workflowType, notes)`
Change a patient's workflow status.

```javascript
await api.updatePatientWorkflow(123, 'discharge', 'Ready for discharge');
// workflowType: 'admission', 'follow-up', 'discharge'
```

#### `generateDocument(options)`
Generate clinical documents.

```javascript
await api.generateDocument({
  templateId: 1,
  patientIds: [123, 456, 789],
  aiEnhancement: true,
  format: 'pdf'
});
```

### UI Automation Methods

#### `clickElement(selector)`
Programmatically click any element with full event simulation.

```javascript
// Click a stat card
await api.clickElement('#stat-total-patients');

// Open daily info modal  
await api.clickElement('[data-ai-action="enter-daily-info"]');

// Click patient row
await api.clickElement('[data-ai-patient-id="123"]');
```

#### `fillForm(formSelector, data)`
Automatically fill form fields.

```javascript
await api.fillForm('#daily-info-form', {
  'patient_mood': 'stable',
  'medication_compliance': 'excellent', 
  'notes': 'Patient doing well today'
});
```

#### `executeBatchOperation(operations)`
Execute multiple operations in sequence.

```javascript
await api.executeBatchOperation([
  {
    type: 'get-patients',
    filters: { workflow: 'admission' }
  },
  {
    type: 'click',  
    selector: '[data-ai-action="generate-documents"]',
    delay: 1000
  },
  {
    type: 'fill-form',
    formSelector: '#document-options',
    data: { template: 'progress-note', ai_enhancement: true }
  }
]);
```

## 📊 State Monitoring

### Real-time State Changes
```javascript
// Monitor workspace changes
const observer = api.watchWorkspaceChanges((newState) => {
  console.log('Workspace updated:', newState);
  
  // React to patient count changes
  if (newState.workspace.patients.total > previousCount) {
    console.log('New patient added');
  }
});

// Stop monitoring
observer.disconnect();
```

### Current State Access
```javascript
// Global state is always available
const currentState = window.MeDocProAPI.clinicalWorkspace.state;

// Current patient counts
const totalPatients = currentState.totalPatients;
const admissions = currentState.admissions;

// Modal states  
const isDailyInfoOpen = currentState.dailyInfoModalOpen;
const isPreviewOpen = currentState.previewModalOpen;
```

## 🎮 Keyboard Navigation

All interactive elements support keyboard navigation:

- **Tab** - Navigate between elements
- **Enter/Space** - Activate buttons and links  
- **Arrow Keys** - Navigate within lists and grids
- **Escape** - Close modals and dropdowns

### Programmatic Keyboard Events
```javascript
// Simulate keyboard navigation
const element = document.querySelector('#stat-total-patients');
element.focus();
element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
```

## 🔍 Element Discovery Patterns

### Finding Actionable Elements
```javascript
// All clickable elements
const clickable = document.querySelectorAll('[data-ai-action]');

// Specific action types
const buttons = document.querySelectorAll('[data-ai-action*="button"]');
const links = document.querySelectorAll('[data-ai-action*="view"]');
const modals = document.querySelectorAll('[data-ai-action*="modal"]');

// Elements by component type
const statCards = document.querySelectorAll('[data-ai-component="stat-card"]'); 
const patientRows = document.querySelectorAll('[data-ai-component="patient-row"]');
const forms = document.querySelectorAll('[data-ai-component*="form"]');
```

### Data Extraction Patterns
```javascript
// Extract current values
const getValue = (selector) => {
  const element = document.querySelector(selector);
  return element?.dataset.aiValue || element?.textContent?.trim();
};

// Patient statistics
const stats = {
  total: getValue('#stat-total-patients [data-ai-element="stat-value"]'),
  admissions: getValue('#stat-admissions [data-ai-element="stat-value"]'),
  followUps: getValue('#stat-followups [data-ai-element="stat-value"]'),
  discharges: getValue('#stat-discharges [data-ai-element="stat-value"]')
};
```

## 📋 Common Automation Workflows

### 1. View Patient Statistics
```javascript
// Method 1: Using API
const state = await api.getWorkspaceState();
const stats = state.workspace.patients;

// Method 2: Direct DOM access  
const totalPatients = document.querySelector('#stat-total-patients').dataset.aiValue;
```

### 2. Select a Patient (SOLVES YOUR ISSUE)
```javascript
// Method 1: Using AI API (RECOMMENDED)
await api.selectPatient('John Doe'); // by name
await api.selectPatient(123); // by patient ID  
await api.selectPatient('101A'); // by room number

// Method 2: Direct DOM selection
await api.clickElement('[data-ai-patient-name*="John"]');
await api.clickElement('[data-ai-patient-room="101A"]');
await api.clickElement('#patient-row-123');

// Method 3: Multiple patients
await api.selectPatients({ workflow: 'admission' });
```

### 3. Open Daily Information Entry
```javascript
// Method 1: Using API
await api.clickElement('[data-ai-action="enter-daily-info"]');

// Method 2: Direct event simulation
const dailyInfoBtn = document.querySelector('[data-ai-action="enter-daily-info"]');
dailyInfoBtn?.click();
```

### 3. Generate Documents for All Admission Patients
```javascript
// Complete workflow
const admissionPatients = await api.getPatients({ workflow: 'admission' });
const patientIds = admissionPatients.patients.map(p => p.id);

await api.generateDocument({
  templateId: 1, // Progress Note template
  patientIds,
  aiEnhancement: true,
  format: 'pdf'
});
```

### 4. Monitor Patient Census Changes
```javascript
let previousTotal = 0;

api.watchWorkspaceChanges((state) => {
  const currentTotal = state.workspace.patients.total;
  
  if (currentTotal > previousTotal) {
    console.log(`New patient added. Total: ${currentTotal}`);
    // Trigger automated response...
  } else if (currentTotal < previousTotal) {
    console.log(`Patient discharged. Total: ${currentTotal}`);
  }
  
  previousTotal = currentTotal;
});
```

## 🛡️ Error Handling and Reliability

### Robust Element Selection
```javascript
// Wait for elements to be available
const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element not found: ${selector}`));
    }, timeout);
  });
};
```

### API Call Reliability
```javascript
// Retry mechanism for API calls
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      if (result.success) return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Usage
const patients = await retryOperation(() => api.getPatients());
```

## 🎯 Best Practices for AI Agents

### 1. **Always Check State First**
```javascript
// Before performing actions, verify the workspace is ready
const state = await api.getWorkspaceState();
if (state.workspace.state !== 'ready') {
  console.log('Workspace not ready, waiting...');
  // Implement retry logic
}
```

### 2. **Use Semantic Selectors**
```javascript
// Prefer data-ai attributes over CSS classes or generic selectors
// ✅ Good
await api.clickElement('[data-ai-action="enter-daily-info"]');

// ❌ Avoid
await api.clickElement('.btn.btn-primary'); // May break with styling changes
```

### 3. **Handle Asynchronous Operations**
```javascript
// Wait for modals to open/close
await api.clickElement('[data-ai-action="enter-daily-info"]');
await waitForElement('#daily-info-modal[data-ai-modal-state="open"]');

// Now interact with modal content
```

### 4. **Batch Related Operations**
```javascript
// Group related operations for better performance
const operations = [
  { type: 'get-patients', filters: { workflow: 'admission' } },
  { type: 'click', selector: '[data-ai-action="generate-documents"]' },
  { type: 'fill-form', formSelector: '#doc-options', data: {...} }
];

await api.executeBatchOperation(operations);
```

### 5. **Monitor for Changes**
```javascript
// Set up monitoring before performing operations
const observer = api.watchWorkspaceChanges((state) => {
  // React to state changes
});

// Perform operations...

// Clean up when done
observer.disconnect();
```

## 🔮 Future-Proofing Considerations

### Selector Stability
- **Semantic attributes (`data-ai-*`)** are guaranteed to remain stable across UI updates
- **IDs and component names** follow consistent naming conventions
- **API methods** are versioned and backwards-compatible

### Extensibility
- New features will follow the same `data-ai-*` attribute patterns
- API methods will maintain consistent parameter and response structures
- Additional capabilities will be added to the global `MeDocProAI` object

### Version Compatibility
```javascript
// Check API version compatibility
const apiVersion = api.version;
if (apiVersion < '1.0.0') {
  console.warn('API version may not support all features');
}
```

## 🆘 Troubleshooting

### Common Issues and Solutions

#### Element Not Found
```javascript
// Use more specific selectors or wait for elements
const element = await waitForElement('[data-ai-component="patient-census"]');
```

#### API Calls Failing  
```javascript
// Check authentication and connectivity
const token = localStorage.getItem('token');
if (!token) {
  console.error('No authentication token found');
  // Handle re-authentication...
}
```

#### Modal Not Opening
```javascript
// Ensure workspace is in correct state
const state = await api.getWorkspaceState();
if (state.workspace.patients.total === 0) {
  console.log('No patients available for daily info entry');
}
```

### Debug Mode
```javascript
// Enable verbose logging
window.MeDocProAI.debug = true;

// All API calls will now log detailed information
```

## 📞 Support and Updates

- **API Version**: Check `window.MeDocProAI.version`
- **Capabilities**: Call `window.MeDocProAI.getCapabilities()`  
- **Usage Examples**: Call `window.MeDocProAI.getUsageExamples()`
- **Documentation**: This document is embedded in the application and kept up-to-date

---

*This interface is specifically designed for compatibility with Perplexity Comet browser and other AI automation tools. The semantic structure and standardized patterns ensure reliable automation that survives UI changes and updates.*