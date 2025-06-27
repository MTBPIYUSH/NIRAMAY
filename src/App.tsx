import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthSelector } from './components/AuthSelector';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SubWorkerDashboard } from './components/SubWorkerDashboard';
import { mockUsers } from './data/mockData';

type UserRole = 'citizen' | 'admin' | 'subworker';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleRoleSelect = (role: UserRole) => {
    const user = mockUsers.find(u => u.role === role);
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return <AuthSelector onRoleSelect={handleRoleSelect} />;
  }

  if (currentView === 'dashboard' && currentUser) {
    switch (currentUser.role) {
      case 'citizen':
        return <CitizenDashboard user={currentUser} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
      case 'subworker':
        return <SubWorkerDashboard user={currentUser} onLogout={handleLogout} />;
      default:
        return <AuthSelector onRoleSelect={handleRoleSelect} />;
    }
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}

export default App;