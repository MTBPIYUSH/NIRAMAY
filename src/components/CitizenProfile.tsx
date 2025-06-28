import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { 
  initializeGoogleMaps, 
  initializePlacesAutocomplete, 
  reverseGeocode,
  PlaceResult 
} from '../lib/googleMaps';

interface CitizenProfileProps {
  user: Profile;
  onBack: () => void;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

export const CitizenProfile: React.FC<CitizenProfileProps> = ({ 
  user, 
  onBack, 
  onProfileUpdate 
}) => {
  const [profile, setProfile] = useState<Profile>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [addressInputValue, setAddressInputValue] = useState('');
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error('Google Maps API key not found');
          return;
        }

        await initializeGoogleMaps(apiKey);
        setMapsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setMessage({
          type: 'error',
          text: 'Failed to load Google Maps. Address autocomplete will not be available.'
        });
      }
    };

    initMaps();
  }, []);

  // Initialize Places Autocomplete when maps are loaded and editing
  useEffect(() => {
    if (mapsLoaded && isEditing && addressInputRef.current && !profile.address) {
      autocompleteRef.current = initializePlacesAutocomplete(
        addressInputRef.current,
        handlePlaceSelected,
        {
          country: 'in',
          types: ['address']
        }
      );
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [mapsLoaded, isEditing, profile.address]);

  const handlePlaceSelected = async (place: PlaceResult) => {
    try {
      setLoading(true);
      
      // If ward is not available from place, try reverse geocoding
      let ward = place.ward;
      if (!ward) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const reverseResult = await reverseGeocode(place.latitude, place.longitude, apiKey);
          ward = reverseResult?.ward;
        }
      }

      setProfile(prev => ({
        ...prev,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        ward: ward || prev.ward,
        city: place.city || prev.city
      }));

      setAddressInputValue(place.address);
      
      setMessage({
        type: 'success',
        text: 'Address selected successfully!'
      });
    } catch (error) {
      console.error('Error handling place selection:', error);
      setMessage({
        type: 'error',
        text: 'Error processing selected address. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      setMessage({
        type: 'error',
        text: 'Name is required'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const updateData: Partial<Profile> = {
        name: profile.name.trim(),
        updated_at: new Date().toISOString()
      };

      // Only update address fields if they were changed and address was previously empty
      if (!user.address && profile.address) {
        updateData.address = profile.address;
        updateData.latitude = profile.latitude;
        updateData.longitude = profile.longitude;
        updateData.ward = profile.ward;
        updateData.city = profile.city;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      const updatedProfile = { ...profile, ...data };
      setProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      setIsEditing(false);
      
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfile(user);
    setAddressInputValue(user.address || '');
    setIsEditing(false);
    setMessage(null);
  };

  const startEditing = () => {
    setIsEditing(true);
    setAddressInputValue(profile.address || '');
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
                  <p className="text-sm text-gray-600">Manage your account information</p>
                </div>
              </div>
            </div>
            
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Edit3 size={16} className="mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <User size={20} className="mr-2 text-green-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800">
                      {profile.name}
                    </div>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                      <Phone size={16} className="mr-2 text-gray-400" />
                      {profile.phone || 'Not provided'}
                      <Lock size={14} className="ml-auto text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                      <Mail size={16} className="mr-2 text-gray-400" />
                      {profile.email || 'Not provided'}
                      <Lock size={14} className="ml-auto text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Aadhaar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhaar Number
                  </label>
                  <div className="relative">
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                      <span className="mr-2">🆔</span>
                      {profile.aadhar ? `****-****-${profile.aadhar.slice(-4)}` : 'Not provided'}
                      <Lock size={14} className="ml-auto text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <MapPin size={20} className="mr-2 text-green-600" />
                Location Information
              </h3>
              
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address {!profile.address && '*'}
                  </label>
                  {isEditing && !profile.address ? (
                    <div>
                      <input
                        ref={addressInputRef}
                        type="text"
                        value={addressInputValue}
                        onChange={(e) => setAddressInputValue(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Start typing your address..."
                        disabled={!mapsLoaded}
                      />
                      {!mapsLoaded && (
                        <p className="text-sm text-gray-500 mt-2">
                          Loading address autocomplete...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      {profile.address || 'Address not set'}
                      {profile.address && <Lock size={14} className="ml-auto text-gray-400" />}
                    </div>
                  )}
                  {!profile.address && (
                    <p className="text-sm text-blue-600 mt-2">
                      💡 Address can only be set once for security purposes
                    </p>
                  )}
                </div>

                {/* Ward and City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Municipal Ward
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                      <span className="mr-2">🏛️</span>
                      {profile.ward || 'Auto-detected from address'}
                      <Lock size={14} className="ml-auto text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                      <span className="mr-2">🏙️</span>
                      {profile.city || 'Auto-detected from address'}
                      <Lock size={14} className="ml-auto text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Coordinates (if available) */}
                {profile.latitude && profile.longitude && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GPS Coordinates
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 flex items-center">
                      <span className="mr-2">📍</span>
                      {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
                      <Lock size={14} className="ml-auto text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <CheckCircle size={20} className="mr-2 text-green-600" />
                Account Statistics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {profile.eco_points || 0}
                    </div>
                    <div className="text-sm text-green-700">Eco Points</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {profile.points || 0}
                    </div>
                    <div className="text-sm text-blue-700">Total Points</div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {new Date(profile.created_at).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-purple-700">Member Since</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-800 mb-3">📋 Profile Guidelines</h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Your name can be updated anytime</li>
            <li>• Address can only be set once for security purposes</li>
            <li>• Municipal ward is automatically detected from your address</li>
            <li>• Contact information is protected and cannot be changed here</li>
            <li>• Your location helps us assign nearby cleanup tasks efficiently</li>
          </ul>
        </div>
      </div>
    </div>
  );
};