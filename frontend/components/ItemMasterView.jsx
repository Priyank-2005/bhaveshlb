// frontend/components/ItemMasterView.jsx

'use client';

import { useEffect, useState } from 'react';
import API from '@/utils/api';

export default function ItemMasterView() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list'); 
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ item_name: ''});

    // --- Data Fetching Logic ---
    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/masters/item'); 
            setItems(response.data);
        } catch (err) {
            console.error('Failed to fetch items:', err);
            setError('Failed to load item list. Check backend API status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [viewMode, editingItem]); 

    // --- Form Handlers (New Item) ---
    const handleNewItemChange = (e) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const handleNewItemSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/masters/item', newItem);
            alert(`Item ${newItem.item_name} added successfully.`);
            setNewItem({ item_name: ''}); 
            setViewMode('list'); 
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add new item.';
            alert(`Error: ${msg}`);
        }
    };

    // --- Action Handlers (Edit/Delete) ---
    const handleEdit = (item) => {
        setEditingItem({ ...item }); 
    };

    const handleDelete = async (itemId, itemName) => {
        if (!confirm(`Are you sure you want to delete item ${itemName}? This is irreversible.`)) {
            return;
        }

        try {
            await API.delete(`/masters/item/${itemId}`);
            alert(`Item ${itemName} deleted successfully.`);
            fetchItems(); 
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Deletion failed. Item may be linked to transactions.');
        }
    };
    
    // --- Form Handlers (Edit Item Modal) ---
    const handleEditingItemChange = (e) => {
        setEditingItem({ ...editingItem, [e.target.name]: e.target.value });
    };

    const handleUpdateItemSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/masters/item/${editingItem.item_id}`, editingItem); 
            alert(`Item ${editingItem.item_name} updated successfully.`);
            setEditingItem(null); 
            fetchItems(); 
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update item.';
            alert(`Error: ${msg}`);
        }
    };

    // --- Render Logic ---
    if (loading) return <div className="text-center py-8">Loading Item Data...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;


    // RENDER EDIT MODAL
    if (editingItem) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Edit Item: {editingItem.item_name}</h2>
                    <form onSubmit={handleUpdateItemSubmit} className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                                <input type="text" name="item_name" required onChange={handleEditingItemChange} value={editingItem.item_name} className="mt-1 block w-full border rounded-md p-2" />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100">
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


    // RENDER FORM VIEW (New Item)
    if (viewMode === 'form') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Add New Item/Product</h2>
                <form onSubmit={handleNewItemSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                            <input type="text" name="item_name" required onChange={handleNewItemChange} value={newItem.item_name} className="mt-1 block w-full border rounded-md p-2" />
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
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Item/Product Master</h2>
            <div className="flex justify-between items-center mb-4">
                <button 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
                    onClick={() => setViewMode('form')} 
                >
                    + Add New Item
                </button>
                <p className="text-sm text-gray-600">Total Items: {items.length}</p>
            </div>
            
            <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Item Name</th>
                            <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {items.map((item) => (
                            <tr key={item.item_id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-center space-x-2">
                                    <button 
                                        onClick={() => handleEdit(item)}
                                        className="text-indigo-600 hover:text-indigo-900 transition"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.item_id, item.item_name)}
                                        className="text-red-600 hover:text-red-900 transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 && (
                    <p className="text-center py-6 text-gray-500">No items found. Click "Add New Item" to define products.</p>
                )}
            </div>
        </div>
    );
}