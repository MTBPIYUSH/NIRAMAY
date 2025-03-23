// Use a valid API key - this is a placeholder, replace with your actual key
const GOOGLE_MAPS_API_KEY = "";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

// Load Google Maps API script with retry mechanism
export function loadGoogleMapsScript(retryCount = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`,
    );
    if (existingScript) {
      console.log("Google Maps script is already loading");
      // If script is already loading, wait for it to load
      existingScript.addEventListener("load", () => {
        console.log("Existing Google Maps script loaded");
        resolve();
      });
      existingScript.addEventListener("error", (e) => {
        console.error("Error loading existing Google Maps script:", e);
        reject(new Error("Failed to load Google Maps API"));
      });
      return;
    }

    // Create and append script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Define a global callback function
    window.initGoogleMapsCallback = function () {
      console.log("Google Maps loaded via callback");
      resolve();
      delete window.initGoogleMapsCallback;
    };

    script.onerror = (e) => {
      console.error("Error loading Google Maps script:", e);
      if (retryCount < 3) {
        console.log(`Retrying Google Maps load (${retryCount + 1}/3)...`);
        // Remove the failed script
        script.remove();
        // Try again with exponential backoff
        setTimeout(
          () => {
            loadGoogleMapsScript(retryCount + 1)
              .then(resolve)
              .catch(reject);
          },
          1000 * Math.pow(2, retryCount),
        );
      } else {
        reject(
          new Error("Failed to load Google Maps API after multiple attempts"),
        );
      }
    };

    document.head.appendChild(script);

    // Set a timeout in case the callback is never called
    const timeoutId = setTimeout(() => {
      if (window.google && window.google.maps) {
        console.log("Google Maps loaded but callback wasn't called");
        resolve();
      } else {
        console.error("Google Maps load timed out");
        if (retryCount < 3) {
          console.log(`Retrying Google Maps load (${retryCount + 1}/3)...`);
          // Remove the failed script
          script.remove();
          // Try again with exponential backoff
          loadGoogleMapsScript(retryCount + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error("Failed to load Google Maps API after timeout"));
        }
      }
      clearTimeout(timeoutId);
    }, 10000); // 10 second timeout
  });
}

// Get address from coordinates using Google Maps Geocoding API
export async function getAddressFromCoordinates(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    console.log(`Getting address for coordinates: ${lat}, ${lng}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Geocoding API response:", data);

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    if (data.status !== "OK") {
      console.warn(`Geocoding API returned status: ${data.status}`);
      // Fallback to a simple formatted string if the API fails
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }

    return "Unknown location";
  } catch (error) {
    console.error("Error getting address:", error);
    // Fallback to coordinates if there's an error
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  }
}

// Get coordinates from address using Google Maps Geocoding API
export async function getCoordinatesFromAddress(
  address: string,
): Promise<Location | null> {
  try {
    console.log(`Getting coordinates for address: ${address}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Geocoding API response:", data);

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng, address: data.results[0].formatted_address };
    }

    if (data.status !== "OK") {
      console.warn(`Geocoding API returned status: ${data.status}`);
    }

    return null;
  } catch (error) {
    console.error("Error getting coordinates:", error);
    return null;
  }
}

// Declare the global callback function type
declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;
    google?: any;
  }
}
