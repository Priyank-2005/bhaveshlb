// frontend/utils/api.js
import axios from 'axios';

const base = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE)
  ? process.env.NEXT_PUBLIC_API_BASE
  : (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api');

const API = axios.create({
  baseURL: base, 
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
