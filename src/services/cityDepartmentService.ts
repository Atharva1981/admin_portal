import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { adminDb } from '../config/firebase';

export interface CityDepartment {
  id: string;
  category: string;
  city: string;
  department: string;
  higher_authority: string;
  status: string;
}

export interface DepartmentStats {
  department: string;
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  avgResolutionTime: number;
}

/**
 * Fetch all departments for a specific city from the civic_issues collection
 */
export const fetchDepartmentsByCity = async (city: string): Promise<CityDepartment[]> => {
  try {
    if (!city) {
      throw new Error('City parameter is required');
    }

    const departmentsRef = collection(adminDb, 'civic_issues');
    const q = query(
      departmentsRef,
      where('city', '==', city)
    );

    const snapshot = await getDocs(q);
    const departments: CityDepartment[] = [];
    const uniqueDepartments = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const department = data.department;
      
      // Only add unique departments
      if (department && !uniqueDepartments.has(department)) {
        uniqueDepartments.add(department);
        departments.push({
          id: doc.id,
          category: data.category || '',
          city: data.city || city,
          department: department,
          higher_authority: data.higher_authority || '',
          status: data.status || 'active'
        });
      }
    });

    return departments;
  } catch (error) {
    console.error('Error fetching departments by city:', error);
    throw error;
  }
};

/**
 * Fetch all unique cities from the civic_issues collection
 */
export const fetchAllCities = async (): Promise<string[]> => {
  try {
    const departmentsRef = collection(adminDb, 'civic_issues');
    const snapshot = await getDocs(departmentsRef);
    
    const cities = new Set<string>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.city) {
        cities.add(data.city);
      }
    });

    return Array.from(cities).sort();
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * Fetch categories for a specific city and department
 */
export const fetchCategoriesByDepartment = async (city: string, department: string): Promise<string[]> => {
  try {
    if (!city || !department) {
      throw new Error('City and department parameters are required');
    }

    const departmentsRef = collection(adminDb, 'civic_issues');
    const q = query(
      departmentsRef,
      where('city', '==', city),
      where('department', '==', department)
    );

    const snapshot = await getDocs(q);
    const categories = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories by department:', error);
    throw error;
  }
};

/**
 * Get department statistics for a specific city and department
 */
export const getDepartmentStats = async (city: string, department: string): Promise<DepartmentStats> => {
  try {
    // This would typically fetch from user complaints and calculate stats
    // For now, returning mock data structure
    return {
      department,
      totalIssues: 0,
      resolvedIssues: 0,
      pendingIssues: 0,
      avgResolutionTime: 0
    };
  } catch (error) {
    console.error('Error getting department stats:', error);
    throw error;
  }
};
