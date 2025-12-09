// frontend/utils/api.js
import axios from 'axios';
// frontend/utils/api.js 

// Set API_BASE_URL via Vercel Environment Variable (NEXT_PUBLIC_API_URL)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// ...

const base = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

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
