// Form field wrapper: label + control. Pass an <input>/<select>/<textarea>
// (styled via the shared .ui-input class) as children, or use the `as` helper.
export default function FormField({ label, required, hint, error, children }) {
  return (
    <label className="ui-field">
      {label && (
        <span className="ui-field-label">
          {label}
          {required && <em className="ui-field-req">*</em>}
        </span>
      )}

      {children}

      {hint && !error && <span className="ui-field-hint">{hint}</span>}
      {error && <span className="ui-field-error">{error}</span>}
    </label>
  );
}
