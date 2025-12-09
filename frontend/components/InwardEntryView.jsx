'use client';

import { useState, useEffect } from 'react';
import useMasterData from '@/hooks/useMasterData'; // Imports parties and items
import API from '@/utils/api'; // Authorized API instance
import InwardEntryDetailsForm from './InwardEntryDetailsForm';

export default function InwardEntryView() {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
    const { masterData, loading, error } = useMasterData();// Fetch master lists
    const [entryToViewId, setEntryToViewId] = useState(null);
    // Initial state setup for the form (no unit_of_measure anywhere)
    const [formData, setFormData] = useState({
        inward_date: new Date().toISOString().substring(0, 10),
        party_id: '',
        entry_type: 'Purchase',
        line_items: [{ item_id: '', quantity: 0.00, lot_no: '', godown_no: '' }]
    });

    // Handler for changes in Header fields
    const handleHeaderChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler for changes in Line Items (including item selection)
    const handleLineItemChange = (index, e) => {
        const { name, value } = e.target;
        const list = [...formData.line_items];
        // Keep quantity as number where appropriate
        if (name === 'quantity') {
            list[index][name] = value === '' ? '' : parseFloat(value);
        } else {
            list[index][name] = value;
        }
        setFormData({ ...formData, line_items: list });
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            line_items: [...prev.line_items, { item_id: '', quantity: 0.00, lot_no: '', godown_no: '' }]
        }));
    };

    const handleRemoveItem = (index) => {
        // Prevent removing the last line item
        if (formData.line_items.length <= 1) return;

        const list = [...formData.line_items];
        list.splice(index, 1);
        setFormData({ ...formData, line_items: list });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const hasValidItems = formData.line_items.some(item =>
            item.item_id && Number(item.quantity) > 0
        );

        if (!hasValidItems) {
            alert("Please ensure at least one item has been selected and has a quantity greater than zero.");
            return;
        }

        try {
            // Prepare payload: strip any stray fields and ensure quantity is numeric
            const payload = {
                inward_date: formData.inward_date,
                party_id: formData.party_id,
                entry_type: formData.entry_type,
                line_items: formData.line_items.map(li => ({
                    item_id: Number(li.item_id),
                    quantity: Number(li.quantity),
                    lot_no: li.lot_no || null,
                    godown_no: li.godown_no || null
                }))
            };

            const response = await API.post('/inward', payload);
            alert(`Entry saved successfully! ID: ${response.data.entry_id}. Stock updated.`);

            // Reset form data and switch to list view
            setFormData({
                inward_date: new Date().toISOString().substring(0, 10),
                invoice_no: '',
                party_id: '',
                entry_type: 'Purchase',
                line_items: [{ item_id: '', quantity: 0.00, lot_no: '', godown_no: '' }]
            });
            setViewMode('list');
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save entry. Check server logs.";
            alert(`Error: ${msg}`);
            console.error(err);
        }
    };

    if (loading) return <div className="text-center py-8">Loading Masters Data...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error loading required data: {error}</div>;

    if (viewMode === 'view_details' && entryToViewId) {
        return (
            <InwardEntryDetailsForm
                entryId={entryToViewId} // Pass the ID of the entry to load
                setViewMode={setViewMode}
                setEntryToViewId={setEntryToViewId}
            />
        );
    }

    if (viewMode === 'form') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-indigo-700">New Inward Entry</h2>
                <button
                    onClick={() => setViewMode('list')}
                    className="mb-4 text-sm text-indigo-600 hover:text-indigo-800"
                >
                    ← Back to List
                </button>
                <form onSubmit={handleFormSubmit} className="space-y-6">

                    {/* Entry Header */}
                    <div className="grid grid-cols-3 gap-4 border p-4 rounded-md bg-gray-50">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Inward Date</label>
                            <input
                                type="date"
                                name="inward_date"
                                value={formData.inward_date}
                                onChange={handleHeaderChange}
                                className="text-gray-700 mt-1 block w-full border rounded-md p-2" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Party Name (Vendor)</label>
                            <select
                                name="party_id"
                                value={formData.party_id}
                                onChange={handleHeaderChange}
                                className="text-gray-700 mt-1 block w-full border rounded-md p-2" required
                            >
                                <option value="">-- Select Vendor --</option>
                                {masterData.parties
                                    .filter(p => p.type === 'Vendor' || p.type === 'Both')
                                    .map(party => (
                                        <option key={party.party_id} value={party.party_id}>
                                            {party.name} ({party.gst_no})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Line Items Grid */}
                    <h3 className="text-gray-700 text-xl font-semibold pt-4 border-t">Items Received (Details)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-800 uppercase">Item Name</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-800 uppercase">Lot No.</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-800 uppercase">Godown No.</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-800 uppercase">Unit</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-800 uppercase">Quantity</th>
                                    <th className="px-3 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.line_items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="text-gray-700 px-3 py-4">
                                            <select
                                                name="item_id"
                                                value={item.item_id}
                                                onChange={(e) => handleLineItemChange(index, e)}
                                                className="w-full border rounded-md p-1" required
                                            >
                                                <option value="">-- Select Item --</option>
                                                {masterData.items.map(mItem => (
                                                    <option key={mItem.item_id} value={mItem.item_id}>
                                                        {mItem.item_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-gray-700 px-3 py-4">
                                            <input
                                                type="text"
                                                name="lot_no"
                                                value={item.lot_no}
                                                onChange={(e) => handleLineItemChange(index, e)}
                                                placeholder="Lot No."
                                                className="w-24 border rounded-md p-1"
                                            />
                                        </td>
                                        <td className="text-gray-700 px-3 py-4">
                                            <input
                                                type="text"
                                                name="godown_no"
                                                value={item.godown_no}
                                                onChange={(e) => handleLineItemChange(index, e)}
                                                placeholder="Godown No."
                                                className="w-24 border rounded-md p-1"
                                            />
                                        </td>
                                        <td className="text-gray-700 px-3 py-4">
                                            {/* UoM removed from DB — show placeholder */}
                                            <div className="w-20 bg-gray-100 border rounded-md p-1 text-center">—</div>
                                        </td>
                                        <td className="text-gray-700 px-3 py-4">
                                            <input
                                                type="number"
                                                name="quantity"
                                                step="0.01"
                                                min="0.01"
                                                value={item.quantity}
                                                onChange={(e) => handleLineItemChange(index, e)}
                                                className="w-24 border rounded-md p-1" required
                                            />
                                        </td>
                                        <td className="text-gray-700 px-3 py-4">
                                            {formData.line_items.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={handleAddItem} className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition">
                        + Add Line Item
                    </button>

                    {/* Form Actions */}
                    <div className="pt-6 border-t flex justify-end space-x-3">
                        <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100">
                            Exit
                        </button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700">
                            Save Entry
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (viewMode === 'view_details') {
        return (
            <InwardEntryDetailsForm
                entryId={entryToViewId} // Pass the ID of the entry to load
                setViewMode={setViewMode}
                setEntryToViewId={setEntryToViewId}
            />
        );
    }

    // Default List View (viewMode === 'list')
    return <InwardEntryList setViewMode={setViewMode} setEntryToViewId={setEntryToViewId} />;
}

// --- NEW COMPONENT FOR THE LIST VIEW ---

function InwardEntryList({ setViewMode, setEntryToViewId }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lotSearchTerm, setLotSearchTerm] = useState(''); // <-- NEW STATE for Lot No.
    const [godownSearchTerm, setGodownSearchTerm] = useState(''); // <-- NEW STATE for Godown No.

    const fetchInwardEntries = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/inward');
            setEntries(response.data);
        } catch (err) {
            console.error('Failed to fetch inward entries:', err);
            setError('Could not load entries. Check server connection or login status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInwardEntries();
    }, [setViewMode]);

    // Filter logic based on Lot No AND Godown No (applied separately)
    const filteredEntries = entries.filter(entry =>
        (entry.lot_no || '').toLowerCase().includes(lotSearchTerm.toLowerCase()) &&
        (entry.godown_no || '').toLowerCase().includes(godownSearchTerm.toLowerCase())
    );

    // Placeholder actions
    const handleViewDetails = (id) => {
        setEntryToViewId(id);       // Store the ID of the entry clicked
        setViewMode('view_details'); // Switch to the detail view mode
    };

    const handleDelete = async (id) => {
        if (!confirm(`Are you sure you want to delete entry ${id}? This will also reduce inventory.`)) {
            return;
        }
        try {
            await API.delete(`/inward/${id}`);
            alert('Entry deleted and inventory reduced successfully.');
            fetchInwardEntries(); // Refresh the list
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Deletion failed. Check backend logs.');
        }
    };

    // Date/Time formatting helper
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
    const formatTime = (dateString) => new Date(dateString).toLocaleTimeString();


    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-indigo-700">Inward Entry List (Line Items)</h2>
                <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition"
                    onClick={() => setViewMode('form')}
                >
                    + New Inward Entry
                </button>
            </div>

            {/* Search Bars */}
            <div className="flex space-x-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by Lot No."
                    value={lotSearchTerm}
                    onChange={(e) => setLotSearchTerm(e.target.value)}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                    type="text"
                    placeholder="Search by Godown No."
                    value={godownSearchTerm}
                    onChange={(e) => setGodownSearchTerm(e.target.value)}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {loading && <div className="text-center py-6">Loading entries...</div>}
            {error && <div className="text-center py-6 text-red-600">{error}</div>}

            {!loading && !error && (
                <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Time</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Party Name</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Item</th>
                                <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 uppercase">Quantity</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Lot No.</th>
                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase">Godown No.</th>
                                <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredEntries.map((entry, index) => (
                                <tr key={entry.entry_id + '-' + index} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(entry.date)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{formatTime(entry.entry_time)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-blue-600">{entry.party_name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{entry.item_name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right font-bold">{parseFloat(entry.quantity).toFixed(2)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{entry.lot_no || 'N/A'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{entry.godown_no || 'N/A'}</td>

                                    {/* ACTIONS CELL */}
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center space-x-2">
                                        <button
                                            onClick={() => handleViewDetails(entry.entry_id)}
                                            className="text-indigo-600 hover:text-indigo-900 transition"
                                        >
                                            View/Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.entry_id)}
                                            className="text-red-600 hover:text-red-900 transition"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEntries.length === 0 && (
                        <p className="text-center py-6 text-gray-500">No entries match your search criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
}
