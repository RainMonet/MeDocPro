// medocpro-dashboard/src/services/api.js
// API service for communicating with MeDocPro backend

const API_BASE_URL = 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to get headers with authentication
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
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
    const response = await fetch(`${this.baseURL}/api/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(templateData),
    });
    
    return this.handleResponse(response);
  }

  async updateTemplate(templateId, templateData) {
    const response = await fetch(`${this.baseURL}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(templateData),
    });
    
    return this.handleResponse(response);
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
    const response = await fetch(`${this.baseURL}/api/ai/ollama/status`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
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
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };