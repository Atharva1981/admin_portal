# Department Mapping Service Usage Guide

This guide demonstrates how to use the `mapComplaintToDepartment` function to connect to the admin Firestore project and map complaints to their appropriate departments.

## 📋 Function Overview

The `mapComplaintToDepartment` function:
- Connects to the admin Firestore project (already configured)
- Queries the `departments` collection where `category` == complaint.category AND `city` == complaint.city
- Returns department info (department, higher_authority, status)
- Falls back to "General Grievances" if no match is found

## 🚀 Basic Usage

### 1. Import the Function

```typescript
import { mapComplaintToDepartment } from '../services/departmentMappingService';
```

### 2. Map a Single Complaint

```typescript
const complaint = {
  category: 'Garbage / Waste',
  city: 'Ranchi',
  pincode: '834001',
  description: 'Overflowing dustbin near Albert Ekka Chowk',
  complaintId: 'COMP-001'
};

const result = await mapComplaintToDepartment(complaint);

console.log('Department:', result.department);
console.log('Authority:', result.higher_authority);
console.log('Status:', result.status);
console.log('Is Default:', result.isDefault);
```

### 3. Map Multiple Complaints

```typescript
import { mapComplaintsToDepartments } from '../services/departmentMappingService';

const complaints = [
  { category: 'Garbage / Waste', city: 'Ranchi', pincode: '834001' },
  { category: 'Road Damage / Potholes', city: 'Jamshedpur', pincode: '831001' },
  { category: 'Water Supply / Leakage', city: 'Dhanbad', pincode: '826001' }
];

const results = await mapComplaintsToDepartments(complaints);

results.forEach((deptInfo, complaintId) => {
  console.log(`${complaintId}: ${deptInfo.department}`);
});
```

## 🎯 React Hook Usage

### Using the useDepartmentMapping Hook

```typescript
import { useDepartmentMapping } from '../hooks/useDepartmentMapping';

const MyComponent = () => {
  const { mapComplaint, loading, error } = useDepartmentMapping();
  
  const handleMapComplaint = async (complaint) => {
    const result = await mapComplaint(complaint);
    console.log('Mapped to:', result.department);
  };
  
  if (loading) return <div>Mapping complaint...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {/* Your component UI */}
    </div>
  );
};
```

## 📊 Available Functions

### 1. mapComplaintToDepartment(complaint)
- **Purpose**: Map a single complaint to its department
- **Parameters**: `Complaint` object with category, city, etc.
- **Returns**: `Promise<DepartmentMappingResult>`

### 2. mapComplaintsToDepartments(complaints)
- **Purpose**: Map multiple complaints to departments in batch
- **Parameters**: Array of `Complaint` objects
- **Returns**: `Promise<Map<string, DepartmentMappingResult>>`

### 3. getDepartmentsByCity(city)
- **Purpose**: Get all departments for a specific city
- **Parameters**: City name string
- **Returns**: `Promise<DepartmentInfo[]>`

### 4. getAvailableCategories()
- **Purpose**: Get all available complaint categories
- **Returns**: `Promise<string[]>`

### 5. getAvailableCities()
- **Purpose**: Get all available cities
- **Returns**: `Promise<string[]>`

## 🔧 Data Structures

### Complaint Interface
```typescript
interface Complaint {
  category: string;        // 'Garbage / Waste', 'Road Damage / Potholes', etc.
  city: string;           // 'Ranchi', 'Jamshedpur', etc.
  pincode?: string;       // '834001', '831001', etc.
  description?: string;   // Optional description
  complaintId?: string;   // Optional unique ID
}
```

### DepartmentMappingResult Interface
```typescript
interface DepartmentMappingResult {
  department: string;           // 'Sanitation Department (Ranchi ULB)'
  higher_authority: string;     // 'Municipal Commissioner / Executive Officer - Ranchi ULB'
  status: string;              // 'active', 'inactive', etc.
  isDefault: boolean;          // true if using default department
  matchedCriteria?: {          // What criteria matched
    category: string;
    city: string;
  };
}
```

