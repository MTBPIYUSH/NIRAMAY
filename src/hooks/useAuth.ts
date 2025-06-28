import { useState, useEffect } from 'react';

export interface Profile {
  id: string;
  role: 'citizen' | 'admin' | 'subworker';
  aadhar?: string;
  name: string;
  phone?: string;
  ward?: string;
  city?: string;
  points?: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

// Mock data for demo purposes
const mockProfiles: Profile[] = [
  {
    id: '1',
    role: 'citizen',
    name: 'Arjun Sharma',
    email: 'arjun@example.com',
    aadhar: '123456789012',
    phone: '9876543210',
    points: 1250,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    role: 'admin',
    name: 'Priya Patel',
    email: 'admin@niramay.gov.in',
    ward: 'Ward 12',
    city: 'Gurgaon',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    role: 'subworker',
    name: 'Ravi Kumar',
    email: 'worker@niramay.gov.in',
    ward: 'Ward 12',
    city: 'Gurgaon',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('niramay_user');
    const savedProfile = localStorage.getItem('niramay_profile');
    
    if (savedUser && savedProfile) {
      try {
        setUser(JSON.parse(savedUser));
        setProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error parsing saved auth data:', error);
        localStorage.removeItem('niramay_user');
        localStorage.removeItem('niramay_profile');
      }
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userData: {
    name: string;
    aadhar: string;
    phone: string;
  }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if Aadhar already exists
      const existingProfile = mockProfiles.find(p => p.aadhar === userData.aadhar);
      if (existingProfile) {
        throw new Error('An account with this Aadhaar number already exists');
      }

      // Check if email already exists
      const existingEmail = mockProfiles.find(p => p.email === email);
      if (existingEmail) {
        throw new Error('An account with this email already exists');
      }

      // Create new user and profile
      const newUser: User = {
        id: Date.now().toString(),
        email
      };

      const newProfile: Profile = {
        id: newUser.id,
        role: 'citizen',
        name: userData.name,
        email,
        aadhar: userData.aadhar,
        phone: userData.phone,
        points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to mock data
      mockProfiles.push(newProfile);

      // Save to localStorage
      localStorage.setItem('niramay_user', JSON.stringify(newUser));
      localStorage.setItem('niramay_profile', JSON.stringify(newProfile));

      // Update state immediately
      setUser(newUser);
      setProfile(newProfile);

      return { data: { user: newUser }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user profile
      const userProfile = mockProfiles.find(p => p.email === email);
      
      if (!userProfile) {
        throw new Error('Invalid email or password');
      }

      // Simulate password validation (in real app, this would be handled by backend)
      if (password.length < 6) {
        throw new Error('Invalid email or password');
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email
      };

      // Save to localStorage
      localStorage.setItem('niramay_user', JSON.stringify(user));
      localStorage.setItem('niramay_profile', JSON.stringify(userProfile));

      // Update state immediately
      setUser(user);
      setProfile(userProfile);

      return { data: { user }, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('niramay_user');
      localStorage.removeItem('niramay_profile');
      
      setUser(null);
      setProfile(null);
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };
};