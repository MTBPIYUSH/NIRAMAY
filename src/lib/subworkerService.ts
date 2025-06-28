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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'subworker')
    .order('name');

  if (error) {
    console.error('Error fetching subworkers:', error);
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
};

/**
 * Subscribe to subworker changes in real-time
 */
export const subscribeToSubWorkers = (
  callback: (workers: SubWorkerProfile[]) => void,
  onError?: (error: Error) => void
) => {
  const subscription = supabase
    .channel('subworkers')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
      },
      async (payload) => {
        const record = payload.new || payload.old;
        if (record?.role === 'subworker') {
          try {
            const workers = await fetchSubWorkers();
            callback(workers);
          } catch (error) {
            onError?.(error as Error);
          }
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
    if (filters.status && filters.status !== 'all' && worker.status !== filters.status) {
      return false;
    }

    if (filters.ward) {
      const ward = filters.ward.toLowerCase();
      const inWard = worker.ward?.toLowerCase().includes(ward) || worker.assigned_ward?.toLowerCase().includes(ward);
      if (!inWard) return false;
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matches = worker.name.toLowerCase().includes(term) ||
        worker.ward?.toLowerCase().includes(term) ||
        worker.assigned_ward?.toLowerCase().includes(term) ||
        worker.phone?.includes(filters.searchTerm);

      if (!matches) return false;
    }

    return true;
  });
};

/**
 * Sort subworkers
 */
export const sortSubWorkers = (
  workers: SubWorkerProfile[],
  sortBy: 'availability' | 'name' | 'performance' | 'ward' = 'availability'
): SubWorkerProfile[] => {
  return [...workers].sort((a, b) => {
    switch (sortBy) {
      case 'availability':
        const order = { available: 0, busy: 1, offline: 2 };
        return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'performance':
        return b.task_completion_count - a.task_completion_count;
      case 'ward':
        return (a.ward || a.assigned_ward || '').localeCompare(b.ward || b.assigned_ward || '');
      default:
        return 0;
    }
  });
};

/**
 * Subworker statistics
 */
export const getSubWorkerStats = (workers: SubWorkerProfile[]): SubWorkerStats => {
  const total = workers.length;
  const available = workers.filter(w => w.status === 'available').length;
  const busy = workers.filter(w => w.status === 'busy').length;
  const offline = workers.filter(w => w.status === 'offline').length;

  const taskSum = workers.reduce((sum, w) => sum + w.task_completion_count, 0);
  return {
    total,
    available,
    busy,
    offline,
    averageCompletionRate: total ? Math.round(taskSum / total) : 0
  };
};

/**
 * Assign a task to a subworker
 */
export const assignTaskToSubWorker = async (reportId: string, workerId: string) => {
  const { error: reportError } = await supabase
    .from('reports')
    .update({
      assigned_to: workerId,
      status: 'assigned',
      updated_at: new Date().toISOString()
    })
    .eq('id', reportId);

  if (reportError) throw reportError;

  const { error: workerError } = await supabase
    .from('profiles')
    .update({
      status: 'busy',
      current_task_id: reportId,
      updated_at: new Date().toISOString()
    })
    .eq('id', workerId);

  if (workerError) {
    // Rollback
    await supabase.from('reports').update({ assigned_to: null, status: 'submitted' }).eq('id', reportId);
    throw workerError;
  }
};

/**
 * Update worker status
 */
export const updateSubWorkerStatus = async (
  workerId: string,
  status: 'available' | 'busy' | 'offline'
) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status !== 'busy' && { current_task_id: null })
    })
    .eq('id', workerId);

  if (error) throw error;
};

/**
 * Get workers available in a ward
 */
export const getAvailableWorkersForWard = async (ward?: string): Promise<SubWorkerProfile[]> => {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'subworker')
    .eq('status', 'available');

  if (ward) {
    query = query.or(`ward.eq.${ward},assigned_ward.eq.${ward}`);
  }

  const { data, error } = await query.order('task_completion_count', { ascending: true });

  if (error) throw error;

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
};

/**
 * Validate assignment
 */
export const validateWorkerAssignment = (
  worker: SubWorkerProfile,
  reportWard?: string
): { isEligible: boolean; reason?: string } => {
  if (worker.status !== 'available') return { isEligible: false, reason: `Worker is ${worker.status}` };
  if (worker.current_task_id) return { isEligible: false, reason: 'Already has a task' };
  if (
    reportWard &&
    worker.ward &&
    worker.assigned_ward &&
    ![worker.ward, worker.assigned_ward].some(w => w?.toLowerCase().includes(reportWard.toLowerCase()))
  ) {
    return { isEligible: false, reason: 'Not in this ward' };
  }

  return { isEligible: true };
};
