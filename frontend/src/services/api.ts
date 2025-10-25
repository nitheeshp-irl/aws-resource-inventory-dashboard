import axios, { AxiosResponse } from 'axios';
import { ApiResponse, AccountConfig, ResourcesResponse, ResourceSummary, FilterOptions } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  healthCheck: async (): Promise<ApiResponse> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Account endpoints
  accounts: {
    getAll: async (): Promise<ApiResponse<AccountConfig[]>> => {
      const response = await api.get('/accounts');
      return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<AccountConfig>> => {
      const response = await api.get(`/accounts/${id}`);
      return response.data;
    },

    create: async (account: Partial<AccountConfig>): Promise<ApiResponse<AccountConfig>> => {
      const response = await api.post('/accounts', account);
      return response.data;
    },

    update: async (id: string, account: Partial<AccountConfig>): Promise<ApiResponse<AccountConfig>> => {
      const response = await api.put(`/accounts/${id}`, account);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await api.delete(`/accounts/${id}`);
      return response.data;
    },

    testConnection: async (id: string): Promise<ApiResponse<{ connected: boolean }>> => {
      const response = await api.post(`/accounts/${id}/test`);
      return response.data;
    },
  },

  // Resource endpoints
  resources: {
    getAll: async (filters?: FilterOptions): Promise<ApiResponse<ResourcesResponse>> => {
      const params = new URLSearchParams();
      
      if (filters?.accountIds) {
        filters.accountIds.forEach(id => params.append('accountIds', id));
      }
      if (filters?.regions) {
        filters.regions.forEach(region => params.append('regions', region));
      }
      if (filters?.resourceTypes) {
        filters.resourceTypes.forEach(type => params.append('resourceTypes', type));
      }
      if (filters?.statuses) {
        filters.statuses.forEach(status => params.append('statuses', status));
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await api.get(`/resources?${params.toString()}`);
      return response.data;
    },

    getByAccount: async (accountId: string, filters?: FilterOptions): Promise<ApiResponse<ResourcesResponse>> => {
      const params = new URLSearchParams();
      
      if (filters?.resourceTypes) {
        filters.resourceTypes.forEach(type => params.append('resourceTypes', type));
      }
      if (filters?.statuses) {
        filters.statuses.forEach(status => params.append('statuses', status));
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await api.get(`/resources/account/${accountId}?${params.toString()}`);
      return response.data;
    },

    getSummary: async (filters?: FilterOptions): Promise<ApiResponse<ResourceSummary>> => {
      const params = new URLSearchParams();
      
      if (filters?.accountIds) {
        filters.accountIds.forEach(id => params.append('accountIds', id));
      }

      const response = await api.get(`/resources/summary?${params.toString()}`);
      return response.data;
    },

    refreshAll: async (): Promise<ApiResponse> => {
      const response = await api.post('/resources/refresh');
      return response.data;
    },

    refreshByAccount: async (accountId: string): Promise<ApiResponse> => {
      const response = await api.post(`/resources/refresh/${accountId}`);
      return response.data;
    },
  },
};

export default api;
