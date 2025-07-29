// medocpro-dashboard/src/services/api.js
// API service for communicating with MeDocPro backend

// Environment-based API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const DEBUG_MODE = import.meta.env.VITE_DEBUG === 'true';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Helper method to get headers with authentication
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      // Always get fresh token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Helper method to handle API responses with automatic token refresh
  async handleResponse(response, originalRequest = null) {
    const data = await response.json();
    
    // Debug logging in development
    if (DEBUG_MODE) {
      console.log(`🌐 API Response [${response.status}]:`, response.url, data);
    }
    
    if (!response.ok) {
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && originalRequest) {
        if (DEBUG_MODE) console.log('🔄 401 Unauthorized - attempting token refresh');
        
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.access_token) {
                this.setToken(refreshData.access_token);
                console.log('Token refreshed successfully');
                
                // Retry the original request with new token
                const retryResponse = await fetch(originalRequest.url, {
                  ...originalRequest,
                  headers: {
                    ...originalRequest.headers,
                    'Authorization': `Bearer ${refreshData.access_token}`
                  }
                });
                
                if (retryResponse.ok) {
                  return await retryResponse.json();
                }
              }
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }
        
        // If refresh fails, redirect to login
        console.log('Token refresh failed, redirecting to login');
        this.setToken(null);
        window.location.reload(); // Force re-login
      }
      
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Authentication endpoints
  async login(username, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ username, password }),
    });
    
    const data = await this.handleResponse(response);
    
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    
    return data;
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      this.setToken(null);
    }
  }

  async refreshToken(refreshToken) {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    const data = await this.handleResponse(response);
    
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    
    return data;
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async updateProfile(profileData) {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    
    return this.handleResponse(response);
  }

  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${this.baseURL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      }),
    });
    
    return this.handleResponse(response);
  }

  async getPasswordRequirements() {
    const response = await fetch(`${this.baseURL}/auth/password-requirements`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    
    return this.handleResponse(response);
  }

  // Template endpoints
  async getTemplates(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${this.baseURL}/api/templates?${searchParams}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getTemplate(templateId) {
    const response = await fetch(`${this.baseURL}/api/templates/${templateId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createTemplate(templateData) {
    console.log('Creating template with data:', templateData);
    const response = await fetch(`${this.baseURL}/api/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(templateData),
    });
    
    const result = await this.handleResponse(response);
    console.log('Create template response:', result);
    return result;
  }

  async updateTemplate(templateId, templateData) {
    console.log('Updating template', templateId, 'with data:', templateData);
    const response = await fetch(`${this.baseURL}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(templateData),
    });
    
    const result = await this.handleResponse(response);
    console.log('Update template response:', result);
    return result;
  }

  async deleteTemplate(templateId) {
    const response = await fetch(`${this.baseURL}/api/templates/${templateId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async populateTemplate(templateId, populationData) {
    const response = await fetch(`${this.baseURL}/api/templates/${templateId}/populate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(populationData),
    });
    
    return this.handleResponse(response);
  }

  async getTemplateCategories() {
    const response = await fetch(`${this.baseURL}/api/templates/categories`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getTemplateStatistics() {
    const response = await fetch(`${this.baseURL}/api/templates/statistics`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // AI Enhancement endpoints
  async enhanceText(enhancementData) {
    const response = await fetch(`${this.baseURL}/api/ai/enhance`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(enhancementData),
    });
    
    return this.handleResponse(response);
  }

  // Ollama AI Enhancement endpoints
  async checkOllamaStatus() {
    const response = await fetch(`${this.baseURL}/health/ai`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    const result = await this.handleResponse(response);
    
    // Convert health endpoint response to expected format
    if (result && result.status) {
      return {
        status: result.status === 'healthy' ? 'online' : 'offline',
        models: result.models || [],
        latency: result.latency_ms || 0
      };
    }
    
    return { status: 'offline' };
  }

  async enhanceContentWithOllama(enhancementRequest) {
    const response = await fetch(`${this.baseURL}/api/ai/ollama/enhance`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(enhancementRequest),
    });
    
    return this.handleResponse(response);
  }

  async getOllamaModels() {
    const response = await fetch(`${this.baseURL}/api/ai/ollama/models`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async spellCheck(text) {
    const response = await fetch(`${this.baseURL}/api/ai/spell-check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });
    
    return this.handleResponse(response);
  }

  async grammarCheck(text) {
    const response = await fetch(`${this.baseURL}/api/ai/grammar-check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });
    
    return this.handleResponse(response);
  }

  // Health and system endpoints
  async getHealth() {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    
    return this.handleResponse(response);
  }

  async getStatus() {
    const response = await fetch(`${this.baseURL}/status`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    
    return this.handleResponse(response);
  }

  async getReady() {
    const response = await fetch(`${this.baseURL}/ready`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    
    return this.handleResponse(response);
  }

  // User management endpoints (admin only)
  async getUsers(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${this.baseURL}/api/users?${searchParams}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createUser(userData) {
    const response = await fetch(`${this.baseURL}/api/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse(response);
  }

  async updateUser(userId, userData) {
    const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse(response);
  }

  async deleteUser(userId) {
    const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Patient Census endpoints
  async getPatientCensusToday() {
    const response = await fetch(`${this.baseURL}/api/patient-census/today`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async addPatientToCensus(censusId, patientData) {
    const response = await fetch(`${this.baseURL}/api/patient-census/${censusId}/rows`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(patientData),
    });
    
    return this.handleResponse(response);
  }

  async updatePatientInCensus(patientId, updates) {
    const response = await fetch(`${this.baseURL}/api/patient-census/rows/${patientId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    
    return this.handleResponse(response);
  }

  async deletePatientFromCensus(patientId) {
    const response = await fetch(`${this.baseURL}/api/patient-census/rows/${patientId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // User management endpoints
  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/api/users/current`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async listUsers() {
    const response = await fetch(`${this.baseURL}/api/users/list`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createUser(userData) {
    const response = await fetch(`${this.baseURL}/api/users/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse(response);
  }

  async switchUser(userId) {
    const response = await fetch(`${this.baseURL}/api/users/switch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user_id: userId }),
    });
    
    return this.handleResponse(response);
  }

  async updateUser(userId, userData) {
    const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse(response);
  }

  // Audit endpoints (admin only)
  async getAuditLogs(params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${this.baseURL}/api/audit/logs?${searchParams}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async getAuditReports(reportType, params = {}) {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`${this.baseURL}/api/audit/reports/${reportType}?${searchParams}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async exportAuditLogs(exportData) {
    const response = await fetch(`${this.baseURL}/api/audit/export`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(exportData),
    });
    
    return this.handleResponse(response);
  }

  // AI Enhancement endpoints
  async enhanceText(enhancementData) {
    const response = await fetch(`${this.baseURL}/api/ai/enhance`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        text: enhancementData.text,
        enhancement_type: enhancementData.enhancement_type || 'clinical',
        intensity: enhancementData.intensity || 50,
        style: enhancementData.style || 'professional',
        model: enhancementData.model || 'mistral:latest',
        include_spell_check: enhancementData.include_spell_check || true,
        include_grammar_check: enhancementData.include_grammar_check || true,
        preserve_structure: enhancementData.preserve_structure || true
      }),
    });
    
    return this.handleResponse(response);
  }

  async spellCheck(text) {
    const response = await fetch(`${this.baseURL}/api/ai/spell-check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });
    
    return this.handleResponse(response);
  }

  async grammarCheck(text) {
    const response = await fetch(`${this.baseURL}/api/ai/grammar-check`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text }),
    });
    
    return this.handleResponse(response);
  }

  // Generic HTTP methods for direct API calls
  async get(url, params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async post(url, data = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async put(url, data = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse(response);
  }

  async delete(url) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };
