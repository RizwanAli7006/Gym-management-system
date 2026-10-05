// Full-panel loading indicator with a spinner and optional label.
export default function Loading({ label = "Loading..." }) {
  return (
    <div className="ui-loading">
      <span className="ui-spinner" />
      <span>{label}</span>
    </div>
  );
}
