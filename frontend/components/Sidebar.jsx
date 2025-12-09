// frontend/components/Sidebar.jsx

"use client"; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 

// Define navigation links
const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠', subtitle: 'Overview' },
    { name: 'Masters', href: '/masters', icon: '📝', subtitle: 'Ledger & Items' },
    { name: 'Inward', href: '/inward', icon: '📦', subtitle: 'Stock In' },
    { name: 'Outward', href: '/outward', icon: '🚚', subtitle: 'Stock Out' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [displayName, setDisplayName] = useState('Guest');

    // Fetch and set username from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUsername = localStorage.getItem('username');
            if (storedUsername) {
                // Capitalize the first letter for display
                setDisplayName(storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1));
            }
        }
    }, []);

    const handleLogout = () => {
        // Clear stored token and username
        localStorage.removeItem('token'); 
        localStorage.removeItem('username'); 
        
        // Redirect to the login page
        router.push('/login'); 
    };

    return (
        // Main Sidebar Container
        <div className={`flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
            
            {/* Header Section */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                            {isCollapsed ? 'BC' : '📊'}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3">
                                <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Bhavesh Clearings
                                </div>
                                <div className="text-xs text-slate-400">Inventory Management</div>
                            </div>
                        )}
                    </div>
                    {/* Collapse Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-2 hover:bg-slate-700/50 rounded-lg transition-colors ${isCollapsed ? 'hidden' : 'block'}`}
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                {!isCollapsed && (
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
                        Navigation
                    </div>
                )}
                {navItems.map((item) => {
                    const isActive = pathname === item.href; 
                    return (
                        <Link key={item.name} href={item.href} className="block group">
                            <div
                                className={`relative flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50'
                                        : 'hover:bg-slate-700/50'
                                }`}
                            >
                                {/* Active Indicator */}
                                {isActive && !isCollapsed && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                                )}
                                {/* Icon */}
                                <span className={`text-2xl transition-transform group-hover:scale-110 ${isCollapsed ? 'mx-auto' : ''}`}>
                                    {item.icon}
                                </span>
                                {/* Text Content */}
                                {!isCollapsed && (
                                    <div className="ml-4 flex-1">
                                        <div className={`font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                            {item.name}
                                        </div>
                                        {item.subtitle && (
                                            <div className={`text-xs ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                {item.subtitle}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Section (Displays the logged-in username) */}
            <div className="p-4 border-t border-slate-700/50">
                {!isCollapsed ? (
                    <div className="mb-3 p-3 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                                {displayName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="ml-3 flex-1">
                                <div className="text-sm font-semibold text-slate-200">{displayName}</div>
                                <div className="text-xs text-slate-400">Administrator</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-3 flex justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                            {displayName.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                )}
                
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group ${
                        isCollapsed ? 'justify-center' : ''
                    }`}
                >
                    <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
                    {!isCollapsed && <span className="ml-3 font-semibold">Logout</span>}
                </button>
            </div>
        </div>
    );
}