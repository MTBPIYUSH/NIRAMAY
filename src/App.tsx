import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SubWorkerDashboard } from './components/SubWorkerDashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    console.log('App useEffect - User:', user?.email, 'Profile:', profile?.role);
    
    if (user && profile) {
      // User is authenticated and has a profile - redirect to appropriate dashboard
      console.log('Redirecting to dashboard for role:', profile.role);
      setCurrentView('dashboard');
    } else if (!user && !profile) {
      // No user - stay on landing page
      console.log('No user, staying on landing page');
      setCurrentView('landing');
    }
    // If user exists but no profile, stay on current view (loading state)
  }, [user, profile]);

  const handleGetStarted = () => {
    console.log('Get started clicked');
    setCurrentView('auth');
  };

  const handleAuthSuccess = () => {
    console.log('Auth success callback triggered');
    // The useEffect above will handle the actual redirection based on user/profile state
    // We don't need to manually set the view here as it will be handled reactively
  };

  const handleLogout = async () => {
    console.log('Logout initiated');
    await signOut();
    setCurrentView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading Niramay...</div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show dashboard regardless of currentView
  if (user && profile) {
    console.log('Rendering dashboard for role:', profile.role);
    switch (profile.role) {
      case 'citizen':
        return <CitizenDashboard user={profile} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={profile} onLogout={handleLogout} />;
      case 'subworker':
        return <SubWorkerDashboard user={profile} onLogout={handleLogout} />;
      default:
        console.log('Unknown role, showing landing page');
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  }

  // User is not authenticated - show appropriate view
  if (currentView === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Default to landing page
  return <LandingPage onGetStarted={handleGetStarted} />;
}

export default App;