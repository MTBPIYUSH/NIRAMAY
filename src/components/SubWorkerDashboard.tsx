import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, MapPin, Star, TrendingUp, Camera, Upload, X, AlertTriangle, Navigation, Map as MapIcon, Route } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Complaint, SubWorker } from '../types';
import { 
  initializeGoogleMaps, 
  createEmbeddedMap, 
  getCurrentLocation 
} from '../lib/googleMaps';

interface SubWorkerDashboardProps {
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
}

interface ReporterProfile {
  id: string;
  name: string;
  phone?: string;
}

interface ProofSubmissionModal {
  isOpen: boolean;
  report: Complaint | null;
}

interface TaskDetailModal {
  isOpen: boolean;
  report: Complaint | null;
}

export const SubWorkerDashboard: React.FC<SubWorkerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'completed'>('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [reporterProfiles, setReporterProfiles] = useState<Map<string, ReporterProfile>>(new Map());
  const [proofModal, setProofModal] = useState<ProofSubmissionModal>({
    isOpen: false,
    report: null
  });
  const [taskDetailModal, setTaskDetailModal] = useState<TaskDetailModal>({
    isOpen: false,
    report: null
  });
  const [proofImage, setProofImage] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [rejectionBanner, setRejectionBanner] = useState<string>('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const taskMapRef = useRef<HTMLDivElement>(null);
  const [currentMap, setCurrentMap] = useState<google.maps.Map | null>(null);

  // Mock worker data - in real app, fetch from database
  const currentWorker = {
    id: user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    status: 'available' as 'available' | 'busy',
    ward: user.ward || 'Ward 12',
    completedTasks: 45,
    rating: 4.8
  };

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
    fetchAssignedTasks();
    getCurrentLocationData();
  }, [user.id]);

  const getCurrentLocationData = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      // Use mock location for demo
      setCurrentLocation({
        lat: 28.4595 + Math.random() * 0.01,
        lng: 77.0266 + Math.random() * 0.01
      });
    }
  };

  const fetchAssignedTasks = async () => {
    setLoadingTasks(true);
    try {
      // Fetch reports assigned to this sub-worker
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching assigned tasks:', reportsError);
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
      const convertedComplaints: Complaint[] = (reportsData || []).map((report: DatabaseReport) => {
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
          status: report.status as 'submitted' | 'assigned' | 'in-progress' | 'completed' | 'submitted_for_approval',
          priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
          submittedAt: new Date(report.created_at),
          assignedTo: report.assigned_to,
          proofImage: report.proof_image,
          proofLocation: report.proof_lat && report.proof_lng ? {
            lat: report.proof_lat,
            lng: report.proof_lng,
            address: 'Proof location'
          } : undefined,
          rejectionComment: report.rejection_comment
        };
      });

      setComplaints(convertedComplaints);

      // Check for recently rejected tasks
      const rejectedTask = convertedComplaints.find(c => c.rejectionComment && c.status === 'assigned');
      if (rejectedTask) {
        setRejectionBanner(`Task was rejected: ${rejectedTask.rejectionComment}`);
        setTimeout(() => setRejectionBanner(''), 10000); // Hide after 10 seconds
      }

    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
    } finally {
      setLoadingTasks(false);
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

  const openTaskDetail = async (report: Complaint) => {
    setTaskDetailModal({ isOpen: true, report });
    
    // Initialize map when modal opens
    if (mapsLoaded && taskMapRef.current) {
      setTimeout(() => {
        const map = createEmbeddedMap(taskMapRef.current!, {
          lat: report.location.lat,
          lng: report.location.lng,
          address: report.location.address
        }, {
          zoom: 16,
          marker: true
        });
        setCurrentMap(map);

        // Add directions if current location is available
        if (currentLocation && window.google && window.google.maps) {
          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#4F46E5',
              strokeWeight: 4
            }
          });
          
          directionsRenderer.setMap(map);

          directionsService.route({
            origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            destination: new google.maps.LatLng(report.location.lat, report.location.lng),
            travelMode: google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
            }
          });
        }
      }, 100);
    }
  };

  const getDirectionsUrl = (report: Complaint) => {
    if (currentLocation) {
      return `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${report.location.lat},${report.location.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${report.location.lat},${report.location.lng}`;
  };

  const handleProofImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setProofImage(result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const openProofModal = (report: Complaint) => {
    setProofModal({ isOpen: true, report });
    setProofImage('');
    getCurrentLocationData();
  };

  const submitProofForApproval = async () => {
    if (!proofModal.report || !proofImage || !currentLocation) {
      alert('Please capture proof image and ensure location is available');
      return;
    }

    // Validate location is within 50m of original report
    const distance = calculateDistance(
      proofModal.report.location.lat,
      proofModal.report.location.lng,
      currentLocation.lat,
      currentLocation.lng
    );

    if (distance > 50) {
      alert(`You are ${Math.round(distance)}m away from the original location. Please move within 50m to submit proof.`);
      return;
    }

    setSubmittingProof(true);

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: 'submitted_for_approval',
          proof_image: proofImage,
          proof_lat: currentLocation.lat,
          proof_lng: currentLocation.lng,
          rejection_comment: null // Clear any previous rejection comment
        })
        .eq('id', proofModal.report.id);

      if (error) {
        console.error('Error submitting proof:', error);
        alert('Failed to submit proof. Please try again.');
        return;
      }

      // Update local state
      setComplaints(prev => prev.map(complaint =>
        complaint.id === proofModal.report!.id
          ? {
              ...complaint,
              status: 'submitted_for_approval',
              proofImage: proofImage,
              proofLocation: {
                lat: currentLocation.lat,
                lng: currentLocation.lng,
                address: 'Proof location'
              },
              rejectionComment: undefined
            }
          : complaint
      ));

      setProofModal({ isOpen: false, report: null });
      setProofImage('');
      alert('Proof submitted for approval successfully!');

    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof. Please try again.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const assignedTasks = complaints.filter(c => c.status === 'assigned');
  const completedTasks = complaints.filter(c => c.status === 'completed');
  const pendingApprovalTasks = complaints.filter(c => c.status === 'submitted_for_approval');

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

      {/* Rejection Banner */}
      {rejectionBanner && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="text-red-400 mr-3" size={20} />
            <div>
              <p className="text-red-800 font-medium">Task Rejection Notice</p>
              <p className="text-red-700 text-sm">{rejectionBanner}</p>
            </div>
            <button
              onClick={() => setRejectionBanner('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'tasks', label: `My Tasks ${assignedTasks.length > 0 ? `(${assignedTasks.length})` : ''}`, icon: Clock },
            { id: 'completed', label: 'Completed', icon: CheckCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'tasks' | 'completed')}
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
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingApprovalTasks.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Upload className="text-purple-600" size={24} />
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
                  <p className="text-white/90 mb-2">Reporter: {assignedTasks[0].userName}</p>
                  <div className="flex items-center text-white/80 mb-4">
                    <MapPin size={16} className="mr-2" />
                    {assignedTasks[0].location.address}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openTaskDetail(assignedTasks[0])}
                      className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <MapIcon size={16} className="mr-2" />
                      View on Map
                    </button>
                    <button
                      onClick={() => openProofModal(assignedTasks[0])}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center"
                    >
                      <Camera size={16} className="mr-2" />
                      Submit Proof
                    </button>
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
            <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
            
            {loadingTasks ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading tasks...</span>
              </div>
            ) : assignedTasks.length === 0 ? (
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
                      <div className="relative">
                        <img
                          src={task.imageUrl}
                          alt="Task"
                          className="w-full lg:w-64 h-48 object-cover rounded-xl"
                        />
                        {task.images && task.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs">
                            +{task.images.length - 1} more
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                            <div className="space-y-1">
                              <p className="text-gray-600">Reporter: <span className="font-medium">{task.userName}</span></p>
                              <p className="text-gray-600">Contact: <span className="font-medium">{task.userPhone}</span></p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600">{task.description}</p>
                        
                        <div className="flex items-center text-sm text-gray-500 bg-blue-50 p-3 rounded-xl">
                          <MapPin size={16} className="mr-2 text-blue-600" />
                          <span className="font-medium flex-1">{task.location.address}</span>
                          {currentLocation && (
                            <span className="text-xs text-blue-600 ml-2">
                              {Math.round(calculateDistance(
                                currentLocation.lat, 
                                currentLocation.lng, 
                                task.location.lat, 
                                task.location.lng
                              ))}m away
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Assigned: {task.submittedAt.toLocaleDateString()}
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => openTaskDetail(task)}
                              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
                            >
                              <Navigation size={16} className="mr-2" />
                              Navigate
                            </button>
                            <button
                              onClick={() => openProofModal(task)}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                              <Camera size={16} className="mr-2" />
                              Submit Proof
                            </button>
                          </div>
                        </div>

                        {task.rejectionComment && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start">
                              <AlertTriangle size={16} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-red-800 font-medium text-sm">Previous submission was rejected:</p>
                                <p className="text-red-700 text-sm mt-1">{task.rejectionComment}</p>
                              </div>
                            </div>
                          </div>
                        )}
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
              {completedTasks.concat(pendingApprovalTasks).map(task => (
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
                          <p className="text-gray-600">Reporter: {task.userName} ({task.userPhone})</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="mr-2" />
                        {task.location.address}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Submitted: {task.submittedAt.toLocaleDateString()}</span>
                        <div className="flex items-center text-green-600">
                          <CheckCircle size={14} className="mr-1" />
                          <span className="font-medium">
                            {task.status === 'completed' ? 'Approved & Completed' : 'Awaiting Approval'}
                          </span>
                        </div>
                      </div>

                      {task.proofImage && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Submitted Proof:</p>
                          <img
                            src={task.proofImage}
                            alt="Proof of completion"
                            className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal with Navigation */}
      {taskDetailModal.isOpen && taskDetailModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Task Navigation</h3>
              <button
                onClick={() => setTaskDetailModal({ isOpen: false, report: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Task Info */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Task Details</h4>
                  <img
                    src={taskDetailModal.report.imageUrl}
                    alt="Task"
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Reporter:</span> {taskDetailModal.report.userName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Contact:</span> {taskDetailModal.report.userPhone}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Assigned:</span> {taskDetailModal.report.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Location Details</h4>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center text-blue-700 mb-2">
                      <MapPin size={16} className="mr-2" />
                      <span className="text-sm font-medium">{taskDetailModal.report.location.address}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      {taskDetailModal.report.location.lat.toFixed(6)}, {taskDetailModal.report.location.lng.toFixed(6)}
                    </div>
                    {currentLocation && (
                      <div className="text-xs text-blue-600 mt-1">
                        Distance: {Math.round(calculateDistance(
                          currentLocation.lat, 
                          currentLocation.lng, 
                          taskDetailModal.report.location.lat, 
                          taskDetailModal.report.location.lng
                        ))}m from your location
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <a
                      href={getDirectionsUrl(taskDetailModal.report)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Route size={16} className="mr-2" />
                      Open in Google Maps
                    </a>
                    <button
                      onClick={() => {
                        setTaskDetailModal({ isOpen: false, report: null });
                        openProofModal(taskDetailModal.report!);
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                    >
                      <Camera size={16} className="mr-2" />
                      Submit Proof
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Map with Directions */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Navigation Map</h4>
                  {mapsLoaded ? (
                    <div 
                      ref={taskMapRef}
                      className="w-full h-96 rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapIcon size={48} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h5 className="font-semibold text-orange-800 mb-2">Navigation Instructions</h5>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Blue route shows the path to the task location</li>
                    <li>• Red marker indicates the exact waste location</li>
                    <li>• Use "Open in Google Maps" for turn-by-turn navigation</li>
                    <li>• Submit proof when you reach within 50m of the location</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Submission Modal */}
      {proofModal.isOpen && proofModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Submit Completion Proof</h3>
              <button
                onClick={() => setProofModal({ isOpen: false, report: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Original Report */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Original Report</h4>
                <div className="flex gap-4">
                  <img
                    src={proofModal.report.imageUrl}
                    alt="Original Report"
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Reporter:</span> {proofModal.report.userName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Location:</span> {proofModal.report.location.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Contact:</span> {proofModal.report.userPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proof Image Capture */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Capture Proof of Completion</h4>
                {proofImage ? (
                  <div className="relative">
                    <img
                      src={proofImage}
                      alt="Proof of completion"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setProofImage('')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors bg-gray-50 hover:bg-green-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofImageCapture}
                      className="hidden"
                    />
                    <Camera size={48} className="mb-4" />
                    <span className="text-lg font-medium">Take Photo</span>
                    <span className="text-sm">Capture proof of cleanup completion</span>
                  </label>
                )}
              </div>

              {/* Location Validation */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Location Validation</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  {currentLocation ? (
                    <div>
                      <div className="flex items-center text-blue-700 mb-2">
                        <MapPin size={16} className="mr-2" />
                        <span className="text-sm font-medium">Current Location Detected</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Distance from original report: {
                          calculateDistance(
                            proofModal.report.location.lat,
                            proofModal.report.location.lng,
                            currentLocation.lat,
                            currentLocation.lng
                          ).toFixed(0)
                        }m
                      </p>
                      {calculateDistance(
                        proofModal.report.location.lat,
                        proofModal.report.location.lng,
                        currentLocation.lat,
                        currentLocation.lng
                      ) > 50 && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠️ You must be within 50m of the original location to submit proof
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm">Getting your location...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setProofModal({ isOpen: false, report: null })}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitProofForApproval}
                  disabled={
                    !proofImage || 
                    !currentLocation || 
                    submittingProof ||
                    calculateDistance(
                      proofModal.report.location.lat,
                      proofModal.report.location.lng,
                      currentLocation?.lat || 0,
                      currentLocation?.lng || 0
                    ) > 50
                  }
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submittingProof ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit for Approval'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};