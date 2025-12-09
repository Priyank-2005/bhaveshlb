// frontend/app/(protected)/inward/page.jsx

import InwardEntryView from '@/components/InwardEntryView';

export default function InwardPage() {
    return (
        <div className="min-h-full p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Inward Transactions</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <InwardEntryView />
            </div>
        </div>
    );
}