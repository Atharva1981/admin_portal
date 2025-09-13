/**
 * Utility functions for parsing addresses and extracting city names
 * Specifically designed for SIH 2025 complaints database address format
 */

export interface ParsedAddress {
  city: string;
  state?: string;
  pincode?: string;
  fullAddress: string;
}

/**
 * Common Indian city names and their variations
 */
const CITY_MAPPINGS: Record<string, string> = {
  // Major cities and their common variations
  'mumbai': 'Mumbai',
  'bombay': 'Mumbai',
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
  'bengaluru': 'Bengaluru',
  'bangalore': 'Bengaluru',
  'hyderabad': 'Hyderabad',
  'chennai': 'Chennai',
  'madras': 'Chennai',
  'kolkata': 'Kolkata',
  'calcutta': 'Kolkata',
  'pune': 'Pune',
  'ahmedabad': 'Ahmedabad',
  'surat': 'Surat',
  'jaipur': 'Jaipur',
  'lucknow': 'Lucknow',
  'kanpur': 'Kanpur',
  'nagpur': 'Nagpur',
  'indore': 'Indore',
  'thane': 'Thane',
  'bhopal': 'Bhopal',
  'visakhapatnam': 'Visakhapatnam',
  'vizag': 'Visakhapatnam',
  'pimpri chinchwad': 'Pimpri-Chinchwad',
  'pimpri-chinchwad': 'Pimpri-Chinchwad',
  'patna': 'Patna',
  'vadodara': 'Vadodara',
  'baroda': 'Vadodara',
  'ghaziabad': 'Ghaziabad',
  'ludhiana': 'Ludhiana',
  'agra': 'Agra',
  'nashik': 'Nashik',
  'faridabad': 'Faridabad',
  'meerut': 'Meerut',
  'rajkot': 'Rajkot',
  'kalyan-dombivli': 'Kalyan-Dombivli',
  'vasai-virar': 'Vasai-Virar',
  'varanasi': 'Varanasi',
  'banaras': 'Varanasi',
  'srinagar': 'Srinagar',
  'aurangabad': 'Aurangabad',
  'dhanbad': 'Dhanbad',
  'amritsar': 'Amritsar',
  'navi mumbai': 'Navi Mumbai',
  'allahabad': 'Prayagraj',
  'prayagraj': 'Prayagraj',
  'howrah': 'Howrah',
  'ranchi': 'Ranchi',
  'gwalior': 'Gwalior',
  'jabalpur': 'Jabalpur',
  'coimbatore': 'Coimbatore',
  'vijayawada': 'Vijayawada',
  'jodhpur': 'Jodhpur',
  'madurai': 'Madurai',
  'raipur': 'Raipur',
  'kota': 'Kota',
  'chandigarh': 'Chandigarh',
  'guwahati': 'Guwahati',
  'solapur': 'Solapur',
  'hubli-dharwad': 'Hubli-Dharwad',
  'bareilly': 'Bareilly',
  'moradabad': 'Moradabad',
  'mysore': 'Mysuru',
  'mysuru': 'Mysuru',
  'tiruchirappalli': 'Tiruchirappalli',
  'trichy': 'Tiruchirappalli',
  'salem': 'Salem',
  'tiruppur': 'Tiruppur'
};

/**
 * Indian state names for better parsing
 */
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu'
];

/**
 * Extracts city name from an Indian address string
 * @param address - Full address string
 * @returns Extracted and normalized city name
 */
