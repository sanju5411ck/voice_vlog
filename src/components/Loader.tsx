import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export default function Loader({ size = 'medium', color = '#4F46E5', text }: LoaderProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 'h-16';
      case 'large':
        return 'h-32';
      default:
        return 'h-24';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`flex items-center justify-center space-x-1 ${getSize()}`}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full transform origin-bottom animate-soundwave"
            style={{
              height: '100%',
              animation: `soundwave 1s ease-in-out infinite ${i * 0.1}s`,
              backgroundColor: color
            }}
          />
        ))}
      </div>
      {text && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
} 