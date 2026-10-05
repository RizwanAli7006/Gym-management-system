import { X } from "lucide-react";

// Centered modal dialog with overlay, header + close, body and optional footer.
export default function Modal({ open, title, onClose, children, footer, size }) {
  if (!open) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div
        className={`ui-modal ${size === "lg" ? "ui-modal--lg" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ui-modal-head">
          <h3 className="ui-modal-title">{title}</h3>

          <button className="ui-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="ui-modal-body">{children}</div>

        {footer && <footer className="ui-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
