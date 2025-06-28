import { supabase } from './supabase';
import { createNotification, NotificationTemplates } from './notifications';

export interface RedemptionItem {
  id: string;
  name: string;
  description: string;
  point_cost: number;
  quantity: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

export interface RedemptionRequest {
  itemId: string;
  quantity: number;
  deliveryAddress?: string;
}

export interface RedemptionResult {
  success: boolean;
  orderId?: string;
  message: string;
  error?: string;
  orderDetails?: {
    itemName: string;
    quantity: number;
    totalPointsSpent: number;
    deliveryAddress: string;
    orderStatus: string;
    redemptionDate: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  eco_points: number;
  address?: string;
  phone?: string;
}

/**
 * Validates if an address is complete and valid
 */
const validateDeliveryAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: 'Delivery address is required' };
  }

  const trimmedAddress = address.trim();
  
  // Check minimum length
  if (trimmedAddress.length < 10) {
    return { isValid: false, error: 'Address must be at least 10 characters long' };
  }

  // Check for basic address components (at least 2 words)
  const words = trimmedAddress.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 3) {
    return { isValid: false, error: 'Please provide a complete address with street, area, and city' };
  }

  // Check for common address patterns (numbers, letters, basic punctuation)
  const addressPattern = /^[a-zA-Z0-9\s,.-]+$/;
  if (!addressPattern.test(trimmedAddress)) {
    return { isValid: false, error: 'Address contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Sends order confirmation email (mock implementation)
 * In a real application, this would integrate with an email service
 */
const sendOrderConfirmationEmail = async (
  userEmail: string,
  userName: string,
  orderDetails: any
): Promise<boolean> => {
  try {
    // Mock email sending - in production, integrate with SendGrid, AWS SES, etc.
    console.log('📧 Sending order confirmation email to:', userEmail);
    console.log('Order details:', orderDetails);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production, you would:
    // 1. Use an email service provider
    // 2. Send HTML formatted email with order details
    // 3. Include order tracking information
    // 4. Handle email delivery failures
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    return false;
  }
};

/**
 * Main function to process item redemption
 */
export const processItemRedemption = async (
  userId: string,
  redemptionRequest: RedemptionRequest
): Promise<RedemptionResult> => {
  try {
    console.log('🛒 Processing redemption for user:', userId, 'item:', redemptionRequest.itemId);

    // 1. Validate input parameters
    if (!userId || !redemptionRequest.itemId) {
      return {
        success: false,
        message: 'Invalid request parameters',
        error: 'User ID and Item ID are required'
      };
    }

    if (redemptionRequest.quantity <= 0) {
      return {
        success: false,
        message: 'Invalid quantity',
        error: 'Quantity must be greater than 0'
      };
    }

    // 2. Fetch user profile and validate points
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, eco_points, address, phone')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('❌ Error fetching user profile:', userError);
      return {
        success: false,
        message: 'User not found',
        error: 'Unable to retrieve user information'
      };
    }

    // 3. Fetch item details and validate availability
    const { data: item, error: itemError } = await supabase
      .from('eco_store_items')
      .select('*')
      .eq('id', redemptionRequest.itemId)
      .eq('is_active', true)
      .single();

    if (itemError || !item) {
      console.error('❌ Error fetching item:', itemError);
      return {
        success: false,
        message: 'Item not found',
        error: 'The requested item is not available'
      };
    }

    // 4. Check item availability in inventory
    if (item.quantity < redemptionRequest.quantity) {
      return {
        success: false,
        message: 'Insufficient inventory',
        error: `Only ${item.quantity} items available, but ${redemptionRequest.quantity} requested`
      };
    }

    // 5. Calculate total points required
    const totalPointsRequired = item.point_cost * redemptionRequest.quantity;

    // 6. Validate user has sufficient points
    if (userProfile.eco_points < totalPointsRequired) {
      return {
        success: false,
        message: 'Insufficient eco-points',
        error: `You need ${totalPointsRequired} eco-points but only have ${userProfile.eco_points}`
      };
    }

    // 7. Determine delivery address
    let deliveryAddress = redemptionRequest.deliveryAddress || userProfile.address;
    
    if (!deliveryAddress) {
      return {
        success: false,
        message: 'Delivery address required',
        error: 'Please provide a delivery address or update your profile with a default address'
      };
    }

    // 8. Validate delivery address
    const addressValidation = validateDeliveryAddress(deliveryAddress);
    if (!addressValidation.isValid) {
      return {
        success: false,
        message: 'Invalid delivery address',
        error: addressValidation.error
      };
    }

    // 9. Start database transaction for order creation
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        user_id: userId,
        item_id: redemptionRequest.itemId,
        quantity: redemptionRequest.quantity,
        total_points_spent: totalPointsRequired,
        status: 'pending',
        delivery_address: deliveryAddress
      })
      .select()
      .single();

    if (redemptionError || !redemption) {
      console.error('❌ Error creating redemption record:', redemptionError);
      return {
        success: false,
        message: 'Failed to create order',
        error: 'Unable to process your redemption request'
      };
    }

    // 10. Deduct points from user's balance
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({
        eco_points: userProfile.eco_points - totalPointsRequired,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (pointsError) {
      console.error('❌ Error deducting points:', pointsError);
      
      // Rollback: Delete the redemption record
      await supabase
        .from('redemptions')
        .delete()
        .eq('id', redemption.id);

      return {
        success: false,
        message: 'Failed to process payment',
        error: 'Unable to deduct eco-points from your account'
      };
    }

    // 11. Update inventory levels
    const { error: inventoryError } = await supabase
      .from('eco_store_items')
      .update({
        quantity: item.quantity - redemptionRequest.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', redemptionRequest.itemId);

    if (inventoryError) {
      console.error('❌ Error updating inventory:', inventoryError);
      
      // Rollback: Restore user points and delete redemption
      await supabase
        .from('profiles')
        .update({
          eco_points: userProfile.eco_points,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      await supabase
        .from('redemptions')
        .delete()
        .eq('id', redemption.id);

      return {
        success: false,
        message: 'Inventory update failed',
        error: 'Unable to update item inventory'
      };
    }

    // 12. Create reward transaction record (negative points for redemption)
    const { error: transactionError } = await supabase
      .from('reward_transactions')
      .insert({
        user_id: userId,
        report_id: null, // No associated report for redemptions
        points: -totalPointsRequired // Negative points for spending
      });

    if (transactionError) {
      console.error('⚠️ Warning: Failed to create transaction record:', transactionError);
      // Don't rollback for this - the redemption is still valid
    }

    // 13. Send order confirmation email
    if (userProfile.email) {
      const emailSent = await sendOrderConfirmationEmail(
        userProfile.email,
        userProfile.name,
        {
          orderId: redemption.id,
          itemName: item.name,
          quantity: redemptionRequest.quantity,
          totalPointsSpent: totalPointsRequired,
          deliveryAddress: deliveryAddress,
          redemptionDate: new Date().toISOString()
        }
      );

      if (!emailSent) {
        console.warn('⚠️ Warning: Failed to send confirmation email');
      }
    }

    // 14. Create in-app notification
    try {
      const notificationTemplate = NotificationTemplates.redemptionConfirmed(
        item.name,
        totalPointsRequired
      );
      
      await createNotification(
        userId,
        notificationTemplate.title,
        notificationTemplate.message,
        notificationTemplate.type
      );
    } catch (notificationError) {
      console.error('⚠️ Warning: Failed to create notification:', notificationError);
      // Don't fail the redemption for notification errors
    }

    // 15. Return success response with order details
    const orderDetails = {
      itemName: item.name,
      quantity: redemptionRequest.quantity,
      totalPointsSpent: totalPointsRequired,
      deliveryAddress: deliveryAddress,
      orderStatus: 'pending',
      redemptionDate: new Date(redemption.created_at).toISOString()
    };

    console.log('✅ Redemption processed successfully:', redemption.id);

    return {
      success: true,
      orderId: redemption.id,
      message: `Successfully redeemed ${redemptionRequest.quantity}x ${item.name}! Your order is being processed.`,
      orderDetails
    };

  } catch (error) {
    console.error('❌ Unexpected error in processItemRedemption:', error);
    return {
      success: false,
      message: 'Unexpected error occurred',
      error: 'Please try again later or contact support if the problem persists'
    };
  }
};

/**
 * Get user's redemption history
 */
export const getUserRedemptions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        eco_store_items (
          name,
          description,
          image_url,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching redemptions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserRedemptions:', error);
    return [];
  }
};

/**
 * Check if user can redeem an item (validation only, no processing)
 */
export const validateRedemption = async (
  userId: string,
  itemId: string,
  quantity: number
): Promise<{ canRedeem: boolean; reason?: string; requiredPoints?: number }> => {
  try {
    // Fetch user and item data
    const [userResult, itemResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('eco_points, address')
        .eq('id', userId)
        .single(),
      supabase
        .from('eco_store_items')
        .select('point_cost, quantity, is_active')
        .eq('id', itemId)
        .single()
    ]);

    if (userResult.error || !userResult.data) {
      return { canRedeem: false, reason: 'User not found' };
    }

    if (itemResult.error || !itemResult.data) {
      return { canRedeem: false, reason: 'Item not found' };
    }

    const user = userResult.data;
    const item = itemResult.data;

    if (!item.is_active) {
      return { canRedeem: false, reason: 'Item is not available' };
    }

    if (item.quantity < quantity) {
      return { canRedeem: false, reason: `Only ${item.quantity} items in stock` };
    }

    const requiredPoints = item.point_cost * quantity;
    if (user.eco_points < requiredPoints) {
      return { 
        canRedeem: false, 
        reason: `Insufficient eco-points (need ${requiredPoints}, have ${user.eco_points})`,
        requiredPoints
      };
    }

    if (!user.address) {
      return { canRedeem: false, reason: 'Delivery address required' };
    }

    return { canRedeem: true, requiredPoints };

  } catch (error) {
    console.error('❌ Error in validateRedemption:', error);
    return { canRedeem: false, reason: 'Validation error' };
  }
};

/**
 * Get available items for redemption
 */
export const getAvailableItems = async () => {
  try {
    const { data, error } = await supabase
      .from('eco_store_items')
      .select('*')
      .eq('is_active', true)
      .gt('quantity', 0)
      .order('point_cost', { ascending: true });

    if (error) {
      console.error('❌ Error fetching available items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getAvailableItems:', error);
    return [];
  }
};