import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import RoleImage from './role-image';
import { Users, Shield, HardHat, Camera, TrendingUp, Award, Recycle, MapPin, CheckCircle, Star, Zap } from 'lucide-react';

export interface RoleFeature {
  icon: React.ElementType;
  title: string;
  desc: string;
}

export interface RoleData {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  features: RoleFeature[];
}

export interface RolesByCpuProps {
  className?: string;
  title?: string;
  subtitle?: string;
  initialRole?: string;
}

export const RolesByCpu: React.FC<RolesByCpuProps> = ({
  className,
  title = "Features by Role",
  subtitle = "Tailored experiences for every stakeholder in the waste management ecosystem",
  initialRole = "citizen"
}) => {
  const [activeRole, setActiveRole] = useState<string>(initialRole);

  // Define roles data with features
  const roles: RoleData[] = [
    {
      id: 'citizen',
      label: 'Citizens',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      features: [
        { icon: Camera, title: 'Live Garbage Reporting', desc: 'Capture and report waste instantly with location tracking' },
        { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor your complaint status in real-time' },
        { icon: Award, title: 'Earn Eco Points', desc: 'Get rewarded for contributing to cleaner cities' },
        { icon: Recycle, title: 'Eco Store', desc: 'Redeem points for sustainable products' }
      ]
    },
    {
      id: 'admin',
      label: 'Admins',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      features: [
        { icon: Shield, title: 'Multi-Admin System', desc: 'Manage complaints across different wards and cities' },
        { icon: Users, title: 'Worker Management', desc: 'Assign tasks and monitor field worker performance' },
        { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Track resolution rates and cleanliness metrics' },
        { icon: MapPin, title: 'Real-time Tracking', desc: 'Monitor live status of all cleanup operations' }
      ]
    },
    {
      id: 'worker',
      label: 'Workers',
      icon: HardHat,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      features: [
        { icon: HardHat, title: 'Task Notifications', desc: 'Receive cleanup assignments with precise locations' },
        { icon: CheckCircle, title: 'Status Updates', desc: 'Update availability and task completion status' },
        { icon: Star, title: 'Performance Tracking', desc: 'Build reputation through quality work' },
        { icon: Zap, title: 'Instant Rewards', desc: 'Trigger point distribution upon task completion' }
      ]
    }
  ];

  // Find the active role data
  const activeRoleData = roles.find(role => role.id === activeRole) || roles[0];

  return (
    <div className={cn("py-20", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {title.split(' ').map((word, i) => (
              <span key={i} className={i === title.split(' ').length - 1 ? "text-green-600" : ""}>
                {word}{' '}
              </span>
            ))}
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl">
            {roles.map(role => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={cn(
                    "flex items-center px-6 py-3 rounded-xl font-semibold transition-all",
                    activeRole === role.id
                      ? "bg-white shadow-lg " + role.color
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <Icon size={20} className="mr-2" />
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Images and Features */}
        <div className="grid md:grid-cols-12 gap-8 items-center">
          {/* Role Image - Left Side on larger screens */}
          <div className="md:col-span-5 lg:col-span-4 flex justify-center">
            <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-lg">
              <RoleImage 
                roleId={activeRoleData.id}
                className={activeRoleData.color}
              />
            </div>
          </div>

          {/* Features - Right Side on larger screens */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="grid md:grid-cols-2 gap-6">
              {activeRoleData.features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      activeRoleData.bgColor
                    )}>
                      <Icon className={activeRoleData.color} size={24} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-3">{feature.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};