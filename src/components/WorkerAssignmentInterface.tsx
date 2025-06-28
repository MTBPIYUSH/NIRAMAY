import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  MapPin, 
  Clock, 
  Award,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  Plus
} from 'lucide-react';
import {
  SubWorkerProfile,
  SubWorkerFilters,
  SubWorkerStats,
  fetchSubWorkers,
  subscribeToSubWorkers,
  filterSubWorkers,
  sortSubWorkers,
  getSubWorkerStats,
  assignTaskToSubWorker,
  validateWorkerAssignment
} from '../lib/subworkerService';

interface WorkerAssignmentInterfaceProps {
  reportId?: string;
  reportWard?: string;
  onAssignmentComplete?: (workerId: string) => void;
  showAssignmentActions?: boolean;
}

export const WorkerAssignmentInterface: React.FC<WorkerAssignmentInterfaceProps> = ({
  reportId,
  reportWard,
  onAssignmentComplete,
  showAssignmentActions = true
}) => {
  const [workers, setWorkers] = useState<SubWorkerProfile[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<SubWorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [stats, setStats] = useState<SubWorkerStats>({
    total: 0,
    available: 0,
    busy: 0,
    offline: 0,
    averageCompletionRate: 0
  });

  const [filters, setFilters] = useState<SubWorkerFilters>({
    status: 'all',
    searchTerm: '',
    ward: ''
  });

  const [sortBy, setSortBy] = useState<'availability' | 'name' | 'performance' | 'ward'>('availability');

  // Fetch workers on component mount
  useEffect(() => {
    loadWorkers();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscribeToSubWorkers(
      (updatedWorkers) => {
        console.log('📡 Real-time update received:', updatedWorkers.length, 'workers');
        setWorkers(updatedWorkers);
        updateStats(updatedWorkers);
      },
      (error) => {
        console.error('Real-time subscription error:', error);
        setError('Failed to maintain real-time connection');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply filters and sorting when workers or filters change
  useEffect(() => {
    const filtered = filterSubWorkers(workers, filters);
    const sorted = sortSubWorkers(filtered, sortBy);
    setFilteredWorkers(sorted);
  }, [workers, filters, sortBy]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Loading subworkers...');
      const fetchedWorkers = await fetchSubWorkers();
      console.log('✅ Loaded workers:', fetchedWorkers);
      
      setWorkers(fetchedWorkers);
      updateStats(fetchedWorkers);
      
    } catch (error) {
      console.error('Error loading workers:', error);
      setError('Failed to load subworker profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (workerList: SubWorkerProfile[]) => {
    const newStats = getSubWorkerStats(workerList);
    setStats(newStats);
  };

  const handleAssignTask = async (workerId: string) => {
    if (!reportId) {
      alert('No report selected for assignment');
      return;
    }

    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
      alert('Worker not found');
      return;
    }

    // Validate assignment
    const validation = validateWorkerAssignment(worker, reportWard);
    if (!validation.isEligible) {
      alert(`Cannot assign task: ${validation.reason}`);
      return;
    }

    setAssigning(workerId);
    try {
      await assignTaskToSubWorker(reportId, workerId);
      onAssignmentComplete?.(workerId);
      alert('Task assigned successfully!');
      
      // Refresh workers to get updated status
      await loadWorkers();
      
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Failed to assign task. Please try again.');
    } finally {
      setAssigning(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <UserCheck size={14} className="text-green-600" />;
      case 'busy': return <Clock size={14} className="text-orange-600" />;
      case 'offline': return <UserX size={14} className="text-gray-600" />;
      default: return <AlertCircle size={14} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Loading subworkers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-200">
        <div className="text-center py-8">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Workers</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadWorkers}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users size={20} className="mr-2 text-blue-600" />
              SubWorker Assignment
            </h3>
            <p className="text-sm text-gray-600">
              {stats.total} workers • {stats.available} available • {stats.busy} busy
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.available}</div>
              <div className="text-xs text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.busy}</div>
              <div className="text-xs text-gray-600">Busy</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.averageCompletionRate}</div>
              <div className="text-xs text-gray-600">Avg Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ward, or phone..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="availability">Sort by Availability</option>
            <option value="name">Sort by Name</option>
            <option value="performance">Sort by Performance</option>
            <option value="ward">Sort by Ward</option>
          </select>

          {/* Refresh */}
          <button
            onClick={loadWorkers}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center text-sm"
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Workers List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              {workers.length === 0 ? 'No SubWorkers Found' : 'No Workers Match Filters'}
            </h4>
            <p className="text-gray-500 mb-4">
              {workers.length === 0 
                ? "No subworker accounts exist in the system. SubWorkers need to be created with role='subworker' in the profiles table."
                : "No workers match your current filters. Try adjusting the search criteria."
              }
            </p>
            {workers.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-4 text-left">
                <h5 className="font-semibold text-yellow-800 mb-2">💡 How to add SubWorkers:</h5>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Create auth users in Supabase Dashboard</li>
                  <li>2. Add profiles with role='subworker'</li>
                  <li>3. Or use the seeding script in src/scripts/seedSubWorkers.ts</li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredWorkers.map(worker => {
              const validation = validateWorkerAssignment(worker, reportWard);
              const isAssigning = assigning === worker.id;
              
              return (
                <div key={worker.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Worker Info */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(worker.status)}`}>
                            {getStatusIcon(worker.status)}
                            <span className="ml-1 capitalize">{worker.status}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {(worker.ward || worker.assigned_ward) && (
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {worker.ward || worker.assigned_ward}
                            </div>
                          )}
                          
                          {worker.phone && (
                            <div className="flex items-center">
                              <Phone size={14} className="mr-1" />
                              {worker.phone}
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Award size={14} className="mr-1" />
                            {worker.task_completion_count} tasks
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Actions */}
                    {showAssignmentActions && reportId && (
                      <div className="flex items-center gap-2">
                        {!validation.isEligible && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-32 text-center">
                            {validation.reason}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleAssignTask(worker.id)}
                          disabled={!validation.isEligible || isAssigning}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center ${
                            validation.isEligible
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isAssigning ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Assign Task
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredWorkers.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredWorkers.length} of {workers.length} workers
            {reportWard && ` • Filtered for ${reportWard}`}
          </p>
        </div>
      )}
    </div>
  );
};