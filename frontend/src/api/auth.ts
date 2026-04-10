import { apiClient } from './client';

export const register = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}) => {
  const res = await apiClient.post('/auth/register', data);
  return res.data;
};

export const login = async (data: {
  email: string;
  password: string;
}) => {
  const res = await apiClient.post('/auth/login', data);
  return res.data;
};