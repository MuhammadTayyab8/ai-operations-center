import { apiClient } from './client';

export const dashboardApi = {
  getMetrics: () => apiClient.get('/api/v1/dashboard/metrics').then(r => r.data),
  getMonthlySales: (year?: number) =>
    apiClient.get('/api/v1/dashboard/monthly-sales', { params: year ? { year } : {} }).then(r => r.data),
  getWeeklySales: () => apiClient.get('/api/v1/dashboard/weekly-sales').then(r => r.data),
  getLowStock: () => apiClient.get('/api/v1/dashboard/low-stock').then(r => r.data),
  getHighDemand: () => apiClient.get('/api/v1/dashboard/high-demand').then(r => r.data),
  getCRM: () => apiClient.get('/api/v1/dashboard/crm').then(r => r.data),
};

export const productsApi = {
  getAll: () => apiClient.get('/api/v1/products').then(r => r.data),
  create: (data: any) => apiClient.post('/api/v1/products', data).then(r => r.data),
  update: (id: number, data: any) => apiClient.put(`/api/v1/products/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/api/v1/products/${id}`),
};

export const salesApi = {
  getAll: () => apiClient.get('/api/v1/sales').then(r => r.data),
  create: (data: any) => apiClient.post('/api/v1/sales', data).then(r => r.data),
  update: (id: number, data: any) => apiClient.put(`/api/v1/sales/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/api/v1/sales/${id}`),
};

export const campaignsApi = {
  getAll: () => apiClient.get('/api/v1/campaigns').then(r => r.data),
  create: (data: any) => apiClient.post('/api/v1/campaigns', data).then(r => r.data),
  update: (id: number, data: any) => apiClient.put(`/api/v1/campaigns/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/api/v1/campaigns/${id}`),
};

export const workflowsApi = {
  trigger: async (user_input: string, category?: string, fileUri?: string, fileName?: string, fileType?: string) => {
    const formData = new FormData();
    if (user_input) formData.append('user_input', user_input);
    if (category) formData.append('category', category);
    
    if (fileUri && fileName) {
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType || 'application/octet-stream',
      } as any);
    }
    
    return apiClient.post('/api/v1/workflows/trigger', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },
  getStatus: (id: string) => apiClient.get(`/api/v1/workflows/${id}/status`).then(r => r.data),
  approve: (id: string, approved: boolean) => apiClient.post(`/api/v1/workflows/${id}/approve`, { approved }).then(r => r.data),
  getAll: () => apiClient.get('/api/v1/workflows/').then(r => r.data),
};
