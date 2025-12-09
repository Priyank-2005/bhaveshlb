// frontend/app/(protected)/layout.tsx

"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar'; // <-- Import the Sidebar here

// NOTE: This layout wraps all pages inside the (protected) folder.
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const router = useRouter();

    // --- Client-Side Authentication Check ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    // Render loading state or null while checking auth
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        return <div className="flex items-center justify-center h-screen text-gray-500">Redirecting to login...</div>;
    }

    // --- Render Protected Content (Sidebar + Page) ---
    return (
        <div className="flex h-screen">
            {/* 1. Sidebar Component (Renders once for all protected routes) */}
            <Sidebar /> 

            {/* 2. Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50/50">
                {children} 
            </main>
        </div>
    );
}