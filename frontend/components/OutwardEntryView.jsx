'use client';

import { useState } from 'react';
import useMasterData from '@/hooks/useMasterData';
import API from '@/utils/api';
import OutwardEntryDetailsForm from './OutwardEntryDetailsForm';

export default function OutwardEntryView() {
  const { masterData, loading, error } = useMasterData();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form' | 'view_details'
  const [entryToViewId, setEntryToViewId] = useState(null);

  const [formData, setFormData] = useState({
    outward_date: new Date().toISOString().slice(0, 10),
    do_no: '',
    party_id: '',
    vehicle_no: '',
    line_items: [{ item_id: '', quantity: 0, lot_no: '', godown_no: '' }]
  });

  const handleHeaderChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...formData.line_items];
    list[index][name] = name === 'quantity' ? (value === '' ? '' : Number(value)) : value;
    setFormData({ ...formData, line_items: list });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { item_id: '', quantity: 0, lot_no: '', godown_no: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.line_items.length <= 1) return;
    const list = [...formData.line_items];
    list.splice(index, 1);
    setFormData({ ...formData, line_items: list });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validate at least one valid line
    const hasValid = formData.line_items.some(li => li.item_id && Number(li.quantity) > 0);
    if (!hasValid) {
      alert('Please add at least one item with quantity > 0.');
      return;
    }

    try {
      const payload = {
        outward_date: formData.outward_date,
        do_no: formData.do_no,
        party_id: formData.party_id,
        vehicle_no: formData.vehicle_no,
        line_items: formData.line_items.map(li => ({
          item_id: Number(li.item_id),
          quantity: Number(li.quantity),
          lot_no: li.lot_no || null,
          godown_no: li.godown_no || null
        }))
      };

      const res = await API.post('/outward', payload);
      alert(`Outward saved (ID: ${res.data.entry_id})`);
      // reset
      setFormData({
        outward_date: new Date().toISOString().slice(0, 10),
        do_no: '',
        party_id: '',
        vehicle_no: '',
        line_items: [{ item_id: '', quantity: 0, lot_no: '', godown_no: '' }]
      });
      setViewMode('list');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Failed to save outward entry.';
      alert(msg);
    }
  };

  if (loading) return <div>Loading masters...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (viewMode === 'form') {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">New Outward Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm">Outward Date</label>
              <input name="outward_date" type="date" value={formData.outward_date} onChange={handleHeaderChange} className="w-full border p-2 rounded" required />
            </div>

            <div>
              <label className="text-sm">DO Number</label>
              <input name="do_no" value={formData.do_no} onChange={handleHeaderChange} className="w-full border p-2 rounded" required />
            </div>

            <div>
              <label className="text-sm">Vehicle No.</label>
              <input name="vehicle_no" value={formData.vehicle_no} onChange={handleHeaderChange} className="w-full border p-2 rounded" />
            </div>

            <div className="col-span-3">
              <label className="text-sm">Party (Customer)</label>
              <select name="party_id" value={formData.party_id} onChange={handleHeaderChange} className="w-full border p-2 rounded" required>
                <option value="">-- Select Party --</option>
                {masterData.parties.map(p => (
                  <option key={p.party_id} value={p.party_id}>{p.name} {p.gst_no ? `(${p.gst_no})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Lot</th>
                    <th className="p-2 text-left">Godown</th>
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.line_items.map((li, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">
                        <select name="item_id" value={li.item_id} onChange={(e) => handleLineItemChange(idx, e)} className="border p-1 rounded" required>
                          <option value="">-- Select Item --</option>
                          {masterData.items.map(it => <option key={it.item_id} value={it.item_id}>{it.item_name}</option>)}
                        </select>
                      </td>

                      <td className="p-2">
                        <input name="lot_no" value={li.lot_no} onChange={(e) => handleLineItemChange(idx, e)} className="border p-1 rounded w-32" />
                      </td>

                      <td className="p-2">
                        <input name="godown_no" value={li.godown_no} onChange={(e) => handleLineItemChange(idx, e)} className="border p-1 rounded w-24" />
                      </td>

                      <td className="p-2">
                        <input name="quantity" type="number" step="0.01" min="0.01" value={li.quantity} onChange={(e) => handleLineItemChange(idx, e)} className="border p-1 rounded w-24" required />
                      </td>

                      <td className="p-2">
                        {formData.line_items.length > 1 && (
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-600">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={handleAddItem} className="mt-2 px-3 py-1 bg-yellow-500 rounded text-white">+ Add Item</button>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setViewMode('list')} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save Outward</button>
          </div>
        </form>
      </div>
    );
  }

  if (viewMode === 'view_details' && entryToViewId) {
    return <OutwardEntryDetailsForm entryId={entryToViewId} setViewMode={setViewMode} />;
  }

  // Default list view
  return <OutwardEntryList setViewMode={setViewMode} setEntryToViewId={setEntryToViewId} />;
}

/* --- internal list component --- */
function OutwardEntryList({ setViewMode, setEntryToViewId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lotFilter, setLotFilter] = useState('');
  const [godownFilter, setGodownFilter] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await API.get('/outward');
      setEntries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch outward entries:', err);
      alert('Failed to load outward entries.');
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useState(() => { fetchEntries(); }, []);

  const filtered = entries.filter(e =>
    (e.lot_no || '').toLowerCase().includes(lotFilter.toLowerCase()) &&
    (e.godown_no || '').toLowerCase().includes(godownFilter.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm(`Delete outward entry ${id}? This will add back inventory.`)) return;
    try {
      await API.delete(`/outward/${id}`);
      alert('Deleted successfully.');
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Outward Entries</h2>
        <button onClick={() => setViewMode('form')} className="px-3 py-2 bg-green-600 text-white rounded">+ New Outward</button>
      </div>

      <div className="flex gap-4 mb-4">
        <input value={lotFilter} onChange={e => setLotFilter(e.target.value)} placeholder="Filter by Lot" className="border p-2 rounded w-full" />
        <input value={godownFilter} onChange={e => setGodownFilter(e.target.value)} placeholder="Filter by Godown" className="border p-2 rounded w-full" />
        <button onClick={fetchEntries} className="px-3 py-2 bg-indigo-600 text-white rounded">Refresh</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">DO No.</th>
                <th className="p-2">Party</th>
                <th className="p-2">Item</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2">Lot</th>
                <th className="p-2">Godown</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-2">{e.do_no}</td>
                  <td className="p-2">{e.party_name}</td>
                  <td className="p-2">{e.item_name}</td>
                  <td className="p-2 text-right font-bold">{parseFloat(e.quantity).toFixed(2)}</td>
                  <td className="p-2">{e.lot_no || 'N/A'}</td>
                  <td className="p-2">{e.godown_no || 'N/A'}</td>
                  <td className="p-2">
                    <button onClick={() => { setEntryToViewId(e.entry_id); setViewMode('view_details'); }} className="text-indigo-600 mr-2">View</button>
                    <button onClick={() => handleDelete(e.entry_id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-4 text-center">No outward entries found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
