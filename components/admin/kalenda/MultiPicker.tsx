import React, { useState, useMemo } from 'react';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';

// ─── Badge source ─────────────────────────────────────────────────────────────
export const sourceBadge = (source?: { type: string }) => {
  if (!source) return null;
  if (source.type === 'central')      return <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">🏛️ Central</span>;
  if (source.type === 'imported_csv') return <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5">⬆️ Importé</span>;
  return <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">📍 Local</span>;
};

// ─── MultiPicker ──────────────────────────────────────────────────────────────

export interface MultiPickerProps<T extends { id: string; title?: string; name?: string; slug?: string; source?: { type: string } }> {
  label: string;
  items: T[];
  selected: string[];
  onToggle: (id: string) => void;
  renderItem?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
}

export function MultiPicker<T extends { id: string; title?: string; name?: string; slug?: string; source?: { type: string } }>({
  label, items, selected, onToggle, renderItem, searchPlaceholder,
}: MultiPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(it => !q || (it.title ?? it.name ?? '').toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
      >
        <span>
          {label}{' '}
          <span className="text-primary font-bold">
            ({selected.length} sélectionné{selected.length !== 1 ? 's' : ''})
          </span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-3 space-y-2">
          <input
            type="text"
            placeholder={searchPlaceholder ?? 'Rechercher…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat</p>
            )}
            {filtered.map(item => {
              const isSelected = selected.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/8 border border-primary/30' : 'hover:bg-muted/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(item.id)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    {renderItem ? renderItem(item) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{item.title ?? item.name}</span>
                        {sourceBadge(item.source)}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
