import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  User, 
  ChevronDown, 
  Eye, 
  UserCheck, 
  X, 
  Camera, 
  Award, 
  Filter, 
  Search, 
  RefreshCw, 
  BarChart3, 
  Settings, 
  Bell, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Star, 
  Phone, 
  Mail, 
  Calendar, 
  Target, 
  Zap, 
  Activity, 
  PieChart, 
  TrendingDown, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Complaint, SubWorker, EcoProduct } from '../types';
import { createNotification, NotificationTemplates, getUserNotifications, Notification } from '../lib/notifications';

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
  eco_points?: number;
}

interface WorkerProfile {
  id: string;
  name: string;
  phone?: string;
  status?: string;
  ward?: string;
  assigned_ward?: string;
  task_completion_count?: number;
}

interface ReportDetailModal {
  isOpen: boolean;
  report: Complaint | null;
}

interface AssignTaskModal {
  isOpen: boolean;
  report: Complaint | null;
}

interface ProofReviewModal {
  isOpen: boolean;
  report: Complaint | null;
}

interface EcoStoreModal {
  isOpen: boolean;
  product: EcoProduct | null;
  isEditing: boolean;
}

interface Analytics {
  totalReports: number;
  pendingReports: number;
  completedReports: number;
  activeWorkers: number;
  averageResolutionTime: number;
  cleanlinessIndex: number;
  todayReports: number;
  weeklyTrend: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'workers' | 'analytics' | 'ecostore'>('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Data states
  const [reports, setReports] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<SubWorker[]>([]);
  const [ecoProducts, setEcoProducts] = useState<EcoProduct[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reporterProfiles, setReporterProfiles] = useState<Map<string, ReporterProfile>>(new Map());
  const [workerProfiles, setWorkerProfiles] = useState<Map<string, WorkerProfile>>(new Map());
  
  // Loading states
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);
  const [reviewingProof, setReviewingProof] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [reportDetailModal, setReportDetailModal] = useState<ReportDetailModal>({ isOpen: false, report: null });
  const [assignTaskModal, setAssignTaskModal] = useState<AssignTaskModal>({ isOpen: false, report: null });
  const [proofReviewModal, setProofReviewModal] = useState<ProofReviewModal>({ isOpen: false, report: null });
  const [ecoStoreModal, setEcoStoreModal] = useState<EcoStoreModal>({ isOpen: false, product: null, isEditing: false });
  
