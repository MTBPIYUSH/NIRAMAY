import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Award, 
  MapPin, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Loader,
  Plus,
  Minus,
  CreditCard,
  Truck,
  X
} from 'lucide-react';
import { Profile } from '../lib/supabase';
import { 
  processItemRedemption, 
  validateRedemption, 
  getAvailableItems,
  getUserRedemptions,
  RedemptionItem,
  RedemptionRequest,
  RedemptionResult
} from '../lib/redemptionService';

interface EcoStoreRedemptionProps {
  user: Profile;
  onPointsUpdate: (newPoints: number) => void;
}

interface CartItem extends RedemptionItem {
  cartQuantity: number;
}

interface RedemptionModal {
  isOpen: boolean;
  item: RedemptionItem | null;
  quantity: number;
}

export const EcoStoreRedemption: React.FC<EcoStoreRedemptionProps> = ({ 
  user, 
  onPointsUpdate 
}) => {
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [redemptionModal, setRedemptionModal] = useState<RedemptionModal>({
    isOpen: false,
    item: null,
    quantity: 1
  });
  const [deliveryAddress, setDeliveryAddress] = useState(user.address || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'store' | 'cart' | 'orders'>('store');

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const [availableItems, redemptionHistory] = await Promise.all([
        getAvailableItems(),
        getUserRedemptions(user.id)
      ]);
      
      setItems(availableItems);
      setUserRedemptions(redemptionHistory);
    } catch (error) {
      console.error('Error loading store data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load store data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const openRedemptionModal = (item: RedemptionItem) => {
    setRedemptionModal({
      isOpen: true,
      item,
      quantity: 1
    });
  };

  const closeRedemptionModal = () => {
    setRedemptionModal({
      isOpen: false,
      item: null,
      quantity: 1
    });
  };

  const addToCart = (item: RedemptionItem, quantity: number) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, cartQuantity: cartItem.cartQuantity + quantity }
            : cartItem
        );
      } else {
        return [...prev, { ...item, cartQuantity: quantity }];
      }
    });
    
    setMessage({
      type: 'success',
      text: `Added ${quantity}x ${item.name} to cart`
    });
    
    closeRedemptionModal();
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, cartQuantity: newQuantity }
          : item
      )
    );
  };

  const getTotalCartPoints = () => {
    return cart.reduce((total, item) => total + (item.point_cost * item.cartQuantity), 0);
  };

  const processCartRedemption = async () => {
    if (cart.length === 0) {
      setMessage({
        type: 'error',
        text: 'Your cart is empty'
      });
      return;
    }

    if (!deliveryAddress.trim()) {
      setMessage({
        type: 'error',
        text: 'Please provide a delivery address'
      });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const results: RedemptionResult[] = [];
      
      // Process each item in cart
      for (const cartItem of cart) {
        const redemptionRequest: RedemptionRequest = {
          itemId: cartItem.id,
          quantity: cartItem.cartQuantity,
          deliveryAddress: deliveryAddress.trim()
        };

        const result = await processItemRedemption(user.id, redemptionRequest);
        results.push(result);

        if (!result.success) {
          // If any item fails, stop processing and show error
          setMessage({
            type: 'error',
            text: `Failed to redeem ${cartItem.name}: ${result.error}`
          });
          return;
        }
      }

      // All items processed successfully
      const totalPointsSpent = getTotalCartPoints();
      const newPointsBalance = user.eco_points! - totalPointsSpent;
      
      onPointsUpdate(newPointsBalance);
      setCart([]); // Clear cart
      
      setMessage({
        type: 'success',
        text: `Successfully redeemed ${cart.length} item(s)! Total: ${totalPointsSpent} eco-points spent.`
      });

      // Refresh data
      await loadStoreData();
      setActiveTab('orders');

    } catch (error) {
      console.error('Error processing cart redemption:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const canAffordCart = () => {
    return user.eco_points! >= getTotalCartPoints();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-green-500" />
        <span className="ml-3 text-gray-600">Loading eco store...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <ShoppingBag className="text-green-600 mr-3" size={32} />
          Eco Store
        </h2>
        <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg">
          <Award size={24} className="mr-3" />
          <div>
            <span className="font-bold text-lg">{user.eco_points || 0}</span>
            <span className="text-green-100 ml-2">Eco-Points</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-2xl shadow-lg border border-gray-100">
        {[
          { id: 'store', label: 'Store', icon: ShoppingBag, count: items.length },
          { id: 'cart', label: 'Cart', icon: Package, count: cart.length },
          { id: 'orders', label: 'My Orders', icon: Truck, count: userRedemptions.length }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'store' | 'cart' | 'orders')}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className="mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-green-100 text-green-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Store Tab */}
      {activeTab === 'store' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover rounded-2xl mb-4 shadow-md"
              />
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">{item.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-xl">
                  <Award size={18} className="mr-2" />
                  <span className="font-bold">{item.point_cost} Points</span>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {item.quantity} in stock
                </span>
              </div>
              
              <button
                onClick={() => openRedemptionModal(item)}
                disabled={item.quantity === 0 || (user.eco_points || 0) < item.point_cost}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
              >
                {item.quantity === 0 ? 'Out of Stock' : 
                 (user.eco_points || 0) < item.point_cost ? 'Insufficient Points' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cart Tab */}
      {activeTab === 'cart' && (
        <div className="space-y-6">
          {cart.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
              <Package size={64} className="text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-600 mb-4">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some eco-friendly items to get started!</p>
              <button
                onClick={() => setActiveTab('store')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Browse Store
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1">{item.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center text-green-600">
                          <Award size={16} className="mr-1" />
                          <span className="font-semibold">{item.point_cost} points each</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{item.cartQuantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                          disabled={item.cartQuantity >= item.quantity}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-800">
                          {item.point_cost * item.cartQuantity} pts
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <MapPin size={20} className="mr-2 text-blue-600" />
                  Delivery Address
                </h3>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your complete delivery address..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Cart Summary */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">{getTotalCartPoints()} eco-points</span>
                </div>
                
                <div className="flex justify-between items-center mb-6">
                  <span>Your Balance:</span>
                  <span className="font-semibold">{user.eco_points || 0} eco-points</span>
                </div>
                
                {!canAffordCart() && (
                  <div className="bg-red-500/20 border border-red-300 rounded-lg p-3 mb-4">
                    <div className="flex items-center text-red-100">
                      <AlertCircle size={16} className="mr-2" />
                      <span className="text-sm">
                        Insufficient eco-points. You need {getTotalCartPoints() - (user.eco_points || 0)} more points.
                      </span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={processCartRedemption}
                  disabled={processing || !canAffordCart() || !deliveryAddress.trim()}
                  className="w-full bg-white text-green-600 py-3 px-6 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} className="mr-2" />
                      Redeem Items
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {userRedemptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center">
              <Truck size={64} className="text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-600 mb-4">No orders yet</h3>
              <p className="text-gray-500 mb-6">Your redemption history will appear here.</p>
              <button
                onClick={() => setActiveTab('store')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userRedemptions.map(redemption => (
                <div key={redemption.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-4">
                    <img
                      src={redemption.eco_store_items.image_url}
                      alt={redemption.eco_store_items.name}
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">
                        {redemption.eco_store_items.name}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">
                        Quantity: {redemption.quantity} • {redemption.total_points_spent} eco-points
                      </p>
                      <p className="text-gray-500 text-xs">
                        Ordered: {new Date(redemption.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        redemption.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        redemption.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        redemption.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redemption Modal */}
      {redemptionModal.isOpen && redemptionModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Add to Cart</h3>
              <button
                onClick={closeRedemptionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <img
              src={redemptionModal.item.image_url}
              alt={redemptionModal.item.name}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
            
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              {redemptionModal.item.name}
            </h4>
            <p className="text-gray-600 mb-4">{redemptionModal.item.description}</p>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-green-600">
                <Award size={18} className="mr-2" />
                <span className="font-bold">{redemptionModal.item.point_cost} points each</span>
              </div>
              <span className="text-sm text-gray-500">
                {redemptionModal.item.quantity} available
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setRedemptionModal(prev => ({ 
                  ...prev, 
                  quantity: Math.max(1, prev.quantity - 1) 
                }))}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-bold w-16 text-center">{redemptionModal.quantity}</span>
              <button
                onClick={() => setRedemptionModal(prev => ({ 
                  ...prev, 
                  quantity: Math.min(redemptionModal.item!.quantity, prev.quantity + 1) 
                }))}
                disabled={redemptionModal.quantity >= redemptionModal.item.quantity}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <span className="text-lg font-semibold text-gray-800">
                Total: {redemptionModal.item.point_cost * redemptionModal.quantity} eco-points
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={closeRedemptionModal}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addToCart(redemptionModal.item!, redemptionModal.quantity)}
                disabled={(user.eco_points || 0) < (redemptionModal.item.point_cost * redemptionModal.quantity)}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};