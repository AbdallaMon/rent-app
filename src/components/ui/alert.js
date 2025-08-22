// مكون Alert للتنبيهات والإشعارات

export function Alert({ children, className = "", variant = "default" }) {
  const variantStyles = {
    default: "border-gray-200 bg-gray-50 text-gray-900",
    destructive: "border-red-200 bg-red-50 text-red-900",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
    success: "border-green-200 bg-green-50 text-green-900",
    info: "border-blue-200 bg-blue-50 text-blue-900"
  };

  return (
    <div className={`relative w-full rounded-lg border p-4 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = "" }) {
  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = "" }) {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
}
