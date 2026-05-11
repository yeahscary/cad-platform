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
export const uploadReference = async (questionId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post(
        `/cad/reference/${questionId}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
};

export const checkReferenceExists = async (questionId: string) => {
    const res = await apiClient.get(`/cad/reference/${questionId}/exists`);
    return res.data.exists as boolean;
};