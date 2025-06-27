import { User, Complaint, SubWorker, EcoProduct, Analytics, LeaderboardEntry } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Arjun Sharma',
    email: 'arjun@example.com',
    role: 'citizen',
    points: 1250,
    location: 'Sector 14, Gurgaon'
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya@admin.gov.in',
    role: 'admin',
    ward: 'Ward 12',
    city: 'Gurgaon'
  },
  {
    id: '3',
    name: 'Ravi Kumar',
    email: 'ravi@worker.gov.in',
    role: 'subworker',
    location: 'Sector 14, Gurgaon'
  }
];

export const mockComplaints: Complaint[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Arjun Sharma',
    title: 'Overflowing Dustbin',
    description: 'The dustbin near the park is completely overflowing with garbage spilling onto the road.',
    imageUrl: 'https://images.pexels.com/photos/2768961/pexels-photo-2768961.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: {
      lat: 28.4595,
      lng: 77.0266,
      address: 'Sector 14, Gurgaon, Haryana'
    },
    status: 'assigned',
    priority: 'high',
    assignedTo: '3',
    assignedWorkerName: 'Ravi Kumar',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    pointsAwarded: 50
  },
  {
    id: '2',
    userId: '1',
    userName: 'Arjun Sharma',
    title: 'Plastic Waste Accumulation',
    description: 'Large amount of plastic waste has accumulated near the bus stop.',
    imageUrl: 'https://images.pexels.com/photos/2850094/pexels-photo-2850094.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: {
      lat: 28.4601,
      lng: 77.0285,
      address: 'Bus Stop, Sector 14, Gurgaon'
    },
    status: 'completed',
    priority: 'medium',
    assignedTo: '3',
    assignedWorkerName: 'Ravi Kumar',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    pointsAwarded: 75
  },
  {
    id: '3',
    userId: '1',
    userName: 'Arjun Sharma',
    title: 'Construction Debris',
    description: 'Construction debris blocking the footpath near residential area.',
    imageUrl: 'https://images.pexels.com/photos/3847569/pexels-photo-3847569.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: {
      lat: 28.4580,
      lng: 77.0245,
      address: 'Residential Complex, Sector 14, Gurgaon'
    },
    status: 'submitted',
    priority: 'critical',
    submittedAt: new Date(Date.now() - 30 * 60 * 1000)
  }
];

export const mockSubWorkers: SubWorker[] = [
  {
    id: '3',
    name: 'Ravi Kumar',
    email: 'ravi@worker.gov.in',
    phone: '+91 98765 43210',
    status: 'busy',
    ward: 'Ward 12',
    completedTasks: 45,
    rating: 4.8,
    currentTask: '1'
  },
  {
    id: '4',
    name: 'Suresh Verma',
    email: 'suresh@worker.gov.in',
    phone: '+91 87654 32109',
    status: 'available',
    ward: 'Ward 12',
    completedTasks: 38,
    rating: 4.6
  },
  {
    id: '5',
    name: 'Amit Singh',
    email: 'amit@worker.gov.in',
    phone: '+91 76543 21098',
    status: 'available',
    ward: 'Ward 12',
    completedTasks: 52,
    rating: 4.9
  }
];

export const mockEcoProducts: EcoProduct[] = [
  {
    id: '1',
    name: 'Smart Dustbin',
    description: 'IoT-enabled dustbin with overflow sensors',
    points: 500,
    image: 'https://images.pexels.com/photos/3735187/pexels-photo-3735187.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dustbins',
    stock: 15
  },
  {
    id: '2',
    name: 'Organic Compost Kit',
    description: 'Complete kit for home composting',
    points: 300,
    image: 'https://images.pexels.com/photos/1444321/pexels-photo-1444321.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'compost',
    stock: 25
  },
  {
    id: '3',
    name: 'Recycling Tools Set',
    description: 'Professional tools for waste segregation',
    points: 400,
    image: 'https://images.pexels.com/photos/3735196/pexels-photo-3735196.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'tools',
    stock: 12
  },
  {
    id: '4',
    name: 'Air Purifying Plants',
    description: 'Set of 5 air purifying indoor plants',
    points: 200,
    image: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'plants',
    stock: 30
  },
  {
    id: '5',
    name: 'Eco-Friendly Bags',
    description: 'Reusable jute bags for shopping',
    points: 150,
    image: 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'tools',
    stock: 50
  },
  {
    id: '6',
    name: 'Solar LED Lights',
    description: 'Solar-powered LED lights for gardens',
    points: 350,
    image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'tools',
    stock: 20
  }
];

export const mockAnalytics: Analytics = {
  totalComplaints: 1247,
  resolvedComplaints: 1089,
  activeWorkers: 23,
  averageResolutionTime: 4.2,
  cleanlinessIndex: 87.3,
  monthlyTrends: [
    { month: 'Jan', complaints: 98, resolved: 85 },
    { month: 'Feb', complaints: 112, resolved: 98 },
    { month: 'Mar', complaints: 125, resolved: 115 },
    { month: 'Apr', complaints: 134, resolved: 128 },
    { month: 'May', complaints: 145, resolved: 138 },
    { month: 'Jun', complaints: 158, resolved: 151 }
  ]
};

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'Arjun Sharma',
    points: 1250,
    rank: 4,
    city: 'Gurgaon',
    reportsCount: 12
  },
  {
    id: '2',
    name: 'Priya Singh',
    points: 1850,
    rank: 1,
    city: 'Gurgaon',
    reportsCount: 18
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    points: 1650,
    rank: 2,
    city: 'Gurgaon',
    reportsCount: 15
  },
  {
    id: '4',
    name: 'Anita Verma',
    points: 1450,
    rank: 3,
    city: 'Gurgaon',
    reportsCount: 14
  },
  {
    id: '5',
    name: 'Vikram Joshi',
    points: 1150,
    rank: 5,
    city: 'Gurgaon',
    reportsCount: 11
  }
];