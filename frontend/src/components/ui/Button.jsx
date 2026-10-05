const VARIANTS = {
  primary: "ui-btn--primary",
  secondary: "ui-btn--secondary",
  danger: "ui-btn--danger",
  ghost: "ui-btn--ghost",
};

// Button with consistent variants + optional leading lucide icon.
export default function Button({
  variant = "primary",
  size,
  icon: Icon,
  children,
  className = "",
  type = "button",
  ...rest
}) {
  const sizeClass = size === "sm" ? "ui-btn--sm" : "";

  return (
    <button
      type={type}
      className={`ui-btn ${VARIANTS[variant] || VARIANTS.primary} ${sizeClass} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}
