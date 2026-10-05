export default function StatCard({
  icon,
  title,
  value,
  change,
  color = "purple",
}) {
  return (
    <div className="sa-stat-card">
      <div className={`sa-stat-icon ${color}`}>
        {icon}
      </div>

      <div className="sa-stat-content">
        <span>{title}</span>
        <strong>{value}</strong>

        <small>
          ↑ {change}
        </small>
      </div>
    </div>
  );
}