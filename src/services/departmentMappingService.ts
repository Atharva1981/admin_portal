import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore';
import { adminDb, userDb } from '../config/firebase';

export interface DepartmentInfo {
  department: string;
  higher_authority: string;
  status: string;
  category: string;
  city: string;
  pincode?: string;
}

export interface Complaint {
  category: string;
  city: string;
  pincode?: string;
  description?: string;
  complaintId?: string;
}

export interface DepartmentMappingResult {
  department: string;
  higher_authority: string;
  status: string;
  isDefault: boolean;
  matchedCriteria?: {
    category: string;
    city: string;
  };
}

/**
 * Maps a complaint to its appropriate department based on category and city
 * @param complaint - The complaint object containing category, city, and other details
 * @returns Promise<DepartmentMappingResult> - Department information for the complaint
 */
export const mapComplaintToDepartment = async (complaint: Complaint): Promise<DepartmentMappingResult> => {
  try {
    console.log(`🔍 Mapping complaint to department: ${complaint.category} in ${complaint.city}`);
    
    // Query the civic_issues collection for matching category and city
    const departmentsRef = collection(adminDb, 'civic_issues');
    const q = query(
      departmentsRef,
      where('category', '==', complaint.category),
      where('city', '==', complaint.city),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Found a matching department
      const doc = snapshot.docs[0];
      const data = doc.data() as DepartmentInfo;
      
      console.log(`✅ Found matching department: ${data.department}`);
      
      return {
        department: data.department,
        higher_authority: data.higher_authority,
        status: data.status || 'active',
        isDefault: false,
        matchedCriteria: {
          category: complaint.category,
          city: complaint.city
        }
      };
    }
    
    // No exact match found, try to find by category only
    console.log(`⚠️ No exact match found, trying category-only match for: ${complaint.category}`);
    
    const categoryQuery = query(
      departmentsRef,
      where('category', '==', complaint.category),
      limit(1)
    );
    
    const categorySnapshot = await getDocs(categoryQuery);
    
    if (!categorySnapshot.empty) {
      const doc = categorySnapshot.docs[0];
      const data = doc.data() as DepartmentInfo;
      
      console.log(`✅ Found category match: ${data.department} (city: ${data.city})`);
      
      return {
        department: data.department,
        higher_authority: data.higher_authority,
        status: data.status || 'active',
        isDefault: false,
        matchedCriteria: {
          category: complaint.category,
          city: data.city // Note: This is the department's city, not the complaint's city
        }
      };
    }
    
    // No match found at all, return default department
    console.log(`❌ No department match found, using default department`);
    
    return {
      department: 'Other Department',
      higher_authority: 'Municipal Commissioner / Executive Officer - Other Department',
      status: 'active',
      isDefault: true,
      matchedCriteria: {
        category: complaint.category,
        city: complaint.city
      }
    };
    
  } catch (error) {
    console.error('❌ Error mapping complaint to department:', error);
    
    // Return default department on error
    return {
      department: 'Other Department',
      higher_authority: 'Municipal Commissioner / Executive Officer - Other Department',
      status: 'active',
      isDefault: true,
      matchedCriteria: {
        category: complaint.category,
        city: complaint.city
      }
    };
  }
};

/**
 * Maps multiple complaints to departments in batch
 * @param complaints - Array of complaint objects
 * @returns Promise<Map<string, DepartmentMappingResult>> - Map of complaint IDs to department info
 */
export const mapComplaintsToDepartments = async (
  complaints: Complaint[]
): Promise<Map<string, DepartmentMappingResult>> => {
  const results = new Map<string, DepartmentMappingResult>();
  
  console.log(`🔄 Mapping ${complaints.length} complaints to departments...`);
  
  // Process complaints in parallel for better performance
  const promises = complaints.map(async (complaint) => {
    const complaintId = complaint.complaintId || `${complaint.category}_${complaint.city}_${Date.now()}`;
    const departmentInfo = await mapComplaintToDepartment(complaint);
    return { complaintId, departmentInfo };
  });
  
  try {
    const resultsArray = await Promise.all(promises);
    
    resultsArray.forEach(({ complaintId, departmentInfo }) => {
      results.set(complaintId, departmentInfo);
    });
    
    console.log(`✅ Successfully mapped ${results.size} complaints to departments`);
    
  } catch (error) {
    console.error('❌ Error in batch mapping:', error);
  }
  
  return results;
};

/**
 * Gets all available departments for a specific city
 * @param city - The city to get departments for
 * @returns Promise<DepartmentInfo[]> - Array of department information
 */
