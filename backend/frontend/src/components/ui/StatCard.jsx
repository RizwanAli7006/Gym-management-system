// Metric tile with a lucide icon, value, label and optional trend/hint line.
export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "purple",
}) {
  return (
    <div className="ui-stat">
      <div className={`ui-stat-icon ui-stat-icon--${tone}`}>
        {Icon && <Icon size={22} />}
      </div>

      <div className="ui-stat-body">
        <span className="ui-stat-value">{value}</span>
        <span className="ui-stat-label">{label}</span>
        {hint && <span className="ui-stat-hint">{hint}</span>}
      </div>
    </div>
  );
}
