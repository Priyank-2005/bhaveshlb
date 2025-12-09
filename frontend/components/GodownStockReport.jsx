// frontend/components/GodownStockReport.jsx

'use client';

import { useState, useEffect } from 'react';
import API from '@/utils/api';

export default function GodownStockReport() {
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Unified search for item, lot, godown

    const fetchStock = async () => {
        setLoading(true);
        try {
            // This API now returns stock broken down by Lot/Godown
            const response = await API.get('/masters/inventory'); 
            setStockData(response.data);
        } catch (err) {
            console.error('Failed to fetch detailed stock:', err);
            // show server message if available
            const msg = err?.response?.data?.message || err?.message || 'Failed to load inventory data. Check API/Database status.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
        const interval = setInterval(fetchStock, 30000); 
        return () => clearInterval(interval);
    }, []);

    // Filter logic: Search by Item Name, Lot No, or Godown No
    const filteredStock = stockData.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            item.item_name?.toLowerCase().includes(query) ||
            item.lot_no?.toLowerCase().includes(query) ||
            item.godown_no?.toLowerCase().includes(query)
        );
    });

    if (loading) return <div className="text-center py-10 text-indigo-600">Loading Live Inventory Data...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Stock Balance by Godown/Lot</h2>
            
            <input
                type="text"
                placeholder="Search by Item Name, Lot No, or Godown No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full p-3 mb-6 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Item Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Godown No.</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Lot No.</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Current Stock</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredStock.map((item, index) => (
                            <tr key={item.item_id + '-' + item.godown_no + index} className="hover:bg-indigo-50/50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.item_name}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {item.godown_no || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {item.lot_no || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-extrabold">
                                    <span className={item.current_stock > 10 ? 'text-green-700' : item.current_stock > 0 ? 'text-amber-600' : 'text-red-600'}>
                                        {parseFloat(item.current_stock).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                    {item.current_stock > 10 ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                                    ) : item.current_stock > 0 ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Zero Stock</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStock.length === 0 && !loading && (
                    <p className="text-center py-6 text-gray-500">No stock found matching your criteria.</p>
                )}
            </div>
        </div>
    );
}
