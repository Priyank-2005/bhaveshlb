// frontend/components/PartyLedgerView.jsx

'use client';

import { useEffect, useState } from 'react';
import API from '@/utils/api';

export default function PartyLedgerView() {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list'); 
    const [editingParty, setEditingParty] = useState(null); 
    const [newParty, setNewParty] = useState({ name: '', gst_no: '', email_id: '', contact_no: '', type: 'Customer' });

    // --- Data Fetching Logic ---
    const fetchParties = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/masters/party'); 
            setParties(response.data);
        } catch (err) {
            console.error('Failed to fetch parties:', err);
            setError('Failed to load party list. Check backend API status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParties();
    }, [viewMode, editingParty]); 

    // --- Action Handlers ---
    const handleEdit = (party) => {
        setEditingParty({ ...party }); 
    };

    const handleDelete = async (partyId, partyName) => {
        if (!confirm(`Are you sure you want to delete ${partyName}? This action is irreversible.`)) {
            return;
        }

        try {
            await API.delete(`/masters/party/${partyId}`);
            alert(`Party ${partyName} deleted successfully.`);
            fetchParties(); 
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Deletion failed. Party may be linked to transactions.');
        }
    };

    // --- Form Handlers (New Party) ---
    const handleNewPartyChange = (e) => {
        setNewParty({ ...newParty, [e.target.name]: e.target.value });
    };

    const handleNewPartySubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/masters/party', newParty);
            alert(`Party ${newParty.name} added successfully.`);
            setNewParty({ name: '', gst_no: '', email_id: '', contact_no: '', type: 'Customer' }); 
            setViewMode('list'); 
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add new party.';
            alert(`Error: ${msg}`);
        }
    };
    
    // --- Form Handlers (Edit Party) ---
    const handleEditingPartyChange = (e) => {
        setEditingParty({ ...editingParty, [e.target.name]: e.target.value });
    };

    const handleUpdatePartySubmit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/masters/party/${editingParty.party_id}`, editingParty); 
            alert(`Party ${editingParty.name} updated successfully.`);
            setEditingParty(null); 
            fetchParties(); 
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update party.';
            alert(`Error: ${msg}`);
        }
    };


    // --- Render Logic ---
    if (loading) return <div className="text-center py-8">Loading Party Data...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    // RENDER EDIT MODAL
    if (editingParty) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Edit Party: {editingParty.name}</h2>
                    <form onSubmit={handleUpdatePartySubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Party Name *</label>
                                <input type="text" name="name" required onChange={handleEditingPartyChange} value={editingParty.name} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Party Type *</label>
                                <select name="type" required onChange={handleEditingPartyChange} value={editingParty.type} className="mt-1 block w-full border rounded-md p-2">
                                    <option value="Customer">Customer</option>
                                    <option value="Vendor">Vendor</option>
                                    <option value="Both">Both (Customer & Vendor)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">GST No.</label>
                                <input type="text" name="gst_no" onChange={handleEditingPartyChange} value={editingParty.gst_no || ''} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact No.</label>
                                <input type="text" name="contact_no" onChange={handleEditingPartyChange} value={editingParty.contact_no || ''} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Id.</label>
                                <input type="email" name="email_id" onChange={handleEditingPartyChange} value={editingParty.email_id || ''} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={() => setEditingParty(null)} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100">
                                Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // RENDER FORM VIEW
    if (viewMode === 'form') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Add New Party</h2>
                <form onSubmit={handleNewPartySubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Party Name *</label>
                            <input type="text" name="name" required onChange={handleNewPartyChange} value={newParty.name} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Party Type *</label>
                            <select name="type" required onChange={handleNewPartyChange} value={newParty.type} className="mt-1 block w-full border rounded-md p-2">
                                <option value="Customer">Customer</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Both">Both (Customer & Vendor)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">GST No.</label>
                            <input type="text" name="gst_no" onChange={handleNewPartyChange} value={newParty.gst_no} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact No.</label>
                            <input type="text" name="contact_no" onChange={handleNewPartyChange} value={newParty.contact_no} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Id.</label>
                            <input type="email" name="email_id" onChange={handleNewPartyChange} value={newParty.email_id} className="mt-1 block w-full border rounded-md p-2" />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100">
                            Exit
                        </button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700">
                            Add & Save
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // RENDER LIST VIEW 
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Party Ledger Management</h2>
            <div className="flex justify-between items-center mb-4">
                <button 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
                    onClick={() => setViewMode('form')} 
                >
                    + Add New Party
                </button>
                <p className="text-sm text-gray-600">Total Parties: {parties.length}</p>
            </div>
            
            <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">GST No.</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Contact No.</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                            <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {parties.map((party) => (
                            <tr key={party.party_id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{party.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{party.gst_no || 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{party.contact_no || 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 font-semibold">{party.type}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-center space-x-2">
                                    <button 
                                        onClick={() => handleEdit(party)}
                                        className="text-indigo-600 hover:text-indigo-900 transition"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(party.party_id, party.name)}
                                        className="text-red-600 hover:text-red-900 transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {parties.length === 0 && (
                    <p className="text-center py-6 text-gray-500">No parties found. Click "Add New Party" to begin.</p>
                )}
            </div>
        </div>
    );
}