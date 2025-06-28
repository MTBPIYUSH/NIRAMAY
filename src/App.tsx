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
    console.log('App useEffect - user:', user?.id, 'profile:', profile?.id, 'loading:', loading);
    
    if (user && profile) {
      console.log('User and profile found, setting dashboard view');
      setCurrentView('dashboard');
    } else if (user && !profile) {
      console.log('User found but no profile, staying on auth view');
      // User exists but no profile - might be pending verification
      setCurrentView('auth');
    } else if (!user && !loading) {
      console.log('No user and not loading, setting landing view');
      setCurrentView('landing');
    }
  }, [user, profile, loading]);

  const handleGetStarted = () => {
    console.log('Get started clicked, setting auth view');
    setCurrentView('auth');
  };

  const handleAuthSuccess = () => {
    console.log('Auth success, setting dashboard view');
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    console.log('Logout clicked');
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

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentView === 'dashboard' && profile) {
    switch (profile.role) {
      case 'citizen':
        return <CitizenDashboard user={profile} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={profile} onLogout={handleLogout} />;
      case 'subworker':
        return <SubWorkerDashboard user={profile} onLogout={handleLogout} />;
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}

export default App;