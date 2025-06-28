import React, { useState, useEffect } from 'react';
import { BarChart3, Users, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Star, UserCheck, X, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { mockSubWorkers, mockAnalytics } from '../data/mockData';
import { Profile, supabase } from '../lib/supabase';
import { Complaint, SubWorker } from '../types';

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
}

interface ReporterProfile {
  id: string;
  name: string;
  phone?: string;
}

interface AssignmentModal {
  isOpen: boolean;
  reportId: string;
  reportTitle: string;
  workerId: string;
  workerName: string;
}

interface DetailModal {
  isOpen: boolean;
  report: Complaint | null;
}

interface ApprovalModal {
  isOpen: boolean;
  report: Complaint | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'workers' | 'analytics' | 'approvals'>('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<SubWorker[]>(mockSubWorkers);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reporterProfiles, setReporterProfiles] = useState<Map<string, ReporterProfile>>(new Map());
  const [assignmentModal, setAssignmentModal] = useState<AssignmentModal>({
    isOpen: false,
    reportId: '',
    reportTitle: '',
    workerId: '',
    workerName: ''
  });
  const [detailModal, setDetailModal] = useState<DetailModal>({
    isOpen: false,
    report: null
  });
  const [approvalModal, setApprovalModal] = useState<ApprovalModal>({
    isOpen: false,
    report: null
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rejectionComment, setRejectionComment] = useState('');

  // Fetch reports from database for the admin's region
  useEffect(() => {
    fetchRegionalReports();
  }, [user.ward, user.city]);

  const fetchRegionalReports = async () => {
    setLoadingReports(true);
    try {
      // First fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        return;
      }

      // Then fetch user profiles for the reports
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

      // Create a map of user_id to profile for quick lookup
      const profileMap = new Map(profilesData.map(profile => [profile.id, profile]));
      setReporterProfiles(profileMap);

      // Convert database reports to complaint format
      const convertedComplaints: Complaint[] = (reportsData || []).map((report: DatabaseReport) => {
        const reporterProfile = profileMap.get(report.user_id);
        const assignedWorker = workers.find(w => w.id === report.assigned_to);
        
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
          status: report.status as 'submitted' | 'assigned' | 'in-progress' | 'completed' | 'submitted_for_approval',
          priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
          submittedAt: new Date(report.created_at),
          assignedTo: report.assigned_to,
          assignedWorkerName: assignedWorker?.name,
          proofImage: report.proof_image,
          proofLocation: report.proof_lat && report.proof_lng ? {
            lat: report.proof_lat,
            lng: report.proof_lng,
            address: 'Proof location'
          } : undefined
        };
      });

      // Filter reports by admin's region if ward/city is specified
      let filteredComplaints = convertedComplaints;
      if (user.ward || user.city) {
        filteredComplaints = convertedComplaints.filter(complaint => {
          const address = complaint.location.address?.toLowerCase() || '';
          const ward = user.ward?.toLowerCase() || '';
          const city = user.city?.toLowerCase() || '';
          
          return address.includes(ward) || address.includes(city);
        });
      }

      setComplaints(filteredComplaints);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'submitted_for_approval': return 'bg-purple-100 text-purple-800';
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

  const openAssignmentModal = (complaintId: string, complaintTitle: string, workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    setAssignmentModal({
      isOpen: true,
      reportId: complaintId,
      reportTitle: complaintTitle,
      workerId: workerId,
      workerName: worker.name
    });
  };

  const confirmAssignment = async () => {
    try {
      // Update the report status in database
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'assigned',
          assigned_to: assignmentModal.workerId
        })
        .eq('id', assignmentModal.reportId);

      if (error) {
        console.error('Error updating report status:', error);
        alert('Failed to assign worker. Please try again.');
        return;
      }

      // Update local state
      setComplaints(prev => prev.map(complaint =>
        complaint.id === assignmentModal.reportId
          ? { 
              ...complaint, 
              status: 'assigned', 
              assignedTo: assignmentModal.workerId, 
              assignedWorkerName: assignmentModal.workerName 
            }
          : complaint
      ));

      setWorkers(prev => prev.map(w =>
        w.id === assignmentModal.workerId
          ? { ...w, status: 'busy', currentTask: assignmentModal.reportId }
          : w
      ));

      setAssignmentModal({ isOpen: false, reportId: '', reportTitle: '', workerId: '', workerName: '' });
      alert(`Task assigned to ${assignmentModal.workerName} successfully!`);
    } catch (error) {
      console.error('Error assigning worker:', error);
      alert('Failed to assign worker. Please try again.');
    }
  };

