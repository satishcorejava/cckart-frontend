import client from './client';
import type { ApiResponse } from '../types';

export interface AuthResponse {
  token: string | null;
  email: string;
  name:  string;
  role:  string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  return res.data.data;
};

export const fetchMe = async (): Promise<AuthResponse> => {
  const res = await client.get<ApiResponse<AuthResponse>>('/auth/me');
  return res.data.data;
};