  // Form states
  const [rejectionComment, setRejectionComment] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    point_cost: 0,
    quantity: 0,
    image_url: '',
    category: 'tools' as 'dustbins' | 'compost' | 'tools' | 'plants' | 'vouchers'
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);

  useEffect(() => {
    fetchAllData();
  }, [user.id]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchReports(),
      fetchWorkers(),
      fetchEcoProducts(),
      fetchNotifications(),
      calculateAnalytics()
    ]);
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      // Fetch all reports (admin can see all)
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
      let reporterProfilesData: ReporterProfile[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, phone, eco_points')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching reporter profiles:', profilesError);
        } else {
          reporterProfilesData = profiles || [];
        }
      }

      const reporterProfileMap = new Map(reporterProfilesData.map(profile => [profile.id, profile]));
      setReporterProfiles(reporterProfileMap);

      // Convert to complaint format
      const convertedReports: Complaint[] = (reportsData || []).map((report: DatabaseReport) => {
        const reporterProfile = reporterProfileMap.get(report.user_id);
        const workerProfile = report.assigned_to ? workerProfiles.get(report.assigned_to) : null;
        
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
          priority: (report.priority_level as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          submittedAt: new Date(report.created_at),
          assignedTo: report.assigned_to,
          assignedWorkerName: workerProfile?.name,
          ecoPoints: report.eco_points,
          proofImage: report.proof_image,
          proofLocation: report.proof_lat && report.proof_lng ? {
            lat: report.proof_lat,
            lng: report.proof_lng,
            address: 'Proof location'
          } : undefined,
          rejectionComment: report.rejection_comment,
          aiAnalysis: report.ai_analysis
        };
      });

      setReports(convertedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const { data: workersData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'subworker')
        .order('name');

      if (error) {
        console.error('Error fetching workers:', error);
        return;
      }

      const workerProfileMap = new Map(workersData?.map(worker => [worker.id, worker]) || []);
      setWorkerProfiles(workerProfileMap);

      const convertedWorkers: SubWorker[] = (workersData || []).map(worker => ({
        id: worker.id,
        name: worker.name,
        email: worker.email || '',
        phone: worker.phone || '',
        status: (worker.status as 'available' | 'busy') || 'available',
        ward: worker.assigned_ward || worker.ward || 'Unassigned',
        completedTasks: worker.task_completion_count || 0,
        rating: 4.5, // Mock rating - could be calculated from feedback
        currentTask: worker.current_task_id
      }));

      setWorkers(convertedWorkers);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchEcoProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('eco_store_items')
        .select('*')
        .order('point_cost');

      if (error) {
        console.error('Error fetching eco products:', error);
        return;
      }

      const convertedProducts: EcoProduct[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        eco_points: item.point_cost,
        image: item.image_url,
        category: item.category as 'dustbins' | 'compost' | 'tools' | 'plants',
        stock: item.quantity
      }));

      setEcoProducts(convertedProducts);
    } catch (error) {
      console.error('Error fetching eco products:', error);
    } finally {
      setLoadingProducts(false);
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

  const calculateAnalytics = async () => {
    try {
      // Get basic counts
      const { data: allReports } = await supabase
        .from('reports')
        .select('status, created_at, priority_level');

      const { data: allWorkers } = await supabase
        .from('profiles')
        .select('status')
        .eq('role', 'subworker');

      if (!allReports || !allWorkers) return;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayReports = allReports.filter(r => new Date(r.created_at) >= today).length;
      const weekReports = allReports.filter(r => new Date(r.created_at) >= weekAgo).length;
      const prevWeekReports = allReports.filter(r => {
        const date = new Date(r.created_at);
        return date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < weekAgo;
      }).length;

      const weeklyTrend = prevWeekReports > 0 ? ((weekReports - prevWeekReports) / prevWeekReports) * 100 : 0;

      const analytics: Analytics = {
        totalReports: allReports.length,
        pendingReports: allReports.filter(r => ['submitted', 'assigned', 'submitted_for_approval'].includes(r.status)).length,
        completedReports: allReports.filter(r => r.status === 'completed').length,
        activeWorkers: allWorkers.filter(w => w.status === 'available').length,
        averageResolutionTime: 4.2, // Mock - would need to calculate from actual data
        cleanlinessIndex: 87.3, // Mock - would be calculated based on completion rates
        todayReports,
        weeklyTrend
      };

      setAnalytics(analytics);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const assignTaskToWorker = async (reportId: string, workerId: string) => {
    setAssigningTask(true);
    try {
      // Update report with assigned worker
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          status: 'assigned',
          assigned_to: workerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (reportError) {
        console.error('Error assigning task:', reportError);
        alert('Failed to assign task. Please try again.');
        return;
      }

      // Update worker status to busy
      const { error: workerError } = await supabase
        .from('profiles')
        .update({
          status: 'busy',
          current_task_id: reportId,
          updated_at: new Date().toISOString()
        })
        .eq('id', workerId);

      if (workerError) {
        console.error('Error updating worker status:', workerError);
      }

      // Create notification for worker
      const report = reports.find(r => r.id === reportId);
      if (report) {
        const template = NotificationTemplates.taskAssigned(reportId, report.location.address);
        await createNotification(workerId, template.title, template.message, template.type, reportId);
      }

      // Refresh data
      await fetchAllData();
      setAssignTaskModal({ isOpen: false, report: null });
      alert('Task assigned successfully!');

    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task. Please try again.');
    } finally {
      setAssigningTask(false);
    }
  };

  const approveTask = async (reportId: string) => {
    setReviewingProof(true);
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // Update report status to completed
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (reportError) {
        console.error('Error approving task:', reportError);
        alert('Failed to approve task. Please try again.');
        return;
      }

      // Update worker status back to available
      if (report.assignedTo) {
        const { error: workerError } = await supabase
          .from('profiles')
          .update({
            status: 'available',
            current_task_id: null,
            task_completion_count: supabase.sql`task_completion_count + 1`,
            updated_at: new Date().toISOString()
          })
          .eq('id', report.assignedTo);

        if (workerError) {
          console.error('Error updating worker status:', workerError);
        }
      }

      // Award eco-points to citizen
      if (report.ecoPoints) {
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({
            eco_points: supabase.sql`eco_points + ${report.ecoPoints}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', report.userId);

        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        }

        // Create reward transaction
        await supabase
          .from('reward_transactions')
          .insert([{
            user_id: report.userId,
            report_id: reportId,
            points: report.ecoPoints
          }]);

        // Notify citizen about points
        const template = NotificationTemplates.taskApproved(report.ecoPoints);
        await createNotification(report.userId, template.title, template.message, template.type, reportId);
      }

      // Notify worker about approval
      if (report.assignedTo) {
        await createNotification(
          report.assignedTo,
          'Task Approved!',
          'Your cleanup work has been approved. Great job!',
          'success',
          reportId
        );
      }

      // Refresh data
      await fetchAllData();
      setProofReviewModal({ isOpen: false, report: null });
      alert('Task approved successfully! Eco-points awarded to citizen.');

    } catch (error) {
      console.error('Error approving task:', error);
      alert('Failed to approve task. Please try again.');
    } finally {
      setReviewingProof(false);
    }
  };

  const rejectTask = async (reportId: string, comment: string) => {
    if (!comment.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setReviewingProof(true);
    try {
      // Update report with rejection comment and reset to assigned status
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          status: 'assigned',
          rejection_comment: comment,
          proof_image: null,
          proof_lat: null,
          proof_lng: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (reportError) {
        console.error('Error rejecting task:', reportError);
        alert('Failed to reject task. Please try again.');
        return;
      }

      const report = reports.find(r => r.id === reportId);
      
      // Notify worker about rejection
      if (report?.assignedTo) {
        const template = NotificationTemplates.taskRejected(comment);
        await createNotification(report.assignedTo, template.title, template.message, template.type, reportId);
      }

      // Refresh data
      await fetchAllData();
      setProofReviewModal({ isOpen: false, report: null });
      setRejectionComment('');
      alert('Task rejected. Worker has been notified to resubmit.');

    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Failed to reject task. Please try again.');
    } finally {
      setReviewingProof(false);
    }
  };

  const saveEcoProduct = async () => {
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.image_url.trim()) {
      alert('Please fill all required fields.');
      return;
    }

    setSavingProduct(true);
    try {
      if (ecoStoreModal.product) {
        // Update existing product
        const { error } = await supabase
          .from('eco_store_items')
          .update({
            name: productForm.name,
            description: productForm.description,
            point_cost: productForm.point_cost,
            quantity: productForm.quantity,
            image_url: productForm.image_url,
            category: productForm.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', ecoStoreModal.product.id);

        if (error) {
          console.error('Error updating product:', error);
          alert('Failed to update product. Please try again.');
          return;
        }
      } else {
        // Create new product
        const { error } = await supabase
          .from('eco_store_items')
          .insert([{
            name: productForm.name,
            description: productForm.description,
            point_cost: productForm.point_cost,
            quantity: productForm.quantity,
            image_url: productForm.image_url,
            category: productForm.category,
            is_active: true
          }]);

        if (error) {
          console.error('Error creating product:', error);
          alert('Failed to create product. Please try again.');
          return;
        }
      }

      // Refresh products
      await fetchEcoProducts();
      setEcoStoreModal({ isOpen: false, product: null, isEditing: false });
      setProductForm({
        name: '',
        description: '',
        point_cost: 0,
        quantity: 0,
        image_url: '',
        category: 'tools'
      });
      alert('Product saved successfully!');

    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteEcoProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('eco_store_items')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
        return;
      }

      await fetchEcoProducts();
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const openProductModal = (product?: EcoProduct) => {
    if (product) {
      setProductForm({
        name: product.name,
        description: product.description,
        point_cost: product.eco_points,
        quantity: product.stock,
        image_url: product.image,
        category: product.category
      });
      setEcoStoreModal({ isOpen: true, product, isEditing: true });
    } else {
      setProductForm({
        name: '',
        description: '',
        point_cost: 0,
        quantity: 0,
        image_url: '',
        category: 'tools'
      });
      setEcoStoreModal({ isOpen: true, product: null, isEditing: false });
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

  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
      report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Niramay Admin</h1>
                <p className="text-xs text-gray-500">Municipal Management Portal</p>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-lg">
                  <span className="text-yellow-800 text-sm font-medium">
                    {analytics?.pendingReports || 0} Pending
                  </span>
                </div>
                <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                  <span className="text-green-800 text-sm font-medium">
                    {analytics?.activeWorkers || 0} Workers
                  </span>
                </div>
              </div>

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
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map(notification => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-50 ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield size={16} className="text-white" />
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
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'reports', label: `Reports ${filteredReports.length > 0 ? `(${filteredReports.length})` : ''}`, icon: Clock },
            { id: 'workers', label: 'Workers', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'ecostore', label: 'Eco Store', icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'reports' | 'workers' | 'analytics' | 'ecostore')}
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
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome, {user.name?.split(' ')[0] || 'Admin'}!
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Managing waste reports and coordinating cleanup efforts
                  </p>
                  <div className="flex items-center mt-4 space-x-6">
                    <div className="flex items-center">
                      <Activity size={20} className="mr-2" />
                      <span className="font-semibold">{analytics?.todayReports || 0} Today</span>
                    </div>
                    <div className="flex items-center">
                      <Target size={20} className="mr-2" />
                      <span className="font-semibold">{analytics?.cleanlinessIndex || 0}% Clean Index</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => fetchAllData()}
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center"
                >
                  <RefreshCw size={24} className="mr-3" />
                  Refresh Data
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.totalReports || 0}</p>
                    <div className="flex items-center mt-2">
                      {analytics?.weeklyTrend && analytics.weeklyTrend > 0 ? (
                        <TrendingUp size={16} className="text-green-600 mr-1" />
                      ) : (
                        <TrendingDown size={16} className="text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        analytics?.weeklyTrend && analytics.weeklyTrend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(analytics?.weeklyTrend || 0).toFixed(1)}%
                      </span>
                    </div>
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
                    <p className="text-3xl font-bold text-gray-900">{analytics?.pendingReports || 0}</p>
                    <p className="text-sm text-orange-600 mt-2">Needs attention</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="text-orange-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.completedReports || 0}</p>
                    <p className="text-sm text-green-600 mt-2">Successfully resolved</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={28} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Workers</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics?.activeWorkers || 0}</p>
                    <p className="text-sm text-blue-600 mt-2">Available now</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Users className="text-purple-600" size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports & Quick Actions */}
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
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.slice(0, 3).map(report => (
                      <div key={report.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                           onClick={() => setReportDetailModal({ isOpen: true, report })}>
                        <img
                          src={report.imageUrl}
                          alt="Report"
                          className="w-16 h-16 rounded-xl object-cover shadow-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-1">{report.userName}</h4>
                          <p className="text-sm text-gray-600 mb-2">{report.location.address}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                              {report.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {report.submittedAt.toLocaleDateString()}
                          </p>
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
                    Manage All
                  </button>
                </div>
                
                {loadingWorkers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : workers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No workers registered</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workers.slice(0, 4).map(worker => (
                      <div key={worker.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{worker.name}</h4>
                            <p className="text-sm text-gray-600">{worker.ward}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getWorkerStatusColor(worker.status)}`}>
                            {worker.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{worker.completedTasks} tasks</p>
                        </div>
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
            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="assigned">Assigned</option>
                    <option value="submitted_for_approval">Pending Approval</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{filteredReports.length} reports</span>
                </div>
              </div>
            </div>

            {/* Reports List */}
            {loadingReports ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading reports...</span>
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
                  <div key={report.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="relative">
                        <img
                          src={report.imageUrl}
                          alt="Report"
                          className="w-full lg:w-64 h-48 object-cover rounded-2xl shadow-lg cursor-pointer"
                          onClick={() => setReportDetailModal({ isOpen: true, report })}
                        />
                        {report.images && report.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs">
                            +{report.images.length - 1} more
                          </div>
                        )}
                        {/* Priority indicator */}
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{report.title}</h3>
                            <div className="space-y-1">
                              <p className="text-gray-600">Reporter: <span className="font-medium">{report.userName}</span></p>
                              <p className="text-gray-600">Contact: <span className="font-medium">{report.userPhone}</span></p>
                              {report.assignedWorkerName && (
                                <p className="text-gray-600">Assigned to: <span className="font-medium">{report.assignedWorkerName}</span></p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(report.status)}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                            {report.ecoPoints && (
                              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                <Award size={14} className="mr-1" />
                                <span className="text-sm font-semibold">{report.ecoPoints} points</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl">
                          <MapPin size={18} className="mr-2 text-blue-600" />
                          <span className="font-medium">{report.location.address}</span>
                        </div>

                        {/* AI Analysis */}
                        {report.aiAnalysis && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="flex items-center mb-2">
                              <Sparkles size={16} className="text-purple-600 mr-2" />
                              <span className="font-semibold text-purple-800 text-sm">AI Analysis</span>
                            </div>
                            <div className="text-sm text-purple-700">
                              <p><span className="font-medium">Type:</span> {report.aiAnalysis.waste_type}</p>
                              <p><span className="font-medium">Impact:</span> {report.aiAnalysis.environmental_impact}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center text-gray-500">
                            <Calendar size={16} className="mr-2" />
                            <span className="text-sm">
                              Submitted: {report.submittedAt.toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setReportDetailModal({ isOpen: true, report })}
                              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <Eye size={16} className="mr-2" />
                              View Details
                            </button>
                            
                            {report.status === 'submitted' && (
                              <button
                                onClick={() => setAssignTaskModal({ isOpen: true, report })}
                                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <UserCheck size={16} className="mr-2" />
                                Assign Worker
                              </button>
                            )}
                            
                            {report.status === 'submitted_for_approval' && (
                              <button
                                onClick={() => setProofReviewModal({ isOpen: true, report })}
                                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                              >
                                <CheckCircle size={16} className="mr-2" />
                                Review Proof
                              </button>
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

        {/* Workers Management */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800">Worker Management</h2>
              <div className="text-sm text-gray-600">
                {workers.length} total workers
              </div>
            </div>
            
            {loadingWorkers ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading workers...</span>
              </div>
            ) : workers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Users size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No workers registered</h3>
                <p className="text-gray-500">Workers will appear here once they register in the system.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers.map(worker => (
                  <div key={worker.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <User size={32} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{worker.name}</h3>
                      <p className="text-gray-600 mb-4">{worker.ward}</p>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getWorkerStatusColor(worker.status)}`}>
                        {worker.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Mail size={16} className="mr-3 text-gray-400" />
                        <span className="text-sm">{worker.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone size={16} className="mr-3 text-gray-400" />
                        <span className="text-sm">{worker.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Target size={16} className="mr-3 text-gray-400" />
                        <span className="text-sm">{worker.completedTasks} tasks completed</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Star size={16} className="mr-3 text-gray-400" />
                        <span className="text-sm">{worker.rating}/5.0 rating</span>
                      </div>
                    </div>
                    
                    {worker.currentTask && (
                      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-orange-800 text-sm font-medium">
                          Currently working on task: {worker.currentTask}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics ? Math.round((analytics.completedReports / analytics.totalReports) * 100) : 0}%
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
                    <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.averageResolutionTime || 0}h</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cleanliness Index</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.cleanlinessIndex || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <PieChart className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Worker Efficiency</p>
                    <p className="text-2xl font-bold text-gray-900">92%</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Zap className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Reports by Status</h3>
                <div className="space-y-4">
                  {[
                    { status: 'Completed', count: analytics?.completedReports || 0, color: 'bg-green-500' },
                    { status: 'Pending', count: analytics?.pendingReports || 0, color: 'bg-yellow-500' },
                    { status: 'In Progress', count: reports.filter(r => r.status === 'assigned').length, color: 'bg-blue-500' }
                  ].map(item => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 ${item.color} rounded mr-3`}></div>
                        <span className="text-gray-700">{item.status}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Priority Distribution</h3>
                <div className="space-y-4">
                  {[
                    { priority: 'Urgent', count: reports.filter(r => r.priority === 'urgent').length, color: 'bg-red-500' },
                    { priority: 'High', count: reports.filter(r => r.priority === 'high').length, color: 'bg-orange-500' },
                    { priority: 'Medium', count: reports.filter(r => r.priority === 'medium').length, color: 'bg-yellow-500' },
                    { priority: 'Low', count: reports.filter(r => r.priority === 'low').length, color: 'bg-green-500' }
                  ].map(item => (
                    <div key={item.priority} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 ${item.color} rounded mr-3`}></div>
                        <span className="text-gray-700">{item.priority}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Eco Store Management */}
        {activeTab === 'ecostore' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800">Eco Store Management</h2>
              <button
                onClick={() => openProductModal()}
                className="flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg"
              >
                <Plus size={20} className="mr-2" />
                Add Product
              </button>
            </div>
            
            {loadingProducts ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading products...</span>
              </div>
            ) : ecoProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
                <Package size={64} className="text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No products yet</h3>
                <p className="text-gray-500 mb-8">Start by adding eco-friendly products to the store.</p>
                <button
                  onClick={() => openProductModal()}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ecoProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-2xl mb-6 shadow-lg"
                    />
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{product.name}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                    
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                        <Award size={20} className="mr-2" />
                        <span className="font-bold text-lg">{product.eco_points} Points</span>
                      </div>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {product.stock} in stock
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openProductModal(product)}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        <Edit3 size={16} className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEcoProduct(product.id)}
                        className="flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {/* Images */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Report Images</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {reportDetailModal.report.images?.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Report ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl shadow-md"
                      />
                    )) || (
                      <img
                        src={reportDetailModal.report.imageUrl}
                        alt="Report"
                        className="w-full h-32 object-cover rounded-xl shadow-md"
                      />
                    )}
                  </div>
                  
                  {reportDetailModal.report.proofImage && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 mb-4">Completion Proof</h4>
                      <img
                        src={reportDetailModal.report.proofImage}
                        alt="Completion Proof"
                        className="w-full h-48 object-cover rounded-xl shadow-md"
                      />
                    </div>
                  )}
                </div>
                
                {/* Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Report Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600">Reporter:</span>
                        <span className="ml-2 font-medium">{reportDetailModal.report.userName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Contact:</span>
                        <span className="ml-2 font-medium">{reportDetailModal.report.userPhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reportDetailModal.report.status)}`}>
                          {reportDetailModal.report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Priority:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(reportDetailModal.report.priority)}`}>
                          {reportDetailModal.report.priority}
                        </span>
                      </div>
                      {reportDetailModal.report.ecoPoints && (
                        <div>
                          <span className="text-gray-600">Eco Points:</span>
                          <span className="ml-2 font-medium text-green-600">{reportDetailModal.report.ecoPoints} points</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Location</h4>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center text-gray-700">
                        <MapPin size={16} className="mr-2 text-blue-600" />
                        <span>{reportDetailModal.report.location.address}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Coordinates: {reportDetailModal.report.location.lat.toFixed(6)}, {reportDetailModal.report.location.lng.toFixed(6)}
                      </div>
                    </div>
                  </div>
                  
                  {reportDetailModal.report.assignedWorkerName && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Assignment</h4>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center text-blue-700">
                          <UserCheck size={16} className="mr-2" />
                          <span>Assigned to: {reportDetailModal.report.assignedWorkerName}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportDetailModal.report.aiAnalysis && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">AI Analysis</h4>
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-purple-700">Waste Type:</span> {reportDetailModal.report.aiAnalysis.waste_type}</p>
                          <p><span className="font-medium text-purple-700">Severity:</span> {reportDetailModal.report.aiAnalysis.severity}</p>
                          <p><span className="font-medium text-purple-700">Environmental Impact:</span> {reportDetailModal.report.aiAnalysis.environmental_impact}</p>
                          <p><span className="font-medium text-purple-700">Cleanup Difficulty:</span> {reportDetailModal.report.aiAnalysis.cleanup_difficulty}</p>
                          <p><span className="font-medium text-purple-700">Reasoning:</span> {reportDetailModal.report.aiAnalysis.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">{reportDetailModal.report.submittedAt.toLocaleString()}</span>
                      </div>
                      {reportDetailModal.report.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium">{reportDetailModal.report.completedAt.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {assignTaskModal.isOpen && assignTaskModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Assign Task to Worker</h3>
                <button
                  onClick={() => setAssignTaskModal({ isOpen: false, report: null })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Report Details</h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-700 mb-2">
                    <span className="font-medium">Location:</span> {assignTaskModal.report.location.address}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Priority:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${getPriorityColor(assignTaskModal.report.priority)}`}>
                      {assignTaskModal.report.priority}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Available Workers</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {workers.filter(w => w.status === 'available').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-400" />
                      <p>No workers available at the moment</p>
                    </div>
                  ) : (
                    workers.filter(w => w.status === 'available').map(worker => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                        onClick={() => assignTaskToWorker(assignTaskModal.report!.id, worker.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-800">{worker.name}</h5>
                            <p className="text-sm text-gray-600">{worker.ward} • {worker.completedTasks} tasks completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-yellow-600 mb-1">
                            <Star size={14} className="mr-1" />
                            <span className="text-sm font-medium">{worker.rating}</span>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Available</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {assigningTask && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Assigning task...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof Review Modal */}
      {proofReviewModal.isOpen && proofReviewModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Review Completion Proof</h3>
                <button
                  onClick={() => setProofReviewModal({ isOpen: false, report: null })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Before/After Comparison */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Before (Original Report)</h4>
                  <img
                    src={proofReviewModal.report.imageUrl}
                    alt="Original Report"
                    className="w-full h-64 object-cover rounded-xl shadow-md mb-6"
                  />
                  
                  <h4 className="font-semibold text-gray-800 mb-4">After (Completion Proof)</h4>
                  {proofReviewModal.report.proofImage ? (
                    <img
                      src={proofReviewModal.report.proofImage}
                      alt="Completion Proof"
                      className="w-full h-64 object-cover rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                      <p className="text-gray-500">No proof image available</p>
                    </div>
                  )}
                </div>
                
                {/* Review Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Task Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600">Worker:</span>
                        <span className="ml-2 font-medium">{proofReviewModal.report.assignedWorkerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium">{proofReviewModal.report.location.address}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Eco Points to Award:</span>
                        <span className="ml-2 font-medium text-green-600">{proofReviewModal.report.ecoPoints} points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Review Decision</h4>
                    <div className="space-y-4">
                      <button
                        onClick={() => approveTask(proofReviewModal.report!.id)}
                        disabled={reviewingProof}
                        className="w-full flex items-center justify-center px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {reviewingProof ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} className="mr-2" />
                            Approve & Award Points
                          </>
                        )}
                      </button>
                      
                      <div className="space-y-3">
                        <textarea
                          value={rejectionComment}
                          onChange={(e) => setRejectionComment(e.target.value)}
                          placeholder="Reason for rejection (required if rejecting)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                        <button
                          onClick={() => rejectTask(proofReviewModal.report!.id, rejectionComment)}
                          disabled={reviewingProof || !rejectionComment.trim()}
                          className="w-full flex items-center justify-center px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <X size={20} className="mr-2" />
                          Reject & Request Resubmission
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <AlertCircle size={16} className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Review Guidelines:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Compare before and after images carefully</li>
                          <li>Ensure the area is properly cleaned</li>
                          <li>Verify the proof image is from the correct location</li>
                          <li>Approve only if the cleanup meets standards</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eco Store Product Modal */}
      {ecoStoreModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {ecoStoreModal.isEditing ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => setEcoStoreModal({ isOpen: false, product: null, isEditing: false })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter product description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Point Cost *</label>
                    <input
                      type="number"
                      value={productForm.point_cost}
                      onChange={(e) => setProductForm(prev => ({ ...prev, point_cost: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="tools">Tools</option>
                    <option value="dustbins">Dustbins</option>
                    <option value="compost">Compost</option>
                    <option value="plants">Plants</option>
                    <option value="vouchers">Vouchers</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL *</label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {productForm.image_url && (
                    <img
                      src={productForm.image_url}
                      alt="Preview"
                      className="mt-3 w-full h-32 object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEcoStoreModal({ isOpen: false, product: null, isEditing: false })}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEcoProduct}
                    disabled={savingProduct || !productForm.name.trim() || !productForm.description.trim() || !productForm.image_url.trim()}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {savingProduct ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" />
                        {ecoStoreModal.isEditing ? 'Update Product' : 'Add Product'}
                      </>
                    )}
                  </button>
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