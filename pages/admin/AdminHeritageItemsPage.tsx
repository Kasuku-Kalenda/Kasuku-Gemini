import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { Button } from '../../components/ui/Button';
import type { HeritageItem, HeritageCategory } from '../../types';

const CATEGORIES: { value: HeritageCategory | ''; label: string }[] = [
  { value: '', label: 'Toutes catégories' },
  { value: 'mask',    label: 'Masque' },
  { value: 'proverb', label: 'Proverbe' },
  { value: 'symbol',  label: 'Symbole' },
  { value: 'recipe',  label: 'Recette' },
  { value: 'craft',   label: 'Artisanat' },
  { value: 'music',   label: 'Musique' },
  { value: 'other',   label: 'Autre' },
];

const CATEGORY_LABELS: Record<HeritageCategory, string> = {
  mask: 'Masque', proverb: 'Proverbe', symbol: 'Symbole',
  recipe: 'Recette', craft: 'Artisanat', music: 'Musique', other: 'Autre',
};

interface Props {
  navigateTo: (view: string, id?: string) => void;
}

export const AdminHeritageItemsPage: React.FC<Props> = ({ navigateTo }) => {
  const [items, setItems]     = useState<HeritageItem[]>([]);
  const [filtered, setFiltered] = useState<HeritageItem[]>([]);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState<HeritageCategory | ''>('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listHeritage();
      setItems(res.items);
      setFiltered(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = search.toLowerCase().trim();
      setFiltered(items.filter(item => {
        const matchSearch = !q ||
          item.title.toLowerCase().includes(q) ||
          (item.countryCode ?? '').toLowerCase().includes(q) ||
          (item.summary ?? '').toLowerCase().includes(q);
        const matchCat = !category || item.category === category;
        return matchSearch && matchCat;
      }));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, category, items]);

  const handleDelete = async (item: HeritageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer "${item.title}" ?`)) return;
    try {
      await adminApi.deleteHeritage(item.id);
      load();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'published') return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">Publié</span>;
    if (status === 'archived')  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Archivé</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">Brouillon</span>;
  };

  return (
    <AdminLayout currentView="adminHeritage" navigateTo={navigateTo as any}>
      <div className="container py-6 space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Patrimoine culturel</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? '…' : `${filtered.length} élément${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => navigateTo('adminNewHeritage')} className="rounded-full px-6">
            + Nouvel élément
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par titre, pays, résumé…"
            className="border rounded-lg px-3 py-1.5 text-sm bg-background w-72 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value as HeritageCategory | '')}
            className="border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Élément</th>
                <th className="text-left px-3 py-2.5 font-semibold w-28">Catégorie</th>
                <th className="text-left px-3 py-2.5 font-semibold w-16">Pays</th>
                <th className="text-left px-3 py-2.5 font-semibold w-28">Statut</th>
                <th className="px-3 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">Chargement…</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm italic">
                    Aucun élément de patrimoine trouvé.
                  </td>
                </tr>
              )}
              {!loading && filtered.map(item => (
                <tr
                  key={item.id}
                  onClick={() => navigateTo('adminEditHeritage', item.id)}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0 bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-lg">🏺</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-secondary truncate leading-tight">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono uppercase">
                    {item.countryCode ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {statusBadge(item.status)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); navigateTo('adminEditHeritage', item.id); }}
                        className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={e => handleDelete(item, e)}
                        className="text-xs border border-destructive/40 rounded px-2 py-1 text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
