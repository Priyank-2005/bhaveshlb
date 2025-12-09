// frontend/app/page.jsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The default unauthenticated route redirects immediately to the login page.
export default function LandingPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push('/login');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <p className="text-lg text-gray-600">Loading application...</p>
        </div>
    );
}