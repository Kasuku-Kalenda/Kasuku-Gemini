import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { TimelineNarrative, Event } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminDataTable } from '../../components/admin/AdminDataTable';

type AdminView = 'adminDashboard' | 'adminTimelines' | 'adminNewTimeline' | 'adminEditTimeline';

interface AdminTimelinesPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

export const AdminTimelinesPage: React.FC<AdminTimelinesPageProps> = ({ navigateTo }) => {
    const [timelines, setTimelines] = useState<TimelineNarrative[]>([]);
    const [linkedEventCounts, setLinkedEventCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    const loadTimelines = async () => {
        setIsLoading(true);
        const [result, evRes] = await Promise.all([
            adminApi.listTimelines(),
            adminApi.listEvents(),
        ]);
        const allEvents = evRes.items ?? [];
        setTimelines(result.items);
        // Compte les événements liés à chaque timeline
        const counts: Record<string, number> = {};
        for (const tl of result.items) {
            counts[tl.id] = allEvents.filter(
                (e: Event) => e.timelineId === tl.id || e.timelineSlug === tl.slug
            ).length;
        }
        setLinkedEventCounts(counts);
        setIsLoading(false);
    }

    useEffect(() => {
        loadTimelines();
    }, []);

    const handleDelete = async (timeline: TimelineNarrative) => {
      if (window.confirm(`Voulez-vous vraiment supprimer le parcours "${timeline.title}" ? Tous les moments associés seront perdus.`)) {
        await adminApi.deleteTimeline(timeline.id);
        loadTimelines();
      }
    }
    
    return (
        <AdminLayout currentView="adminTimelines" navigateTo={navigateTo as any}>
            <div className="container py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Récits & Parcours</h1>
                        <p className="text-muted-foreground">Gérez les trajectoires narratives de Kasuku.</p>
                    </div>
                    <Button onClick={() => navigateTo('adminNewTimeline')} className="rounded-full px-6">
                        + Nouveau parcours
                    </Button>
                </div>

                <AdminDataTable
                    data={timelines}
                    isLoading={isLoading}
                    searchKey="title"
                    searchPlaceholder="Rechercher un parcours..."
                    onEdit={(t) => navigateTo('adminEditTimeline', t.id)}
                    onDelete={handleDelete}
                    columns={[
                        {
                            header: "Parcours",
                            accessor: (t) => (
                                <div className="flex items-center gap-3">
                                    <img src={t.coverUrl} alt="" className="w-12 h-10 rounded-lg object-cover bg-muted" />
                                    <div>
                                        <div className="font-bold text-secondary">{t.title}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{t.slug}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: "Type",
                            accessor: (t) => (
                                <Badge variant="outline" className="capitalize text-[10px]">
                                    {t.type === 'personnage' ? '👤 Personnage' : '🏛️ Événement'}
                                </Badge>
                            )
                        },
                        {
                            header: "Statut",
                            accessor: (t) => (
                                <Badge variant={t.status === 'published' ? 'secondary' : 'outline'} className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5">
                                    {t.status === 'published' ? 'Publié' : 'Brouillon'}
                                </Badge>
                            )
                        },
                        {
                            header: "Moments",
                            accessor: (t) => (
                                <span className="text-sm font-bold text-primary">{t.eventCount ?? 0}</span>
                            ),
                            className: "text-center w-20"
                        },
                        {
                            header: "Évén. liés",
                            accessor: (t) => {
                                const count = linkedEventCounts[t.id] ?? 0;
                                return (
                                    <span className={`text-sm font-bold ${count > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {count > 0 ? `+${count}` : '—'}
                                    </span>
                                );
                            },
                            className: "text-center w-24"
                        },
                        {
                            header: "Source",
                            accessor: (t) => {
                                const src = t.source;
                                if (!src) return <span className="text-[9px] text-muted-foreground">—</span>;
                                if (src.type === 'central') return <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">🏛️ Central</span>;
                                if (src.type === 'imported_csv') return <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5">⬆️ Importé</span>;
                                return <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">📍 Local</span>;
                            },
                            className: "w-24"
                        }
                    ]}
                />
            </div>
        </AdminLayout>
    );
};
