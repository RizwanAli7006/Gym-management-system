const TONES = {
  green: "ui-badge--green",
  red: "ui-badge--red",
  amber: "ui-badge--amber",
  blue: "ui-badge--blue",
  purple: "ui-badge--purple",
  gray: "ui-badge--gray",
};

// Status pill. tone defaults to gray.
export default function Badge({ tone = "gray", children }) {
  return <span className={`ui-badge ${TONES[tone] || TONES.gray}`}>{children}</span>;
}
