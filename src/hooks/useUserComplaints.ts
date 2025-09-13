import { useState, useEffect, useCallback } from 'react';
import { 
  fetchUserComplaints, 
  listenToUserComplaints, 
  fetchUserComplaintById,
  getUserComplaintStats,
  UserComplaint, 
  ComplaintFilters, 
  FetchOptions 
} from '../services/userComplaintsService';

interface UseUserComplaintsReturn {
  complaints: UserComplaint[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    byCategory: Record<string, number>;
    byCity: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } | null;
  fetchComplaints: (options?: FetchOptions) => Promise<void>;
  fetchComplaintById: (complaintId: string) => Promise<UserComplaint | null>;
  refreshStats: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useUserComplaints = (
  initialOptions: FetchOptions = {}
): UseUserComplaintsReturn => {
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Record<string, number>;
    byCity: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } | null>(null);

  const fetchComplaints = useCallback(async (options: FetchOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedComplaints = await fetchUserComplaints({ ...initialOptions, ...options });
      setComplaints(fetchedComplaints);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch complaints';
      setError(errorMessage);
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [initialOptions]);

  const fetchComplaintById = useCallback(async (complaintId: string): Promise<UserComplaint | null> => {
    try {
      setError(null);
      const complaint = await fetchUserComplaintById(complaintId);
      return complaint;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch complaint';
      setError(errorMessage);
      console.error('Error fetching complaint by ID:', err);
      return null;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setError(null);
      const statsData = await getUserComplaintStats(initialOptions.filters);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    }
  }, [initialOptions.filters]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchComplaints(),
      refreshStats()
    ]);
  }, [fetchComplaints, refreshStats]);

  // Set up real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = () => {
      try {
        unsubscribe = listenToUserComplaints(
          (newComplaints) => {
            setComplaints(newComplaints);
            setError(null);
          },
          initialOptions
        );
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        // Fallback to one-time fetch
        fetchComplaints();
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialOptions, fetchComplaints]);

  // Load initial data and stats
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    complaints,
    loading,
    error,
    stats,
    fetchComplaints,
    fetchComplaintById,
    refreshStats,
    refresh
  };
};

export default useUserComplaints;