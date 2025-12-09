// frontend/app/(protected)/masters/page.jsx

"use client";

import { useState } from 'react';
import PartyLedgerView from '@/components/PartyLedgerView';
import ItemMasterView from '@/components/ItemMasterView';

export default function MastersPage() {
    // State to manage which master module is currently active
    const [activeTab, setActiveTab] = useState('party'); // 'party' or 'item'

    const activeClasses = "bg-indigo-600 text-white shadow-md";
    const inactiveClasses = "bg-white text-gray-700 hover:bg-gray-100";

    return (
        <div className="min-h-full p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Master Data Management 📝</h1>
            
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-6 p-1 bg-gray-200 rounded-xl max-w-lg shadow-inner">
                <button
                    onClick={() => setActiveTab('party')}
                    className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors duration-200 ${
                        activeTab === 'party' ? activeClasses : inactiveClasses
                    }`}
                >
                    Party Ledger (Vendors/Customers)
                </button>
                <button
                    onClick={() => setActiveTab('item')}
                    className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors duration-200 ${
                        activeTab === 'item' ? activeClasses : inactiveClasses
                    }`}
                >
                    Item/Product Master
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                {activeTab === 'party' && <PartyLedgerView />}
                {activeTab === 'item' && <ItemMasterView />}
            </div>
        </div>
    );
}