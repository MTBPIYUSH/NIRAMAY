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
