# Google Maps API Setup Guide

## Required API Keys

To integrate Google Maps functionality in Niramay, you need to set up the following Google Cloud APIs and obtain API keys:

### 1. Maps JavaScript API
- **Purpose**: Display embedded maps in the application
- **Usage**: Report detail views, location visualization
- **Restrictions**: Restrict to your domain (e.g., `*.yourdomain.com`)

### 2. Places API
- **Purpose**: Address autocomplete functionality
- **Usage**: Citizen profile address input
- **Restrictions**: Restrict to your domain and limit to Places API

### 3. Geocoding API
- **Purpose**: Convert coordinates to addresses and vice versa
- **Usage**: Reverse geocoding to determine municipal ward from coordinates
- **Restrictions**: Restrict to your domain and limit to Geocoding API

## Setup Steps

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

### 2. Enable Required APIs
1. Navigate to "APIs & Services" > "Library"
2. Search for and enable:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 3. Create API Keys
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Create separate keys for each API (recommended) or use one key for all

### 4. Configure API Key Restrictions

#### For Maps JavaScript API Key:
- **Application restrictions**: HTTP referrers (web sites)
- **Website restrictions**: Add your domains:
  - `localhost:*` (for development)
  - `*.yourdomain.com/*` (for production)
- **API restrictions**: Restrict key to Maps JavaScript API

#### For Places API Key:
- **Application restrictions**: HTTP referrers (web sites)
- **Website restrictions**: Same as above
- **API restrictions**: Restrict key to Places API

#### For Geocoding API Key:
- **Application restrictions**: HTTP referrers (web sites)
- **Website restrictions**: Same as above
- **API restrictions**: Restrict key to Geocoding API

### 5. Environment Variables
Add the following to your `.env` file:

```env
# Google Maps API Keys
VITE_GOOGLE_MAPS_API_KEY=your_maps_javascript_api_key_here
VITE_GOOGLE_PLACES_API_KEY=your_places_api_key_here
VITE_GOOGLE_GEOCODING_API_KEY=your_geocoding_api_key_here
```

**Note**: If using a single API key for all services, use the same key for all three variables.

## Usage in Application

### 1. Maps Display
```typescript
import { initializeGoogleMaps, createEmbeddedMap } from '../lib/googleMaps';

// Initialize maps
await initializeGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

// Create map
const map = createEmbeddedMap(container, {
  lat: 28.4595,
  lng: 77.0266,
  address: 'Gurgaon, Haryana'
});
```

### 2. Address Autocomplete
```typescript
import { initializePlacesAutocomplete } from '../lib/googleMaps';

const autocomplete = initializePlacesAutocomplete(
  inputElement,
  (place) => {
    console.log('Selected place:', place);
  },
  { country: 'in', types: ['address'] }
);
```

### 3. Reverse Geocoding
```typescript
import { reverseGeocode } from '../lib/googleMaps';

const result = await reverseGeocode(
  28.4595, 
  77.0266, 
  import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY
);
```

## Cost Optimization

### 1. API Usage Limits
- Set daily quotas for each API to prevent unexpected charges
- Monitor usage in Google Cloud Console

### 2. Caching
- Cache geocoding results to avoid repeated API calls
- Store user addresses locally after first lookup

### 3. Efficient Loading
- Load Maps API only when needed
- Use lazy loading for map components

## Security Best Practices

### 1. API Key Security
- Never expose API keys in client-side code for server-side APIs
- Use environment variables for all API keys
- Regularly rotate API keys

### 2. Domain Restrictions
- Always restrict API keys to specific domains
- Use HTTPS only in production
- Monitor API key usage for suspicious activity

### 3. Rate Limiting
- Implement client-side rate limiting
- Use debouncing for autocomplete inputs
- Cache results to reduce API calls

## Testing

### 1. Development Testing
- Use `localhost` restrictions for development
- Test all map functionalities locally
- Verify autocomplete works with Indian addresses

### 2. Production Testing
- Test with production domain restrictions
- Verify all APIs work correctly
- Monitor performance and loading times

## Troubleshooting

### Common Issues:

1. **API Key Errors**
   - Check if APIs are enabled
   - Verify domain restrictions
   - Ensure billing is enabled

2. **Autocomplete Not Working**
   - Check Places API is enabled
   - Verify API key restrictions
   - Test with different address formats

3. **Maps Not Loading**
   - Check browser console for errors
   - Verify Maps JavaScript API is enabled
   - Check network connectivity

4. **Geocoding Failures**
   - Verify Geocoding API is enabled
   - Check coordinate format
   - Test with known valid coordinates

## Support

For additional help:
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Support](https://cloud.google.com/support)
- [Stack Overflow - Google Maps](https://stackoverflow.com/questions/tagged/google-maps)