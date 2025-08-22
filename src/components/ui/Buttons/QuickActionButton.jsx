import React from 'react';

/**
 * مكون زر الإجراءات السريعة
 * مصمم للاستخدام في أقسام الإجراءات السريعة
 */
const QuickActionButton = ({ 
  title, 
  icon: Icon,
  color = 'blue',
  onClick,
  disabled = false,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 text-green-600',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
    red: 'bg-red-50 hover:bg-red-100 text-red-600',
    gray: 'bg-gray-50 hover:bg-gray-100 text-gray-600'
  };

  const textClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    red: 'text-red-700',
    gray: 'text-gray-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center p-4 text-center rounded-lg transition-colors
        ${colorClasses[color]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {Icon && <Icon className={`${color === 'blue' ? 'text-blue-600' : 
                                 color === 'green' ? 'text-green-600' : 
                                 color === 'purple' ? 'text-purple-600' : 
                                 color === 'orange' ? 'text-orange-600' : 
                                 color === 'red' ? 'text-red-600' : 'text-gray-600'} mb-2`} />}
      <span className={`text-sm font-medium ${textClasses[color]}`}>
        {title}
      </span>
    </button>
  );
};

export default QuickActionButton;
