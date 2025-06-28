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
  status: 'all' | 'available' | 'busy' | 'offline';
  searchTerm: string;
  ward: string;
}

export interface SubWorkerStats {
  total: number;
  available: number;
  busy: number;
  offline: number;
  averageCompletionRate: number;
}

export interface ValidationResult {
  isEligible: boolean;
  reason?: string;
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

export const subscribeToSubWorkers = (
  onUpdate: (workers: SubWorkerProfile[]) => void,
  onError: (error: any) => void
) => {
  console.log('Setting up real-time subscription for subworkers...');

  const subscription = supabase
    .channel('subworkers-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'role=eq.subworker'
      },
      async (payload) => {
        console.log('Real-time update received:', payload);
        
        try {
          // Fetch updated workers list
          const updatedWorkers = await fetchSubWorkers();
          onUpdate(updatedWorkers);
        } catch (error) {
          console.error('Error handling real-time update:', error);
          onError(error);
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to subworkers updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel subscription error');
        onError(new Error('Failed to subscribe to real-time updates'));
      }
    });

  return subscription;
};

export const filterSubWorkers = (
  subworkers: SubWorkerProfile[],
  filters: SubWorkerFilters
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

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesName = worker.name.toLowerCase().includes(searchLower);
      const matchesPhone = worker.phone?.toLowerCase().includes(searchLower);
      const matchesWard = worker.ward?.toLowerCase().includes(searchLower);
      const matchesAssignedWard = worker.assigned_ward?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesPhone && !matchesWard && !matchesAssignedWard) {
        return false;
      }
    }

    return true;
  });
};

export const sortSubWorkers = (
  subworkers: SubWorkerProfile[],
  sortBy: 'availability' | 'name' | 'performance' | 'ward',
  sortOrder: 'asc' | 'desc' = 'asc'
): SubWorkerProfile[] => {
  return [...subworkers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'availability':
        // Sort by status priority: available > busy > offline
        const statusPriority = { available: 3, busy: 2, offline: 1 };
        comparison = (statusPriority[a.status] || 0) - (statusPriority[b.status] || 0);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'performance':
        comparison = a.task_completion_count - b.task_completion_count;
        break;
      case 'ward':
        comparison = (a.assigned_ward || '').localeCompare(b.assigned_ward || '');
        break;
      default:
        return 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

export const getSubWorkerStats = (subworkers: SubWorkerProfile[]): SubWorkerStats => {
  const totalTasks = subworkers.reduce((sum, worker) => sum + worker.task_completion_count, 0);
  const averageCompletionRate = subworkers.length > 0 ? Math.round(totalTasks / subworkers.length) : 0;

  return {
    total: subworkers.length,
    available: subworkers.filter(w => w.status === 'available').length,
    busy: subworkers.filter(w => w.status === 'busy').length,
    offline: subworkers.filter(w => w.status === 'offline').length,
    averageCompletionRate
  };
};

export const validateWorkerAssignment = (
  worker: SubWorkerProfile,
  reportWard?: string
): ValidationResult => {
  // Check if worker is available
  if (worker.status !== 'available') {
    return {
      isEligible: false,
      reason: `Worker is ${worker.status}`
    };
  }

  // Check if worker already has a task assigned
  if (worker.current_task_id) {
    return {
      isEligible: false,
      reason: 'Already has task'
    };
  }

  // Check ward assignment if both worker and report have ward information
  if (worker.assigned_ward && reportWard && worker.assigned_ward !== reportWard) {
    return {
      isEligible: false,
      reason: `Wrong ward (${worker.assigned_ward})`
    };
  }

  return {
    isEligible: true
  };
};

export const updateSubWorkerStatus = async (
  workerId: string,
  newStatus: 'available' | 'busy' | 'offline'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', workerId)
      .eq('role', 'subworker');

    if (error) {
      console.error('Error updating subworker status:', error);
      return {
        success: false,
        error: 'Failed to update worker status'
      };
    }

    return {
      success: true
    };

  } catch (err) {
    console.error('Error in updateSubWorkerStatus:', err);
    return {
      success: false,
      error: 'Unexpected error occurred while updating status'
    };
  }
};

export const assignTaskToSubWorker = async (
  reportId: string,
  workerId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First validate the assignment by fetching current worker status
    const { data: worker, error: workerError } = await supabase
      .from('profiles')
      .select('status, assigned_ward, current_task_id')
      .eq('id', workerId)
      .eq('role', 'subworker')
      .single();

    if (workerError || !worker) {
      return {
        success: false,
        error: 'Worker not found or not a subworker'
      };
    }

    if (worker.status !== 'available') {
      return {
        success: false,
        error: `Worker is currently ${worker.status}`
      };
    }

    if (worker.current_task_id) {
      return {
        success: false,
        error: 'Worker already has a task assigned'
      };
    }

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
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status: 'busy',
        current_task_id: reportId,
        updated_at: new Date().toISOString()
      })
      .eq('id', workerId);

    if (profileError) {
      console.error('Error updating worker profile:', profileError);
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