export const getDepartmentsByCity = async (city: string): Promise<DepartmentInfo[]> => {
  try {
    const departmentsRef = collection(adminDb, 'civic_issues');
    const q = query(
      departmentsRef,
      where('city', '==', city),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const departments: DepartmentInfo[] = [];
    
    snapshot.forEach((doc) => {
      departments.push({
        id: doc.id,
        ...doc.data()
      } as DepartmentInfo);
    });
    
    console.log(`📋 Found ${departments.length} departments for ${city}`);
    return departments;
    
  } catch (error) {
    console.error(`❌ Error getting departments for ${city}:`, error);
    return [];
  }
};

/**
 * Gets all available categories
 * @returns Promise<string[]> - Array of unique categories
 */
export const getAvailableCategories = async (): Promise<string[]> => {
  try {
    const departmentsRef = collection(adminDb, 'civic_issues');
    const snapshot = await getDocs(departmentsRef);
    const categories = new Set<string>();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    const categoryArray = Array.from(categories).sort();
    console.log(`📋 Found ${categoryArray.length} unique categories`);
    return categoryArray;
    
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    return [];
  }
};

/**
 * Gets all available cities
 * @returns Promise<string[]> - Array of unique cities
 */
export const getAvailableCities = async (): Promise<string[]> => {
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
    
    const cityArray = Array.from(cities).sort();
    console.log(`📋 Found ${cityArray.length} unique cities`);
    return cityArray;
    
  } catch (error) {
    console.error('❌ Error getting cities:', error);
    return [];
  }
};

/**
 * Creates a new department mapping entry
 * @param departmentInfo - Department information to create
 * @returns Promise<boolean> - Success status
 */
export const createDepartmentMapping = async (departmentInfo: DepartmentInfo): Promise<boolean> => {
  try {
    const { addDoc } = await import('firebase/firestore');
    const departmentsRef = collection(adminDb, 'civic_issues');
    
    await addDoc(departmentsRef, {
      ...departmentInfo,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Created department mapping: ${departmentInfo.department} for ${departmentInfo.category} in ${departmentInfo.city}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error creating department mapping:', error);
    return false;
  }
};

/**
 * Frontend-compatible version that uses userDb instead of adminDb
 * This function can be called from the React frontend
 */
export const mapComplaintToDepartmentFrontend = async (complaint: Complaint): Promise<DepartmentMappingResult> => {
  try {
    console.log(`🔍 [Frontend] Mapping complaint to department: ${complaint.category} in ${complaint.city}`);
    
    // Query the civic_issues collection using userDb (frontend-compatible)
    const departmentsRef = collection(userDb, 'civic_issues');
    const q = query(
      departmentsRef,
      where('category', '==', complaint.category),
      where('city', '==', complaint.city),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Found a matching department
      const doc = snapshot.docs[0];
      const data = doc.data() as DepartmentInfo;
      
      console.log(`✅ [Frontend] Found matching department: ${data.department}`);
      
      return {
        department: data.department,
        higher_authority: data.higher_authority,
        status: data.status || 'active',
        isDefault: false,
        matchedCriteria: {
          category: complaint.category,
          city: complaint.city
        }
      };
    }
    
    // No exact match found, try to find by category only
    console.log(`⚠️ [Frontend] No exact match found, trying category-only match for: ${complaint.category}`);
    
    const categoryQuery = query(
      departmentsRef,
      where('category', '==', complaint.category),
      limit(1)
    );
    
    const categorySnapshot = await getDocs(categoryQuery);
    
    if (!categorySnapshot.empty) {
      const doc = categorySnapshot.docs[0];
      const data = doc.data() as DepartmentInfo;
      
      console.log(`✅ [Frontend] Found category match: ${data.department} (city: ${data.city})`);
      
      return {
        department: data.department,
        higher_authority: data.higher_authority,
        status: data.status || 'active',
        isDefault: false,
        matchedCriteria: {
          category: complaint.category,
          city: data.city // Note: This is the department's city, not the complaint's city
        }
      };
    }
    
    // No match found at all, return default department
    console.log(`❌ [Frontend] No department match found, using default department`);
    
    return {
      department: 'Other Department',
      higher_authority: 'Municipal Commissioner / Executive Officer - Other Department',
      status: 'active',
      isDefault: true,
      matchedCriteria: {
        category: complaint.category,
        city: complaint.city
      }
    };
    
  } catch (error) {
    console.error('❌ [Frontend] Error mapping complaint to department:', error);
    
    // Return default department on error
    return {
      department: 'Other Department',
      higher_authority: 'Municipal Commissioner / Executive Officer - Other Department',
      status: 'active',
      isDefault: true,
      matchedCriteria: {
        category: complaint.category,
        city: complaint.city
      }
    };
  }
};

export default {
  mapComplaintToDepartment,
  mapComplaintToDepartmentFrontend,
  mapComplaintsToDepartments,
  getDepartmentsByCity,
  getAvailableCategories,
  getAvailableCities,
  createDepartmentMapping
};