import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api',
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('zh-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zh-token');
      window.location.href = '/login';
    }
    const message = err.response?.data?.error ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

export default client;
