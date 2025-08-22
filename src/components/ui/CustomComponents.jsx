/**
 * مكونات UI مخصصة للوحة التحكم
 * تسمح بتوحيد المظهر والسلوك عبر التطبيق
 */

import React from 'react';

// مكونات البطاقات
export const Card = ({ children, title, extra, className = "", ...props }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`} {...props}>
    {title && (
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {extra && <div>{extra}</div>}
      </div>
    )}
    {children}
  </div>
);

// مكونات الصفوف والأعمدة
export const Row = ({ children, gutter = [16, 16], className = "", ...props }) => (
  <div className={`flex flex-wrap -mx-2 ${className}`} {...props}>
    {children}
  </div>
);

export const Col = ({ children, xs = 24, sm, md, lg, xl, className = "", ...props }) => {
  const getColClass = () => {
    if (lg === 6) return "w-full lg:w-1/4";
    if (lg === 8) return "w-full lg:w-1/3";
    if (lg === 12) return "w-full lg:w-1/2";
    if (md === 12) return "w-full md:w-1/2";
    return "w-full";
  };
  
  return (
    <div className={`px-2 mb-4 ${getColClass()} ${className}`} {...props}>
      {children}
    </div>
  );
};

// مكون الإحصائيات
export const Statistic = ({ title, value, prefix, suffix, valueStyle = {} }) => (
  <div className="text-center">
    <div className="text-sm text-gray-500 mb-1">{title}</div>
    <div className="text-2xl font-bold" style={valueStyle}>
      {prefix} {value} {suffix}
    </div>
  </div>
);

// مكون شريط التقدم
export const Progress = ({ percent, showInfo = true, strokeColor = "#1890ff", className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="h-2 rounded-full" 
      style={{ width: `${percent}%`, backgroundColor: strokeColor }}
    ></div>
    {showInfo && <div className="text-xs text-gray-500 mt-1">{percent}%</div>}
  </div>
);

// مكون الجداول
export const Table = ({ columns, dataSource, loading, scroll, pagination, className = "" }) => {
  if (loading) return <div className="text-center py-4">جاري التحميل...</div>;
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource?.map((row, index) => (
            <tr key={index} className="border-b">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-4 py-2 text-sm">
                  {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// مكون العلامات
export const Tag = ({ children, color = "default", className = "" }) => {
  const colorClasses = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-800",
    cyan: "bg-cyan-100 text-cyan-800",
    default: "bg-gray-100 text-gray-800"
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs ${colorClasses[color] || colorClasses.default} ${className}`}>
      {children}
    </span>
  );
};

// مكون الأزرار
export const Button = ({ children, type = "default", size = "default", icon, loading, onClick, className = "", ...props }) => {
  const baseClasses = "inline-flex items-center px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const typeClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    default: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500",
    dashed: "bg-white text-gray-700 border border-dashed border-gray-300 hover:bg-gray-50"
  };
  const sizeClasses = {
    small: "px-2 py-1 text-sm",
    default: "px-4 py-2",
    large: "px-6 py-3 text-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${typeClasses[type]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// مكون المساحة
export const Space = ({ children, className = "" }) => (
  <div className={`flex items-center space-x-2 space-x-reverse ${className}`}>
    {children}
  </div>
);

// مكون القائمة المنسدلة
export const Select = ({ children, placeholder, value, onChange, className = "", name, defaultValue, required, ...props }) => (
  <select 
    name={name}
    defaultValue={defaultValue || value}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    onChange={onChange}
    required={required}
    {...props}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

export const Option = ({ children, value }) => (
  <option value={value}>{children}</option>
);

// مكون حقل الإدخال
export const Input = ({ placeholder, value, onChange, className = "", name, defaultValue, required, ...props }) => (
  <input 
    type="text"
    name={name}
    defaultValue={defaultValue || value}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    placeholder={placeholder}
    onChange={onChange}
    required={required}
    {...props}
  />
);

// مكون منطقة النص
export const TextArea = ({ rows = 4, placeholder, value, onChange, className = "", name, defaultValue, required, ...props }) => (
  <textarea 
    rows={rows}
    name={name}
    defaultValue={defaultValue || value}
    className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    placeholder={placeholder}
    onChange={onChange}
    required={required}
    {...props}
  />
);

// مكون النافذة المنبثقة
export const Modal = ({ title, open, onCancel, footer, width = 600, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto m-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t">{footer}</div>}
      </div>
    </div>
  );
};

// مكون النموذج
export const Form = ({ children, layout = "vertical", onFinish, initialValues }) => {
  return (
    <form onSubmit={onFinish} className="space-y-4">
      {children}
    </form>
  );
};

const FormItem = ({ children, name, label, rules = [], initialValue }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <div>
      {React.cloneElement(children, { 
        name, 
        defaultValue: initialValue,
        required: rules.some(rule => rule.required)
      })}
    </div>
  </div>
);

FormItem.displayName = 'Form.Item';
Form.Item = FormItem;

// مكون التنبيه
export const Alert = ({ message, description, type = "info", showIcon, closable, className = "" }) => {
  const typeClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800"
  };
  
  return (
    <div className={`border rounded-md p-4 ${typeClasses[type]} ${className}`}>
      <div className="font-medium">{message}</div>
      {description && <div className="text-sm mt-1">{description}</div>}
    </div>
  );
};

// مكون التبويب
export const Tabs = ({ activeKey, onChange, children, size = "default" }) => {
  const tabs = React.Children.toArray(children);
  
  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 space-x-reverse">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeKey === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.props?.tab || 'Tab'}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {tabs.find(tab => tab.key === activeKey)?.props?.children}
      </div>
    </div>
  );
};

