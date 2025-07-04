export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin' | 'subworker';
  eco_points?: number;
  location?: string;
  ward?: string;
  city?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  title: string;
  description: string;
  imageUrl: string;
  images?: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'submitted' | 'assigned' | 'in-progress' | 'completed' | 'submitted_for_approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedWorkerName?: string;
  submittedAt: Date;
  completedAt?: Date;
  ecoPoints?: number;
  proofImage?: string;
  proofLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  rejectionComment?: string;
  aiAnalysis?: {
    waste_type: string;
    severity: string;
    environmental_impact: string;
    cleanup_difficulty: string;
    reasoning: string;
  };
  ward?: string;
}

export interface SubWorker {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'busy';
  ward: string;
  completedTasks: number;
  rating: number;
  currentTask?: string;
}

export interface EcoProduct {
  id: string;
  name: string;
  description: string;
  eco_points: number;
  image: string;
  category: 'dustbins' | 'compost' | 'tools' | 'plants';
  stock: number;
}

export interface Analytics {
  totalComplaints: number;
  resolvedComplaints: number;
  activeWorkers: number;
  averageResolutionTime: number;
  cleanlinessIndex: number;
  monthlyTrends: {
    month: string;
    complaints: number;
    resolved: number;
  }[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  eco_points: number;
  rank: number;
  city: string;
  reportsCount: number;
}