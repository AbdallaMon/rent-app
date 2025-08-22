import React from 'react';

/**
 * مكون زر التحديث
 * مصمم لاستخدامه في صفحات الداشبورد
 */
const RefreshButton = ({ 
  onRefresh, 
  loading = false, 
  size = 'medium',
  variant = 'primary',
  disabled = false,
  children = 'تحديث'
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      onClick={onRefresh}
      disabled={loading || disabled}
      className={`
        flex items-center space-x-2 space-x-reverse
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        font-medium
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      <span>{loading ? 'جاري التحديث...' : children}</span>
    </button>
  );
};

export default RefreshButton;
