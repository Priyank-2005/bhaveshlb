// frontend/components/OutwardEntryDetailsForm.jsx

'use client';

import { useState, useEffect } from 'react';
import API from '@/utils/api';
import useMasterData from '@/hooks/useMasterData';

export default function OutwardEntryDetailsForm({ entryId, setViewMode, setEntryToViewId }) {
    const { loading: mastersLoading, error: mastersError } = useMasterData();
    const [entryData, setEntryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        if (!entryId) return;
        const fetchEntryDetails = async () => {
            try {
                const response = await API.get(`/outward/${entryId}`);
                setEntryData(response.data);
            } catch (err) {
                setError('Failed to load entry details. Entry may have been deleted.');
            } finally {
                setLoading(false);
            }
        };
        fetchEntryDetails();
    }, [entryId]); 

    // --- Form Handlers ---
    const handleHeaderChange = (e) => {
        setEntryData({ ...entryData, [e.target.name]: e.target.value });
    };

    const handleLineItemChange = (index, e) => {
        const { name, value } = e.target;
        const list = [...entryData.line_items];
        list[index][name] = value;
        setEntryData({ ...entryData, line_items: list });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        
        const formattedDate = entryData.outward_date 
            ? entryData.outward_date.substring(0, 10) 
            : null;

        const payload = {
            outward_date: formattedDate,
            do_no: entryData.do_no,
            party_id: entryData.party_id, 
            vehicle_no: entryData.vehicle_no,
            line_items: entryData.line_items.map(item => ({
                item_id: item.item_id,
                unit_of_measure: item.unit_of_measure,
                quantity: parseFloat(item.quantity),
                lot_no: item.lot_no,
                godown_no: item.godown_no,
            }))
        };

        try {
            await API.put(`/outward/${entryId}`, payload);

            alert(`Outward Entry ${entryId} updated successfully!`);
            setViewMode('list');
            setEntryToViewId(null);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update entry. Check server logs.";
            alert(`Update Error: ${msg}`);
        }
    };

    // --- Loading and Error States ---
    if (loading || mastersLoading) return <div className="p-8 text-center">Loading Entry Details...</div>;
    if (error || mastersError) return <div className="p-8 text-center text-red-600">{error || mastersError}</div>;
    if (!entryData) return <div className="p-8 text-center">Entry data not found.</div>;

    // --- Main Form Render ---
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-indigo-700">Edit Outward Entry #{entryData.entry_id}</h2>
            
            <button 
                onClick={() => { setViewMode('list'); setEntryToViewId(null); }} 
                className="mb-4 text-sm text-indigo-600 hover:text-indigo-800"
            >
                ← Back to List
            </button>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-6">
                
                {/* Entry Header */}
                <div className="grid grid-cols-4 gap-4 border p-4 rounded-md bg-gray-50">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Outward Date</label>
                        <input type="date" name="outward_date" value={entryData.outward_date.substring(0, 10)} onChange={handleHeaderChange} className="mt-1 block w-full border rounded-md p-2 bg-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Delivery Challan (DO) No.</label>
                        <input type="text" name="do_no" value={entryData.do_no} onChange={handleHeaderChange} className="mt-1 block w-full border rounded-md p-2 bg-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Party Name (Customer)</label>
                        <input type="text" value={entryData.party_name} readOnly className="mt-1 block w-full border rounded-md p-2 bg-gray-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vehicle No.</label>
                        <input type="text" name="vehicle_no" value={entryData.vehicle_no || ''} onChange={handleHeaderChange} className="mt-1 block w-full border rounded-md p-2 bg-white" />
                    </div>
                </div>
                
                {/* Line Items Grid */}
                <h3 className="text-xl font-semibold pt-4 border-t">Items Dispatched (Details)</h3>
                <div className="overflow-x-auto">
                    {/* Table headers omitted for brevity */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                            {entryData.line_items.map((item, index) => (
                                <tr key={item.line_item_id || index}>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm">{item.item_name}</td>
                                    
                                    <td className="px-3 py-4">
                                        <input type="text" name="lot_no" value={item.lot_no || ''} onChange={(e) => handleLineItemChange(index, e)} className="w-24 border rounded-md p-1" />
                                    </td>
                                    <td className="px-3 py-4">
                                        <input type="text" name="godown_no" value={item.godown_no || ''} onChange={(e) => handleLineItemChange(index, e)} className="w-24 border rounded-md p-1" />
                                    </td>
                                    <td className="px-3 py-4">
                                        <input type="number" name="quantity" step="0.01" value={item.quantity} onChange={(e) => handleLineItemChange(index, e)} className="w-24 border rounded-md p-1" required />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Form Actions */}
                <div className="pt-6 border-t flex justify-end space-x-3">
                    <button type="button" onClick={() => { setViewMode('list'); setEntryToViewId(null); }} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100">
                        Cancel / View Only
                    </button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}