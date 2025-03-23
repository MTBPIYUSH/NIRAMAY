import { useEffect, useRef, useState, useCallback } from "react";
import {
  loadGoogleMapsScript,
  getAddressFromCoordinates,
  Location,
} from "@/lib/maps";

interface GoogleMapProps {
  onLocationSelect?: (location: Location) => void;
  initialLocation?: Location;
  markers?: Location[];
  height?: string;
  className?: string;
}

export function GoogleMap({
  onLocationSelect,
  initialLocation = { lat: 40.7128, lng: -74.006 }, // Default to NYC
  markers = [],
  height = "400px",
  className = "",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading map...");

  // Load Google Maps script
  useEffect(() => {
    const loadMap = async () => {
      try {
        setLoadingMessage("Loading Google Maps API...");
        await loadGoogleMapsScript();
        setIsLoaded(true);
        setLoadError(false);
        console.log("Google Maps API loaded successfully");
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
        setLoadError(true);
        setLoadingMessage("Failed to load Google Maps API. Retrying...");

        // Try again after a short delay
        setTimeout(() => {
          loadMap();
        }, 3000);
      }
    };

    loadMap();
  }, []);

  // Initialize map with useCallback to prevent unnecessary re-renders
  const initializeMap = useCallback(() => {
    if (!isLoaded || !mapRef.current) return;
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not available");
      setLoadError(true);
      return;
    }

    try {
      console.log("Initializing map with center:", initialLocation);
      const newMap = new google.maps.Map(mapRef.current, {
        center: initialLocation,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      setMap(newMap);
      console.log("Map initialized successfully");

      // Add click listener if onLocationSelect is provided
      if (onLocationSelect) {
        newMap.addListener("click", async (e: google.maps.MapMouseEvent) => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();

          if (lat && lng) {
            try {
              const address = await getAddressFromCoordinates(lat, lng);
              onLocationSelect({ lat, lng, address });
              console.log("Location selected:", { lat, lng, address });
            } catch (error) {
              console.error("Error getting address from coordinates:", error);
              onLocationSelect({ lat, lng, address: "Unknown location" });
            }
          }
        });
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setLoadError(true);
    }
  }, [isLoaded, initialLocation, onLocationSelect]);

  // Call initializeMap when dependencies change
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      console.log("Calling initializeMap");
      initializeMap();
    }
  }, [isLoaded, initializeMap]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!window.google || !window.google.maps) return;

    try {
      console.log("Updating markers:", markers);
      // Clear existing markers
      mapMarkers.forEach((marker) => marker.setMap(null));
      const newMarkers: google.maps.Marker[] = [];

      // Add new markers
      markers.forEach((location) => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          title: location.address || "Waste Report",
        });

        newMarkers.push(marker);
      });

      setMapMarkers(newMarkers);
    } catch (error) {
      console.error("Error updating markers:", error);
    }
  }, [map, markers, isLoaded]);

  // Cleanup function to remove markers when component unmounts
  useEffect(() => {
    return () => {
      mapMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [mapMarkers]);

  return (
    <div
      ref={mapRef}
      className={`rounded-md overflow-hidden ${className}`}
      style={{ height, minHeight: "300px", width: "100%" }}
    >
      {!isLoaded && !loadError && (
        <div className="h-full w-full flex items-center justify-center bg-muted">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">{loadingMessage}</p>
          </div>
        </div>
      )}
      {loadError && (
        <div className="h-full w-full flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">
              Failed to load map. Please check your API key and try again.
            </p>
            <button
              onClick={() => {
                setLoadError(false);
                setIsLoaded(false);
                loadGoogleMapsScript()
                  .then(() => {
                    setIsLoaded(true);
                    setLoadError(false);
                  })
                  .catch((error) => {
                    console.error("Failed to reload Google Maps:", error);
                    setLoadError(true);
                  });
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Retry Loading Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
