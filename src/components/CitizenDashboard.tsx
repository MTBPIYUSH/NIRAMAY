import React, { useState } from 'react';
import { Camera, MapPin, Award, ShoppingBag, TrendingUp, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { mockComplaints, mockEcoProducts } from '../data/mockData';
import { Complaint, EcoProduct } from '../types';

interface CitizenDashboardProps {
  user: any;
  onLogout: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'complaints' | 'store'>('dashboard');
  const [showCamera, setShowCamera] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    imageUrl: ''
  });

  const userComplaints = complaints.filter(c => c.userId === user.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImageCapture = (imageDataUrl: string) => {
    setNewComplaint(prev => ({ ...prev, imageUrl: imageDataUrl }));
  };

  const handleSubmitComplaint = () => {
    if (!newComplaint.title || !newComplaint.description || !newComplaint.imageUrl) {
      alert('Please fill all fields and capture an image');
      return;
    }

    const newComplaintData: Complaint = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      title: newComplaint.title,
      description: newComplaint.description,
      imageUrl: newComplaint.imageUrl,
      location: {
        lat: 28.4595 + Math.random() * 0.01,
        lng: 77.0266 + Math.random() * 0.01,
        address: 'Auto-detected location, Gurgaon'
      },
      status: 'submitted',
      priority: newComplaint.priority,
      submittedAt: new Date()
    };

    setComplaints(prev => [newComplaintData, ...prev]);
    setNewComplaint({ title: '', description: '', priority: 'medium', imageUrl: '' });
    setActiveTab('complaints');
    alert('Complaint submitted successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <h1 className="text-xl font-bold text-gray-800">Niramay</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gradient-to-r from-green-400 to-emerald-600 text-white px-3 py-1 rounded-full">
                <Award size={16} className="mr-1" />
                <span className="font-semibold">{user.points} Points</span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'report', label: 'Report Issue', icon: Camera },
            { id: 'complaints', label: 'My Reports', icon: Clock },
            { id: 'store', label: 'Eco Store', icon: ShoppingBag }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{userComplaints.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userComplaints.filter(c => c.status === 'completed').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eco Points</p>
                    <p className="text-2xl font-bold text-gray-900">{user.points}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Award className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userComplaints.filter(c => c.status === 'assigned' || c.status === 'in-progress').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {userComplaints.slice(0, 3).map(complaint => (
                  <div key={complaint.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                    <img
                      src={complaint.imageUrl}
                      alt="Complaint"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{complaint.title}</h4>
                      <p className="text-sm text-gray-600">{complaint.location.address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report Issue Tab */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Report Garbage Issue</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title</label>
                  <input
                    type="text"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the garbage issue"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
                  {newComplaint.imageUrl ? (
                    <div className="relative">
                      <img
                        src={newComplaint.imageUrl}
                        alt="Captured"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => setNewComplaint(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <Plus size={16} className="rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCamera(true)}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-green-500 transition-colors"
                    >
                      <Camera size={48} className="text-gray-400 mb-2" />
                      <span className="text-gray-600 font-medium">Capture Photo</span>
                      <span className="text-sm text-gray-500">Required for verification</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2 text-green-600" />
                  Location will be captured automatically
                </div>

                <button
                  onClick={handleSubmitComplaint}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Reports</h2>
            
            <div className="grid gap-6">
              {userComplaints.map(complaint => (
                <div key={complaint.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={complaint.imageUrl}
                      alt="Complaint"
                      className="w-full md:w-48 h-48 object-cover rounded-xl"
                    />
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-800">{complaint.title}</h3>
                        <div className="flex space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{complaint.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="mr-2" />
                        {complaint.location.address}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Submitted: {complaint.submittedAt.toLocaleDateString()}
                        </span>
                        {complaint.pointsAwarded && (
                          <div className="flex items-center text-green-600">
                            <Award size={16} className="mr-1" />
                            <span className="font-semibold">+{complaint.pointsAwarded} points</span>
                          </div>
                        )}
                      </div>
                      
                      {complaint.assignedWorkerName && (
                        <div className="text-sm text-blue-600">
                          Assigned to: {complaint.assignedWorkerName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eco Store Tab */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Eco Store</h2>
              <div className="flex items-center bg-gradient-to-r from-green-400 to-emerald-600 text-white px-4 py-2 rounded-xl">
                <Award size={20} className="mr-2" />
                <span className="font-semibold">{user.points} Points Available</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockEcoProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-green-600">
                      <Award size={18} className="mr-1" />
                      <span className="font-bold">{product.points} Points</span>
                    </div>
                    <span className="text-sm text-gray-500">{product.stock} in stock</span>
                  </div>
                  
                  <button
                    disabled={user.points < product.points || product.stock === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {user.points < product.points ? 'Insufficient Points' : 
                     product.stock === 0 ? 'Out of Stock' : 'Redeem'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};