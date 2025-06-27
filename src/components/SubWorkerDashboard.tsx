import React, { useState } from 'react';
import { CheckCircle, Clock, MapPin, Camera, Star, TrendingUp } from 'lucide-react';
import { mockComplaints, mockSubWorkers } from '../data/mockData';

interface SubWorkerDashboardProps {
  user: any;
  onLogout: () => void;
}

export const SubWorkerDashboard: React.FC<SubWorkerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'completed'>('dashboard');
  const [complaints, setComplaints] = useState(mockComplaints);
  const [workers, setWorkers] = useState(mockSubWorkers);

  const currentWorker = workers.find(w => w.id === user.id) || mockSubWorkers[0];
  const assignedTasks = complaints.filter(c => c.assignedTo === user.id && c.status !== 'completed');
  const completedTasks = complaints.filter(c => c.assignedTo === user.id && c.status === 'completed');

  const completeTask = (taskId: string) => {
    setComplaints(prev => prev.map(complaint =>
      complaint.id === taskId
        ? { ...complaint, status: 'completed', completedAt: new Date(), pointsAwarded: 75 }
        : complaint
    ));

    setWorkers(prev => prev.map(worker =>
      worker.id === user.id
        ? { ...worker, status: 'available', currentTask: undefined, completedTasks: worker.completedTasks + 1 }
        : worker
    ));

    alert('Task completed successfully! Points awarded to the reporter.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Niramay Worker</h1>
                <p className="text-sm text-gray-600">{currentWorker.name} - {currentWorker.ward}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentWorker.status === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentWorker.status}
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
            { id: 'tasks', label: 'Active Tasks', icon: Clock },
            { id: 'completed', label: 'Completed', icon: CheckCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow-sm'
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
                    <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{assignedTasks.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{currentWorker.completedTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{currentWorker.rating}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-lg font-bold text-gray-900 capitalize">{currentWorker.status}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    currentWorker.status === 'available' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className={`w-4 h-4 rounded-full ${
                      currentWorker.status === 'available' ? 'bg-green-600' : 'bg-red-600'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Task Highlight */}
            {assignedTasks.length > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Current Priority Task</h3>
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{assignedTasks[0].title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignedTasks[0].priority)}`}>
                      {assignedTasks[0].priority}
                    </span>
                  </div>
                  <p className="text-white/90 mb-2">{assignedTasks[0].description}</p>
                  <div className="flex items-center text-white/80">
                    <MapPin size={16} className="mr-2" />
                    {assignedTasks[0].location.address}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{currentWorker.completedTasks}</div>
                  <p className="text-gray-600">Tasks Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">{currentWorker.rating}</div>
                  <p className="text-gray-600">Average Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {currentWorker.completedTasks > 0 ? Math.round((currentWorker.completedTasks / (currentWorker.completedTasks + assignedTasks.length)) * 100) : 0}%
                  </div>
                  <p className="text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Active Tasks</h2>
            
            {assignedTasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
                <Clock size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Tasks</h3>
                <p className="text-gray-500">You're all caught up! New tasks will appear here when assigned.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {assignedTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <img
                        src={task.imageUrl}
                        alt="Task"
                        className="w-full lg:w-64 h-48 object-cover rounded-xl"
                      />
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                            <p className="text-gray-600">Reported by: {task.userName}</p>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600">{task.description}</p>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin size={16} className="mr-2" />
                          {task.location.address}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Assigned: {task.submittedAt.toLocaleDateString()}
                          </span>
                          
                          <button
                            onClick={() => completeTask(task.id)}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Tasks */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Completed Tasks</h2>
            
            <div className="grid gap-6">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 opacity-75">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <img
                      src={task.imageUrl}
                      alt="Completed Task"
                      className="w-full lg:w-48 h-32 object-cover rounded-xl"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                          <p className="text-gray-600">Reported by: {task.userName}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          completed
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="mr-2" />
                        {task.location.address}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Completed: {task.completedAt?.toLocaleDateString()}</span>
                        <div className="flex items-center text-green-600">
                          <CheckCircle size={14} className="mr-1" />
                          <span className="font-medium">Task Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};