// frontend/hooks/useMasterData.js

import { useState, useEffect } from 'react';
import API from '@/utils/api'; 

/**
 * Custom hook to fetch common master data (Parties and Items) for transaction forms.
 * This prevents repeated fetching across different components.
 */
export default function useMasterData() {
    const [masterData, setMasterData] = useState({ parties: [], items: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllMasters = async () => {
        setError(null);
        try {
            // Fetch Parties (Customers/Vendors)
            const partyResponse = await API.get('/masters/party');
            // Fetch Items/Products
            const itemResponse = await API.get('/masters/item'); 
            
            setMasterData({
                parties: partyResponse.data,
                items: itemResponse.data.map(item => ({
                    ...item,
                    // Ensure unit_of_measure is available for quick look-up
                    unit_of_measure: item.unit_of_measure 
                }))
            });
        } catch (err) {
            console.error('Failed to fetch master data:', err);
            setError('Could not load parties or items for transaction forms.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllMasters();
    }, []);

    return { masterData, loading, error };
}