export const extractCityFromAddress = (address: string): string => {
  if (!address || typeof address !== 'string') {
    return 'Unknown';
  }

  // Clean and normalize the address
  const cleanAddress = address.trim().toLowerCase();
  
  // Split address by common separators
  const addressParts = cleanAddress.split(/[,\n\r\-|]/);
  
  // Remove empty parts and trim
  const cleanParts = addressParts
    .map(part => part.trim())
    .filter(part => part.length > 0);

  // Strategy 1: Look for direct city matches in the address parts
  for (const part of cleanParts) {
    const normalizedPart = part.toLowerCase().trim();
    
    // Check if this part matches a known city
    if (CITY_MAPPINGS[normalizedPart]) {
      return CITY_MAPPINGS[normalizedPart];
    }
    
    // Check for partial matches (for compound city names)
    for (const [key, value] of Object.entries(CITY_MAPPINGS)) {
      if (normalizedPart.includes(key) || key.includes(normalizedPart)) {
        return value;
      }
    }
  }

  // Strategy 2: Look for patterns like "City, State" or "City - State"
  for (let i = 0; i < cleanParts.length - 1; i++) {
    const currentPart = cleanParts[i].toLowerCase().trim();
    const nextPart = cleanParts[i + 1].toLowerCase().trim();
    
    // Check if next part is a state (indicating current part might be city)
    const isNextPartState = INDIAN_STATES.some(state => 
      state.toLowerCase() === nextPart || nextPart.includes(state.toLowerCase())
    );
    
    if (isNextPartState && CITY_MAPPINGS[currentPart]) {
      return CITY_MAPPINGS[currentPart];
    }
  }

  // Strategy 3: Look for pincode patterns and use the part before it as city
  const pincodePattern = /\b\d{6}\b/;
  const addressWithPincode = cleanAddress.match(/(.+?)\s*\b\d{6}\b/);
  
  if (addressWithPincode) {
    const beforePincode = addressWithPincode[1];
    const parts = beforePincode.split(/[,\-|]/).map(p => p.trim()).filter(p => p.length > 0);
    
    // Check the last meaningful part before pincode
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1].toLowerCase();
      if (CITY_MAPPINGS[lastPart]) {
        return CITY_MAPPINGS[lastPart];
      }
    }
  }

  // Strategy 4: Use heuristics for common address patterns
  // Look for parts that are likely to be cities (not too short, not numbers, etc.)
  for (const part of cleanParts) {
    const normalizedPart = part.toLowerCase().trim();
    
    // Skip if it's too short, contains only numbers, or looks like a pincode
    if (normalizedPart.length < 3 || /^\d+$/.test(normalizedPart) || /\d{6}/.test(normalizedPart)) {
      continue;
    }
    
    // Skip common non-city words
    const skipWords = ['near', 'opp', 'opposite', 'behind', 'front', 'road', 'street', 'lane', 'area', 'sector', 'block', 'plot', 'house', 'flat', 'apartment', 'building', 'complex', 'society', 'colony', 'nagar', 'pura', 'ganj', 'market', 'chowk', 'circle', 'square', 'junction', 'cross', 'bridge', 'gate', 'station', 'stop', 'stand', 'depot', 'terminal', 'airport', 'port', 'hospital', 'school', 'college', 'university', 'temple', 'mosque', 'church', 'park', 'garden', 'mall', 'center', 'centre'];
    
    if (skipWords.some(word => normalizedPart.includes(word))) {
      continue;
    }
    
    // If we reach here, this might be a city name
    // Capitalize first letter of each word
    const capitalizedCity = part
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return capitalizedCity;
  }

  // Strategy 5: Fallback - return the longest meaningful part
  const meaningfulParts = cleanParts.filter(part => 
    part.length >= 3 && 
    !/^\d+$/.test(part) && 
    !pincodePattern.test(part)
  );
  
  if (meaningfulParts.length > 0) {
    const longestPart = meaningfulParts.reduce((a, b) => a.length > b.length ? a : b);
    return longestPart.charAt(0).toUpperCase() + longestPart.slice(1).toLowerCase();
  }

  return 'Unknown';
};

/**
 * Parses a full address and extracts structured information
 * @param address - Full address string
 * @returns Parsed address components
 */
export const parseAddress = (address: string): ParsedAddress => {
  if (!address || typeof address !== 'string') {
    return {
      city: 'Unknown',
      fullAddress: address || ''
    };
  }

  const city = extractCityFromAddress(address);
  
  // Extract pincode
  const pincodeMatch = address.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : undefined;
  
  // Extract state (look for known state names)
  let state: string | undefined;
  const lowerAddress = address.toLowerCase();
  
  for (const stateName of INDIAN_STATES) {
    if (lowerAddress.includes(stateName.toLowerCase())) {
      state = stateName;
      break;
    }
  }

  return {
    city,
    state,
    pincode,
    fullAddress: address.trim()
  };
};

/**
 * Validates if a string looks like a valid Indian city name
 * @param cityName - City name to validate
 * @returns Boolean indicating if it's likely a valid city
 */
export const isValidCityName = (cityName: string): boolean => {
  if (!cityName || typeof cityName !== 'string' || cityName.length < 2) {
    return false;
  }

  const normalizedCity = cityName.toLowerCase().trim();
  
  // Check if it's in our known cities list
  if (CITY_MAPPINGS[normalizedCity] || Object.values(CITY_MAPPINGS).some(city => 
    city.toLowerCase() === normalizedCity
  )) {
    return true;
  }

  // Basic validation - should not be all numbers or contain only special characters
  if (/^\d+$/.test(normalizedCity) || /^[^a-zA-Z]+$/.test(normalizedCity)) {
    return false;
  }

  // Should not be common non-city words
  const nonCityWords = ['unknown', 'not provided', 'n/a', 'na', 'nil', 'none', 'test', 'sample'];
  if (nonCityWords.includes(normalizedCity)) {
    return false;
  }

  return true;
};

export default {
  extractCityFromAddress,
  parseAddress,
  isValidCityName,
  CITY_MAPPINGS,
  INDIAN_STATES
};
