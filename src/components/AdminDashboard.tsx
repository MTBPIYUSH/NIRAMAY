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
  Shield
} from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Complaint } from '../types';

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

interface SubWorkerProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'available' | 'busy' | 'offline';
  ward?: string;
  city?: string;
  assigned_ward?: string;
  current_task_id?: string;
  task_completion_count: number;
  created_at: string;
  updated_at: string;
}

interface ReporterProfile {
  id: string;
  name: string;
  phone?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'workers' | 'analytics'>('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [reports, setReports] = useState<Complaint[]>([]);
  const [subWorkers, setSubWorkers] = useState<SubWorkerProfile[]>([]);
  const [reporterProfiles, setReporterProfiles] = useState<globalThis.Map<string, ReporterProfile>>(new globalThis.Map());
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [workerFilter, setWorkerFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');

  // Verify admin access
  useEffect(() => {
    if (user.role !== 'admin') {
      console.error('❌ Unauthorized access attempt - user is not admin');
      onLogout();
      return;
    }
    
    console.log('✅ Admin access verified for user:', user.id);
    fetchReports();
    fetchSubWorkers();
  }, [user.id, user.role]);

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

  const fetchSubWorkers = async () => {
    setLoadingWorkers(true);
    try {
      console.log('👷 Fetching all subworker accounts...');
      
      // Fetch all active subworker profiles
      const { data: subWorkersData, error: subWorkersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'subworker')
        .neq('status', 'deleted') // Exclude any deleted/test accounts
        .order('name');

      if (subWorkersError) {
        console.error('❌ Error fetching subworkers:', subWorkersError);
        return;
      }

      console.log('✅ Subworkers fetched:', subWorkersData?.length || 0);

      // Filter out any test or debug entries based on naming patterns
      const filteredWorkers = (subWorkersData || []).filter(worker => {
        // Exclude test accounts or debug entries
        const isTestAccount = worker.name?.toLowerCase().includes('test') ||
                             worker.name?.toLowerCase().includes('debug') ||
                             worker.name?.toLowerCase().includes('demo') ||
                             worker.email?.toLowerCase().includes('test') ||
                             worker.email?.toLowerCase().includes('debug');
        
        // Only include workers with proper names
        const hasValidName = worker.name && worker.name.trim().length > 0;
        
        return !isTestAccount && hasValidName;
      });

      const workers: SubWorkerProfile[] = filteredWorkers.map(worker => ({
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        status: worker.status || 'available',
        ward: worker.ward,
        city: worker.city,
        assigned_ward: worker.assigned_ward,
        current_task_id: worker.current_task_id,
        task_completion_count: worker.task_completion_count || 0,
        created_at: worker.created_at,
        updated_at: worker.updated_at
      }));

      setSubWorkers(workers);

    } catch (error) {
      console.error('❌ Error in fetchSubWorkers:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const assignTaskToWorker = async (reportId: string, workerId: string) => {
    setAssigningTask(reportId);
    try {
      console.log('📋 Assigning task:', reportId, 'to worker:', workerId);

      const { error } = await supabase
        .from('reports')
        .update({
          assigned_to: workerId,
          status: 'assigned'
        })
        .eq('id', reportId);

      if (error) {
        console.error('❌ Error assigning task:', error);
        alert('Failed to assign task. Please try again.');
        return;
      }

      // Update worker status to busy
      await supabase
        .from('profiles')
        .update({
          status: 'busy',
          current_task_id: reportId
        })
        .eq('id', workerId);

      console.log('✅ Task assigned successfully');
      
      // Refresh data
      await Promise.all([fetchReports(), fetchSubWorkers()]);
      
      alert('Task assigned successfully!');

    } catch (error) {
      console.error('❌ Error in assignTaskToWorker:', error);
      alert('Failed to assign task. Please try again.');
    } finally {
      setAssigningTask(null);
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
      (worker.assigned_ward && worker.assigned_ward.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'submitted').length,
    assignedReports: reports.filter(r => r.status === 'assigned').length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    availableWorkers: subWorkers.filter(w => w.status === 'available').length,
    busyWorkers: subWorkers.filter(w => w.status === 'busy').length,
    totalWorkers: subWorkers.length
  };

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
                <span className="font-bold">{stats.totalWorkers}</span>
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
            { id: 'reports', label: `Reports (${stats.totalReports})`, icon: Clock },
            { id: 'workers', label: `Workers (${stats.totalWorkers})`, icon: Users },
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
                    <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
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
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingReports}</p>
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
                    <p className="text-3xl font-bold text-gray-900">{stats.availableWorkers}</p>
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
                    <p className="text-3xl font-bold text-gray-900">{stats.completedReports}</p>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Worker Status */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Worker Status</h3>
                  <button
                    onClick={() => setActiveTab('workers')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Manage Workers
                  </button>
                </div>
                
                {loadingWorkers ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : subWorkers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No workers found</p>
                    <p className="text-xs text-gray-400">Contact system administrator to create worker accounts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subWorkers.slice(0, 4).map(worker => (
                      <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                            <p className="text-sm text-gray-600">{worker.ward || worker.assigned_ward || 'No ward'}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkerStatusColor(worker.status)}`}>
                          {worker.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                          
                          {report.status === 'submitted' && stats.availableWorkers > 0 && (
                            <div className="flex items-center gap-3">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    assignTaskToWorker(report.id, e.target.value);
                                  }
                                }}
                                disabled={assigningTask === report.id}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Assign to worker...</option>
                                {subWorkers
                                  .filter(w => w.status === 'available')
                                  .map(worker => (
                                    <option key={worker.id} value={worker.id}>
                                      {worker.name} ({worker.ward || worker.assigned_ward})
                                    </option>
                                  ))}
                              </select>
                              
                              {assigningTask === report.id && (
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                          )}
                          
                          {report.status === 'submitted' && stats.availableWorkers === 0 && (
                            <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                              No available workers
                            </span>
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
              <h2 className="text-3xl font-bold text-gray-800">SubWorker Accounts</h2>
              
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
                  <option value="all">All Workers</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
                
                <button
                  onClick={fetchSubWorkers}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            
            {loadingWorkers ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Users size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No SubWorker Accounts Found</h3>
                <p className="text-gray-500 mb-4">
                  {subWorkers.length === 0 
                    ? "No subworker accounts exist in the system. Contact system administrator to create worker accounts."
                    : "No workers match your current filters."
                  }
                </p>
                {subWorkers.length === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                    <h4 className="font-semibold text-blue-800 mb-2">To add workers:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Contact system administrator</li>
                      <li>2. Provide worker details (name, phone, email)</li>
                      <li>3. Assign workers to appropriate wards</li>
                      <li>4. Workers will receive login credentials</li>
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Active SubWorker Accounts</h3>
                    <span className="text-sm text-gray-600">
                      {filteredWorkers.length} of {subWorkers.length} workers
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Worker</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ward Assignment</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Performance</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Account Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredWorkers.map(worker => (
                        <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                                <User size={16} className="text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                                <p className="text-sm text-gray-500">ID: {worker.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
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
                                  {worker.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {worker.ward && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Ward:</span> {worker.ward}
                                </div>
                              )}
                              {worker.assigned_ward && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Assigned:</span> {worker.assigned_ward}
                                </div>
                              )}
                              {!worker.ward && !worker.assigned_ward && (
                                <span className="text-sm text-gray-400">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkerStatusColor(worker.status)}`}>
                              {worker.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-800">{worker.task_completion_count}</div>
                              <div className="text-gray-500">tasks completed</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">
                              {new Date(worker.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      {stats.totalReports > 0 ? Math.round((stats.completedReports / stats.totalReports) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Worker Utilization</span>
                    <span className="font-bold text-blue-600">
                      {stats.totalWorkers > 0 ? Math.round((stats.busyWorkers / stats.totalWorkers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Reports</span>
                    <span className="font-bold text-orange-600">{stats.pendingReports}</span>
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
                      {stats.availableWorkers} Available
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