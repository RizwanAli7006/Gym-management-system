// Panel container with an optional header (title + action slot).
export default function Card({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`ui-card ${className}`}>
      {(title || actions) && (
        <header className="ui-card-head">
          <div>
            {title && <h3 className="ui-card-title">{title}</h3>}
            {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
          </div>

          {actions && <div className="ui-card-actions">{actions}</div>}
        </header>
      )}

      <div className="ui-card-body">{children}</div>
    </section>
  );
}