  const openDetailModal = (complaint: Complaint) => {
    setDetailModal({ isOpen: true, report: complaint });
    setCurrentImageIndex(0);
  };

  const openApprovalModal = (complaint: Complaint) => {
    setApprovalModal({ isOpen: true, report: complaint });
    setRejectionComment('');
  };

  const approveTask = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'completed' })
        .eq('id', reportId);

      if (error) {
        console.error('Error approving task:', error);
        alert('Failed to approve task. Please try again.');
        return;
      }

      // Update local state
      setComplaints(prev => prev.map(complaint =>
        complaint.id === reportId
          ? { ...complaint, status: 'completed' }
          : complaint
      ));

      // Update worker status back to available
      const report = complaints.find(c => c.id === reportId);
      if (report?.assignedTo) {
        setWorkers(prev => prev.map(w =>
          w.id === report.assignedTo
            ? { ...w, status: 'available', currentTask: undefined, completedTasks: w.completedTasks + 1 }
            : w
        ));
      }

      setApprovalModal({ isOpen: false, report: null });
      alert('Task approved successfully! Rewards have been distributed.');
    } catch (error) {
      console.error('Error approving task:', error);
      alert('Failed to approve task. Please try again.');
    }
  };

  const rejectTask = async (reportId: string, comment: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: 'assigned',
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
      setComplaints(prev => prev.map(complaint =>
        complaint.id === reportId
          ? { 
              ...complaint, 
              status: 'assigned',
              proofImage: undefined,
              proofLocation: undefined
            }
          : complaint
      ));

      setApprovalModal({ isOpen: false, report: null });
      alert(`Task rejected. Sub-worker has been notified to retry. Comment: ${comment}`);
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Failed to reject task. Please try again.');
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const pendingComplaints = complaints.filter(c => c.status === 'submitted');
  const completedComplaints = complaints.filter(c => c.status === 'completed');
  const availableWorkers = workers.filter(w => w.status === 'available');
  const approvalRequests = complaints.filter(c => c.status === 'submitted_for_approval');

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
            { id: 'approvals', label: `Approvals ${approvalRequests.length > 0 ? `(${approvalRequests.length})` : ''}`, icon: CheckCircle },
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">{approvalRequests.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Eye className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Complaints</h3>
                {loadingReports ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Loading reports...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.slice(0, 5).map(complaint => (
                      <div key={complaint.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <img
                          src={complaint.imageUrl}
                          alt="Complaint"
                          className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                          onClick={() => openDetailModal(complaint)}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                          <p className="text-sm text-gray-600">{complaint.userName}</p>
                          <p className="text-xs text-gray-500">{complaint.userPhone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Complaint Management</h2>
              <div className="text-sm text-gray-600">
                Showing reports for {user.ward}, {user.city}
              </div>
            </div>
            
            {loadingReports ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading reports...</span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
                <AlertTriangle size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No reports found</h3>
                <p className="text-gray-500">No waste reports have been submitted in your region yet.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {complaints.map(complaint => (
                  <div key={complaint.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <img
                        src={complaint.imageUrl}
                        alt="Complaint"
                        className="w-full lg:w-64 h-48 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openDetailModal(complaint)}
                      />
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{complaint.title}</h3>
                            <div className="space-y-1">
                              <p className="text-gray-600">Reported by: <span className="font-medium">{complaint.userName}</span></p>
                              <p className="text-gray-600">Contact: <span className="font-medium">{complaint.userPhone}</span></p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                              {complaint.status.replace('_', ' ')}
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
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailModal(complaint)}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                            >
                              View Details
                            </button>
                            
                            {complaint.status === 'submitted' && availableWorkers.length > 0 && (
                              <select
                                onChange={(e) => e.target.value && openAssignmentModal(complaint.id, complaint.title, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                defaultValue=""
                              >
                                <option value="">Assign Worker</option>
                                {availableWorkers.map(worker => (
                                  <option key={worker.id} value={worker.id}>
                                    {worker.name} (Rating: {worker.rating})
                                  </option>
                                ))}
                              </select>
                            )}

                            {complaint.status === 'submitted' && availableWorkers.length === 0 && (
                              <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                                No workers available
                              </div>
                            )}
                            
                            {complaint.assignedWorkerName && (
                              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                Assigned to: {complaint.assignedWorkerName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Task Approvals</h2>
              <div className="text-sm text-gray-600">
                {approvalRequests.length} pending approvals
              </div>
            </div>
            
            {approvalRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
                <CheckCircle size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No pending approvals</h3>
                <p className="text-gray-500">All submitted tasks have been reviewed.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {approvalRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{request.title}</h3>
                          <p className="text-gray-600">Reporter: {request.userName} ({request.userPhone})</p>
                          <p className="text-gray-600">Worker: {request.assignedWorkerName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          Awaiting Approval
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original Report */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Original Report</h4>
                          <img
                            src={request.imageUrl}
                            alt="Original Report"
                            className="w-full h-48 object-cover rounded-xl mb-3"
                          />
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center text-blue-700">
                              <MapPin size={16} className="mr-2" />
                              <span className="text-sm">{request.location.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Proof Submission */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Proof of Completion</h4>
                          {request.proofImage && (
                            <img
                              src={request.proofImage}
                              alt="Proof of Completion"
                              className="w-full h-48 object-cover rounded-xl mb-3"
                            />
                          )}
                          {request.proofLocation && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex items-center text-green-700">
                                <MapPin size={16} className="mr-2" />
                                <span className="text-sm">
                                  Proof location ({request.proofLocation.lat.toFixed(6)}, {request.proofLocation.lng.toFixed(6)})
                                </span>
                              </div>
                              {request.proofLocation && (
                                <div className="mt-2 text-sm text-green-600">
                                  Distance from original: {
                                    calculateDistance(
                                      request.location.lat,
                                      request.location.lng,
                                      request.proofLocation.lat,
                                      request.proofLocation.lng
                                    ).toFixed(0)
                                  }m
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => openApprovalModal(request)}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                        >
                          <ThumbsDown size={16} className="mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={() => approveTask(request.id)}
                          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                        >
                          <ThumbsUp size={16} className="mr-2" />
                          Approve
                        </button>
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
                    {complaints.length > 0 ? ((completedComplaints.length / complaints.length) * 100).toFixed(1) : 0}%
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

      {/* Assignment Confirmation Modal */}
      {assignmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Assignment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to assign report "{assignmentModal.reportTitle}" to {assignmentModal.workerName}?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setAssignmentModal({ isOpen: false, reportId: '', reportTitle: '', workerId: '', workerName: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssignment}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Report Details</h3>
              <button
                onClick={() => setDetailModal({ isOpen: false, report: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Images Carousel */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Images ({detailModal.report.images?.length || 1})</h4>
                <div className="relative">
                  <img
                    src={detailModal.report.images?.[currentImageIndex] || detailModal.report.imageUrl}
                    alt={`Report image ${currentImageIndex + 1}`}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  {detailModal.report.images && detailModal.report.images.length > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      {detailModal.report.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full ${
                            index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Report Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Reporter Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {detailModal.report.userName}</p>
                    <p><span className="font-medium">Phone:</span> {detailModal.report.userPhone}</p>
                    <p><span className="font-medium">Submitted:</span> {detailModal.report.submittedAt.toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Report Status</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(detailModal.report.status)}`}>
                        {detailModal.report.status.replace('_', ' ')}
                      </span>
                    </p>
                    <p><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(detailModal.report.priority)}`}>
                        {detailModal.report.priority}
                      </span>
                    </p>
                    {detailModal.report.assignedWorkerName && (
                      <p><span className="font-medium">Assigned to:</span> {detailModal.report.assignedWorkerName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Map */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Location</h4>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center text-blue-700">
                    <MapPin size={20} className="mr-2" />
                    <span>{detailModal.report.location.address}</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Coordinates: {detailModal.report.location.lat.toFixed(6)}, {detailModal.report.location.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Task</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this task completion:
            </p>
            <textarea
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 resize-none"
              rows={4}
            />
            <div className="flex space-x-4">
              <button
                onClick={() => setApprovalModal({ isOpen: false, report: null })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectTask(approvalModal.report!.id, rejectionComment)}
                disabled={!rejectionComment.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};