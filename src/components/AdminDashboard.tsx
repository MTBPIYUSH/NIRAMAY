import React, { useState } from 'react';
import { BarChart3, Users, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Star, UserCheck } from 'lucide-react';
import { mockComplaints, mockSubWorkers, mockAnalytics } from '../data/mockData';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'workers' | 'analytics'>('dashboard');
  const [complaints, setComplaints] = useState(mockComplaints);
  const [workers, setWorkers] = useState(mockSubWorkers);

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

  const assignWorker = (complaintId: string, workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    setComplaints(prev => prev.map(complaint =>
      complaint.id === complaintId
        ? { ...complaint, status: 'assigned', assignedTo: workerId, assignedWorkerName: worker.name }
        : complaint
    ));

    setWorkers(prev => prev.map(w =>
      w.id === workerId
        ? { ...w, status: 'busy', currentTask: complaintId }
        : w
    ));
  };

  const pendingComplaints = complaints.filter(c => c.status === 'submitted');
  const assignedComplaints = complaints.filter(c => c.status === 'assigned' || c.status === 'in-progress');
  const completedComplaints = complaints.filter(c => c.status === 'completed');
  const availableWorkers = workers.filter(w => w.status === 'available');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Niramay Admin</h1>
                <p className="text-sm text-gray-600">{user.ward}, {user.city}</p>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
            { id: 'workers', label: 'Workers', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                    <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingComplaints.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{completedComplaints.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Workers</p>
                    <p className="text-2xl font-bold text-gray-900">{availableWorkers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <UserCheck className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Complaints</h3>
                <div className="space-y-4">
                  {complaints.slice(0, 5).map(complaint => (
                    <div key={complaint.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={complaint.imageUrl}
                        alt="Complaint"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                        <p className="text-sm text-gray-600">{complaint.userName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Status</h3>
                <div className="space-y-4">
                  {workers.map(worker => (
                    <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-800">{worker.name}</h4>
                        <p className="text-sm text-gray-600">{worker.completedTasks} tasks completed</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star size={14} className="text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{worker.rating}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          worker.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {worker.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Management */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Complaint Management</h2>
            
            <div className="grid gap-6">
              {complaints.map(complaint => (
                <div key={complaint.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <img
                      src={complaint.imageUrl}
                      alt="Complaint"
                      className="w-full lg:w-64 h-48 object-cover rounded-xl"
                    />
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{complaint.title}</h3>
                          <p className="text-gray-600">Reported by: {complaint.userName}</p>
                        </div>
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
                        
                        {complaint.status === 'submitted' && (
                          <div className="flex items-center space-x-2">
                            <select
                              onChange={(e) => e.target.value && assignWorker(complaint.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                              defaultValue=""
                            >
                              <option value="">Assign Worker</option>
                              {availableWorkers.map(worker => (
                                <option key={worker.id} value={worker.id}>
                                  {worker.name} (Rating: {worker.rating})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {complaint.assignedWorkerName && (
                          <div className="text-sm text-blue-600">
                            Assigned to: {complaint.assignedWorkerName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workers Management */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Worker Management</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workers.map(worker => (
                <div key={worker.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{worker.name}</h3>
                      <p className="text-gray-600">{worker.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      worker.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {worker.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2" />
                      {worker.phone}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed Tasks</span>
                      <span className="font-semibold">{worker.completedTasks}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center">
                        <Star size={16} className="text-yellow-500 mr-1" />
                        <span className="font-semibold">{worker.rating}</span>
                      </div>
                    </div>
                    
                    {worker.currentTask && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Currently working on task: {worker.currentTask}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {((mockAnalytics.resolvedComplaints / mockAnalytics.totalComplaints) * 100).toFixed(1)}%
                  </div>
                  <p className="text-gray-600">Resolution Rate</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {mockAnalytics.averageResolutionTime}h
                  </div>
                  <p className="text-gray-600">Avg Resolution Time</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {mockAnalytics.cleanlinessIndex}
                  </div>
                  <p className="text-gray-600">Cleanliness Index</p>
                </div>
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
              <div className="space-y-4">
                {mockAnalytics.monthlyTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">{trend.month}</span>
                    <div className="flex space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Complaints: </span>
                        <span className="font-semibold text-blue-600">{trend.complaints}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Resolved: </span>
                        <span className="font-semibold text-green-600">{trend.resolved}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};