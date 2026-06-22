import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

// Interceptor to inject JWT token and Gemini API key into headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Get local Gemini key if user saved one in settings
  const geminiKey = localStorage.getItem('gemini_key');
  if (geminiKey) {
    config.headers['x-gemini-key'] = geminiKey;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
