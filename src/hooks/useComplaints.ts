import { useState, useEffect, useCallback } from 'react';
import complaintService, { Complaint, ComplaintFilters, PaginationOptions } from '../services/complaintService';

interface UseComplaintsReturn {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  loadComplaints: (filters?: ComplaintFilters, pagination?: PaginationOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  } | null;
}

export const useComplaints = (
  initialFilters: ComplaintFilters = {},
  initialPagination: PaginationOptions = { pageSize: 20 }
): UseComplaintsReturn => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  } | null>(null);

  const loadComplaints = useCallback(async (
    filters: ComplaintFilters = initialFilters,
    pagination: PaginationOptions = initialPagination
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await complaintService.getComplaints(filters, pagination);
      setComplaints(result.complaints);
      setLastDoc(result.lastDoc);
      setHasMore(result.complaints.length === (pagination.pageSize || 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [initialFilters, initialPagination]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await complaintService.getComplaints(
        initialFilters,
        { ...initialPagination, lastDoc }
      );
      
      setComplaints(prev => [...prev, ...result.complaints]);
      setLastDoc(result.lastDoc);
      setHasMore(result.complaints.length === (initialPagination.pageSize || 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more complaints');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, lastDoc, initialFilters, initialPagination]);

  const refresh = useCallback(async () => {
    setComplaints([]);
    setLastDoc(null);
    setHasMore(true);
    await loadComplaints();
  }, [loadComplaints]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await complaintService.getComplaintStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
    loadStats();
  }, [loadComplaints, loadStats]);

  return {
    complaints,
    loading,
    error,
    lastDoc,
    hasMore,
    loadComplaints,
    loadMore,
    refresh,
    stats
  };
};

export default useComplaints;