/**
 * Data Integrity Service for Niramay Platform
 * 
 * Ensures data consistency, validates relationships, and maintains referential integrity
 */

import { supabase } from './supabase';

export interface IntegrityCheckResult {
  table: string;
  issues: IntegrityIssue[];
  recordsChecked: number;
  issuesFound: number;
}

export interface IntegrityIssue {
  type: 'orphaned_record' | 'invalid_status' | 'missing_required_field' | 'invalid_points' | 'inconsistent_data';
  recordId: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFix: string;
}

/**
 * Comprehensive data integrity check
 */
export const runDataIntegrityCheck = async (): Promise<IntegrityCheckResult[]> => {
  console.log('🔍 Starting data integrity check...');
  
  const results: IntegrityCheckResult[] = [];
  
  try {
    // Check each table for integrity issues
    results.push(await checkProfilesIntegrity());
    results.push(await checkReportsIntegrity());
    results.push(await checkRewardTransactionsIntegrity());
    results.push(await checkRedemptionsIntegrity());
    results.push(await checkNotificationsIntegrity());
    results.push(await checkEcoStoreItemsIntegrity());
    
    // Cross-table relationship checks
    results.push(await checkCrossTableRelationships());
    
    console.log('✅ Data integrity check completed');
    return results;
    
  } catch (error) {
    console.error('❌ Error during data integrity check:', error);
    return [{
      table: 'system',
      issues: [{
        type: 'inconsistent_data',
        recordId: 'unknown',
        description: 'Failed to complete integrity check',
        severity: 'critical',
        suggestedFix: 'Check database connection and permissions'
      }],
      recordsChecked: 0,
      issuesFound: 1
    }];
  }
};

/**
 * Check profiles table integrity
 */
