import React from 'react';

interface PortalSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'green' | 'white' | 'gold' | 'indigo';
  className?: string;
}

const PortalSpinner: React.FC<PortalSpinnerProps> = ({ 
  size = 'md', 
  color = 'green',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    green: 'border-brand-green/20 border-t-brand-green',
    white: 'border-white/20 border-t-white',
    gold: 'border-brand-gold/20 border-t-brand-gold',
    indigo: 'border-indigo-600/20 border-t-indigo-600',
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        rounded-full animate-spin 
        ${className}
      `}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default PortalSpinner;
