import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
  if (!token && !isAuthEndpoint) {
    console.debug('Request without token:', config.url);
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    
    
    if (error.response?.status === 401) {
      const isOnAuthPage = window.location.pathname.includes('/login') || 
                           window.location.pathname.includes('/register') ||
                           window.location.pathname.includes('/signup');
      
      
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      const errorDetail = error.response?.data?.detail || 'Authentication failed';
      
      
      
      
      
      
      if (!isOnAuthPage && localStorage.getItem('token') && !isAuthEndpoint) {
        console.warn('Session expired or invalid token:', errorDetail);
        
        
        if (errorDetail.includes('credentials') || errorDetail.includes('token') || errorDetail.includes('expired')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login/json', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  getMe: () => api.get('/auth/me'),
};

export const recipientAPI = {
  
  getMyRequests: () => api.get('/food-requests/my'),
  createRequest: (data) => api.post('/food-requests/', data),
};

export const contributorAPI = {
  getMyContributions: () => api.get('/donations/my'),
  createDonation: (data) => api.post('/donations/', data),
  getCustomRequests: (params = {}) => api.get('/food-requests/', { params }),
  approveCustomRequest: (id) => api.post(`/food-requests/${id}/approve`),
  rejectCustomRequest: (id) => api.post(`/food-requests/${id}/reject`),
};

export const volunteerAPI = {
  getDeliveries: () => api.get('/volunteer/deliveries'),
  acceptDelivery: (id) => api.post(`/volunteer/deliveries/${id}/accept`),
};

export const claimsAPI = {
  createClaim: (data) => api.post('/claims/', data),
  getMyClaims: () => api.get('/claims/my'),
  getClaim: (id) => api.get(`/claims/${id}`),
};

export const adminAPI = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  getFoodRequests: (params = {}) => api.get('/admin/food-requests', { params }),
  getFoodRequest: (id) => api.get(`/admin/food-requests/${id}`),
  approveFoodRequest: (id) => api.post(`/admin/food-requests/${id}/approve`),
  rejectFoodRequest: (id) => api.post(`/admin/food-requests/${id}/reject`),
  
  getCustomRequests: (params = {}) => api.get('/food-requests/', { params }),
  
  getZakatRequests: (params = {}) => api.get('/admin/zakat-requests', { params }),
  getZakatRequest: (id) => api.get(`/admin/zakat-requests/${id}`),
  approveZakatRequest: (id) => api.post(`/admin/zakat-requests/${id}/approve`),
  rejectZakatRequest: (id) => api.post(`/admin/zakat-requests/${id}/reject`),
};

export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications/', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
};

export const zakatAPI = {
  
  createRequest: (data) => api.post('/zakat/requests', data),
  getMyRequests: () => api.get('/zakat/my-requests'),
  
  getAvailableRecipients: (params = {}) => api.get('/zakat/available-recipients', { params }),
  donate: (data) => api.post('/zakat/donate', data),
  getMyDonations: (params = {}) => api.get('/zakat/my-donations', { params }),
  getMyStats: () => api.get('/zakat/my-stats'),
  getPlatformStats: () => api.get('/zakat/stats'),
};

export const receiptsAPI = {
  getMyReceipts: (params = {}) => api.get('/receipts/my', { params }),
  getReceipt: (id) => api.get(`/receipts/${id}`),
  getReceiptByNumber: (number) => api.get(`/receipts/number/${number}`),
};