import { ArrowRight } from "lucide-react";

export default function QuickAction({
  icon,
  title,
  color,
  onClick,
}) {
  return (
    <button
      className={`sa-quick-action ${color}`}
      onClick={onClick}
    >
      <div className="sa-quick-icon">
        {icon}
      </div>

      <span>{title}</span>

      <ArrowRight size={17} />
    </button>
  );
}