import React from 'react';
import { cn } from '../../lib/utils';

export interface RoleImageProps {
  roleId: string;
  className?: string;
}

/**
 * Component that displays a role-specific image placeholder
 */
export const RoleImage: React.FC<RoleImageProps> = ({ roleId, className }) => {
  // Map of role IDs to placeholder image paths
  const roleImages: Record<string, string> = {
    'citizen': '/images/role_citizen_placeholder.jpg',
    'admin': '/images/role_admin_placeholder.jpg',
    'worker': '/images/role_worker_placeholder.png',
  };

  // Get the image path for the current role, or use a default
  const imagePath = roleImages[roleId] || '/images/role_default_placeholder.jpg';

  return (
    <div className={cn("relative w-full h-full rounded-2xl overflow-hidden", className)}>
      <img 
        src={imagePath} 
        alt={`${roleId} role visualization`}
        className="w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
    </div>
  );
};

export default RoleImage;