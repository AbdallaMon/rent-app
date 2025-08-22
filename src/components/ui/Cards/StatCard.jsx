import React from 'react';

/**
 * مكون بطاقة الإحصائيات
 * مصمم للاستخدام في صفحات الإحصائيات ولوحات التحكم
 */
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  borderColor,
  iconColor,
  textColor,
  layout = 'horizontal' // horizontal أو vertical
}) => {
  // تحديد الألوان تلقائياً إذا لم تكن محددة
  const finalBorderColor = borderColor || `${color}-100`;
  const finalIconColor = iconColor || `${color}-500`;
  const finalTextColor = textColor || `${color}-600`;

  if (layout === 'horizontal') {
    // التخطيط الأفقي (كما في لوحة تحكم الواتساب)
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border border-${finalBorderColor}`}>
        <div className="flex items-center">
          <div className={`p-3 rounded-full bg-${color}-100 text-${finalIconColor}`}>
            {Icon && <Icon />}
          </div>
          <div className="mr-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  // التخطيط العمودي (كما في صفحة الإحصائيات)
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-${finalBorderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold text-${finalTextColor}`}>{value}</p>
        </div>
        {Icon && <Icon className={`w-8 h-8 text-${finalIconColor}`} />}
      </div>
    </div>
  );
};

export default StatCard;
