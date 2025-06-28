// Google Maps integration utilities
export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
}

export interface PlaceResult {
  address: string;
  latitude: number;
  longitude: number;
  ward?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

// Global promise to track Google Maps API loading state
let __googleMapsApiPromise: Promise<void> | null = null;

// Initialize Google Maps
export const initializeGoogleMaps = (apiKey: string): Promise<void> => {
  // Return existing promise if already loading or loaded
  if (__googleMapsApiPromise) {
    return __googleMapsApiPromise;
  }

  // Check if Google Maps is already loaded
  if (window.google && window.google.maps) {
    __googleMapsApiPromise = Promise.resolve();
    return __googleMapsApiPromise;
  }

  __googleMapsApiPromise = new Promise((resolve, reject) => {
    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,directions&callback=__initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Global callback function - ensure it's only defined once
    if (!(window as any).__initGoogleMaps) {
      (window as any).__initGoogleMaps = () => {
        resolve();
      };
    }

    script.onerror = () => {
      __googleMapsApiPromise = null; // Reset on error so it can be retried
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return __googleMapsApiPromise;
};

// Initialize Places Autocomplete
export const initializePlacesAutocomplete = (
  inputElement: HTMLInputElement,
  onPlaceSelected: (place: PlaceResult) => void,
  options: {
    country?: string;
    types?: string[];
  } = {}
): google.maps.places.Autocomplete | null => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps Places API not loaded');
    return null;
  }

  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    componentRestrictions: { country: options.country || 'in' },
    types: options.types || ['address'],
    fields: ['formatted_address', 'geometry', 'address_components']
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (!place.geometry || !place.geometry.location) {
      console.error('No geometry data for selected place');
      return;
    }

    const result: PlaceResult = {
      address: place.formatted_address || '',
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    };

    // Extract ward, city, state from address components
    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
          result.ward = component.long_name;
        } else if (types.includes('locality')) {
          result.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          result.state = component.long_name;
        } else if (types.includes('postal_code')) {
          result.postalCode = component.long_name;
        }
      });
    }

    onPlaceSelected(result);
  });

  return autocomplete;
};

// Reverse geocode coordinates to get address and ward
export const reverseGeocode = async (
  lat: number,
  lng: number,
  apiKey: string
): Promise<PlaceResult | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Reverse geocoding failed:', data.status);
      return null;
    }

    const result = data.results[0];
    const placeResult: PlaceResult = {
      address: result.formatted_address,
      latitude: lat,
      longitude: lng
    };

    // Extract ward, city, state from address components
    if (result.address_components) {
      result.address_components.forEach((component: any) => {
        const types = component.types;
        
        if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
          placeResult.ward = component.long_name;
        } else if (types.includes('locality')) {
          placeResult.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          placeResult.state = component.long_name;
        } else if (types.includes('postal_code')) {
          placeResult.postalCode = component.long_name;
        }
      });
    }

    return placeResult;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

// Create embedded map
export const createEmbeddedMap = (
  container: HTMLElement,
  location: MapLocation,
  options: {
    zoom?: number;
    marker?: boolean;
    clickable?: boolean;
  } = {}
): google.maps.Map | null => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const map = new google.maps.Map(container, {
    center: { lat: location.lat, lng: location.lng },
    zoom: options.zoom || 15,
    clickableIcons: options.clickable !== false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });

  if (options.marker !== false) {
    new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: location.address || 'Location'
    });
  }

  return map;
};

// Create map with directions
export const createMapWithDirections = (
  container: HTMLElement,
  origin: MapLocation,
  destination: MapLocation,
  options: {
    zoom?: number;
    travelMode?: google.maps.TravelMode;
  } = {}
): google.maps.Map | null => {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const map = new google.maps.Map(container, {
    zoom: options.zoom || 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#4F46E5',
      strokeWeight: 4
    }
  });

  directionsRenderer.setMap(map);

  directionsService.route({
    origin: new google.maps.LatLng(origin.lat, origin.lng),
    destination: new google.maps.LatLng(destination.lat, destination.lng),
    travelMode: options.travelMode || google.maps.TravelMode.DRIVING
  }, (result, status) => {
    if (status === 'OK' && result) {
      directionsRenderer.setDirections(result);
    } else {
      console.error('Directions request failed:', status);
    }
  });

  return map;
};

// Get current user location
export const getCurrentLocation = (): Promise<MapLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Calculate distance between two points (in meters)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  if (!window.google || !window.google.maps || !window.google.maps.geometry) {
    // Fallback to Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Use Google Maps geometry library for more accurate calculation
  const point1 = new google.maps.LatLng(lat1, lng1);
  const point2 = new google.maps.LatLng(lat2, lng2);
  
  return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
};

// Get directions URL for external navigation
export const getDirectionsUrl = (
  origin: MapLocation,
  destination: MapLocation,
  travelMode: 'driving' | 'walking' | 'transit' = 'driving'
): string => {
  const baseUrl = 'https://www.google.com/maps/dir/';
  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = `${destination.lat},${destination.lng}`;
  const modeParam = travelMode === 'driving' ? '' : `&dirflg=${travelMode.charAt(0)}`;
  
  return `${baseUrl}${originStr}/${destStr}${modeParam}`;
};

// Validate if location is within Indian boundaries (approximate)
export const isLocationInIndia = (lat: number, lng: number): boolean => {
  // Approximate boundaries of India
  const INDIA_BOUNDS = {
    north: 37.6,
    south: 6.4,
    east: 97.25,
    west: 68.7
  };

  return lat >= INDIA_BOUNDS.south && 
         lat <= INDIA_BOUNDS.north && 
         lng >= INDIA_BOUNDS.west && 
         lng <= INDIA_BOUNDS.east;
};