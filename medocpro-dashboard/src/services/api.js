// API configuration and base client
const API_BASE_URL = 'http://localhost:5000';

// Create axios-like HTTP client using fetch
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Health API
export const healthApi = {
  getHealth: () => apiClient.get('/health'),
  getReadiness: () => apiClient.get('/ready'),
};

// Templates API
export const templatesApi = {
  getTemplates: (params = {}) => apiClient.get('/api/templates', params),
  getTemplate: (id) => apiClient.get(`/api/templates/${id}`),
  createTemplate: (data) => apiClient.post('/api/templates', data),
  updateTemplate: (id, data) => apiClient.put(`/api/templates/${id}`, data),
  deleteTemplate: (id) => apiClient.delete(`/api/templates/${id}`),
  populateTemplate: (id, data) => apiClient.post(`/api/templates/${id}/populate`, data),
  getCategories: () => apiClient.get('/api/templates/categories'),
};

// Auth API (placeholder for future implementation)
export const authApi = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  logout: () => apiClient.post('/api/auth/logout'),
  getCurrentUser: () => apiClient.get('/api/auth/me'),
};

// Audit API (placeholder for future implementation)
export const auditApi = {
  getAuditLogs: (params = {}) => apiClient.get('/api/audit', params),
};

export default apiClient;

