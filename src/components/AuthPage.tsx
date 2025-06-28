import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  HardHat, 
  Mail, 
  Lock, 
  Phone, 
  CreditCard, 
  Leaf,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'admin' | 'subworker'>('citizen');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    aadhar: '',
    phone: ''
  });

  const { signUp, signIn } = useAuth();

  const roles = [
    {
      id: 'citizen',
      title: 'Citizen',
      description: 'Report waste and earn eco-points',
      icon: User,
      color: 'from-green-400 to-emerald-600',
      canSignUp: true
    },
    {
      id: 'admin',
      title: 'Municipal Admin',
      description: 'Manage complaints and workers',
      icon: Shield,
      color: 'from-blue-400 to-indigo-600',
      canSignUp: false
    },
    {
      id: 'subworker',
      title: 'Field Worker',
      description: 'Complete cleanup assignments',
      icon: HardHat,
      color: 'from-orange-400 to-red-600',
      canSignUp: false
    }
  ];

  const currentRole = roles.find(role => role.id === selectedRole)!;

  const validateAadhar = (aadhar: string) => {
    return /^\d{12}$/.test(aadhar);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validation
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (!isLogin) {
        // Sign up validation (only for citizens)
        if (selectedRole === 'citizen') {
          if (!formData.name.trim()) {
            throw new Error('Full name is required');
          }

          if (!validateAadhar(formData.aadhar)) {
            throw new Error('Please enter a valid 12-digit Aadhaar number');
          }

          if (!formData.phone || !validatePhone(formData.phone)) {
            throw new Error('Please enter a valid 10-digit mobile number');
          }

          if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }

          // Citizen sign up
          console.log('🔐 Starting citizen signup...');
          const { data, error } = await signUp(formData.email, formData.password, {
            name: formData.name,
            aadhar: formData.aadhar,
            phone: formData.phone
          });

          if (error) {
            console.error('❌ Signup error:', error);
            throw error;
          }

          console.log('✅ Signup successful:', data);
          setMessage({
            type: 'success',
            text: 'Account created successfully! Please check your email to verify your account.'
          });
          
          // Auto-switch to login after successful signup
          setTimeout(() => {
            setIsLogin(true);
            setMessage(null);
          }, 3000);
        }
      } else {
        // Sign in
        console.log('🔐 Starting signin...');
        const { data, error } = await signIn(formData.email, formData.password);

        if (error) {
          console.error('❌ Signin error:', error);
          throw error;
        }

        console.log('✅ Signin successful:', data);
        
        // Show success message briefly before redirect
        setMessage({
          type: 'success',
          text: 'Login successful! Redirecting to dashboard...'
        });

        // Call onAuthSuccess after a brief delay to show success message
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      }
    } catch (error: unknown) {
      console.error('❌ Form submission error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleRoleChange = (roleId: 'citizen' | 'admin' | 'subworker') => {
    setSelectedRole(roleId);
    // Reset to login for non-citizen roles
    if (roleId !== 'citizen') {
      setIsLogin(true);
    }
    // Clear form data when switching roles
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      aadhar: '',
      phone: ''
    });
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 text-white shadow-2xl">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <Leaf className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold">Niramay</h1>
            </div>
            
            <h2 className="text-3xl font-bold mb-6">
              Join India's Waste Management Revolution
            </h2>
            
            <p className="text-green-100 text-lg mb-8 leading-relaxed">
              Empowering citizens, municipal authorities, and field workers to build cleaner, 
              smarter cities through AI-driven waste management solutions.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle size={16} />
                </div>
                <span>Real-time waste reporting</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle size={16} />
                </div>
                <span>Eco-points reward system</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle size={16} />
                </div>
                <span>Supporting Swachh Bharat Mission</span>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">🇮🇳</div>
                <div className="text-sm text-green-100">Made in India with ❤️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4 lg:hidden">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                  <Leaf className="text-white" size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Niramay</h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isLogin ? 'Welcome Back' : 'Join Niramay'}
              </h2>
              <p className="text-gray-600">
                {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
              </p>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(role => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleChange(role.id as 'citizen' | 'admin' | 'subworker')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedRole === role.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={selectedRole === role.id ? 'text-green-600' : 'text-gray-400'} 
                      />
                      <div className={`text-xs mt-1 font-medium ${
                        selectedRole === role.id ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {role.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auth Toggle - Only for Citizens */}
            {currentRole.canSignUp && (
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    isLogin
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    !isLogin
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start ${
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
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sign Up Fields - Only for Citizens */}
              {!isLogin && selectedRole === 'citizen' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Number *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={formData.aadhar}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                          handleInputChange('aadhar', value);
                        }}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Enter 12-digit Aadhaar number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleInputChange('phone', value);
                        }}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Enter 10-digit mobile number"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="your.email@domain.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your password (minimum 8 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password - Only for Citizen Sign Up */}
              {!isLogin && selectedRole === 'citizen' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r ${currentRole.color} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            {!currentRole.canSignUp && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start text-yellow-800">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {selectedRole === 'admin' 
                      ? 'This portal is restricted to authorized municipal authorities. Login credentials are pre-assigned by the system administrators.'
                      : 'This login is exclusively for registered municipal workers. Your credentials have been provided by your supervisor.'
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <span className="mr-2">🇮🇳</span>
                Made in India | Powered by Niramay
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 via-orange-500 to-blue-500 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};