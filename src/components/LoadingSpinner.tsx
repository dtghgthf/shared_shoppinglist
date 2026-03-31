'use client';

import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Size of the spinner: 'sm', 'md', or 'lg'
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Display mode: 'inline' for use within text/forms, 'fullpage' for page overlay
   * @default 'inline'
   */
  mode?: 'inline' | 'fullpage';
  
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  
  /**
   * Custom CSS class name
   */
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  mode = 'inline',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinner = (
    <div className={`relative ${sizeClasses[size]} inline-block`}>
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spinner-ring {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <svg
        className="spinner-ring"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.2"
        />
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0110 10h-2a8 8 0 00-8-8V2z"
        />
      </svg>
    </div>
  );

  if (mode === 'fullpage') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-950 p-8 rounded-lg shadow-lg">
          <div style={{ color: 'var(--accent)' }}>
            {spinner}
          </div>
          {text && (
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div style={{ color: 'var(--accent)' }}>
        {spinner}
      </div>
      {text && (
        <span
          className="text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
