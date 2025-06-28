import React from 'react';
import { User, Shield, HardHat, Leaf } from 'lucide-react';

interface AuthSelectorProps {
  onRoleSelect: (role: 'citizen' | 'admin' | 'subworker') => void;
}

export const AuthSelector: React.FC<AuthSelectorProps> = ({ onRoleSelect }) => {
  const roles = [
    {
      id: 'citizen',
      title: 'Citizen',
      description: 'Report garbage and track cleanup progress',
      icon: User,
      color: 'from-green-400 to-emerald-600',
      features: ['Report Issues', 'Track Status', 'Earn Points', 'Eco Store']
    },
    {
      id: 'admin',
      title: 'Municipal Admin',
      description: 'Manage complaints and coordinate cleanup efforts',
      icon: Shield,
      color: 'from-blue-400 to-indigo-600',
      features: ['Manage Complaints', 'Assign Tasks', 'View Analytics', 'Monitor Workers']
    },
    {
      id: 'subworker',
      title: 'Field Worker',
      description: 'Receive and complete cleanup assignments',
      icon: HardHat,
      color: 'from-orange-400 to-red-600',
      features: ['Receive Tasks', 'Update Status', 'Complete Jobs', 'Track Performance']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Leaf className="text-green-600 mr-3" size={48} />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Niramay
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            AI-driven waste management platform for smarter, cleaner, and more sustainable urban living
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                onClick={() => onRoleSelect(role.id as 'citizen' | 'admin' | 'subworker')}
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
              >
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white" size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{role.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{role.description}</p>
                  
                  <div className="space-y-2">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${role.color} mr-3`}></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className={`mt-6 px-6 py-3 rounded-xl bg-gradient-to-r ${role.color} text-white text-center font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    Access Dashboard
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Demo Mode - Select any role to explore the platform
          </p>
        </div>
      </div>
    </div>
  );
};