### DepartmentInfo Interface
```typescript
interface DepartmentInfo {
  department: string;
  higher_authority: string;
  status: string;
  category: string;
  city: string;
  pincode?: string;
}
```

## 🎯 Mapping Logic

The function follows this priority order:

1. **Exact Match**: `category` AND `city` match
2. **Category Match**: Only `category` matches (uses department's city)
3. **Default Department**: "General Grievances" if no match found

## 📱 Example: Complete Component

```typescript
import React, { useState } from 'react';
import { mapComplaintToDepartment, Complaint } from '../services/departmentMappingService';

const ComplaintMapper = () => {
  const [complaint, setComplaint] = useState<Complaint>({
    category: 'Garbage / Waste',
    city: 'Ranchi',
    pincode: '834001'
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMap = async () => {
    setLoading(true);
    try {
      const mappingResult = await mapComplaintToDepartment(complaint);
      setResult(mappingResult);
    } catch (error) {
      console.error('Mapping failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2>Complaint to Department Mapping</h2>
      
      {/* Input Form */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Category</label>
          <select 
            value={complaint.category} 
            onChange={(e) => setComplaint({...complaint, category: e.target.value})}
          >
            <option value="Garbage / Waste">Garbage / Waste</option>
            <option value="Road Damage / Potholes">Road Damage / Potholes</option>
            <option value="Water Supply / Leakage">Water Supply / Leakage</option>
            <option value="Streetlight / Power Outage">Streetlight / Power Outage</option>
            <option value="Drainage / Sewage">Drainage / Sewage</option>
          </select>
        </div>
        
        <div>
          <label>City</label>
          <select 
            value={complaint.city} 
            onChange={(e) => setComplaint({...complaint, city: e.target.value})}
          >
            <option value="Ranchi">Ranchi</option>
            <option value="Jamshedpur">Jamshedpur</option>
            <option value="Dhanbad">Dhanbad</option>
            <option value="Bokaro Steel City">Bokaro Steel City</option>
            <option value="Deoghar">Deoghar</option>
          </select>
        </div>
      </div>
      
      <button 
        onClick={handleMap} 
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Mapping...' : 'Map to Department'}
      </button>
      
      {/* Result Display */}
      {result && (
        <div className="bg-gray-50 p-4 rounded">
          <h3>Mapping Result</h3>
          <p><strong>Department:</strong> {result.department}</p>
          <p><strong>Authority:</strong> {result.higher_authority}</p>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Match Type:</strong> {result.isDefault ? 'Default' : 'Exact Match'}</p>
        </div>
      )}
    </div>
  );
};
```

## 🧪 Testing the Function

To test the function in your admin dashboard:

1. **Start the development server**: `npm run dev`
2. **Navigate to Dashboard**: Go to your admin dashboard
3. **Click "Dept Mapping" tab**: This will show the test component
4. **Test different combinations**: Try different categories and cities
5. **View mapping results**: See how complaints map to departments

## 📊 Current Data Status

Your admin Firestore project contains department mappings for:
- **Categories**: Garbage/Waste, Road Damage/Potholes, Water Supply/Leakage, Streetlight/Power Outage, Drainage/Sewage
- **Cities**: Ranchi, Jamshedpur, Dhanbad, Bokaro Steel City, Deoghar, Hazaribagh, Giridih, Ramgarh, Koderma, Chaibasa, Phusro, Medininagar (Daltonganj), Chirkunda, Jhumri Telaiya, Ghatshila, Pakur, Dumka, Simdega, Latehar, Gumla

## 🎉 Ready to Use!

The `mapComplaintToDepartment` function is now ready to use in your admin dashboard. It provides:

- ✅ Connection to admin Firestore project
- ✅ Intelligent department mapping based on category and city
- ✅ Fallback to default department when no match found
- ✅ Batch processing for multiple complaints
- ✅ TypeScript support with proper interfaces
- ✅ Error handling and logging
- ✅ React hooks for easy integration

Start using it to automatically assign complaints to the right departments! 🚀