// frontend/app/layout.tsx

import type { Metadata } from 'next';
import './globals.css'; 

export const metadata: Metadata = {
  title: 'Bhavesh Clearings - Inventory Management',
  description: 'Full-stack inventory and logistics management application.',
};

export default function RootLayout({
  children, 
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased h-screen overflow-hidden">
        {children} {/* This renders either the login page or the ProtectedLayout */}
      </body>
    </html>
  );
}