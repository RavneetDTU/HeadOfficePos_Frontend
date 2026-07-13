import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchAutosuggestProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Minimum chars before suggestions appear (default 1) */
  minChars?: number;
  /** Max number of suggestions to show (default 8) */
  maxSuggestions?: number;
}

/**
 * Reusable search input with autosuggestion dropdown.
 * Shows matching suggestions after the user types at least `minChars` characters.
 * Supports keyboard navigation (↑ ↓ Enter Escape) and highlights the match.
 */
export function SearchAutosuggest({
  value,
  onChange,
  suggestions,
  placeholder = "Search…",
  className = "",
  inputClassName = "",
  minChars = 1,
  maxSuggestions = 8,
}: SearchAutosuggestProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute filtered suggestions
  const filtered =
    value.trim().length >= minChars
      ? suggestions.filter(
          (s) =>
            s.toLowerCase().includes(value.toLowerCase()) &&
            s.toLowerCase() !== value.toLowerCase()
        ).slice(0, maxSuggestions)
      : [];

  // Open / close based on available suggestions
  useEffect(() => {
    setOpen(filtered.length > 0);
    setHighlighted(-1);
  }, [filtered.length]);

  // Close on outside click
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      onChange(filtered[highlighted]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (s: string) => {
    onChange(s);
    setOpen(false);
  };

  // Bold-highlight the matching portion of a suggestion
  const highlightMatch = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1 || !query) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <span className="font-semibold text-blue-700">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Leading search icon */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
        size={15}
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (filtered.length > 0) setOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full pl-9 ${value ? "pr-8" : "pr-3"} py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white transition-shadow ${inputClassName}`}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => { onChange(""); setOpen(false); }}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={13} />
        </button>
      )}

      {/* Suggestions dropdown */}
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors ${
                i === highlighted
                  ? "bg-blue-50 text-blue-800"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Search size={12} className="text-gray-400 shrink-0" />
              {highlightMatch(s, value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
