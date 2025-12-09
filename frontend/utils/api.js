// frontend/utils/api.js
import axios from 'axios';

// Set API_BASE_URL via Vercel Environment Variable (NEXT_PUBLIC_API_URL)
// Vercel ENV Variable should be set to: https://bhaveshlb.onrender.com/api
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Use the environment variable directly. The local fallback ensures the path is correct 
// when running locally, and the Vercel variable handles production.
const base = API_BASE_URL;

const API = axios.create({
  // Use 'base' which is now guaranteed to include the /api prefix, 
  // ensuring the full path called is: BASE_URL + '/auth/login' = /api/auth/login
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