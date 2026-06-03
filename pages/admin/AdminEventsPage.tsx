/**
 * pages/admin/AdminEventsPage.tsx
 *
 * Table riche des événements admin :
 * - Thumbnail · Titre + thèmes · Date + pays
 * - Pills de relations : stories, modules, thèmes, personnes, médias
 * - Filtres : recherche (debounced), statut, pays, thème, orphan/noModule/featured
 * - Clic sur ligne → EventDetailDrawer
 * - Pagination serveur
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../services/apiClient';
import { EventDetailDrawer } from '../../components/admin/EventDetailDrawer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/helpers';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminNewEvent' | 'adminEditEvent';

interface AdminEventsPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  slug: string;
  title: string;
  displayDate: string | null;
  startDate: string | null;
  primaryCountryCode: string | null;
  status: string;
  featured: boolean;
  thumbnailUrl: string | null;
  themes: Array<{ id: string; name: string; color: string }>;
  storiesCount: number;
  modulesCount: number;
  themesCount: number;
  peopleCount: number;
  mediaCount: number;
  tagsCount: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const CountPill: React.FC<{ value: number; icon: string; title: string; color?: string }> = ({
  value, icon, title, color = 'bg-muted text-muted-foreground',
}) => (
  <span
    title={title}
    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
      value > 0 ? color : 'bg-muted/40 text-muted-foreground/40'
    }`}
  >
    {icon} {value}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    draft:     'bg-amber-100  text-amber-800  border-amber-200',
    archived:  'bg-slate-100  text-slate-600  border-slate-200',
  };
  return (
    <span className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${map[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AdminEventsPage: React.FC<AdminEventsPageProps> = ({ navigateTo }) => {
  const [events, setEvents]           = useState<EventRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDSearch] = useState('');
  const [status, setStatus]           = useState('');
  const [country, setCountry]         = useState('');
  const [theme, setTheme]             = useState('');
  const [orphan, setOrphan]           = useState(false);
  const [noModule, setNoModule]       = useState(false);
  const [featured, setFeatured]       = useState(false);
  const [drawerEventId, setDrawerId]  = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 40;

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDSearch(search), 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, status, country, theme, orphan, noModule, featured]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit:  String(LIMIT),
        offset: String((page - 1) * LIMIT),
      });
      if (debouncedSearch) params.set('q',       debouncedSearch);
      if (status)          params.set('status',  status);
      if (country)         params.set('country', country.toUpperCase());
      if (theme)           params.set('theme',   theme);
      if (orphan)          params.set('orphan',   'true');
      if (noModule)        params.set('noModule', 'true');
      if (featured)        params.set('featured', 'true');

      const data = await api.get<{ items: EventRow[]; total: number }>(
        `/events/all?${params.toString()}`
      );
      setEvents(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error('AdminEventsPage load error', e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, country, theme, orphan, noModule, featured]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleDelete = async (e: EventRow, evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (!window.confirm(`Supprimer "${e.title}" ?`)) return;
    try {
      await api.delete(`/events/${e.id}`);
      load();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  // Toggle helpers
  const toggle = (fn: React.Dispatch<React.SetStateAction<boolean>>) =>
    (v: boolean) => fn(!v);

  return (
    <AdminLayout currentView="adminEvents" navigateTo={navigateTo as any}>
      <div className="container py-6 space-y-4">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Événements</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? '…' : `${total} événements`}
            </p>
          </div>
          <Button onClick={() => navigateTo('adminNewEvent')} className="rounded-full px-6">
            + Nouvel événement
          </Button>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="border rounded-lg px-3 py-1.5 text-sm bg-background w-52 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none"
          >
            <option value="">Tous statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>

          {/* Country */}
          <input
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="Pays (ex: SN)"
            className="border rounded-lg px-3 py-1.5 text-sm bg-background w-28 focus:outline-none"
          />

          {/* Theme slug */}
          <input
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="Thème slug"
            className="border rounded-lg px-3 py-1.5 text-sm bg-background w-32 focus:outline-none"
          />

          {/* Toggle pills */}
          {([
            { label: 'Sans récit',  val: orphan,   set: setOrphan   },
            { label: 'Sans module', val: noModule,  set: setNoModule  },
            { label: '⭐ Vedette',   val: featured,  set: setFeatured  },
          ] as const).map(({ label, val, set }) => (
            <button
              key={label}
              onClick={() => set((v: boolean) => !v)}
              className={`text-xs border rounded-full px-3 py-1 transition-colors ${
                val
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Événement</th>
                <th className="text-left px-3 py-2.5 font-semibold w-32">Date</th>
                <th className="text-left px-3 py-2.5 font-semibold w-14">Pays</th>
                <th className="text-center px-2 py-2.5 font-semibold w-10" title="Stories">📖</th>
                <th className="text-center px-2 py-2.5 font-semibold w-10" title="Modules">🎓</th>
                <th className="text-center px-2 py-2.5 font-semibold w-10" title="Thèmes">🏷</th>
                <th className="text-center px-2 py-2.5 font-semibold w-10" title="Personnes">👤</th>
                <th className="text-center px-2 py-2.5 font-semibold w-10" title="Médias">🖼</th>
                <th className="text-left px-3 py-2.5 font-semibold w-24">Statut</th>
                <th className="px-3 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground text-sm">
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground text-sm italic">
                    Aucun événement trouvé.
                  </td>
                </tr>
              )}
              {!loading && events.map(ev => (
                <tr
                  key={ev.id}
                  onClick={() => setDrawerId(ev.id)}
                  className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors group"
                >
                  {/* Événement */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {ev.thumbnailUrl ? (
                        <img
                          src={ev.thumbnailUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-lg">
                          📅
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-secondary truncate leading-tight">
                          {ev.title}
                          {ev.featured && <span className="ml-1 text-amber-500">⭐</span>}
                        </p>
                        {ev.themes.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {ev.themes.slice(0, 3).map(t => (
                              <span
                                key={t.id}
                                className="text-[9px] text-white rounded-full px-1.5 py-px font-medium"
                                style={{ backgroundColor: t.color ?? '#6B7280' }}
                              >
                                {t.name}
                              </span>
                            ))}
                            {ev.themes.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{ev.themes.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {ev.startDate
                      ? formatDate(new Date(ev.startDate))
                      : ev.displayDate ?? '—'}
                  </td>

                  {/* Pays */}
                  <td className="px-3 py-2.5">
                    {ev.primaryCountryCode ? (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {ev.primaryCountryCode}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Count pills */}
                  <td className="px-2 py-2.5 text-center">
                    <CountPill value={ev.storiesCount}  icon="📖" title="Stories liés"    color="bg-blue-100 text-blue-700" />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <CountPill value={ev.modulesCount}  icon="🎓" title="Modules liés"    color="bg-violet-100 text-violet-700" />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <CountPill value={ev.themesCount}   icon="🏷" title="Thèmes"          color="bg-teal-100 text-teal-700" />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <CountPill value={ev.peopleCount}   icon="👤" title="Personnes liées" color="bg-orange-100 text-orange-700" />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <CountPill value={ev.mediaCount}    icon="🖼" title="Médias"          color="bg-pink-100 text-pink-700" />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={ev.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); navigateTo('adminEditEvent', ev.id); }}
                        className="text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={e => handleDelete(ev, e)}
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

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Page {page} / {totalPages} — {total} événements
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← Précédent
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Suivant →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── EventDetailDrawer ───────────────────────────────────────────────── */}
      <EventDetailDrawer
        eventId={drawerEventId}
        onClose={() => setDrawerId(null)}
        onEdit={id => { setDrawerId(null); navigateTo('adminEditEvent', id); }}
      />
    </AdminLayout>
  );
};
