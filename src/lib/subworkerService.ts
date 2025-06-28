import { supabase } from './supabase';

export interface SubWorkerProfile {
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
  eco_points?: number;
}

export interface SubWorkerFilters {
  status?: 'all' | 'available' | 'busy' | 'offline';
  ward?: string;
  searchTerm?: string;
}

export interface SubWorkerStats {
  total: number;
  available: number;
  busy: number;
  offline: number;
  averageCompletionRate: number;
}

/**
 * Fetch all subworker profiles from the database
 */
export const fetchSubWorkers = async (): Promise<SubWorkerProfile[]> => {
  try {
    console.log('🔍 Fetching subworker profiles...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'subworker')
      .order('name');

    if (error) {
      console.error('Error fetching subworkers:', error);
      throw error;
    }

    console.log('Raw subworkers data:', data);

    // Convert the data to match our interface
    const subworkers: SubWorkerProfile[] = (data || []).map(profile => ({
      id: profile.id,
      name: profile.name || 'Unknown Worker',
      phone: profile.phone,
      email: profile.email,
      status: profile.status || 'available',
      ward: profile.ward,
      city: profile.city,
      assigned_ward: profile.assigned_ward,
      current_task_id: profile.current_task_id,
      task_completion_count: profile.task_completion_count || 0,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      eco_points: profile.eco_points
    }));

    console.log('Processed subworkers:', subworkers.length, subworkers);
    return subworkers;

  } catch (error) {
    console.error('Error in fetchSubWorkers:', error);
    throw error;
  }
};

/**
 * Fetch subworkers with real-time updates
 */
export const subscribeToSubWorkers = (
  callback: (workers: SubWorkerProfile[]) => void,
  onError?: (error: Error) => void
) => {
  console.log('🔄 Setting up real-time subworker subscription...');
  
  const subscription = supabase
    .channel('subworkers')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'role=eq.subworker'
      },
      async (payload) => {
        console.log('Subworker data changed:', payload.eventType);
        try {
          const workers = await fetchSubWorkers();
          callback(workers);
        } catch (error) {
          console.error('Error handling real-time update:', error);
          onError?.(error as Error);
        }
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Filter subworkers based on criteria
 */
export const filterSubWorkers = (
  workers: SubWorkerProfile[],
  filters: SubWorkerFilters
): SubWorkerProfile[] => {
  return workers.filter(worker => {
    // Status filter
    if (filters.status && filters.status !== 'all' && worker.status !== filters.status) {
      return false;
    }

    // Ward filter
    if (filters.ward && 
        !worker.ward?.toLowerCase().includes(filters.ward.toLowerCase()) &&
        !worker.assigned_ward?.toLowerCase().includes(filters.ward.toLowerCase())) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesName = worker.name.toLowerCase().includes(searchLower);
      const matchesWard = worker.ward?.toLowerCase().includes(searchLower) || 
                         worker.assigned_ward?.toLowerCase().includes(searchLower);
      const matchesPhone = worker.phone?.includes(filters.searchTerm);
      
      if (!matchesName && !matchesWard && !matchesPhone) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort subworkers by availability and other criteria
 */
export const sortSubWorkers = (
  workers: SubWorkerProfile[],
  sortBy: 'availability' | 'name' | 'performance' | 'ward' = 'availability'
): SubWorkerProfile[] => {
  return [...workers].sort((a, b) => {
    switch (sortBy) {
      case 'availability':
        // Available first, then busy, then offline
        const statusOrder = { available: 0, busy: 1, offline: 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        // Then by name
        return a.name.localeCompare(b.name);
      
      case 'name':
        return a.name.localeCompare(b.name);
      
      case 'performance':
        return b.task_completion_count - a.task_completion_count;
      
      case 'ward':
        const aWard = a.ward || a.assigned_ward || '';
        const bWard = b.ward || b.assigned_ward || '';
        return aWard.localeCompare(bWard);
      
      default:
        return 0;
    }
  });
};

/**
 * Get subworker statistics
 */
export const getSubWorkerStats = (workers: SubWorkerProfile[]): SubWorkerStats => {
  const total = workers.length;
  const available = workers.filter(w => w.status === 'available').length;
  const busy = workers.filter(w => w.status === 'busy').length;
  const offline = workers.filter(w => w.status === 'offline').length;
  
  const totalTasks = workers.reduce((sum, w) => sum + w.task_completion_count, 0);
  const averageCompletionRate = total > 0 ? Math.round(totalTasks / total) : 0;

  return {
    total,
    available,
    busy,
    offline,
    averageCompletionRate
  };
};

/**
 * Assign a task to a subworker
 */
export const assignTaskToSubWorker = async (
  reportId: string,
  workerId: string
): Promise<void> => {
  try {
    console.log('Assigning task:', reportId, 'to worker:', workerId);

    // Start a transaction-like operation
    const { error: reportError } = await supabase
      .from('reports')
      .update({
        assigned_to: workerId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (reportError) {
      console.error('Error updating report:', reportError);
      throw reportError;
    }

    // Update worker status
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
      // Rollback report assignment
      await supabase
        .from('reports')
        .update({
          assigned_to: null,
          status: 'submitted'
        })
        .eq('id', reportId);
      
      throw workerError;
    }

    console.log('Task assigned successfully');

  } catch (error) {
    console.error('Error in assignTaskToSubWorker:', error);
    throw error;
  }
};

/**
 * Update subworker status
 */
export const updateSubWorkerStatus = async (
  workerId: string,
  status: 'available' | 'busy' | 'offline'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
        // Clear current task if going offline or available
        ...(status !== 'busy' && { current_task_id: null })
      })
      .eq('id', workerId);

    if (error) {
      console.error('Error updating worker status:', error);
      throw error;
    }

    console.log('Worker status updated:', workerId, status);

  } catch (error) {
    console.error('Error in updateSubWorkerStatus:', error);
    throw error;
  }
};

/**
 * Get available workers for a specific ward
 */
export const getAvailableWorkersForWard = async (ward?: string): Promise<SubWorkerProfile[]> => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'subworker')
      .eq('status', 'available');

    if (ward) {
      query = query.or(`ward.eq.${ward},assigned_ward.eq.${ward}`);
    }

    const { data, error } = await query.order('task_completion_count', { ascending: true });

    if (error) {
      console.error('Error fetching available workers:', error);
      throw error;
    }

    return (data || []).map(profile => ({
      id: profile.id,
      name: profile.name || 'Unknown Worker',
      phone: profile.phone,
      email: profile.email,
      status: profile.status || 'available',
      ward: profile.ward,
      city: profile.city,
      assigned_ward: profile.assigned_ward,
      current_task_id: profile.current_task_id,
      task_completion_count: profile.task_completion_count || 0,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      eco_points: profile.eco_points
    }));

  } catch (error) {
    console.error('Error in getAvailableWorkersForWard:', error);
    throw error;
  }
};

/**
 * Validate worker assignment eligibility
 */
export const validateWorkerAssignment = (
  worker: SubWorkerProfile,
  reportWard?: string
): { isEligible: boolean; reason?: string } => {
  if (worker.status !== 'available') {
    return {
      isEligible: false,
      reason: `Worker is currently ${worker.status}`
    };
  }

  if (worker.current_task_id) {
    return {
      isEligible: false,
      reason: 'Worker already has an active task'
    };
  }

  if (reportWard && worker.ward && worker.assigned_ward) {
    const workerWards = [worker.ward, worker.assigned_ward].filter(Boolean);
    if (!workerWards.some(ward => ward.toLowerCase().includes(reportWard.toLowerCase()))) {
      return {
        isEligible: false,
        reason: 'Worker is not assigned to this ward'
      };
    }
  }

  return { isEligible: true };
};

/**
 * Create sample subworker profiles for testing (admin only)
 */
export const createSampleSubWorkers = async (): Promise<void> => {
  try {
    console.log('🔧 Creating sample subworker profiles...');
    
    const sampleWorkers = [
      {
        name: 'Ravi Kumar',
        phone: '+91 98765 43210',
        status: 'busy',
        ward: 'Ward 12',
        city: 'Gurgaon',
        assigned_ward: 'Ward 12',
        task_completion_count: 45
      },
      {
        name: 'Suresh Verma',
        phone: '+91 87654 32109',
        status: 'available',
        ward: 'Ward 12',
        city: 'Gurgaon',
        assigned_ward: 'Ward 12',
        task_completion_count: 38
      },
      {
        name: 'Amit Singh',
        phone: '+91 76543 21098',
        status: 'available',
        ward: 'Ward 12',
        city: 'Gurgaon',
        assigned_ward: 'Ward 12',
        task_completion_count: 52
      }
    ];

    // Note: This would require actual auth user IDs
    // In a real implementation, you'd need to create auth users first
    console.log('Sample workers data prepared:', sampleWorkers);
    console.log('Note: Actual implementation requires creating auth users first');

  } catch (error) {
    console.error('Error creating sample subworkers:', error);
    throw error;
  }
};