import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5233/api',
  headers: { 'Content-Type': 'application/json' }
});

// Автоматически добавляет токен к каждому запросу
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});