import React from 'react';

/**
 * مكون قسم الداشبورد
 * مصمم لتنظيم المحتوى في أقسام منطقية مع عناوين وأزرار إجراءات
 */
const DashboardSection = ({ 
  title, 
  subtitle,
  icon: Icon,
  action,
  actionText = 'عرض الكل',
  children,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 ${headerClassName}`}>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          {Icon && <Icon className="ml-2" />}
          {title}
        </h3>
        {action && (
          <button 
            onClick={action}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm transition-colors"
          >
            {actionText}
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-gray-600 text-sm mb-4">{subtitle}</p>
      )}
      
      {/* Content */}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

export default DashboardSection;
