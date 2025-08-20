/**
 * AI Agent API Service - Standardized interface for browser-based AI automation
 * Designed for compatibility with Perplexity Comet and other AI browser agents
 * Future-proof with semantic actions and predictable response patterns
 */

import apiService from './api.js';

class AIAgentAPI {
  constructor() {
    this.baseURL = apiService.baseURL;
    this.version = '1.0.0';
    this.capabilities = [
      'patient-management',
      'document-generation',
      'daily-information',
      'clinical-workflow',
      'data-query',
      'state-monitoring'
    ];
    
    // Expose global API for browser automation
    if (typeof window !== 'undefined') {
      window.MeDocProAI = this;
    }
  }

  /**
   * Get current workspace state with all relevant context
   * @returns {Promise<Object>} Complete workspace state
   */
  async getWorkspaceState() {
    try {
      const [censusResponse, templatesResponse] = await Promise.all([
        this.makeRequest('/api/patient-census/today'),
        this.makeRequest('/api/templates')
      ]);

      const census = censusResponse.success ? censusResponse.census : null;
      const templates = templatesResponse.success ? templatesResponse.templates : [];

      return {
        success: true,
        timestamp: new Date().toISOString(),
        workspace: {
          state: 'ready',
          patients: {
            total: census?.rows?.length || 0,
            active: census?.rows?.filter(p => p.status === 'active').length || 0,
            admissions: census?.rows?.filter(p => p.workflow_type === 'admission').length || 0,
            followUps: census?.rows?.filter(p => p.workflow_type === 'follow-up').length || 0,
            discharges: census?.rows?.filter(p => p.workflow_type === 'discharge').length || 0,
            list: census?.rows || []
          },
          templates: {
            count: templates.length,
            available: templates.map(t => ({
              id: t.id,
              name: t.name,
              type: t.template_type,
              placeholders: t.placeholders?.length || 0
            }))
          },
          capabilities: this.capabilities,
          version: this.version
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Patient Management Actions
   */

  /**
   * Select a patient in the UI (for batch operations)
   * @param {string|number} identifier - Patient ID, name, or room number
   * @returns {Promise<Object>} Selection result
   */
  async selectPatient(identifier) {
    try {
      // Find patient element by various methods
      let element = null;
      
      // Try by patient ID first
      if (typeof identifier === 'number' || !isNaN(identifier)) {
        element = document.querySelector(`[data-ai-patient-id="${identifier}"]`);
      }
      
      // Try by patient name (partial match)
      if (!element && typeof identifier === 'string') {
        const elements = document.querySelectorAll('[data-ai-component="patient-row"]');
        element = Array.from(elements).find(el => 
          el.dataset.aiPatientName?.toLowerCase().includes(identifier.toLowerCase())
        );
      }
      
      // Try by room number
      if (!element && typeof identifier === 'string') {
        element = document.querySelector(`[data-ai-patient-room="${identifier}"]`);
      }
      
      if (!element) {
        return {
          success: false,
          error: `Patient not found: ${identifier}. Available patients: ${this.getAvailablePatients()}`
        };
      }

      // Select the patient
      element.focus();
      element.click();
      
      // Verify selection
      const isSelected = element.dataset.aiSelected === 'true';
      
      return {
        success: true,
        action: 'select-patient',
        patientId: element.dataset.aiPatientId,
        patientName: element.dataset.aiPatientName,
        room: element.dataset.aiPatientRoom,
        selected: isSelected,
        element: this.describeElement(element)
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Select multiple patients by various criteria
   * @param {Object} criteria - Selection criteria
   * @returns {Promise<Object>} Selection results
   */
  async selectPatients(criteria = {}) {
    const results = [];
    let selector = '[data-ai-component="patient-row"]';
    
    // Build selector based on criteria
    if (criteria.workflow) {
      selector += `[data-ai-workflow-type="${criteria.workflow}"]`;
    }
    if (criteria.completed !== undefined) {
      selector += `[data-ai-completed="${criteria.completed}"]`;
    }
    if (criteria.priorityColor) {
      selector += `[data-ai-priority-color="${criteria.priorityColor}"]`;
    }
    
    const elements = document.querySelectorAll(selector);
    
    for (const element of elements) {
      // Apply name filter if specified
      if (criteria.nameContains) {
        const patientName = element.dataset.aiPatientName?.toLowerCase() || '';
        if (!patientName.includes(criteria.nameContains.toLowerCase())) {
          continue;
        }
      }
      
      // Apply room filter if specified
      if (criteria.room) {
        if (element.dataset.aiPatientRoom !== criteria.room) {
          continue;
        }
      }
      
      // Select the patient
      element.focus();
      element.click();
      
      results.push({
        patientId: element.dataset.aiPatientId,
        patientName: element.dataset.aiPatientName,
        room: element.dataset.aiPatientRoom,
        selected: element.dataset.aiSelected === 'true'
      });
      
      // Add small delay between selections
      if (criteria.delay) {
        await new Promise(resolve => setTimeout(resolve, criteria.delay));
      }
    }
    
    return {
      success: true,
      action: 'select-multiple-patients',
      selected: results.length,
      patients: results
    };
  }

  /**
   * Get list of available patients for selection
   * @returns {Array} Available patient identifiers
   */
  getAvailablePatients() {
    const elements = document.querySelectorAll('[data-ai-component="patient-row"]');
    return Array.from(elements).map(el => ({
      id: el.dataset.aiPatientId,
      name: el.dataset.aiPatientName,
      room: el.dataset.aiPatientRoom,
      workflow: el.dataset.aiWorkflowType,
      selected: el.dataset.aiSelected === 'true',
      completed: el.dataset.aiCompleted === 'true'
    }));
  }

  async getPatients(filters = {}) {
    const response = await this.makeRequest('/api/patient-census/today');
    if (!response.success) return response;

    let patients = response.census?.rows || [];

    // Apply filters
    if (filters.workflow) {
      patients = patients.filter(p => p.workflow_type === filters.workflow);
    }
    if (filters.status) {
      patients = patients.filter(p => p.status === filters.status);
    }
    if (filters.room) {
      patients = patients.filter(p => p.room_number === filters.room);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      patients = patients.filter(p => 
        p.patient_name?.toLowerCase().includes(search) ||
        p.room_number?.includes(search)
      );
    }

    return {
      success: true,
      patients: patients.map(this.formatPatientData),
      count: patients.length,
      filters: filters
    };
  }

  async getPatient(identifier) {
    const response = await this.getPatients();
    if (!response.success) return response;

    const patient = response.patients.find(p => 
      p.id == identifier || 
      p.room_number === identifier ||
      p.patient_name?.toLowerCase().includes(identifier.toLowerCase())
    );

    if (!patient) {
      return {
        success: false,
        error: `Patient not found: ${identifier}`
      };
    }

    // Get daily information for this patient
    try {
      const dailyInfoResponse = await this.makeRequest(`/api/daily-info/${patient.id}`);
      patient.dailyInformation = dailyInfoResponse.success ? dailyInfoResponse.daily_info : null;
    } catch (error) {
      patient.dailyInformation = null;
    }

    return {
      success: true,
      patient
    };
  }

  async updatePatientWorkflow(patientId, workflowType, notes = '') {
    return await this.makeRequest(`/api/patient-census/rows/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify({
        workflow_type: workflowType,
        notes: notes
      })
    });
  }

  /**
   * Document Generation Actions
   */
  async generateDocument(options = {}) {
    const {
      templateId,
      patientIds = [],
      aiEnhancement = false,
      format = 'pdf'
    } = options;

    if (!templateId) {
      return {
        success: false,
        error: 'Template ID is required'
      };
    }

    if (patientIds.length === 0) {
      return {
        success: false,
        error: 'At least one patient must be selected'
      };
    }

    return await this.makeRequest('/api/generate-documents', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        patient_ids: patientIds,
        ai_enhancement: aiEnhancement,
        export_format: format
      })
    });
  }

  async getDocumentHistory(limit = 10, filters = {}) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...filters
    });

    return await this.makeRequest(`/api/recent-documents?${params}`);
  }

  /**
   * Daily Information Management
   */
  async getDailyInformation(patientId, date = null) {
    const endpoint = date 
      ? `/api/daily-info/${patientId}?date=${date}`
      : `/api/daily-info/${patientId}`;
    
    return await this.makeRequest(endpoint);
  }

  async updateDailyInformation(patientId, data) {
    return await this.makeRequest('/api/daily-info', {
      method: 'POST',
      body: JSON.stringify({
        patient_census_row_id: patientId,
        ...data
      })
    });
  }

  async getAllTodayDailyInfo() {
    return await this.makeRequest('/api/daily-info/today');
  }

  /**
   * Template Management
   */
  async getTemplates() {
    return await this.makeRequest('/api/templates');
  }

  async getTemplate(templateId) {
    return await this.makeRequest(`/api/templates/${templateId}`);
  }

  /**
   * UI Automation Helpers - Direct DOM manipulation for AI agents
   */
  async clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`
      };
    }

    // Trigger both click and keyboard events for maximum compatibility
    element.focus();
    element.click();
    
    // Dispatch synthetic events
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    return {
      success: true,
      action: 'click',
      selector,
      element: this.describeElement(element)
    };
  }

  async fillForm(formSelector, data) {
    const form = document.querySelector(formSelector);
    if (!form) {
      return {
        success: false,
        error: `Form not found: ${formSelector}`
      };
    }

    const results = [];
    for (const [field, value] of Object.entries(data)) {
      const input = form.querySelector(`[name="${field}"], #${field}, [data-ai-field="${field}"]`);
      if (input) {
        input.focus();
        input.value = value;
        
        // Trigger change events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        results.push({
          field,
          value,
          success: true
        });
      } else {
        results.push({
          field,
          value,
          success: false,
          error: 'Field not found'
        });
      }
    }

    return {
      success: true,
      action: 'fill-form',
      formSelector,
      results
    };
  }

  /**
   * State Monitoring - Real-time workspace state changes
   */
  watchWorkspaceChanges(callback) {
    // Monitor MutationObserver for DOM changes
    const observer = new MutationObserver((mutations) => {
      const relevantChange = mutations.some(mutation => 
        mutation.target.dataset?.aiComponent ||
        mutation.target.closest('[data-ai-component]')
      );

      if (relevantChange) {
        this.getWorkspaceState().then(state => {
          callback(state);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ai-state', 'data-ai-value', 'aria-label']
    });

    return observer;
  }

  /**
   * Batch Operations - Multi-step automation workflows
   */
  async executeBatchOperation(operations) {
    const results = [];
    
    for (const [index, operation] of operations.entries()) {
      try {
        let result;
        
        switch (operation.type) {
          case 'get-patients':
            result = await this.getPatients(operation.filters);
            break;
          case 'update-patient':
            result = await this.updatePatientWorkflow(
              operation.patientId, 
              operation.workflowType, 
              operation.notes
            );
            break;
          case 'generate-document':
            result = await this.generateDocument(operation.options);
            break;
          case 'click':
            result = await this.clickElement(operation.selector);
            break;
          case 'fill-form':
            result = await this.fillForm(operation.formSelector, operation.data);
            break;
          default:
            result = {
              success: false,
              error: `Unknown operation type: ${operation.type}`
            };
        }

        results.push({
          operation: operation.type,
          index,
          ...result
        });

        // Stop on first failure if specified
        if (!result.success && operation.stopOnFailure) {
          break;
        }

        // Add delay between operations if specified
        if (operation.delay) {
          await new Promise(resolve => setTimeout(resolve, operation.delay));
        }

      } catch (error) {
        results.push({
          operation: operation.type,
          index,
          success: false,
          error: error.message
        });

        if (operation.stopOnFailure) {
          break;
        }
      }
    }

    return {
      success: results.every(r => r.success),
      results,
      completed: results.length,
      total: operations.length
    };
  }

  /**
   * Utility Methods
   */
  formatPatientData(patient) {
    return {
      id: patient.id,
      name: patient.patient_name,
      room: patient.room_number,
      workflow: patient.workflow_type,
      status: patient.status,
      dateAdded: patient.date_added,
      lastUpdated: patient.last_updated,
      // AI-friendly metadata
      selectors: {
        row: `[data-ai-patient-id="${patient.id}"]`,
        name: `[data-ai-patient-id="${patient.id}"] [data-ai-element="patient-name"]`,
        room: `[data-ai-patient-id="${patient.id}"] [data-ai-element="room-number"]`,
        workflow: `[data-ai-patient-id="${patient.id}"] [data-ai-element="workflow-type"]`
      }
    };
  }

  describeElement(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label'),
      dataAiComponent: element.dataset.aiComponent,
      dataAiAction: element.dataset.aiAction,
      text: element.textContent?.trim().substring(0, 100) || ''
    };
  }

  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        ...data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  /**
   * Help and Documentation
   */
  getCapabilities() {
    return {
      version: this.version,
      capabilities: this.capabilities,
      endpoints: {
        workspace: {
          getState: 'getWorkspaceState()',
          watchChanges: 'watchWorkspaceChanges(callback)'
        },
        patients: {
          getAll: 'getPatients(filters)',
          getOne: 'getPatient(identifier)',
          update: 'updatePatientWorkflow(id, type, notes)'
        },
        documents: {
          generate: 'generateDocument(options)',
          getHistory: 'getDocumentHistory(limit, filters)'
        },
        dailyInfo: {
          get: 'getDailyInformation(patientId, date)',
          update: 'updateDailyInformation(patientId, data)',
          getAllToday: 'getAllTodayDailyInfo()'
        },
        automation: {
          click: 'clickElement(selector)',
          fillForm: 'fillForm(selector, data)',
          batch: 'executeBatchOperation(operations)'
        }
      },
      selectors: {
        workspace: '#clinical-workspace',
        patientCensus: '#patient-census-section',
        batchDocuments: '#batch-documentation-section',
        statCards: '[data-ai-component="stat-card"]',
        patients: '[data-ai-component="patient-row"]',
        modals: '[data-ai-component*="modal"]'
      }
    };
  }

  getUsageExamples() {
    return {
      'Get all patients': 'await MeDocProAI.getPatients()',
      'Get admission patients': 'await MeDocProAI.getPatients({ workflow: "admission" })',
      'Find patient by name': 'await MeDocProAI.getPatient("John Doe")',
      'Select patient by name': 'await MeDocProAI.selectPatient("John Doe")',
      'Select patient by ID': 'await MeDocProAI.selectPatient(123)',
      'Select patient by room': 'await MeDocProAI.selectPatient("101A")',
      'Select all admission patients': 'await MeDocProAI.selectPatients({ workflow: "admission" })',
      'Select patients with priority': 'await MeDocProAI.selectPatients({ priorityColor: "red" })',
      'Get available patients': 'MeDocProAI.getAvailablePatients()',
      'Generate document': 'await MeDocProAI.generateDocument({ templateId: 1, patientIds: [1,2,3] })',
      'Update patient workflow': 'await MeDocProAI.updatePatientWorkflow(1, "discharge", "Ready for discharge")',
      'Click daily info button': 'await MeDocProAI.clickElement("[data-ai-action=\\"enter-daily-info\\"]")',
      'Watch workspace changes': 'MeDocProAI.watchWorkspaceChanges(state => console.log(state))',
      'Batch operation': 'await MeDocProAI.executeBatchOperation([{type: "get-patients"}, {type: "click", selector: "#btn"}])'
    };
  }
}

// Initialize and expose globally
const aiAgentAPI = new AIAgentAPI();

export default aiAgentAPI;