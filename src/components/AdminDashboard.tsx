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
  Send,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Complaint } from '../types';
import { WorkerAssignmentInterface } from './WorkerAssignmentInterface';
import { 
  SubWorkerProfile,
  fetchSubWorkers,
  subscribeToSubWorkers,
  getSubWorkerStats
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
  proof_image?: string;
  proof_lat?: number;
  proof_lng?: number;
  completion_timestamp?: string;
  rejection_reason?: string;
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

interface ApprovalModal {
  isOpen: boolean;
  report: Complaint | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'workers' | 'approvals' | 'analytics'>('dashboard');
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
  const [approvalModal, setApprovalModal] = useState<ApprovalModal>({
    isOpen: false,
    report: null
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);

  // Verify admin access
  useEffect(() => {
    if (user.role !== 'admin') {
      console.error('Unauthorized access attempt - user is not admin');
      onLogout();
      return;
    }
    
    console.log('Admin access verified for user:', user.id);
    fetchReports();
    loadSubWorkers();
  }, [user.id, user.role]);

  // Set up real-time worker updates
  useEffect(() => {
    const subscription = subscribeToSubWorkers(
      (updatedWorkers) => {
        setSubWorkers(updatedWorkers);
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
      console.log('Fetching reports for admin...');
      
      // Fetch all reports (admins can see all reports)
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        return;
      }

      console.log('Reports fetched:', reportsData?.length || 0);

      // Fetch reporter profiles
      const userIds = reportsData?.map(report => report.user_id).filter(Boolean) || [];
      
      let profilesData: ReporterProfile[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching reporter profiles:', profilesError);
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
          status: report.status as 'submitted' | 'assigned' | 'in-progress' | 'completed' | 'submitted_for_approval' | 'approved' | 'rejected',
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
          completionTimestamp: report.completion_timestamp ? new Date(report.completion_timestamp) : undefined,
          rejectionReason: report.rejection_reason
        };
      });

      setReports(convertedReports);

    } catch (error) {
      console.error('Error in fetchReports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadSubWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const workers = await fetchSubWorkers();
      setSubWorkers(workers);
    } catch (error) {
      console.error('Error loading subworkers:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const openTaskAssignment = (report: Complaint) => {
    setTaskAssignmentModal({ isOpen: true, report });
  };

  const openApprovalModal = (report: Complaint) => {
    setApprovalModal({ isOpen: true, report });
    setRejectionReason('');
  };

  const handleAssignmentComplete = async (workerId: string) => {
    setTaskAssignmentModal({ isOpen: false, report: null });
    
    // Refresh data
    await Promise.all([fetchReports(), loadSubWorkers()]);
  };

  const handleApproveTask = async () => {
    if (!approvalModal.report) return;

    setProcessingApproval(true);
    try {
      const { error } = await supabase.rpc('approve_cleanup_task', {
        task_id: approvalModal.report.id,
        admin_id: user.id
      });

      if (error) {
        console.error('Error approving task:', error);
        alert('Failed to approve task. Please try again.');
        return;
      }

      alert('Task approved successfully! Points have been awarded to the citizen.');
      setApprovalModal({ isOpen: false, report: null });
      await fetchReports();

    } catch (error) {
      console.error('Error approving task:', error);
      alert('Failed to approve task. Please try again.');
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectTask = async () => {
    if (!approvalModal.report || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessingApproval(true);
    try {
      const { error } = await supabase.rpc('reject_cleanup_task', {
        task_id: approvalModal.report.id,
        admin_id: user.id,
        rejection_reason_text: rejectionReason.trim()
      });

      if (error) {
        console.error('Error rejecting task:', error);
        alert('Failed to reject task. Please try again.');
        return;
      }

      alert('Task rejected. The worker has been notified and can resubmit.');
      setApprovalModal({ isOpen: false, report: null });
      setRejectionReason('');
      await fetchReports();

    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Failed to reject task. Please try again.');
    } finally {
      setProcessingApproval(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted_for_approval': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
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

  const pendingApprovalReports = reports.filter(r => r.status === 'submitted_for_approval');

  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === 'submitted').length,
    assignedReports: reports.filter(r => r.status === 'assigned').length,
    completedReports: reports.filter(r => r.status === 'completed' || r.status === 'approved').length,
    pendingApprovalReports: pendingApprovalReports.length,
    ...getSubWorkerStats(subWorkers)
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
                <span className="font-bold">{stats.total}</span>
                <span className="text-xs ml-1 opacity-90">workers</span>
              </div>

              {/* Approval Notifications */}
              {stats.pendingApprovalReports > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors"
                  >
                    <Send size={18} className="mr-2" />
                    <span className="font-bold">{stats.pendingApprovalReports}</span>
                    <span className="text-xs ml-1 opacity-90">pending</span>
                  </button>
                </div>
              )}

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
            { id: 'approvals', label: `Approvals (${stats.pendingApprovalReports})`, icon: Send },
            { id: 'workers', label: `Workers (${stats.total})`, icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'reports' | 'workers' | 'approvals' | 'analytics')}
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
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
                    <p className="text-sm font-medium text-gray-600">Awaiting Approval</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovalReports}</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Send className="text-purple-600" size={28} />
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
                            {report.status.replace('_', ' ')}
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
                        {report.status === 'submitted_for_approval' && (
                          <button
                            onClick={() => openApprovalModal(report)}
                            className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 transition-colors"
                          >
                            Review
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

        {/* Approval Requests Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-3xl font-bold text-gray-800">Approval Requests</h2>
              <div className="flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-xl">
                <Send size={20} className="mr-2" />
                <span className="font-bold">{pendingApprovalReports.length}</span>
                <span className="ml-1">pending approval</span>
              </div>
            </div>
            
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : pendingApprovalReports.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Send size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No Pending Approvals</h3>
                <p className="text-gray-500">All submitted proofs have been reviewed.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {pendingApprovalReports.map(report => (
                  <div key={report.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Original Report */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Original Report</h3>
                        <img
                          src={report.imageUrl}
                          alt="Original Report"
                          className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <p className="text-sm"><span className="font-medium">Reporter:</span> {report.userName}</p>
                          <p className="text-sm"><span className="font-medium">Contact:</span> {report.userPhone}</p>
                          <p className="text-sm"><span className="font-medium">Location:</span> {report.location.address}</p>
                          <p className="text-sm"><span className="font-medium">Priority:</span> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              report.priority === 'low' ? 'bg-green-100 text-green-800' :
                              report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {report.priority} ({
                                report.priority === 'low' ? '10' :
                                report.priority === 'medium' ? '20' :
                                report.priority === 'high' ? '30' : '40'
                              } points)
                            </span>
                          </p>
                          <p className="text-sm"><span className="font-medium">Submitted:</span> {report.submittedAt.toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Completion Proof */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Completion Proof</h3>
                        {report.proofImage ? (
                          <img
                            src={report.proofImage}
                            alt="Completion Proof"
                            className="w-full h-48 object-cover rounded-xl mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                            <p className="text-gray-500">No proof image available</p>
                          </div>
                        )}
                        <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                          <p className="text-sm"><span className="font-medium">Worker:</span> {
                            subWorkers.find(w => w.id === report.assignedTo)?.name || 'Unknown Worker'
                          }</p>
                          <p className="text-sm"><span className="font-medium">Submitted:</span> {
                            report.completionTimestamp?.toLocaleString() || 'Unknown'
                          }</p>
                          {report.proofLocation && (
                            <p className="text-sm"><span className="font-medium">Proof Location:</span> 
                              {report.proofLocation.lat.toFixed(6)}, {report.proofLocation.lng.toFixed(6)}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={() => openApprovalModal(report)}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                          >
                            <ThumbsUp size={20} className="mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => openApprovalModal(report)}
                            className="flex-1 flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                          >
                            <ThumbsDown size={20} className="mr-2" />
                            Reject
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
                  <option value="submitted_for_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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
                            {report.status.replace('_', ' ')}
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

                          {report.status === 'submitted_for_approval' && (
                            <button
                              onClick={() => openApprovalModal(report)}
                              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                            >
                              <Send size={16} className="mr-2" />
                              Review Proof
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
                <button
                  onClick={loadSubWorkers}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            
            <WorkerAssignmentInterface showAssignmentActions={false} />
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
                      {stats.total > 0 ? Math.round((stats.busy / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Approvals</span>
                    <span className="font-bold text-purple-600">{stats.pendingApprovalReports}</span>
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
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Approval Queue</span>
                    <span className="flex items-center text-purple-600">
                      <Send size={16} className="mr-1" />
                      {stats.pendingApprovalReports} Pending
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
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
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

      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Review Cleanup Proof</h3>
              <button
                onClick={() => setApprovalModal({ isOpen: false, report: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Before & After Comparison */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Original Report</h4>
                  <img
                    src={approvalModal.report.imageUrl}
                    alt="Original Report"
                    className="w-full h-48 object-cover rounded-xl border-2 border-red-200"
                  />
                  <p className="text-sm text-gray-600 mt-2">Before cleanup</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Completion Proof</h4>
                  {approvalModal.report.proofImage ? (
                    <img
                      src={approvalModal.report.proofImage}
                      alt="Completion Proof"
                      className="w-full h-48 object-cover rounded-xl border-2 border-green-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                      <p className="text-gray-500">No proof image available</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">After cleanup</p>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Task Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Reporter:</span> {approvalModal.report.userName}</p>
                    <p><span className="font-medium">Worker:</span> {
                      subWorkers.find(w => w.id === approvalModal.report.assignedTo)?.name || 'Unknown Worker'
                    }</p>
                    <p><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        approvalModal.report.priority === 'low' ? 'bg-green-100 text-green-800' :
                        approvalModal.report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        approvalModal.report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {approvalModal.report.priority} ({
                          approvalModal.report.priority === 'low' ? '10' :
                          approvalModal.report.priority === 'medium' ? '20' :
                          approvalModal.report.priority === 'high' ? '30' : '40'
                        } points)
                      </span>
                    </p>
                    <p><span className="font-medium">Location:</span> {approvalModal.report.location.address}</p>
                    <p><span className="font-medium">Submitted:</span> {
                      approvalModal.report.completionTimestamp?.toLocaleString() || 'Unknown'
                    }</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Rejection Reason (if rejecting)</h4>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection (optional for approval)"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleApproveTask}
                    disabled={processingApproval}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingApproval ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <ThumbsUp size={20} className="mr-2" />
                    )}
                    Approve & Award Points
                  </button>
                  <button
                    onClick={handleRejectTask}
                    disabled={processingApproval}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingApproval ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <ThumbsDown size={20} className="mr-2" />
                    )}
                    Reject
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h5 className="font-semibold text-blue-800 mb-2">💡 Review Guidelines</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Compare before and after images carefully</li>
                    <li>• Verify the cleanup is complete and thorough</li>
                    <li>• Check if the location matches the original report</li>
                    <li>• Approve to award eco-points to the citizen</li>
                    <li>• Reject with clear reason if work is incomplete</li>
                  </ul>
                </div>
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