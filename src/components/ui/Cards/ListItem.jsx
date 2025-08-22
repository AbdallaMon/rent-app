import React from 'react';

/**
 * مكون عنصر قائمة بسيط
 * مصمم لعرض العناصر في قوائم منسقة مع حالات وأولويات
 */
const ListItem = ({ 
  title, 
  subtitle,
  status,
  priority,
  timestamp,
  avatar,
  action,
  onClick,
  className = ''
}) => {
  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'معلق': 'bg-yellow-100 text-yellow-800',
      'قيد التنفيذ': 'bg-blue-100 text-blue-800',
      'مكتمل': 'bg-green-100 text-green-800',
      'مرفوض': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': 'bg-red-100 text-red-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'عاجل': 'bg-red-100 text-red-800',
      'متوسط': 'bg-yellow-100 text-yellow-800',
      'منخفض': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'معلق',
      'IN_PROGRESS': 'قيد التنفيذ',
      'COMPLETED': 'مكتمل',
      'REJECTED': 'مرفوض'
    };
    return statusMap[status] || status;
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'HIGH': 'عاجل',
      'MEDIUM': 'متوسط',
      'LOW': 'منخفض'
    };
    return priorityMap[priority] || priority;
  };

  return (
    <div 
      className={`
        flex items-center justify-between p-3 bg-gray-50 rounded-lg
        ${onClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center flex-1">
        {avatar && (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ml-3">
            {typeof avatar === 'string' ? (
              <span className="text-sm font-medium text-gray-600">{avatar}</span>
            ) : (
              avatar
            )}
          </div>
        )}
        
        <div className="flex-1">
          <p className="font-medium text-gray-900">{title}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          {timestamp && (
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timestamp}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right flex items-center space-x-2 space-x-reverse">
        {priority && (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(priority)}`}>
            {getPriorityText(priority)}
          </span>
        )}
        {status && (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        )}
        {action && action}
      </div>
    </div>
  );
};

export default ListItem;
