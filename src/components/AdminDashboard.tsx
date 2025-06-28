import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  MapPin, 
  User, 
  AlertCircle,
  ChevronDown,
  Filter,
  Search,
  Calendar,
  Award,
  Settings,
  Bell,
  X,
  Eye,
  UserCheck,
  Navigation,
  Map
} from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Complaint } from '../types';
import { 
  initializeGoogleMaps, 
  createEmbeddedMap, 
  reverseGeocode 
} from '../lib/googleMaps';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '../lib/notifications';

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
  proof_image?: string;
  proof_lat?: number;
  proof_lng?: number;
  rejection_comment?: string;
  priority_level?: string;
  eco_points?: number;
  ai_analysis?: any;
}

interface ReporterProfile {
  id: string;
  name: string;
  phone?: string;
}

interface SubWorkerProfile {
  id: string;
  name: string;
  phone?: string;
  status: string;
  ward?: string;
  assigned_ward?: string;
}

interface ReportDetailModal {
  isOpen: boolean;
  report: Complaint | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'workers' | 'analytics'>('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reports, setReports] = useState<Complaint[]>([]);
  const [subWorkers, setSubWorkers] = useState<SubWorkerProfile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reporterProfiles, setReporterProfiles] = useState<Map<string, ReporterProfile>>(new Map());
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportDetailModal, setReportDetailModal] = useState<ReportDetailModal>({
    isOpen: false,
    report: null
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentMap, setCurrentMap] = useState<google.maps.Map | null>(null);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  // Initialize Google Maps
  useEffect(() => {
    const initMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error('Google Maps API key not found');
          return;
        }

        await initializeGoogleMaps(apiKey);
        setMapsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
      }
    };

    initMaps();
  }, []);

  useEffect(() => {
    fetchReports();
    fetchSubWorkers();
    fetchNotifications();
  }, [user.id]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      // Fetch all reports for admin
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        return;
      }

      // Fetch reporter profiles
      const userIds = reportsData?.map(report => report.user_id).filter(Boolean) || [];
      
      let profilesData: ReporterProfile[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      const profileMap = new Map(profilesData.map(profile => [profile.id, profile]));
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
          aiAnalysis: report.ai_analysis,
          proofImage: report.proof_image,
          proofLocation: report.proof_lat && report.proof_lng ? {
            lat: report.proof_lat,
            lng: report.proof_lng,
            address: 'Proof location'
          } : undefined,
          rejectionComment: report.rejection_comment
        };
      });

      setReports(convertedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchSubWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, status, ward, assigned_ward')
        .eq('role', 'subworker')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching sub-workers:', error);
        return;
      }

      setSubWorkers(data || []);
    } catch (error) {
      console.error('Error fetching sub-workers:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifications = await getUserNotifications(user.id);
      setNotifications(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    if (notification.related_report_id) {
      setActiveTab('reports');
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const openReportDetail = async (report: Complaint) => {
    setReportDetailModal({ isOpen: true, report });
    
    // Initialize map when modal opens
    if (mapsLoaded && mapRef.current) {
      setTimeout(() => {
        const map = createEmbeddedMap(mapRef.current!, {
          lat: report.location.lat,
          lng: report.location.lng,
          address: report.location.address
        }, {
          zoom: 16,
          marker: true
        });
        setCurrentMap(map);
      }, 100);
    }
  };

  const assignTaskToWorker = async (reportId: string, workerId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'assigned',
          assigned_to: workerId
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error assigning task:', error);
        alert('Failed to assign task. Please try again.');
        return;
      }

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId
          ? { ...report, status: 'assigned', assignedTo: workerId }
          : report
      ));

      alert('Task assigned successfully!');
      setReportDetailModal({ isOpen: false, report: null });
      
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task. Please try again.');
    }
  };

  const approveTask = async (reportId: string, ecoPoints: number, reporterId: string) => {
    try {
      // Update report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'completed' })
        .eq('id', reportId);

      if (reportError) {
        console.error('Error approving task:', error);
        alert('Failed to approve task. Please try again.');
        return;
      }

      // Award eco-points to reporter
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({
          eco_points: supabase.sql`eco_points + ${ecoPoints}`
        })
        .eq('id', reporterId);

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
      }

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId
          ? { ...report, status: 'completed' }
          : report
      ));

      alert(`Task approved! ${ecoPoints} eco-points awarded to reporter.`);
      setReportDetailModal({ isOpen: false, report: null });
      
    } catch (error) {
      console.error('Error approving task:', error);
      alert('Failed to approve task. Please try again.');
    }
  };

  const rejectTask = async (reportId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'assigned',
          rejection_comment: reason,
          proof_image: null,
          proof_lat: null,
          proof_lng: null
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error rejecting task:', error);
        alert('Failed to reject task. Please try again.');
        return;
      }

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId
          ? { 
              ...report, 
              status: 'assigned', 
              rejectionComment: reason,
              proofImage: undefined,
              proofLocation: undefined
            }
          : report
      ));

      alert('Task rejected and sent back to worker.');
      setReportDetailModal({ isOpen: false, report: null });
      
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Failed to reject task. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted_for_approval': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Statistics
  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'submitted').length,
    assignedReports: reports.filter(r => r.status === 'assigned').length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    availableWorkers: subWorkers.filter(w => w.status === 'available').length,
    busyWorkers: subWorkers.filter(w => w.status === 'busy').length
  };

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
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      {unreadNotifications.length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">
                                  {notification.title}
                                </h4>
                                <p className="text-gray-600 text-xs mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="hidden sm:block font-medium text-gray-700">{user.name?.split(' ')[0] || 'Admin'}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">Municipal Admin</p>
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
            { id: 'reports', label: 'Reports', icon: Clock },
            { id: 'workers', label: 'Workers', icon: Users },
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
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.assignedReports}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <UserCheck className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedReports}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.availableWorkers}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="text-green-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Busy Workers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.busyWorkers}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Users className="text-red-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Reports</h3>
              
              {loadingReports ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-600">Loading reports...</span>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No reports yet</h4>
                  <p className="text-gray-500">Reports will appear here when citizens submit them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.slice(0, 5).map(report => (
                    <div key={report.id} className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                      <img
                        src={report.imageUrl}
                        alt="Report"
                        className="w-20 h-20 rounded-xl object-cover shadow-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1">{report.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">Reporter: {report.userName}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                            <span className="capitalize">{report.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                            <span className="capitalize">{report.priority}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-2">
                          {report.submittedAt.toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => openReportDetail(report)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by reporter name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="submitted_for_approval">Pending Approval</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="grid gap-6">
              {filteredReports.map(report => (
                <div key={report.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative">
                      <img
                        src={report.imageUrl}
                        alt="Report"
                        className="w-full lg:w-64 h-48 object-cover rounded-2xl shadow-lg"
                      />
                      <div className="absolute bottom-2 right-2 w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <MapPin size={20} className="text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">{report.title}</h3>
                          <p className="text-gray-600 mb-3">Reporter: {report.userName} ({report.userPhone})</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(report.status)}`}>
                            <span className="capitalize">{report.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getPriorityColor(report.priority)}`}>
                            <span className="capitalize">{report.priority}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                        <MapPin size={18} className="mr-2 text-blue-600" />
                        <span className="font-medium">{report.location.address}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center text-gray-500">
                          <Calendar size={16} className="mr-2" />
                          <span className="text-sm">
                            Submitted: {report.submittedAt.toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => openReportDetail(report)}
                          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                          <Eye size={16} className="mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workers Tab */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Sub-Workers Management</h2>
            
            {loadingWorkers ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading workers...</span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subWorkers.map(worker => (
                  <div key={worker.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        worker.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {worker.status}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{worker.name}</h3>
                    <p className="text-gray-600 text-sm mb-1">📞 {worker.phone}</p>
                    <p className="text-gray-600 text-sm mb-4">🏛️ {worker.ward || worker.assigned_ward || 'No ward assigned'}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">ID: {worker.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Resolution Rate</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.totalReports > 0 ? Math.round((stats.completedReports / stats.totalReports) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">
                  {stats.completedReports} of {stats.totalReports} reports completed
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Efficiency</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {subWorkers.length > 0 ? Math.round((stats.availableWorkers / subWorkers.length) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">
                  {stats.availableWorkers} of {subWorkers.length} workers available
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Tasks</h3>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {stats.pendingReports + stats.assignedReports}
                </div>
                <p className="text-sm text-gray-600">
                  Tasks awaiting completion
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Eco-Points</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {reports.reduce((sum, report) => sum + (report.ecoPoints || 0), 0)}
                </div>
                <p className="text-sm text-gray-600">
                  Points distributed to citizens
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {reportDetailModal.isOpen && reportDetailModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Report Details</h3>
                <button
                  onClick={() => setReportDetailModal({ isOpen: false, report: null })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Report Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Report Images</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {reportDetailModal.report.images?.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Report ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      )) || (
                        <img
                          src={reportDetailModal.report.imageUrl}
                          alt="Report"
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Reporter Information</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p><span className="font-medium">Name:</span> {reportDetailModal.report.userName}</p>
                      <p><span className="font-medium">Phone:</span> {reportDetailModal.report.userPhone}</p>
                      <p><span className="font-medium">Submitted:</span> {reportDetailModal.report.submittedAt.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Status & Priority</h4>
                    <div className="flex gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(reportDetailModal.report.status)}`}>
                        {reportDetailModal.report.status.replace('_', ' ')}
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getPriorityColor(reportDetailModal.report.priority)}`}>
                        {reportDetailModal.report.priority}
                      </span>
                    </div>
                  </div>

                  {reportDetailModal.report.ecoPoints && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Eco-Points</h4>
                      <div className="bg-green-50 rounded-xl p-4 flex items-center">
                        <Award size={20} className="text-green-600 mr-2" />
                        <span className="font-bold text-green-800">{reportDetailModal.report.ecoPoints} points</span>
                      </div>
                    </div>
                  )}

                  {/* Assignment Section */}
                  {reportDetailModal.report.status === 'submitted' && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Assign to Worker</h4>
                      <div className="space-y-3">
                        {subWorkers.filter(w => w.status === 'available').map(worker => (
                          <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium">{worker.name}</p>
                              <p className="text-sm text-gray-600">{worker.ward}</p>
                            </div>
                            <button
                              onClick={() => assignTaskToWorker(reportDetailModal.report!.id, worker.id)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Assign
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval Section */}
                  {reportDetailModal.report.status === 'submitted_for_approval' && reportDetailModal.report.proofImage && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Proof of Completion</h4>
                      <img
                        src={reportDetailModal.report.proofImage}
                        alt="Proof of completion"
                        className="w-full h-48 object-cover rounded-xl mb-4"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => approveTask(
                            reportDetailModal.report!.id, 
                            reportDetailModal.report!.ecoPoints || 20,
                            reportDetailModal.report!.userId
                          )}
                          className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                        >
                          Approve Task
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) {
                              rejectTask(reportDetailModal.report!.id, reason);
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                        >
                          Reject Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Map */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Location</h4>
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center text-gray-700">
                        <MapPin size={16} className="mr-2 text-blue-600" />
                        <span className="text-sm">{reportDetailModal.report.location.address}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {reportDetailModal.report.location.lat.toFixed(6)}, {reportDetailModal.report.location.lng.toFixed(6)}
                      </div>
                    </div>
                    
                    {mapsLoaded ? (
                      <div 
                        ref={mapRef}
                        className="w-full h-64 rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Map size={48} className="text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Loading map...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {reportDetailModal.report.aiAnalysis && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">AI Analysis</h4>
                      <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                        <p><span className="font-medium">Waste Type:</span> {reportDetailModal.report.aiAnalysis.waste_type}</p>
                        <p><span className="font-medium">Severity:</span> {reportDetailModal.report.aiAnalysis.severity}</p>
                        <p><span className="font-medium">Environmental Impact:</span> {reportDetailModal.report.aiAnalysis.environmental_impact}</p>
                        <p><span className="font-medium">Cleanup Difficulty:</span> {reportDetailModal.report.aiAnalysis.cleanup_difficulty}</p>
                        <p className="text-sm text-purple-700 mt-3">{reportDetailModal.report.aiAnalysis.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showUserDropdown || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserDropdown(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
};