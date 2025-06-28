import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  User, 
  ChevronDown,
  Settings,
  Bell,
  X,
  UserCheck,
  UserX,
  Zap,
  Award,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  UserPlus,
  Phone,
  Mail,
  Shield,
  Edit,
  MoreVertical,
  Activity,
  Star
} from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Complaint } from '../types';
import { WorkerAssignmentInterface } from './WorkerAssignmentInterface';
import { 
  SubWorkerProfile,
  fetchSubWorkers,
  subscribeToSubWorkers,
  getSubWorkerStats,
  SubWorkerStats,
  updateSubWorkerStatus
} from '../lib/subworkerService';

interface AdminDashboardProps {
  user: Profile;
  onLogout: () => void;
}

interface DatabaseReport {
  id: string;
  user_id: string;
  images: string[];
  lat: number;
  lng: number;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  priority_level?: string;
  eco_points?: number;
  ai_analysis?: any;
}

interface ReporterProfile {
  id: string;
  name: string;
  phone?: string;
}

interface TaskAssignmentModal {
  isOpen: boolean;
  report: Complaint | null;
}

interface WorkerDetailModal {
  isOpen: boolean;
  worker: SubWorkerProfile | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'workers' | 'analytics'>('workers');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [reports, setReports] = useState<Complaint[]>([]);
  const [subWorkers, setSubWorkers] = useState<SubWorkerProfile[]>([]);
  const [reporterProfiles, setReporterProfiles] = useState<globalThis.Map<string, ReporterProfile>>(new globalThis.Map());
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [workerFilter, setWorkerFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [taskAssignmentModal, setTaskAssignmentModal] = useState<TaskAssignmentModal>({
    isOpen: false,
    report: null
  });
  const [workerDetailModal, setWorkerDetailModal] = useState<WorkerDetailModal>({
    isOpen: false,
    worker: null
  });
  const [stats, setStats] = useState<SubWorkerStats>({
    total: 0,
    available: 0,
    busy: 0,
    offline: 0,
    averageCompletionRate: 0
  });

  // Verify admin access
  useEffect(() => {
    if (user.role !== 'admin') {
      console.error('❌ Unauthorized access attempt - user is not admin');
      onLogout();
      return;
    }
    
    console.log('✅ Admin access verified for user:', user.id);
    fetchReports();
    loadSubWorkers();
  }, [user.id, user.role]);

  // Set up real-time worker updates
  useEffect(() => {
    const subscription = subscribeToSubWorkers(
      (updatedWorkers) => {
        console.log('📡 Real-time worker update received:', updatedWorkers.length);
        setSubWorkers(updatedWorkers);
        updateStats(updatedWorkers);
      },
      (error) => {
        console.error('Real-time worker subscription error:', error);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      console.log('📊 Fetching reports for admin...');
      
      // Fetch all reports (admins can see all reports)
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('❌ Error fetching reports:', reportsError);
        return;
      }

      console.log('✅ Reports fetched:', reportsData?.length || 0);

      // Fetch reporter profiles
      const userIds = reportsData?.map(report => report.user_id).filter(Boolean) || [];
      
      let profilesData: ReporterProfile[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Error fetching reporter profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      const profileMap = new globalThis.Map(profilesData.map(profile => [profile.id, profile]));
      setReporterProfiles(profileMap);

      // Convert to complaint format
      const convertedReports: Complaint[] = (reportsData || []).map((report: DatabaseReport) => {
        const reporterProfile = profileMap.get(report.user_id);
        
        return {
          id: report.id,
          userId: report.user_id,
          userName: reporterProfile?.name || 'Unknown User',
          userPhone: reporterProfile?.phone || 'No phone',
          title: 'Waste Report',
          description: 'Reported waste issue',
          imageUrl: report.images[0] || '',
          images: report.images || [],
          location: {
            lat: report.lat,
            lng: report.lng,
            address: report.address
          },
          status: report.status as 'submitted' | 'assigned' | 'in-progress' | 'completed',
          priority: (report.priority_level as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          submittedAt: new Date(report.created_at),
          assignedTo: report.assigned_to,
          ecoPoints: report.eco_points,
          aiAnalysis: report.ai_analysis
        };
      });

      setReports(convertedReports);

    } catch (error) {
      console.error('❌ Error in fetchReports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadSubWorkers = async () => {
    setLoadingWorkers(true);
    try {
      console.log('👷 Loading subworkers...');
      const workers = await fetchSubWorkers();
      console.log('✅ Subworkers loaded:', workers.length);
      setSubWorkers(workers);
      updateStats(workers);
    } catch (error) {
      console.error('❌ Error loading subworkers:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const updateStats = (workerList: SubWorkerProfile[]) => {
    const newStats = getSubWorkerStats(workerList);
    setStats(newStats);
  };

  const openTaskAssignment = (report: Complaint) => {
    setTaskAssignmentModal({ isOpen: true, report });
  };

  const openWorkerDetail = (worker: SubWorkerProfile) => {
    setWorkerDetailModal({ isOpen: true, worker });
  };

  const handleAssignmentComplete = async (workerId: string) => {
    setTaskAssignmentModal({ isOpen: false, report: null });
    
    // Refresh data
    await Promise.all([fetchReports(), loadSubWorkers()]);
  };

  const handleWorkerStatusUpdate = async (workerId: string, newStatus: 'available' | 'busy' | 'offline') => {
    try {
      await updateSubWorkerStatus(workerId, newStatus);
      await loadSubWorkers(); // Refresh the workers list
    } catch (error) {
      console.error('Error updating worker status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkerStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <UserCheck size={14} className="text-green-600" />;
      case 'busy': return <Clock size={14} className="text-orange-600" />;
      case 'offline': return <UserX size={14} className="text-gray-600" />;
      default: return <AlertTriangle size={14} className="text-gray-600" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredWorkers = subWorkers.filter(worker => {
    const matchesStatus = workerFilter === 'all' || worker.status === workerFilter;
    const matchesSearch = searchTerm === '' || 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.ward && worker.ward.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (worker.assigned_ward && worker.assigned_ward.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (worker.phone && worker.phone.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  // Show access denied if not admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 shadow-2xl border border-red-200 text-center max-w-md">
          <Shield size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h2>
          <p className="text-red-600 mb-6">This dashboard is restricted to authorized administrators only.</p>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Niramay Admin</h1>
                <p className="text-xs text-gray-500">Municipal Management Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full shadow-lg">
                <Users size={18} className="mr-2" />
                <span className="font-bold">{stats.total}</span>
                <span className="text-xs ml-1 opacity-90">workers</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700">{user.name?.split(' ')[0] || 'Admin'}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">Admin - {user.ward || user.assigned_ward || 'All Wards'}</p>
                    </div>
                    <div className="p-2">
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
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'reports', label: `Reports (${reports.length})`, icon: Clock },
            { id: 'workers', label: `Workers (${stats.total})`, icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'reports' | 'workers' | 'analytics')}
                className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className="mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="text-blue-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'submitted').length}</p>
                  </div>
                  <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="text-yellow-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Workers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.available}</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <UserCheck className="text-green-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{reports.filter(r => r.status === 'completed').length}</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="text-purple-600" size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Reports */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Recent Reports</h3>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                {loadingReports ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.slice(0, 3).map(report => (
                      <div key={report.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <img
                          src={report.imageUrl}
                          alt="Report"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{report.userName}</h4>
                          <p className="text-sm text-gray-600">{report.location.address}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        {report.status === 'submitted' && (
                          <button
                            onClick={() => openTaskAssignment(report)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Worker Assignment Interface */}
              <div>
                <WorkerAssignmentInterface
                  showAssignmentActions={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Reports Management */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-3xl font-bold text-gray-800">Reports Management</h2>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                
                <button
                  onClick={fetchReports}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Clock size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No reports found</h3>
                <p className="text-gray-500">No reports match your current filters.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredReports.map(report => (
                  <div key={report.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <img
                        src={report.imageUrl}
                        alt="Report"
                        className="w-full lg:w-64 h-48 object-cover rounded-2xl"
                      />
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">{report.title}</h3>
                            <p className="text-gray-600">Reporter: {report.userName} ({report.userPhone})</p>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                          <MapPin size={18} className="mr-2 text-blue-600" />
                          <span>{report.location.address}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Submitted: {report.submittedAt.toLocaleDateString()}
                          </span>
                          
                          {report.status === 'submitted' && (
                            <button
                              onClick={() => openTaskAssignment(report)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                            >
                              <UserPlus size={16} className="mr-2" />
                              Assign Worker
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workers Management */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-3xl font-bold text-gray-800">SubWorker Management</h2>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={workerFilter}
                  onChange={(e) => setWorkerFilter(e.target.value as 'all' | 'available' | 'busy' | 'offline')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
                
                <button
                  onClick={loadSubWorkers}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Worker Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Workers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                  </div>
                  <UserCheck className="text-green-600" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Busy</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.busy}</p>
                  </div>
                  <Clock className="text-orange-600" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Tasks</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.averageCompletionRate}</p>
                  </div>
                  <Award className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
            
            {loadingWorkers ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Users size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">
                  {subWorkers.length === 0 ? 'No SubWorkers Found' : 'No Workers Match Filters'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {subWorkers.length === 0 
                    ? "No subworker accounts exist in the system. SubWorkers need to be created with role='subworker' in the profiles table."
                    : "No workers match your current filters. Try adjusting the search criteria."
                  }
                </p>
                {subWorkers.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-left max-w-md mx-auto">
                    <h5 className="font-semibold text-yellow-800 mb-3">💡 How to add SubWorkers:</h5>
                    <ol className="text-sm text-yellow-700 space-y-2">
                      <li>1. Create auth users in Supabase Dashboard</li>
                      <li>2. Add profiles with role='subworker'</li>
                      <li>3. Or use the seeding script in src/scripts/seedSubWorkers.ts</li>
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 font-semibold text-gray-700 text-sm">
                    <div className="col-span-3">Worker Details</div>
                    <div className="col-span-2">Contact</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Performance</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {filteredWorkers.map(worker => (
                    <div key={worker.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Worker Details */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                              <User size={20} className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                              <p className="text-sm text-gray-500">ID: {worker.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="col-span-2">
                          <div className="space-y-1">
                            {worker.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone size={14} className="mr-2" />
                                {worker.phone}
                              </div>
                            )}
                            {worker.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail size={14} className="mr-2" />
                                {worker.email.slice(0, 20)}...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                          <div className="space-y-1">
                            {worker.assigned_ward && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin size={14} className="mr-2" />
                                {worker.assigned_ward}
                              </div>
                            )}
                            {worker.city && (
                              <p className="text-sm text-gray-500">{worker.city}</p>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkerStatusColor(worker.status)}`}>
                              {getWorkerStatusIcon(worker.status)}
                              <span className="ml-1 capitalize">{worker.status}</span>
                            </span>
                            {worker.current_task_id && (
                              <p className="text-xs text-orange-600">Has active task</p>
                            )}
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="col-span-2">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Award size={14} className="mr-2 text-yellow-500" />
                              <span className="font-semibold">{worker.task_completion_count}</span>
                              <span className="text-gray-500 ml-1">tasks</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Star size={14} className="mr-2 text-blue-500" />
                              <span className="text-gray-600">
                                {worker.eco_points || 0} points
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openWorkerDetail(worker)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <div className="relative group">
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <MoreVertical size={16} />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <div className="p-2">
                                  <button
                                    onClick={() => handleWorkerStatusUpdate(worker.id, 'available')}
                                    disabled={worker.status === 'available'}
                                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Set Available
                                  </button>
                                  <button
                                    onClick={() => handleWorkerStatusUpdate(worker.id, 'offline')}
                                    disabled={worker.status === 'offline'}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Set Offline
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Showing {filteredWorkers.length} of {subWorkers.length} workers</span>
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Resolution Rate</span>
                    <span className="font-bold text-green-600">
                      {reports.length > 0 ? Math.round((reports.filter(r => r.status === 'completed').length / reports.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Worker Utilization</span>
                    <span className="font-bold text-blue-600">
                      {stats.total > 0 ? Math.round((stats.busy / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Reports</span>
                    <span className="font-bold text-orange-600">{reports.filter(r => r.status === 'submitted').length}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Database Connection</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle size={16} className="mr-1" />
                      Healthy
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Worker Availability</span>
                    <span className="flex items-center text-green-600">
                      <UserCheck size={16} className="mr-1" />
                      {stats.available} Available
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="flex items-center text-green-600">
                      <Zap size={16} className="mr-1" />
                      Fast
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Assignment Modal */}
      {taskAssignmentModal.isOpen && taskAssignmentModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Assign Task to Worker</h3>
              <button
                onClick={() => setTaskAssignmentModal({ isOpen: false, report: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Report Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 mb-3">Report Details</h4>
                <img
                  src={taskAssignmentModal.report.imageUrl}
                  alt="Report"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Reporter:</span> {taskAssignmentModal.report.userName}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Contact:</span> {taskAssignmentModal.report.userPhone}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Location:</span> {taskAssignmentModal.report.location.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Submitted:</span> {taskAssignmentModal.report.submittedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Worker Assignment */}
              <div>
                <WorkerAssignmentInterface
                  reportId={taskAssignmentModal.report.id}
                  reportWard={taskAssignmentModal.report.ward}
                  onAssignmentComplete={handleAssignmentComplete}
                  showAssignmentActions={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Detail Modal */}
      {workerDetailModal.isOpen && workerDetailModal.worker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Worker Details</h3>
              <button
                onClick={() => setWorkerDetailModal({ isOpen: false, worker: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Worker Profile */}
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800">{workerDetailModal.worker.name}</h4>
                  <p className="text-gray-600">SubWorker ID: {workerDetailModal.worker.id}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getWorkerStatusColor(workerDetailModal.worker.status)}`}>
                    {getWorkerStatusIcon(workerDetailModal.worker.status)}
                    <span className="ml-1 capitalize">{workerDetailModal.worker.status}</span>
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3">Contact Information</h5>
                  <div className="space-y-2">
                    {workerDetailModal.worker.phone && (
                      <div className="flex items-center text-sm">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        <span>{workerDetailModal.worker.phone}</span>
                      </div>
                    )}
                    {workerDetailModal.worker.email && (
                      <div className="flex items-center text-sm">
                        <Mail size={16} className="mr-2 text-gray-400" />
                        <span>{workerDetailModal.worker.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3">Location</h5>
                  <div className="space-y-2">
                    {workerDetailModal.worker.assigned_ward && (
                      <div className="flex items-center text-sm">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        <span>{workerDetailModal.worker.assigned_ward}</span>
                      </div>
                    )}
                    {workerDetailModal.worker.city && (
                      <p className="text-sm text-gray-600">{workerDetailModal.worker.city}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h5 className="font-semibold text-gray-800 mb-4">Performance Metrics</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{workerDetailModal.worker.task_completion_count}</div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workerDetailModal.worker.eco_points || 0}</div>
                    <div className="text-sm text-gray-600">Eco Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Date(workerDetailModal.worker.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">Joined</div>
                  </div>
                </div>
              </div>

              {/* Current Task */}
              {workerDetailModal.worker.current_task_id && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h5 className="font-semibold text-orange-800 mb-2">Current Task</h5>
                  <div className="flex items-center text-orange-700">
                    <Activity size={16} className="mr-2" />
                    <span className="text-sm">Task ID: {workerDetailModal.worker.current_task_id}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleWorkerStatusUpdate(workerDetailModal.worker!.id, 'available')}
                  disabled={workerDetailModal.worker.status === 'available'}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Available
                </button>
                <button
                  onClick={() => handleWorkerStatusUpdate(workerDetailModal.worker!.id, 'offline')}
                  disabled={workerDetailModal.worker.status === 'offline'}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Offline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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