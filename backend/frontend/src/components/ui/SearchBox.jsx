import { Search } from "lucide-react";

// Search input with a leading icon, used in page toolbars.
export default function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="ui-search">
      <Search size={17} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