const checkProfilesIntegrity = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    
    recordsChecked = profiles?.length || 0;
    
    for (const profile of profiles || []) {
      // Check required fields
      if (!profile.name || profile.name.trim() === '') {
        issues.push({
          type: 'missing_required_field',
          recordId: profile.id,
          description: 'Profile missing required name field',
          severity: 'high',
          suggestedFix: 'Update profile with valid name'
        });
      }
      
      // Check valid role
      if (!['citizen', 'admin', 'subworker'].includes(profile.role)) {
        issues.push({
          type: 'invalid_status',
          recordId: profile.id,
          description: `Invalid role: ${profile.role}`,
          severity: 'critical',
          suggestedFix: 'Update role to valid value (citizen, admin, subworker)'
        });
      }
      
      // Check valid status for subworkers
      if (profile.role === 'subworker' && !['available', 'busy', 'offline'].includes(profile.status)) {
        issues.push({
          type: 'invalid_status',
          recordId: profile.id,
          description: `Invalid subworker status: ${profile.status}`,
          severity: 'medium',
          suggestedFix: 'Update status to valid value (available, busy, offline)'
        });
      }
      
      // Check eco_points is not negative
      if (profile.eco_points < 0) {
        issues.push({
          type: 'invalid_points',
          recordId: profile.id,
          description: `Negative eco_points: ${profile.eco_points}`,
          severity: 'high',
          suggestedFix: 'Reset eco_points to 0 or positive value'
        });
      }
      
      // Check for duplicate Aadhaar numbers
      if (profile.aadhar) {
        const { data: duplicates } = await supabase
          .from('profiles')
          .select('id')
          .eq('aadhar', profile.aadhar)
          .neq('id', profile.id);
        
        if (duplicates && duplicates.length > 0) {
          issues.push({
            type: 'inconsistent_data',
            recordId: profile.id,
            description: `Duplicate Aadhaar number: ${profile.aadhar}`,
            severity: 'critical',
            suggestedFix: 'Ensure Aadhaar numbers are unique across all profiles'
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking profiles integrity:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check profiles integrity',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'profiles',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Check reports table integrity
 */
const checkReportsIntegrity = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*');
    
    if (error) throw error;
    
    recordsChecked = reports?.length || 0;
    
    for (const report of reports || []) {
      // Check required fields
      if (!report.images || report.images.length === 0) {
        issues.push({
          type: 'missing_required_field',
          recordId: report.id,
          description: 'Report missing required images',
          severity: 'high',
          suggestedFix: 'Ensure all reports have at least one image'
        });
      }
      
      // Check valid status
      const validStatuses = ['submitted', 'assigned', 'in-progress', 'submitted_for_approval', 'approved', 'rejected', 'completed'];
      if (!validStatuses.includes(report.status)) {
        issues.push({
          type: 'invalid_status',
          recordId: report.id,
          description: `Invalid report status: ${report.status}`,
          severity: 'high',
          suggestedFix: 'Update status to valid value'
        });
      }
      
      // Check valid priority
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (report.priority_level && !validPriorities.includes(report.priority_level)) {
        issues.push({
          type: 'invalid_status',
          recordId: report.id,
          description: `Invalid priority level: ${report.priority_level}`,
          severity: 'medium',
          suggestedFix: 'Update priority to valid value (low, medium, high, urgent)'
        });
      }
      
      // Check eco_points consistency with priority
      const expectedPoints = {
        'low': 10,
        'medium': 20,
        'high': 30,
        'urgent': 40
      };
      
      if (report.priority_level && report.eco_points) {
        const expected = expectedPoints[report.priority_level as keyof typeof expectedPoints];
        if (report.eco_points !== expected) {
          issues.push({
            type: 'invalid_points',
            recordId: report.id,
            description: `Eco points (${report.eco_points}) don't match priority (${report.priority_level}, should be ${expected})`,
            severity: 'medium',
            suggestedFix: `Update eco_points to ${expected} for ${report.priority_level} priority`
          });
        }
      }
      
      // Check location coordinates are valid
      if (report.lat < -90 || report.lat > 90 || report.lng < -180 || report.lng > 180) {
        issues.push({
          type: 'inconsistent_data',
          recordId: report.id,
          description: `Invalid coordinates: lat=${report.lat}, lng=${report.lng}`,
          severity: 'high',
          suggestedFix: 'Update with valid latitude (-90 to 90) and longitude (-180 to 180)'
        });
      }
      
      // Check if assigned_to exists in profiles
      if (report.assigned_to) {
        const { data: assignedWorker } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', report.assigned_to)
          .single();
        
        if (!assignedWorker) {
          issues.push({
            type: 'orphaned_record',
            recordId: report.id,
            description: `Assigned to non-existent user: ${report.assigned_to}`,
            severity: 'high',
            suggestedFix: 'Remove assignment or assign to valid subworker'
          });
        } else if (assignedWorker.role !== 'subworker') {
          issues.push({
            type: 'inconsistent_data',
            recordId: report.id,
            description: `Assigned to non-subworker user (role: ${assignedWorker.role})`,
            severity: 'medium',
            suggestedFix: 'Assign only to users with subworker role'
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking reports integrity:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check reports integrity',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'reports',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Check reward transactions integrity
 */
const checkRewardTransactionsIntegrity = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    const { data: transactions, error } = await supabase
      .from('reward_transactions')
      .select('*');
    
    if (error) throw error;
    
    recordsChecked = transactions?.length || 0;
    
    for (const transaction of transactions || []) {
      // Check if user exists
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', transaction.user_id)
        .single();
      
      if (!user) {
        issues.push({
          type: 'orphaned_record',
          recordId: transaction.id,
          description: `Transaction for non-existent user: ${transaction.user_id}`,
          severity: 'high',
          suggestedFix: 'Remove orphaned transaction or restore user profile'
        });
      }
      
      // Check if report exists (if report_id is provided)
      if (transaction.report_id) {
        const { data: report } = await supabase
          .from('reports')
          .select('id')
          .eq('id', transaction.report_id)
          .single();
        
        if (!report) {
          issues.push({
            type: 'orphaned_record',
            recordId: transaction.id,
            description: `Transaction for non-existent report: ${transaction.report_id}`,
            severity: 'medium',
            suggestedFix: 'Remove report_id reference or restore report'
          });
        }
      }
      
      // Check points value is reasonable
      if (Math.abs(transaction.points) > 1000) {
        issues.push({
          type: 'invalid_points',
          recordId: transaction.id,
          description: `Unusually large point transaction: ${transaction.points}`,
          severity: 'medium',
          suggestedFix: 'Verify transaction amount is correct'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking reward transactions integrity:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check reward transactions integrity',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'reward_transactions',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Check redemptions integrity
 */
const checkRedemptionsIntegrity = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    const { data: redemptions, error } = await supabase
      .from('redemptions')
      .select('*');
    
    if (error) throw error;
    
    recordsChecked = redemptions?.length || 0;
    
    for (const redemption of redemptions || []) {
      // Check if user exists
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', redemption.user_id)
        .single();
      
      if (!user) {
        issues.push({
          type: 'orphaned_record',
          recordId: redemption.id,
          description: `Redemption for non-existent user: ${redemption.user_id}`,
          severity: 'high',
          suggestedFix: 'Remove orphaned redemption or restore user profile'
        });
      }
      
      // Check if item exists
      const { data: item } = await supabase
        .from('eco_store_items')
        .select('id, point_cost')
        .eq('id', redemption.item_id)
        .single();
      
      if (!item) {
        issues.push({
          type: 'orphaned_record',
          recordId: redemption.id,
          description: `Redemption for non-existent item: ${redemption.item_id}`,
          severity: 'high',
          suggestedFix: 'Remove orphaned redemption or restore store item'
        });
      } else {
        // Check if total points spent matches item cost * quantity
        const expectedTotal = item.point_cost * redemption.quantity;
        if (redemption.total_points_spent !== expectedTotal) {
          issues.push({
            type: 'invalid_points',
            recordId: redemption.id,
            description: `Points spent (${redemption.total_points_spent}) doesn't match expected (${expectedTotal})`,
            severity: 'high',
            suggestedFix: `Update total_points_spent to ${expectedTotal}`
          });
        }
      }
      
      // Check valid status
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(redemption.status)) {
        issues.push({
          type: 'invalid_status',
          recordId: redemption.id,
          description: `Invalid redemption status: ${redemption.status}`,
          severity: 'medium',
          suggestedFix: 'Update status to valid value'
        });
      }
      
      // Check quantity is positive
      if (redemption.quantity <= 0) {
        issues.push({
          type: 'inconsistent_data',
          recordId: redemption.id,
          description: `Invalid quantity: ${redemption.quantity}`,
          severity: 'high',
          suggestedFix: 'Update quantity to positive value'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking redemptions integrity:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check redemptions integrity',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'redemptions',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Check notifications integrity
 */
const checkNotificationsIntegrity = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*');
    
    if (error) throw error;
    
    recordsChecked = notifications?.length || 0;
    
    for (const notification of notifications || []) {
      // Check if user exists
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', notification.user_id)
        .single();
      
      if (!user) {
        issues.push({
          type: 'orphaned_record',
          recordId: notification.id,
          description: `Notification for non-existent user: ${notification.user_id}`,
          severity: 'medium',
          suggestedFix: 'Remove orphaned notification or restore user profile'
        });
      }
      
      // Check if related report exists (if provided)
      if (notification.related_report_id) {
        const { data: report } = await supabase
          .from('reports')
          .select('id')
          .eq('id', notification.related_report_id)
          .single();
        
        if (!report) {
          issues.push({
            type: 'orphaned_record',
            recordId: notification.id,
            description: `Notification for non-existent report: ${notification.related_report_id}`,
            severity: 'low',
            suggestedFix: 'Remove report reference or restore report'
          });
        }
      }
      
      // Check valid notification type
      const validTypes = ['info', 'success', 'warning', 'error', 'assignment', 'approval', 'rejection'];
      if (!validTypes.includes(notification.type)) {
        issues.push({
          type: 'invalid_status',
          recordId: notification.id,
          description: `Invalid notification type: ${notification.type}`,
          severity: 'low',
          suggestedFix: 'Update type to valid value'
        });
      }
      
      // Check required fields
      if (!notification.title || !notification.message) {
        issues.push({
          type: 'missing_required_field',
          recordId: notification.id,
          description: 'Notification missing title or message',
          severity: 'medium',
          suggestedFix: 'Add required title and message fields'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking notifications integrity:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check notifications integrity',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'notifications',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Check eco store items integrity
 */
const checkEcoStoreItemsIntegrity = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    const { data: items, error } = await supabase
      .from('eco_store_items')
      .select('*');
    
    if (error) throw error;
    
    recordsChecked = items?.length || 0;
    
    for (const item of items || []) {
      // Check required fields
      if (!item.name || item.name.trim() === '') {
        issues.push({
          type: 'missing_required_field',
          recordId: item.id,
          description: 'Store item missing name',
          severity: 'high',
          suggestedFix: 'Add valid name for store item'
        });
      }
      
      // Check valid category
      const validCategories = ['dustbins', 'compost', 'tools', 'plants', 'vouchers'];
      if (!validCategories.includes(item.category)) {
        issues.push({
          type: 'invalid_status',
          recordId: item.id,
          description: `Invalid category: ${item.category}`,
          severity: 'medium',
          suggestedFix: 'Update category to valid value'
        });
      }
      
      // Check point cost is positive
      if (item.point_cost <= 0) {
        issues.push({
          type: 'invalid_points',
          recordId: item.id,
          description: `Invalid point cost: ${item.point_cost}`,
          severity: 'high',
          suggestedFix: 'Update point_cost to positive value'
        });
      }
      
      // Check quantity is not negative
      if (item.quantity < 0) {
        issues.push({
          type: 'inconsistent_data',
          recordId: item.id,
          description: `Negative quantity: ${item.quantity}`,
          severity: 'medium',
          suggestedFix: 'Update quantity to 0 or positive value'
        });
      }
      
      // Check image URL is provided
      if (!item.image_url || item.image_url.trim() === '') {
        issues.push({
          type: 'missing_required_field',
          recordId: item.id,
          description: 'Store item missing image URL',
          severity: 'medium',
          suggestedFix: 'Add valid image URL for store item'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking eco store items integrity:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check eco store items integrity',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'eco_store_items',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Check cross-table relationships
 */
const checkCrossTableRelationships = async (): Promise<IntegrityCheckResult> => {
  const issues: IntegrityIssue[] = [];
  let recordsChecked = 0;
  
  try {
    // Check profile eco_points vs reward_transactions consistency
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, eco_points');
    
    for (const profile of profiles || []) {
      recordsChecked++;
      
      // Calculate total points from transactions
      const { data: transactions } = await supabase
        .from('reward_transactions')
        .select('points')
        .eq('user_id', profile.id);
      
      const calculatedPoints = (transactions || []).reduce((sum, t) => sum + t.points, 0);
      
      // Allow small discrepancies due to redemptions not tracked in reward_transactions
      if (Math.abs((profile.eco_points || 0) - calculatedPoints) > 100) {
        issues.push({
          type: 'inconsistent_data',
          recordId: profile.id,
          description: `Profile eco_points (${profile.eco_points}) doesn't match transaction total (${calculatedPoints})`,
          severity: 'medium',
          suggestedFix: 'Recalculate eco_points from transaction history'
        });
      }
    }
    
    // Check subworker current_task_id consistency
    const { data: subworkers } = await supabase
      .from('profiles')
      .select('id, current_task_id, status')
      .eq('role', 'subworker');
    
    for (const worker of subworkers || []) {
      recordsChecked++;
      
      if (worker.current_task_id) {
        // Check if task exists and is assigned to this worker
        const { data: task } = await supabase
          .from('reports')
          .select('id, assigned_to, status')
          .eq('id', worker.current_task_id)
          .single();
        
        if (!task) {
          issues.push({
            type: 'orphaned_record',
            recordId: worker.id,
            description: `Worker has non-existent current_task_id: ${worker.current_task_id}`,
            severity: 'medium',
            suggestedFix: 'Clear current_task_id or restore task'
          });
        } else if (task.assigned_to !== worker.id) {
          issues.push({
            type: 'inconsistent_data',
            recordId: worker.id,
            description: `Worker current_task_id points to task assigned to different worker`,
            severity: 'high',
            suggestedFix: 'Fix task assignment or clear current_task_id'
          });
        }
      }
      
      // Check status consistency with current_task_id
      if (worker.status === 'busy' && !worker.current_task_id) {
        issues.push({
          type: 'inconsistent_data',
          recordId: worker.id,
          description: 'Worker status is busy but has no current_task_id',
          severity: 'medium',
          suggestedFix: 'Update status to available or assign a task'
        });
      }
      
      if (worker.status === 'available' && worker.current_task_id) {
        issues.push({
          type: 'inconsistent_data',
          recordId: worker.id,
          description: 'Worker status is available but has current_task_id',
          severity: 'medium',
          suggestedFix: 'Update status to busy or clear current_task_id'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking cross-table relationships:', error);
    issues.push({
      type: 'inconsistent_data',
      recordId: 'unknown',
      description: 'Failed to check cross-table relationships',
      severity: 'critical',
      suggestedFix: 'Check database connection and table structure'
    });
  }
  
  return {
    table: 'cross_table_relationships',
    issues,
    recordsChecked,
    issuesFound: issues.length
  };
};

/**
 * Fix common data integrity issues automatically
 */
export const autoFixIntegrityIssues = async (results: IntegrityCheckResult[]) => {
  console.log('🔧 Starting automatic integrity issue fixes...');
  
  const fixResults = [];
  
  for (const result of results) {
    for (const issue of result.issues) {
      try {
        switch (issue.type) {
          case 'invalid_points':
            if (result.table === 'profiles' && issue.description.includes('Negative eco_points')) {
              await supabase
                .from('profiles')
                .update({ eco_points: 0 })
                .eq('id', issue.recordId);
              fixResults.push(`Fixed negative eco_points for profile ${issue.recordId}`);
            }
            break;
            
          case 'invalid_status':
            if (result.table === 'profiles' && issue.description.includes('Invalid subworker status')) {
              await supabase
                .from('profiles')
                .update({ status: 'available' })
                .eq('id', issue.recordId);
              fixResults.push(`Fixed invalid status for subworker ${issue.recordId}`);
            }
            break;
            
          case 'orphaned_record':
            if (result.table === 'notifications' && issue.description.includes('non-existent report')) {
              await supabase
                .from('notifications')
                .update({ related_report_id: null })
                .eq('id', issue.recordId);
              fixResults.push(`Cleared orphaned report reference in notification ${issue.recordId}`);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to fix issue ${issue.recordId}:`, error);
      }
    }
  }
  
  console.log('✅ Automatic fixes completed:', fixResults.length);
  return fixResults;
};