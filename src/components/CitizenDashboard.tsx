import React, { useState } from 'react';
import { 
  Camera, 
  MapPin, 
  Award, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  ChevronDown,
  Trophy,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { mockComplaints, mockEcoProducts } from '../data/mockData';
import { Profile } from '../lib/supabase';
import { Complaint } from '../types';

interface CitizenDashboardProps {
  user: Profile;
  onLogout: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ user, onLogout }) => {
  // Default to 'report' tab for citizens as per requirements
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'complaints' | 'store'>('report');
  const [showCamera, setShowCamera] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [newComplaint, setNewComplaint] = useState<Partial<Complaint>>({
    title: '',
    description: '',
    priority: 'medium',
    imageUrl: ''
  });

  const userComplaints = complaints.filter(c => c.userId === user.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock size={14} />;
      case 'assigned': return <User size={14} />;
      case 'in-progress': return <Zap size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleImageCapture = (imageDataUrl: string) => {
    setNewComplaint((prev: Partial<Complaint>) => ({ ...prev, imageUrl: imageDataUrl }));
  };

  const handleSubmitComplaint = () => {
    if (!newComplaint.title || !newComplaint.imageUrl) {
      alert('Please fill the title and capture an image');
      return;
    }

    const newComplaintData: Complaint = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      title: newComplaint.title || '',
      description: newComplaint.description || '',
      imageUrl: newComplaint.imageUrl || '',
      location: {
        lat: 28.4595 + Math.random() * 0.01,
        lng: 77.0266 + Math.random() * 0.01,
        address: 'Auto-detected location, Gurgaon'
      },
      status: 'submitted',
      priority: (newComplaint.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      submittedAt: new Date()
    };

    setComplaints((prev: Complaint[]) => [newComplaintData, ...prev]);
    setNewComplaint(() => ({ title: '', description: '', priority: 'medium', imageUrl: '' }));
    setActiveTab('complaints');
    alert('Report submitted successfully! Our team will review it shortly.');
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleImageCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Niramay</h1>
                <p className="text-xs text-gray-500">Clean India Initiative</p>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {/* Eco Points Display */}
              <div className="hidden sm:flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg">
                <Award size={18} className="mr-2" />
                <span className="font-bold">{user.points || 0}</span>
                <span className="text-xs ml-1 opacity-90">points</span>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700">{user.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        Profile Settings
                      </button>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-2xl mb-8 shadow-lg border border-gray-100">
          {[
            { id: 'report', label: 'Report Issue', icon: Camera },
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'complaints', label: 'My Reports', icon: Clock },
            { id: 'store', label: 'Eco Store', icon: ShoppingBag }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'report' | 'complaints' | 'store')}
                className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className="mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Report Issue Tab - Default Landing */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Camera size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Report Garbage Issue</h2>
                <p className="text-gray-600">Help keep our community clean by reporting waste issues</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Issue Title *</label>
                  <input
                    type="text"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Description (Optional)</label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the garbage issue"
                    rows={4}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Priority Level</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all text-lg"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Photo Evidence *</label>
                  {newComplaint.imageUrl ? (
                    <div className="relative">
                      <img
                        src={newComplaint.imageUrl}
                        alt="Captured"
                        className="w-full h-64 object-cover rounded-2xl shadow-lg"
                      />
                      <button
                        onClick={() => setNewComplaint(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg transition-colors"
                      >
                        <Plus size={20} className="rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCamera(true)}
                      className="w-full h-64 border-3 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all group"
                    >
                      <Camera size={64} className="text-gray-400 group-hover:text-green-500 mb-4 transition-colors" />
                      <span className="text-gray-600 group-hover:text-green-600 font-semibold text-lg"> Capture Photo</span>
                      <span className="text-sm text-gray-500 mt-2">Required for verification</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center text-sm text-gray-600 bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <MapPin size={20} className="mr-2 text-blue-600" />
                  <span className="font-medium"> Location will be captured automatically</span>
                </div>

                <button
                  onClick={handleSubmitComplaint}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  Submit Report 
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-3xl font-bold mb-2">
                    Hello, {user.name?.split(' ')[0] || 'User'}! 👋
                  </h2>
                  <p className="text-green-100 text-lg">
                    Let's clean our streets together and make India beautiful!
                  </p>
                  <div className="flex items-center mt-4 space-x-6">
                    <div className="flex items-center">
                      <Trophy size={20} className="mr-2" />
                      <span className="font-semibold">Rank #4</span>
                    </div>
                    <div className="flex items-center">
                      <Target size={20} className="mr-2" />
                      <span className="font-semibold">{userComplaints.length} Reports</span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Report Button */}
                <button
                  onClick={() => setActiveTab('report')}
                  className="bg-white text-green-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center"
                >
                  <Camera size={24} className="mr-3" />
                   Report Garbage Now
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900">{userComplaints.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="text-blue-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {userComplaints.filter(c => c.status === 'completed').length}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eco Points</p>
                    <p className="text-3xl font-bold text-gray-900">{user.points || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
                    <Award className="text-yellow-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">City Rank</p>
                    <p className="text-3xl font-bold text-gray-900">#4</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Trophy className="text-purple-600" size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Clock className="text-blue-600 mr-3" size={28} />
                 Recent Activity
              </h3>
              
              {userComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <Camera size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No reports yet</h4>
                  <p className="text-gray-500 mb-6">Start by reporting your first garbage issue!</p>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Report Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userComplaints.slice(0, 3).map(complaint => (
                    <div key={complaint.id} className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                      <img
                        src={complaint.imageUrl}
                        alt="Report"
                        className="w-20 h-20 rounded-xl object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1">{complaint.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{complaint.location.address}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                            {getStatusIcon(complaint.status)}
                            <span className="ml-1 capitalize">{complaint.status}</span>
                          </span>
                          {complaint.pointsAwarded && (
                            <div className="flex items-center text-green-600">
                              <Award size={14} className="mr-1" />
                              <span className="text-xs font-semibold">+{complaint.pointsAwarded} points</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {complaint.submittedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Reports Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <Clock className="text-blue-600 mr-3" size={32} />
                 My Reports
              </h2>
              <div className="text-sm text-gray-600">
                Total: {userComplaints.length} reports
              </div>
            </div>
            
            {userComplaints.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Clock size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No reports yet</h3>
                <p className="text-gray-500 mb-8">Start making a difference by reporting your first garbage issue!</p>
                <button
                  onClick={() => setActiveTab('report')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Camera size={20} className="mr-2 inline" />
                  Report Now
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {userComplaints.map(complaint => (
                  <div key={complaint.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="relative">
                        <img
                          src={complaint.imageUrl}
                          alt="Report"
                          className="w-full lg:w-64 h-48 object-cover rounded-2xl shadow-lg"
                        />
                        {/* Mini Map Placeholder */}
                        <div className="absolute bottom-2 right-2 w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <MapPin size={20} className="text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{complaint.title}</h3>
                            <p className="text-gray-600 mb-3">{complaint.description}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              <span className="ml-2 capitalize">{complaint.status}</span>
                            </span>
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getPriorityColor(complaint.priority)}`}>
                              <span className="capitalize">{complaint.priority}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                          <MapPin size={18} className="mr-2 text-blue-600" />
                          <span className="font-medium">{complaint.location.address}</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center text-gray-500">
                            <Calendar size={16} className="mr-2" />
                            <span className="text-sm">
                              Submitted: {complaint.submittedAt.toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          
                          {complaint.pointsAwarded && (
                            <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
                              <Award size={18} className="mr-2" />
                              <span className="font-bold">+{complaint.pointsAwarded} points earned!</span>
                            </div>
                          )}
                        </div>
                        
                        {complaint.assignedWorkerName && (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <div className="flex items-center text-blue-700">
                              <User size={16} className="mr-2" />
                              <span className="font-semibold">Assigned to: {complaint.assignedWorkerName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Eco Store Tab */}
        {activeTab === 'store' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <ShoppingBag className="text-green-600 mr-3" size={32} />
                 Eco Store
              </h2>
              <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                <Award size={24} className="mr-3" />
                <div>
                  <span className="font-bold text-lg">{user.points || 0}</span>
                  <span className="text-green-100 ml-2">Points Available</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockEcoProducts.map(product => (
                <div key={product.id} className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg"
                  />
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{product.name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                      <Award size={20} className="mr-2" />
                      <span className="font-bold text-lg">{product.points} Points</span>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {product.stock} in stock
                    </span>
                  </div>
                  
                  <button
                    disabled={(user.points || 0) < product.points || product.stock === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {(user.points || 0) < product.points ? '❌ Insufficient Points' : 
                     product.stock === 0 ? '📦 Out of Stock' : '🎁 Redeem Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserDropdown(false)}
        />
      )}
    </div>
  );
};