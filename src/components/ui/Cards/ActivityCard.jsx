import React from 'react';

/**
 * مكون بطاقة نشاط/إحصائيات صغيرة
 * مصمم للاستخدام في الداشبورد لعرض إحصائيات سريعة
 */
const ActivityCard = ({ 
  title, 
  value, 
  subtitle,
  color = 'blue',
  trend, // 'up', 'down', 'neutral'
  badge,
  onClick,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200'
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    red: 'text-red-900',
    yellow: 'text-yellow-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900'
  };

  const badgeColorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800'
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div 
      className={`
        flex justify-between items-center p-3 rounded-lg border
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex-1">
        <p className={`font-medium ${textColorClasses[color]}`}>{title}</p>
        {subtitle && <p className={`text-sm ${textColorClasses[color]} opacity-75`}>{subtitle}</p>}
      </div>
      <div className="text-right flex items-center space-x-2 space-x-reverse">
        {trend && getTrendIcon()}
        {badge && (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeColorClasses[color]}`}>
            {badge}
          </span>
        )}
        {value && (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeColorClasses[color]}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
