// Empty / no-data placeholder with an icon, title and helper text.
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="ui-empty">
      {Icon && (
        <div className="ui-empty-icon">
          <Icon size={28} />
        </div>
      )}

      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}
