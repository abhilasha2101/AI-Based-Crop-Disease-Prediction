import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cropai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cropai_token');
      localStorage.removeItem('cropai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
};

// Crop
export const cropApi = {
  upload: (formData) =>
    api.post('/crop/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  predict: (data) => api.post('/crop/predict', data),
  getUploads: () => api.get('/crop/uploads'),
  getResults: () => api.get('/crop/results'),
};

// Weather
export const weatherApi = {
  getByDistrict: (district) => api.get(`/weather/${district}`),
  getDistricts: () => api.get('/weather/districts'),
  getAll: () => api.get('/weather/all'),
};

// Mandi
export const mandiApi = {
  getPrices: (crop, state) =>
    api.get('/mandi/prices', { params: { crop, state } }),
  getTrends: (crop, days = 30) =>
    api.get('/mandi/trends', { params: { crop, days } }),
  getLatest: (crop) => api.get('/mandi/latest', { params: { crop } }),
  getSummary: () => api.get('/mandi/summary'),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export default api;
