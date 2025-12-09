// frontend/app/login/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/utils/api';

export default function LoginPage() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Redirect if already logged in (optional check, main check is in layout)
        if (typeof window !== 'undefined' && localStorage.getItem('token')) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await API.post('/auth/login', formData);
            
            // Store token and username upon successful login
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username); 

            router.push('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Invalid credentials or server error.';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Bhavesh Clearings Login 🔒
                </h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account? 
                    <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}