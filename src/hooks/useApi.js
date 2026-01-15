import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useApi = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(url, options);
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (url) {
            fetchData();
        }
    }, [url]);

    const refetch = () => {
        fetchData();
    };

    return { data, loading, error, refetch };
};
