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

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface SubWorkerStats {
  total: number;
  available: number;
  busy: number;
  offline: number;
}

export const fetchSubWorkers = async (): Promise<SubWorkerProfile[]> => {
  try {
    console.log('Fetching subworker profiles...');

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        phone,
        email,
        role,
        status,
        ward,
        city,
        assigned_ward,
        current_task_id,
        task_completion_count,
        created_at,
        updated_at,
        eco_points
      `)
      .eq('role', 'subworker');

    if (error) {
      console.error('Error fetching subworkers:', error);
      throw error;
    }

    if (!data) return [];

    const subworkers: SubWorkerProfile[] = data.map((profile: any) => ({
      id: profile.id,
      name: profile.name || 'Unknown',
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
      eco_points: profile.eco_points || 0
    }));

    console.log('Subworkers loaded:', subworkers.length);
    return subworkers;

  } catch (err) {
    console.error('Error in fetchSubWorkers:', err);
    return [];
  }
};

export const filterSubWorkers = (
  subworkers: SubWorkerProfile[],
  filters: {
    status?: string;
    ward?: string;
    city?: string;
    searchTerm?: string;
  }
): SubWorkerProfile[] => {
  return subworkers.filter(worker => {
    // Status filter
    if (filters.status && filters.status !== 'all' && worker.status !== filters.status) {
      return false;
    }

    // Ward filter
    if (filters.ward && filters.ward !== 'all' && worker.assigned_ward !== filters.ward) {
      return false;
    }

    // City filter
    if (filters.city && filters.city !== 'all' && worker.city !== filters.city) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesName = worker.name.toLowerCase().includes(searchLower);
      const matchesPhone = worker.phone?.toLowerCase().includes(searchLower);
      const matchesWard = worker.ward?.toLowerCase().includes(searchLower);
      const matchesCity = worker.city?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesPhone && !matchesWard && !matchesCity) {
        return false;
      }
    }

    return true;
  });
};

export const sortSubWorkers = (
  subworkers: SubWorkerProfile[],
  sortBy: 'name' | 'status' | 'ward' | 'completions' | 'points',
  sortOrder: 'asc' | 'desc' = 'asc'
): SubWorkerProfile[] => {
  return [...subworkers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'ward':
        comparison = (a.assigned_ward || '').localeCompare(b.assigned_ward || '');
        break;
      case 'completions':
        comparison = a.task_completion_count - b.task_completion_count;
        break;
      case 'points':
        comparison = (a.eco_points || 0) - (b.eco_points || 0);
        break;
      default:
        return 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

export const getSubWorkerStats = (subworkers: SubWorkerProfile[]): SubWorkerStats => {
  return {
    total: subworkers.length,
    available: subworkers.filter(w => w.status === 'available').length,
    busy: subworkers.filter(w => w.status === 'busy').length,
    offline: subworkers.filter(w => w.status === 'offline').length
  };
};

export const validateWorkerAssignment = async (
  workerId: string,
  reportWard?: string
): Promise<ValidationResult> => {
  try {
    // Fetch the worker's profile
    const { data: worker, error } = await supabase
      .from('profiles')
      .select('status, assigned_ward, current_task_id')
      .eq('id', workerId)
      .eq('role', 'subworker')
      .single();

    if (error || !worker) {
      return {
        isValid: false,
        reason: 'Worker not found or not a subworker'
      };
    }

    // Check if worker is available
    if (worker.status !== 'available') {
      return {
        isValid: false,
        reason: `Worker is currently ${worker.status}`
      };
    }

    // Check if worker already has a task assigned
    if (worker.current_task_id) {
      return {
        isValid: false,
        reason: 'Worker already has a task assigned'
      };
    }

    // Check ward assignment if both worker and report have ward information
    if (worker.assigned_ward && reportWard && worker.assigned_ward !== reportWard) {
      return {
        isValid: false,
        reason: `Worker is assigned to ${worker.assigned_ward} ward, but report is from ${reportWard} ward`
      };
    }

    return {
      isValid: true
    };

  } catch (err) {
    console.error('Error validating worker assignment:', err);
    return {
      isValid: false,
      reason: 'Error validating worker assignment'
    };
  }
};

export const assignTaskToSubWorker = async (
  reportId: string,
  workerId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First validate the assignment
    const { data: report } = await supabase
      .from('reports')
      .select('address')
      .eq('id', reportId)
      .single();

    const validation = await validateWorkerAssignment(workerId, report?.address);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.reason
      };
    }

    // Start a transaction-like operation
    // Update the report to assign it to the worker
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
      return {
        success: false,
        error: 'Failed to assign report to worker'
      };
    }

    // Update the worker's profile
    const { error: workerError } = await supabase
      .from('profiles')
      .update({
        status: 'busy',
        current_task_id: reportId,
        updated_at: new Date().toISOString()
      })
      .eq('id', workerId);

    if (workerError) {
      console.error('Error updating worker profile:', workerError);
      // Try to rollback the report assignment
      await supabase
        .from('reports')
        .update({
          assigned_to: null,
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      return {
        success: false,
        error: 'Failed to update worker status'
      };
    }

    // Create a notification for the assigned worker
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: workerId,
        title: 'New Task Assigned',
        message: 'You have been assigned a new cleanup task. Please check your dashboard for details.',
        type: 'assignment',
        related_report_id: reportId,
        is_read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the assignment if notification creation fails
    }

    return {
      success: true
    };

  } catch (err) {
    console.error('Error assigning task to subworker:', err);
    return {
      success: false,
      error: 'Unexpected error occurred while assigning task'
    };
  }
};