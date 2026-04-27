import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { syncService, syncConfig, type SyncPackage, type SyncProgress, type SyncPackageType } from '../../services/sync.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// ─── Icônes inline ────────────────────────────────────────────────────────────

const WifiIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const WifiOffIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a11 11 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const DownloadIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CheckIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const RefreshIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const SettingsIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SyncPackageType, string> = {
  events: 'Événements',
  timelines: 'Timelines / Récits',
  themes: 'Thématiques',
  modules: 'Modules de formation',
};

const TYPE_COLORS: Record<SyncPackageType, string> = {
  events: 'bg-blue-100 text-blue-800',
  timelines: 'bg-purple-100 text-purple-800',
  themes: 'bg-green-100 text-green-800',
  modules: 'bg-orange-100 text-orange-800',
};

function formatBytes(kb: number) {
  if (kb < 1024) return `${kb} Ko`;
  return `${(kb / 1024).toFixed(1)} Mo`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AdminSyncPageProps {
  navigateTo: (view: string) => void;
}

type SyncState = 'idle' | 'loading-catalog' | 'syncing' | 'done' | 'error';

export const AdminSyncPage: React.FC<AdminSyncPageProps> = ({ navigateTo }) => {
  const [isOnline, setIsOnline] = useState(syncService.isOnline());
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [catalog, setCatalog] = useState<SyncPackage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progresses, setProgresses] = useState<Record<string, SyncProgress>>({} as Record<string, SyncProgress>);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(syncConfig.getLastSync());
  const [serverUrl, setServerUrl] = useState(syncConfig.getServerUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [filterType, setFilterType] = useState<SyncPackageType | 'all'>('all');

  // Suivi de la connexion
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    setSyncState('loading-catalog');
    setErrorMsg(null);
    try {
      const packages = await syncService.fetchCatalog();
      setCatalog(packages);
      setSyncState('idle');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Impossible de charger le catalogue.');
      setSyncState('error');
    }
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const visible = catalog.filter(p => filterType === 'all' || p.type === filterType);
    setSelected(new Set(visible.map(p => p.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const handleSync = async () => {
    if (selected.size === 0) return;
    setSyncState('syncing');
    setErrorMsg(null);

    const initProgresses: Record<string, SyncProgress> = {};
    selected.forEach(id => {
      initProgresses[id] = { packageId: id, status: 'pending', progress: 0 };
    });
    setProgresses(initProgresses);

    try {
      await syncService.pullPackages([...selected], (progress) => {
        setProgresses(prev => ({ ...prev, [progress.packageId]: progress }));
      });
      setLastSync(syncConfig.getLastSync());
      setSyncState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la synchronisation.');
      setSyncState('error');
    }
  };

  const saveServerUrl = () => {
    syncConfig.setServerUrl(serverUrl);
    setShowServerConfig(false);
  };

  const filtered = catalog.filter(p => filterType === 'all' || p.type === filterType);
  const isSyncing = syncState === 'syncing';
  const totalSizeKb = [...selected].reduce((sum, id) => {
    const pkg = catalog.find(p => p.id === id);
    return sum + (pkg?.sizeKb ?? 0);
  }, 0);

  return (
    <AdminLayout currentView={'adminSync' as any} navigateTo={navigateTo as any}>
      <div className="container py-6 space-y-6 max-w-4xl">

        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Synchronisation</h1>
            <p className="text-muted-foreground mt-1">
              Mettez à jour votre version offline depuis le serveur central Kasuku.
            </p>
          </div>
          <button
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="p-2 rounded-lg border hover:bg-muted transition-colors"
            title="Configurer le serveur"
          >
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Config serveur */}
        {showServerConfig && (
          <div className="border rounded-xl p-4 bg-card space-y-3">
            <h3 className="font-semibold text-sm text-secondary">Configuration du serveur central</h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="https://app.kasuku.com"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
              <Button size="sm" onClick={saveServerUrl}>Enregistrer</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              L'URL du serveur Kasuku central. Laissez vide pour utiliser le catalogue de démonstration.
            </p>
          </div>
        )}

        {/* Statut connexion */}
        <div className={`flex items-center justify-between p-4 rounded-xl border ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {isOnline
              ? <WifiIcon className="h-5 w-5 text-green-600" />
              : <WifiOffIcon className="h-5 w-5 text-red-500" />}
            <div>
              <p className={`font-semibold text-sm ${isOnline ? 'text-green-800' : 'text-red-700'}`}>
                {isOnline ? 'Connecté à internet' : 'Mode hors connexion'}
              </p>
              <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                {isOnline
                  ? 'Vous pouvez synchroniser votre base de données locale.'
                  : 'Connectez-vous à internet pour accéder au catalogue et synchroniser.'}
              </p>
            </div>
          </div>
          {lastSync && (
            <div className="text-right text-xs text-muted-foreground hidden sm:block">
              <p className="font-medium">Dernière sync</p>
              <p>{formatDate(lastSync)}</p>
            </div>
          )}
        </div>

        {/* Bouton charger catalogue */}
        {catalog.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <DownloadIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {isOnline
                ? 'Chargez le catalogue des contenus disponibles sur le serveur.'
                : 'Connexion internet requise pour charger le catalogue.'}
            </p>
            <Button
              onClick={loadCatalog}
              disabled={!isOnline || syncState === 'loading-catalog'}
              className="gap-2"
            >
              {syncState === 'loading-catalog' ? (
                <>
                  <RefreshIcon className="h-4 w-4 animate-spin" />
                  Chargement…
                </>
              ) : (
                <>
                  <RefreshIcon className="h-4 w-4" />
                  Charger le catalogue
                </>
              )}
            </Button>
          </div>
        )}

        {/* Erreur */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Catalogue chargé */}
        {catalog.length > 0 && (
          <div className="space-y-4">
            {/* Barre d'outils */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 flex-wrap">
                {(['all', 'events', 'timelines', 'themes', 'modules'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      filterType === type
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {type === 'all' ? 'Tout' : TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={selectAll} className="text-xs text-primary underline">
                  Tout sélectionner
                </button>
                {selected.size > 0 && (
                  <button onClick={clearSelection} className="text-xs text-muted-foreground underline">
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Liste des paquets */}
            <div className="space-y-3">
              {filtered.map(pkg => {
                const isSelected = selected.has(pkg.id);
                const progress = progresses[pkg.id];
                const isDone = progress?.status === 'done';
                const hasError = progress?.status === 'error';

                return (
                  <div
                    key={pkg.id}
                    onClick={() => !isSyncing && toggleSelect(pkg.id)}
                    className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40'
                    } ${isSyncing ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Cover */}
                      {pkg.coverUrl && (
                        <img
                          src={pkg.coverUrl}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-muted"
                        />
                      )}

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLORS[pkg.type]}`}>
                              {TYPE_LABELS[pkg.type]}
                            </span>
                            <h3 className="font-bold text-secondary text-sm">{pkg.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pkg.description}</p>
                          </div>
                          {/* Checkbox */}
                          <div className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground">{pkg.itemCount} éléments</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{formatBytes(pkg.sizeKb)}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">Màj {formatDate(pkg.lastUpdated)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pkg.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    {progress && !isDone && !hasError && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{progress.status === 'downloading' ? 'Téléchargement…' : 'Enregistrement…'}</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Succès */}
                    {isDone && (
                      <div className="mt-2 flex items-center gap-1.5 text-green-600 text-xs font-medium">
                        <CheckIcon className="h-3.5 w-3.5" />
                        Synchronisé avec succès
                      </div>
                    )}

                    {/* Erreur */}
                    {hasError && (
                      <div className="mt-2 text-red-500 text-xs">{progress.error}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer d'action */}
            {selected.size > 0 && (
              <div className="sticky bottom-4 bg-card/90 backdrop-blur-sm border rounded-xl p-4 shadow-lg flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm text-secondary">
                    {selected.size} paquet{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">~{formatBytes(totalSizeKb)} à télécharger</p>
                </div>
                <Button
                  onClick={handleSync}
                  disabled={isSyncing || !isOnline}
                  className="gap-2 whitespace-nowrap"
                >
                  {isSyncing ? (
                    <>
                      <RefreshIcon className="h-4 w-4 animate-spin" />
                      Synchronisation…
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4" />
                      Synchroniser la sélection
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Résultat final */}
            {syncState === 'done' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800 font-semibold">✓ Synchronisation terminée</p>
                <p className="text-green-600 text-sm mt-1">
                  {(Object.values(progresses) as SyncProgress[]).filter(p => p.status === 'done').length} paquet(s) mis à jour dans votre base locale.
                </p>
                <button
                  onClick={() => { setCatalog([]); setProgresses({}); setSyncState('idle'); setSelected(new Set()); }}
                  className="text-xs text-primary underline mt-2"
                >
                  Recharger le catalogue
                </button>
              </div>
            )}

            {/* Bouton rafraîchir catalogue */}
            <div className="text-center">
              <button
                onClick={loadCatalog}
                disabled={!isOnline || isSyncing}
                className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
              >
                Rafraîchir le catalogue
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
