import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi, type PersonItem } from '../../services/adminApi';
import { Button } from '../../components/ui/Button';
import { useNavigation } from '../../core/navigation';
import type { AppView } from '../../core/navigation';

interface AdminPeoplePageProps {
  navigateTo: (view: string, id?: string) => void;
}

export const AdminPeoplePage: React.FC<AdminPeoplePageProps> = ({ navigateTo }) => {
  const [people, setPeople]   = useState<PersonItem[]>([]);
  const [filtered, setFiltered] = useState<PersonItem[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listPeople();
      setPeople(res.items);
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
      setFiltered(q ? people.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nationality ?? '').toLowerCase().includes(q)
      ) : people);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, people]);

  const handleDelete = async (person: PersonItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer "${person.name}" ?`)) return;
    try {
      await adminApi.deletePerson(person.id);
      load();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <AdminLayout currentView="adminPeople" navigateTo={navigateTo as any}>
      <div className="container py-6 space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Personnages historiques</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? '…' : `${filtered.length} personnage${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => navigateTo('adminNewPerson')} className="rounded-full px-6">
            + Nouveau personnage
          </Button>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou nationalité…"
          className="border rounded-lg px-3 py-1.5 text-sm bg-background w-72 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Personnage</th>
                <th className="text-left px-3 py-2.5 font-semibold w-20">Nation.</th>
                <th className="text-left px-3 py-2.5 font-semibold w-28">Naissance</th>
                <th className="text-left px-3 py-2.5 font-semibold w-28">Décès</th>
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
                    Aucun personnage trouvé.
                  </td>
                </tr>
              )}
              {!loading && filtered.map(person => (
                <tr
                  key={person.id}
                  onClick={() => navigateTo('adminEditPerson', person.id)}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-muted" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-base">👤</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-secondary truncate leading-tight">{person.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{person.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono">
                    {person.nationality ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {person.birthDate ? person.birthDate.split('T')[0] : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {person.deathDate ? person.deathDate.split('T')[0] : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); navigateTo('adminEditPerson', person.id); }}
                        className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={e => handleDelete(person, e)}
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
