import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'approval' | 'rejection';
  is_read: boolean;
  related_report_id?: string;
  created_at: string;
}

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  relatedReportId?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          related_report_id: relatedReportId
        }
      ]);

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Notification templates for common scenarios
export const NotificationTemplates = {
  taskAssigned: (reportId: string, location: string) => ({
    title: 'New Task Assigned',
    message: `You have been assigned a new cleanup task at ${location}. Please check your dashboard for details.`,
    type: 'assignment' as const
  }),

  taskApproved: (ecoPoints: number) => ({ // Changed from points to ecoPoints
    title: 'Task Approved!',
    message: `Great work! Your cleanup has been approved and you've earned ${ecoPoints} eco-points.`,
    type: 'success' as const
  }),

  taskRejected: (reason: string) => ({
    title: 'Task Needs Revision',
    message: `Your submission needs to be revised. Reason: ${reason}. Please resubmit with corrections.`,
    type: 'rejection' as const
  }),

  ecoPointsAwarded: (ecoPoints: number, totalEcoPoints: number) => ({ // Changed from pointsAwarded to ecoPointsAwarded
    title: 'Eco-Points Earned!',
    message: `You've earned ${ecoPoints} eco-points! Your total balance is now ${totalEcoPoints} eco-points.`,
    type: 'success' as const
  }),

  reportStatusUpdate: (status: string, location: string) => ({
    title: 'Report Status Updated',
    message: `Your report at ${location} has been updated to: ${status.replace('_', ' ')}.`,
    type: 'info' as const
  }),

  redemptionConfirmed: (itemName: string, ecoPointsSpent: number) => ({ // Changed from pointsSpent to ecoPointsSpent
    title: 'Redemption Confirmed',
    message: `Your redemption of ${itemName} has been confirmed. ${ecoPointsSpent} eco-points have been deducted from your account.`,
    type: 'success' as const
  })
};