export const TabPane = ({ children, tab, key }) => children;

// مكون الشارة
export const Badge = ({ status, text, dot, className = "" }) => (
  <div className={`inline-flex items-center ${className}`}>
    {status && (
      <span className={`w-2 h-2 rounded-full mr-2 ${
        status === "processing" ? "bg-blue-500" : 
        status === "success" ? "bg-green-500" : 
        status === "error" ? "bg-red-500" : "bg-gray-500"
      }`}></span>
    )}
    {dot && <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>}
    {text && <span className="text-sm">{text}</span>}
  </div>
);

// مكون تلميحات المعلومات
export const Tooltip = ({ title, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {title}
    </div>
  </div>
);

// مكون الإشعارات
export const notification = {
  success: ({ message, description }) => alert(`${message}: ${description}`),
  error: ({ message, description }) => alert(`خطأ - ${message}: ${description}`),
  warning: ({ message, description }) => alert(`تحذير - ${message}: ${description}`),
  info: ({ message, description }) => alert(`معلومات - ${message}: ${description}`)
};

// مكون المفتاح
export const Switch = ({ checked, onChange, loading, className = "" }) => (
  <button
    onClick={() => !loading && onChange?.(!checked)}
    disabled={loading}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? "bg-blue-600" : "bg-gray-200"
    } ${className}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

// مكون الفاصل
export const Divider = ({ className = "" }) => (
  <hr className={`border-gray-200 my-4 ${className}`} />
);

// مكون النصوص
export const Typography = {
  Title: ({ children, level = 1, className = "" }) => {
    const Tag = `h${level}`;
    const sizes = {
      1: "text-3xl font-bold",
      2: "text-2xl font-bold", 
      3: "text-xl font-bold",
      4: "text-lg font-bold"
    };
    return React.createElement(Tag, { className: `${sizes[level]} ${className}` }, children);
  },
  Text: ({ children, className = "" }) => (
    <span className={`text-gray-700 ${className}`}>{children}</span>
  )
};

// اختصارات النصوص
export const { Title, Text } = Typography;

// مكون التحميل
export const Spin = ({ children, size = "default", className = "" }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
    {children}
  </div>
);

// مكون القوائم
export const List = ({ itemLayout, dataSource, renderItem, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {dataSource?.map((item, index) => (
      <div key={index}>{renderItem(item)}</div>
    ))}
  </div>
);

const ListItem = ({ children, className = "" }) => (
  <div className={`p-3 border-b border-gray-100 ${className}`}>{children}</div>
);

ListItem.displayName = 'List.Item';
List.Item = ListItem;

const ListItemMeta = ({ avatar, title, description }) => (
  <div className="flex items-start space-x-3 space-x-reverse">
    {avatar && <div className="flex-shrink-0">{avatar}</div>}
    <div className="flex-1">
      <div className="font-medium">{title}</div>
      {description && <div className="text-sm text-gray-500">{description}</div>}
    </div>
  </div>
);

ListItemMeta.displayName = 'List.Item.Meta';
List.Item.Meta = ListItemMeta;

// مكون الصورة الرمزية
export const Avatar = ({ icon, style, className = "" }) => (
  <div 
    className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${className}`}
    style={style}
  >
    {icon}
  </div>
);

// مكون الوصف
export const Descriptions = ({ column = 1, bordered, children, className = "" }) => (
  <div className={`${bordered ? "border border-gray-200 rounded" : ""} ${className}`}>
    {children}
  </div>
);

const DescriptionsItem = ({ label, children }) => (
  <div className="flex py-2 border-b border-gray-100 last:border-b-0">
    <div className="w-1/3 font-medium text-gray-600">{label}:</div>
    <div className="w-2/3">{children}</div>
  </div>
);

DescriptionsItem.displayName = 'Descriptions.Item';
Descriptions.Item = DescriptionsItem;
