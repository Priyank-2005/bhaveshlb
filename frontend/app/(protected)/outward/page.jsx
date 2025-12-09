// frontend/app/(protected)/outward/page.jsx

import OutwardEntryView from '@/components/OutwardEntryView';

export default function OutwardPage() {
    return (
        <div className="min-h-full p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Outward Transactions</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <OutwardEntryView />
            </div>
        </div>
    );
}