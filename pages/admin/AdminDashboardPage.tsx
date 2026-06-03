import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../services/adminApi';
import { ContentIcon } from '../../components/icons/ContentIcon';
import { ModulesIcon } from '../../components/icons/ModulesIcon';
import { ThemeIcon } from '../../components/icons/ThemeIcon';
import { MegaphoneIcon } from '../../components/icons/MegaphoneIcon';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { TimelineIcon } from '../../components/icons/TimelineIcon';
import type { Event, TrainingModule } from '../../types';

type AdminNav = string;

interface AdminDashboardPageProps {
  navigateTo: (view: AdminNav, id?: string) => void;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
  onClick: () => void;
  delay?: number;
}> = ({ title, value, sub, icon, color = 'bg-primary/5 text-primary', onClick, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group overflow-hidden relative"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRightIcon className="h-4 w-4 text-primary" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">
          {value === -1 ? <span className="text-muted-foreground text-xl animate-pulse">…</span> : value}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

// ─── Recent item row ──────────────────────────────────────────────────────────
const RecentRow: React.FC<{
  emoji: string;
  title: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}> = ({ emoji, title, sub, badge, badgeColor = '#6B7280', onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left group"
  >
    <span className="text-xl shrink-0">{emoji}</span>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-secondary truncate group-hover:text-primary transition-colors">
        {title}
      </p>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
    {badge && (
      <span
        className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shrink-0"
        style={{ backgroundColor: badgeColor }}
      >
        {badge}
      </span>
    )}
  </button>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigateTo }) => {
  const [counts, setCounts] = useState({
    events: -1, modules: -1, themes: -1, timelines: -1, featured: -1,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentModules, setRecentModules] = useState<TrainingModule[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(true);

  useEffect(() => {
    // Load counts + recent content — use allSettled so one missing endpoint
    // doesn't wipe out all stats
    Promise.allSettled([
      adminApi.listEvents(),
      adminApi.listModules(),
      adminApi.listThemes(),
      adminApi.listTimelines(),
      adminApi.listFeatured(),
    ]).then(([evRes, modRes, thRes, tlRes, ftRes]) => {
      const events    = evRes.status    === 'fulfilled' ? (evRes.value.items  ?? []) : [];
      const modules   = modRes.status   === 'fulfilled' ? (modRes.value.items ?? []) : [];
      const themesRaw = thRes.status    === 'fulfilled' ? thRes.value : [];
      const timelines = tlRes.status    === 'fulfilled' ? (tlRes.value.items  ?? []) : [];
      const featured  = ftRes.status    === 'fulfilled' ? (ftRes.value.items  ?? []) : [];

      const themes = (themesRaw as unknown as { items: unknown[] })?.items ?? themesRaw ?? [];

      setCounts({
        events:    evRes.status  === 'fulfilled' ? (evRes.value.total  ?? events.length)    : 0,
        modules:   modRes.status === 'fulfilled' ? (modRes.value.total ?? modules.length)   : 0,
        themes:    (themes as unknown[]).length,
        timelines: tlRes.status  === 'fulfilled' ? (tlRes.value.total  ?? timelines.length) : 0,
        featured:  ftRes.status  === 'fulfilled' ? (ftRes.value.total  ?? featured.length)  : 0,
      });
      setRecentEvents(events.slice(0, 5) as Event[]);
      setRecentModules(modules.slice(0, 5) as TrainingModule[]);
      setIsRecentLoading(false);
    });
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <AdminLayout currentView="adminDashboard" navigateTo={navigateTo as any}>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-dark">Tableau de bord</h1>
            <p className="text-muted-foreground text-sm capitalize">{today}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => navigateTo('adminNewEvent')} className="rounded-full px-6">
              + Nouvel événement
            </Button>
            <Button onClick={() => navigateTo('adminNewModule')} variant="outline" className="rounded-full px-6">
              + Nouveau module
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="À la une" value={counts.featured}
            icon={<MegaphoneIcon className="h-5 w-5" />}
            color="bg-amber-50 text-amber-600"
            onClick={() => navigateTo('adminFeatured')} delay={0.05}
          />
          <StatCard
            title="Événements" value={counts.events}
            sub={counts.events > 0 ? 'dans le calendrier' : undefined}
            icon={<ContentIcon className="h-5 w-5" />}
            color="bg-blue-50 text-blue-600"
            onClick={() => navigateTo('adminEvents')} delay={0.1}
          />
          <StatCard
            title="Modules" value={counts.modules}
            sub={counts.modules > 0 ? 'cours disponibles' : undefined}
            icon={<ModulesIcon className="h-5 w-5" />}
            color="bg-green-50 text-green-600"
            onClick={() => navigateTo('adminModules')} delay={0.15}
          />
          <StatCard
            title="Thèmes" value={counts.themes}
            icon={<ThemeIcon className="h-5 w-5" />}
            color="bg-purple-50 text-purple-600"
            onClick={() => navigateTo('adminThemes')} delay={0.2}
          />
          <StatCard
            title="Récits" value={counts.timelines}
            icon={<TimelineIcon className="h-5 w-5" />}
            color="bg-rose-50 text-rose-600"
            onClick={() => navigateTo('adminTimelines')} delay={0.25}
          />
        </div>

        {/* Recent content */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Recent events */}
          <Card className="rounded-2xl border-muted shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">📅 Derniers événements</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7"
                onClick={() => navigateTo('adminEvents')}>
                Voir tout →
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {isRecentLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm">Aucun événement pour l'instant.</p>
                  <Button size="sm" className="mt-3" onClick={() => navigateTo('adminNewEvent')}>
                    Créer un événement
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentEvents.map(ev => (
                    <RecentRow
                      key={ev.id}
                      emoji="📅"
                      title={ev.title}
                      sub={ev.dateISO ?? (ev.year ? String(ev.year) : ev.period ?? '')}
                      badge={ev.countryCode}
                      onClick={() => navigateTo('adminEditEvent', ev.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent modules */}
          <Card className="rounded-2xl border-muted shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">🎓 Derniers modules</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7"
                onClick={() => navigateTo('adminModules')}>
                Voir tout →
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {isRecentLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentModules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm">Aucun module pour l'instant.</p>
                  <Button size="sm" className="mt-3" onClick={() => navigateTo('adminNewModule')}>
                    Créer un module
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentModules.map(mod => (
                    <RecentRow
                      key={mod.id}
                      emoji={mod.moduleType === 'moodle' ? '🔗' : '🎓'}
                      title={mod.title}
                      sub={mod.level ?? mod.language ?? undefined}
                      badge={mod.moduleType === 'moodle' ? 'Moodle' : 'Kasuku'}
                      badgeColor={mod.moduleType === 'moodle' ? '#E57C3C' : '#4CAF7D'}
                      onClick={() => navigateTo('adminEditModule', mod.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="rounded-2xl border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">⚡ Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Nouvel événement', emoji: '📅', view: 'adminNewEvent' },
                { label: 'Nouveau module', emoji: '🎓', view: 'adminNewModule' },
                { label: 'Nouveau récit', emoji: '🎭', view: 'adminNewTimeline' },
                { label: 'Importer en masse', emoji: '⬆️', view: 'adminImport' },
              ].map(a => (
                <button
                  key={a.view}
                  onClick={() => navigateTo(a.view)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-muted hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                  <span className="text-xs font-bold text-secondary text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
};
