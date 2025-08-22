// CustomComponents.js - مكونات واجهة المستخدم المخصصة
import React from 'react';

// مكونات أساسية بسيطة بدلاً من Ant Design
export const Badge = ({ status, text, children }) => (
  <span className={`badge badge-${status}`}>
    {text || children}
  </span>
);

export const Button = ({ children, onClick, type = 'default', loading = false, disabled = false, className = '', ...props }) => (
  <button 
    onClick={onClick}
    disabled={disabled || loading}
    className={`btn btn-${type} ${className}`}
    {...props}
  >
    {loading ? 'Loading...' : children}
  </button>
);

export const Card = ({ children, title, size = 'default', className = '', ...props }) => (
  <div className={`card card-${size} ${className}`} {...props}>
    {title && <div className="card-header">{title}</div>}
    <div className="card-body">{children}</div>
  </div>
);

export const Checkbox = ({ children, checked = false, onChange, className = '', ...props }) => (
  <label className={`checkbox ${className}`} {...props}>
    <input 
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="checkbox-input"
    />
    <span className="checkbox-label">{children}</span>
  </label>
);

export const Col = ({ children, xs, sm, md, lg, xl, className = '', ...props }) => (
  <div className={`col ${className}`} {...props}>
    {children}
  </div>
);

export const Divider = ({ children, className = '' }) => (
  <div className={`divider ${className}`}>
    {children && <span className="divider-text">{children}</span>}
  </div>
);

export const Input = ({ onChange, value, placeholder, className = '', ...props }) => (
  <input 
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`input ${className}`}
    {...props}
  />
);

export const Row = ({ children, className = '', ...props }) => (
  <div className={`row ${className}`} {...props}>
    {children}
  </div>
);

export const Select = ({ onChange, value, children, className = '', ...props }) => (
  <select 
    value={value}
    onChange={onChange}
    className={`select ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const Space = ({ children, direction = 'horizontal', size = 'middle', className = '' }) => (
  <div className={`space space-${direction} space-${size} ${className}`}>
    {children}
  </div>
);

export const Statistic = ({ title, value, valueStyle = {}, suffix = '', prefix = '' }) => (
  <div className="statistic">
    <div className="statistic-title">{title}</div>
    <div className="statistic-value" style={valueStyle}>
      {prefix}{value}{suffix}
    </div>
  </div>
);

export const Table = ({ 
  columns = [], 
  dataSource = [], 
  rowKey = 'id', 
  loading = false, 
  pagination = true,
  scroll,
  className = '',
  ...props 
}) => {
  if (loading) {
    return <div className="table-loading">Loading...</div>;
  }

  return (
    <div className={`table-container ${className}`} {...props}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={col.key || index} style={{ width: col.width }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.map((row, rowIndex) => (
            <tr key={row[rowKey] || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex}>
                  {col.render 
                    ? col.render(row[col.dataIndex], row, rowIndex)
                    : row[col.dataIndex]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && dataSource.length > 10 && (
        <div className="table-pagination">
          Pagination placeholder
        </div>
      )}
    </div>
  );
};

export const Tag = ({ children, color = 'default', className = '' }) => (
  <span className={`tag tag-${color} ${className}`}>
    {children}
  </span>
);

export const Typography = {
  Title: ({ children, level = 1, className = '', ...props }) => {
    const Tag = `h${level}`;
    return <Tag className={`title title-${level} ${className}`} {...props}>{children}</Tag>;
  },
  Text: ({ children, type = 'default', className = '', ...props }) => (
    <span className={`text text-${type} ${className}`} {...props}>{children}</span>
  )
};

export const { Title, Text } = Typography;
