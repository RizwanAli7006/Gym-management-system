// Page title block: eyebrow + heading + optional subtitle and action slot.
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="ui-page-header">
      <div className="ui-page-header-text">
        {eyebrow && <span className="ui-page-header-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </div>
  );
}
