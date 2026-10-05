// Horizontal toolbar row for search + filters + actions, with wrap on small
// screens. Children are laid out left-to-right; use ui-toolbar-spacer to push.
export default function Toolbar({ children, className = "" }) {
  return <div className={`ui-toolbar ${className}`}>{children}</div>;
}
