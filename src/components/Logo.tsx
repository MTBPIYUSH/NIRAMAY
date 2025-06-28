import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const textSizeClasses = {
  xs: 'text-lg',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl'
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  className = '',
  showText = true 
}) => {
  const logoClasses = `${sizeClasses[size]} object-contain ${className}`;
  const textClasses = `${textSizeClasses[size]} font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent`;

  if (variant === 'icon') {
    return (
      <img
        src="/logo-niramay.png"
        alt="Niramay - AI-Driven Waste Management Platform"
        className={logoClasses}
        loading="lazy"
      />
    );
  }

  if (variant === 'text') {
    return (
      <span className={textClasses}>
        Niramay
      </span>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src="/logo-niramay.png"
        alt="Niramay Logo"
        className={logoClasses}
        loading="lazy"
      />
      {showText && (
        <span className={textClasses}>
          Niramay
        </span>
      )}
    </div>
  );
};

export default Logo;