"use client";
import { useId, useMemo, useState } from "react";
export type DestinationOption = { id: string; name: string; detail: string; keywords: string };
export function DestinationSearchInput({ value, label, placeholder, options, onFocus, onSelect, noResults }: {
  value: string; label: string; placeholder: string; options: DestinationOption[];
  onFocus: () => void; onSelect: (id: string) => void; noResults: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const results = useMemo(() => options.filter(o => o.keywords.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"))).slice(0,10), [options, query]);
  const edit = () => { setQuery(value); setActive(-1); setOpen(true); onFocus(); };
  const choose = (option: DestinationOption) => { setOpen(false); onSelect(option.id); };
  return <div className="gmaps-destination-search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
    <label htmlFor={id} className={`gmaps-input-btn ${open ? "is-focused" : ""}`}>
      <small>{label}</small>
      <input id={id} className="gmaps-destination-input" type="text" role="combobox" autoComplete="off" spellCheck={false}
        value={open ? query : value} placeholder={placeholder} aria-label={label} aria-autocomplete="list"
        aria-expanded={open} aria-controls={open ? id+"-results" : undefined}
        aria-activedescendant={open && active >= 0 ? id+"-option-"+active : undefined}
        onFocus={e => { edit(); e.currentTarget.select(); }} onClick={() => { if (!open) edit(); }}
        onChange={e => { setQuery(e.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault(); setOpen(true);
            if (results.length) setActive(i => (i+(e.key === "ArrowDown" ? 1 : -1)+results.length)%results.length);
          }
          if (e.key === "Enter" && open && results.length) { e.preventDefault(); choose(results[active < 0 ? 0 : active]); }
        }} />
    </label>
    {open && <div className="gmaps-destination-results" id={id+"-results"} role="listbox" aria-label={label}>
      {results.length ? results.map((o,i) => <button key={o.id} id={id+"-option-"+i} type="button" role="option"
        className="gmaps-search-item" aria-selected={active===i} onMouseDown={e => e.preventDefault()} onClick={() => choose(o)}>
        <span className="gmaps-item-info"><strong>{o.name}</strong><small>{o.detail}</small></span>
      </button>) : <p className="gmaps-destination-empty" role="status">{noResults}</p>}
    </div>}
  </div>;
}
