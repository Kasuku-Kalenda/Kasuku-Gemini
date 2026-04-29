import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { Kalenda } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { KalendaForm, type ContentPool } from '../../components/admin/kalenda/KalendaForm';
import { PlusIcon } from '../../components/icons/PlusIcon';

// ─── Icônes locales (non disponibles dans /icons) ─────────────────────────────

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// ─── KalendaCard ──────────────────────────────────────────────────────────────

interface KalendaCardProps {
  kalenda: Kalenda;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const KalendaCard: React.FC<KalendaCardProps> = ({ kalenda: k, onEdit, onDelete, onToggleStatus }) => (
  <div className="bg-card border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
    {k.coverUrl ? (
      <img src={k.coverUrl} alt={k.name} className="w-full h-28 object-cover bg-muted" />
    ) : (
      <div className="w-full h-28 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        <PackageIcon />
      </div>
    )}

    <div className="p-4 flex flex-col flex-1 gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-secondary truncate">{k.name}</h3>
          <p className="text-[10px] font-mono text-muted-foreground">{k.slug} · v{k.version}</p>
        </div>
        <Badge
          variant={k.status === 'published' ? 'secondary' : 'outline'}
          className="text-[9px] font-black tracking-widest uppercase shrink-0"
        >
          {k.status === 'published' ? 'Publié' : 'Brouillon'}
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {k.region    && <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">📍 {k.region}</span>}
        {k.themeLabel && <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">🏷️ {k.themeLabel}</span>}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{k.description}</p>

      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
        {[
          { label: 'Évén.',   count: k.eventIds.length },
          { label: 'Récits',  count: k.timelineIds.length },
          { label: 'Modules', count: k.moduleIds.length },
          { label: 'Thèmes',  count: k.themeIds.length },
        ].map(({ label, count }) => (
          <div key={label} className="bg-muted/50 rounded py-1">
            <div className="font-bold text-foreground">{count}</div>
            <div className="text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 text-xs flex items-center gap-1 justify-center" onClick={onEdit}>
          <EditIcon /> Modifier
        </Button>
        <Button
          variant={k.status === 'published' ? 'outline' : 'default'}
          size="sm" className="flex-1 text-xs"
          onClick={onToggleStatus}
        >
          {k.status === 'published' ? 'Dépublier' : 'Publier'}
        </Button>
        <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded" title="Supprimer">
          <TrashIcon />
        </button>
      </div>
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

interface AdminKalendaPageProps {
  navigateTo: (view: string, id?: string) => void;
}

type FormMode = 'create' | 'edit';

export const AdminKalendaPage: React.FC<AdminKalendaPageProps> = ({ navigateTo }) => {
  const [kalendas, setKalendas] = useState<Kalenda[]>([]);
  const [pool, setPool] = useState<ContentPool>({ events: [], timelines: [], modules: [], themes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [formMode, setFormMode] = useState<{ open: boolean; mode: FormMode; item?: Kalenda }>({ open: false, mode: 'create' });
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    const [kRes, evRes, tlRes, modRes, thRes] = await Promise.all([
      adminApi.listKalendas(),
      adminApi.listEvents(),
      adminApi.listTimelines(),
      adminApi.listModules(),
      adminApi.listThemes(),
    ]);
    setKalendas(kRes.items);
    setPool({ events: evRes.items, timelines: tlRes.items, modules: modRes.items, themes: thRes.items });
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? kalendas.filter(k => k.name.toLowerCase().includes(q) || k.region?.toLowerCase().includes(q) || k.slug.includes(q))
      : kalendas;
  }, [kalendas, search]);

  const closeForm = () => setFormMode({ open: false, mode: 'create' });

  if (formMode.open) {
    return (
      <AdminLayout currentView="adminKalenda" navigateTo={navigateTo as any}>
        <div className="container py-6 max-w-3xl space-y-6">
          <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Retour aux Kalenda
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary">
              {formMode.mode === 'create' ? 'Nouveau Kalenda' : `Modifier "${formMode.item?.name}"`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Composez un paquet de contenus ciblés pour un déploiement spécifique.
            </p>
          </div>
          <div className="bg-card border rounded-xl p-6">
            <KalendaForm
              mode={formMode.mode}
              initial={formMode.item}
              pool={pool}
              onSave={() => { closeForm(); load(); }}
              onCancel={closeForm}
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentView="adminKalenda" navigateTo={navigateTo as any}>
      <div className="container py-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
              <PackageIcon /> Kasuku Kalenda
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Paquets de contenus ciblés pour déploiements locaux et hors-ligne.
            </p>
          </div>
          <Button onClick={() => setFormMode({ open: true, mode: 'create' })} className="rounded-full px-5 flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nouveau Kalenda
          </Button>
        </div>

        {/* Gouvernance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Gouvernance :</strong> Un Kalenda sélectionne des contenus existants (événements, récits, modules, thèmes) pour former un paquet
          exportable et déployable sur des instances locales hors-ligne. Les contenus locaux ne sont jamais écrasés lors d'une synchronisation centrale.
        </div>

        {/* Recherche */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un Kalenda…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-xs border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-sm text-muted-foreground">{filtered.length} Kalenda{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-4 border-2 border-dashed rounded-xl">
            <PackageIcon />
            <p className="text-muted-foreground text-sm">
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucun Kalenda créé. Commencez par en créer un.'}
            </p>
            {!search && (
              <Button variant="outline" onClick={() => setFormMode({ open: true, mode: 'create' })}>
                Créer le premier Kalenda
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(k => (
              <KalendaCard
                key={k.id}
                kalenda={k}
                onEdit={() => setFormMode({ open: true, mode: 'edit', item: k })}
                onToggleStatus={async () => {
                  await adminApi.publishKalenda(k.id, k.status === 'published' ? 'draft' : 'published');
                  load();
                }}
                onDelete={async () => {
                  if (!window.confirm(`Supprimer le Kalenda "${k.name}" ? Cette action est irréversible.`)) return;
                  await adminApi.deleteKalenda(k.id);
                  load();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
