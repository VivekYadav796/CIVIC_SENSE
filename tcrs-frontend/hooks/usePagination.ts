import { useState, useCallback } from 'react';
import API from '@/lib/api';

export interface PageData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrev: boolean;
}

export function usePagination<T>(endpoint: string, defaultSize = 10) {
  const [data, setData]       = useState<PageData<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const fetch = useCallback(async (page = 0, params: Record<string, string> = {}) => {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        size: String(defaultSize),
        ...params,
      }).toString();
      const res = await API.get(`${endpoint}?${query}`);
      setData(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to load data';
      setError(typeof msg === 'string' ? msg : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, defaultSize]);

  return { data, loading, error, fetch, setData };
}