import { useState, useCallback } from 'react';
import { 
  mapComplaintToDepartment, 
  mapComplaintsToDepartments,
  getDepartmentsByCity,
  getAvailableCategories,
  getAvailableCities,
  DepartmentMappingResult,
  DepartmentInfo,
  Complaint
} from '../services/departmentMappingService';

interface UseDepartmentMappingReturn {
  mapComplaint: (complaint: Complaint) => Promise<DepartmentMappingResult>;
  mapComplaints: (complaints: Complaint[]) => Promise<Map<string, DepartmentMappingResult>>;
  getDepartments: (city: string) => Promise<DepartmentInfo[]>;
  getCategories: () => Promise<string[]>;
  getCities: () => Promise<string[]>;
  loading: boolean;
  error: string | null;
}

export const useDepartmentMapping = (): UseDepartmentMappingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapComplaint = useCallback(async (complaint: Complaint): Promise<DepartmentMappingResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mapComplaintToDepartment(complaint);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to map complaint to department';
      setError(errorMessage);
      console.error('Error mapping complaint:', err);
      
      // Return default department on error
      return {
        department: 'General Grievances',
        higher_authority: 'Municipal Commissioner / Executive Officer - General Grievances',
        status: 'active',
        isDefault: true,
        matchedCriteria: {
          category: complaint.category,
          city: complaint.city
        }
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const mapComplaints = useCallback(async (complaints: Complaint[]): Promise<Map<string, DepartmentMappingResult>> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await mapComplaintsToDepartments(complaints);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to map complaints to departments';
      setError(errorMessage);
      console.error('Error mapping complaints:', err);
      return new Map();
    } finally {
      setLoading(false);
    }
  }, []);

  const getDepartments = useCallback(async (city: string): Promise<DepartmentInfo[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const departments = await getDepartmentsByCity(city);
      return departments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get departments';
      setError(errorMessage);
      console.error('Error getting departments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (): Promise<string[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const categories = await getAvailableCategories();
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get categories';
      setError(errorMessage);
      console.error('Error getting categories:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCities = useCallback(async (): Promise<string[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const cities = await getAvailableCities();
      return cities;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get cities';
      setError(errorMessage);
      console.error('Error getting cities:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mapComplaint,
    mapComplaints,
    getDepartments,
    getCategories,
    getCities,
    loading,
    error
  };
};

export default useDepartmentMapping;