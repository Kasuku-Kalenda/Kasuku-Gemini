import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { Theme } from '../../types';
import { Button } from '../../components/ui/Button';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminNewTheme' | 'adminEditTheme';

interface AdminThemesPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

export const AdminThemesPage: React.FC<AdminThemesPageProps> = ({ navigateTo }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setIsLoading(true);
    const result = await adminApi.listThemes();
    setThemes(result.items);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = themes.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (theme: Theme) => {
    if (!confirm(`Supprimer le thème "${theme.name}" ? Cette action est irréversible.`)) return;
    await adminApi.deleteTheme(theme.id);
    load();
  };

  return (
    <AdminLayout currentView="adminThemes" navigateTo={navigateTo as any}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thèmes</h1>
            <p className="text-muted-foreground text-sm">
              Catégories thématiques utilisées pour filtrer les événements.
            </p>
          </div>
          <Button onClick={() => navigateTo('adminNewTheme')} className="rounded-full px-6">
            + Nouveau thème
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un thème…"
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="font-bold text-secondary">
              {search ? 'Aucun thème trouvé' : 'Aucun thème créé'}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => navigateTo('adminNewTheme')}>
                Créer le premier thème
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(theme => (
              <div
                key={theme.id}
                className="group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Color bar */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: theme.color || '#6B7280' }}
                />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black shrink-0"
                      style={{ backgroundColor: theme.color || '#6B7280' }}
                    >
                      {theme.emoji || theme.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-secondary truncate">{theme.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{theme.slug}</p>
                    </div>
                  </div>
                </div>
                {/* Actions (on hover) */}
                <div className="absolute inset-x-0 bottom-0 flex border-t border-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigateTo('adminEditTheme', theme.id)}
                    className="flex-1 py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(theme)}
                    className="flex-1 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-l border-muted"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Count */}
        {!isLoading && themes.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {filtered.length} thème{filtered.length > 1 ? 's' : ''}{search ? ` sur ${themes.length}` : ''}
          </p>
        )}
      </div>
    </AdminLayout>
  );
};
