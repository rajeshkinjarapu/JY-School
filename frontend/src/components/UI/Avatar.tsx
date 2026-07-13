import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'circle' | 'rectangular';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  className = '',
  variant = 'circle',
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const isRect = variant === 'rectangular';

  // Support 3:4 aspect ratio for rectangular portrait style
  const sizeClasses = isRect
    ? {
        sm: 'w-10 h-14 text-xs',
        md: 'w-14 h-20 text-sm',
        lg: 'w-24 h-32 text-lg font-semibold',
        xl: 'w-32 h-44 text-2xl font-bold',
      }
    : {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-lg font-semibold',
        xl: 'w-24 h-24 text-2xl font-bold',
      };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const fullSrc = src ? (src.startsWith('http') ? src : `${API_URL}${src}`) : undefined;

  const shapeClass = isRect ? 'rounded-2xl' : 'rounded-full';

  // Check if custom width/height classes are provided in className
  const hasCustomSize = className.includes('w-') || className.includes('h-');

  return (
    <div className={`relative overflow-hidden inline-block flex-shrink-0 ${shapeClass} ${hasCustomSize ? className : `${sizeClasses[size]} ${className}`}`}>
      {fullSrc && !hasError ? (
        <img
          src={fullSrc}
          alt={name}
          className={`w-full h-full object-cover ${shapeClass} border border-gray-200 dark:border-gray-800 shadow-sm`}
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-teal-500 text-white font-semibold shadow-sm ${shapeClass}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

export default Avatar;
