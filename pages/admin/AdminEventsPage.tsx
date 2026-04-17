import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { Event } from '../../types';
import { Button } from '../../components/ui/Button';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { Badge } from '../../components/ui/Badge';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminNewEvent' | 'adminEditEvent';

interface AdminEventsPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

export const AdminEventsPage: React.FC<AdminEventsPageProps> = ({ navigateTo }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadEvents = async () => {
        setIsLoading(true);
        const result = await adminApi.listEvents();
        setEvents(result.items);
        setIsLoading(false);
    }

    useEffect(() => {
        loadEvents();
    }, []);

    const handleDelete = async (event: Event) => {
      if (window.confirm(`Voulez-vous vraiment supprimer l'événement "${event.title}" ?`)) {
        await adminApi.deleteEvent(event.id);
        loadEvents();
      }
    }
    
    return (
        <AdminLayout currentView="adminEvents" navigateTo={navigateTo as any}>
            <div className="container py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Événements</h1>
                        <p className="text-muted-foreground">Gérez les faits historiques et culturels du calendrier.</p>
                    </div>
                    <Button onClick={() => navigateTo('adminNewEvent')} className="rounded-full px-6">
                        + Nouvel événement
                    </Button>
                </div>

                <AdminDataTable
                    data={events}
                    isLoading={isLoading}
                    searchKey="title"
                    searchPlaceholder="Rechercher un événement..."
                    onEdit={(e) => navigateTo('adminEditEvent', e.id)}
                    onDelete={handleDelete}
                    columns={[
                        { 
                            header: "Événement", 
                            accessor: (e) => (
                                <div className="flex items-center gap-3">
                                    {e.media?.[0]?.url && (
                                        <img src={e.media[0].url} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
                                    )}
                                    <div>
                                        <div className="font-bold text-secondary">{e.title}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{e.slug}</div>
                                    </div>
                                </div>
                            )
                        },
                        { 
                            header: "Date / Période", 
                            accessor: (e) => (
                                <div className="text-sm font-medium">
                                    {e.dateISO || e.period || e.year || "—"}
                                </div>
                            )
                        },
                        {
                            header: "Thèmes",
                            accessor: (e) => (
                                <div className="flex flex-wrap gap-1">
                                    {e.themes.slice(0, 2).map(t => (
                                        <Badge key={t.id} variant="outline" className="text-[9px] px-1.5 py-0">
                                            {t.name}
                                        </Badge>
                                    ))}
                                    {e.themes.length > 2 && <span className="text-[9px] text-muted-foreground">+{e.themes.length - 2}</span>}
                                </div>
                            )
                        },
                        {
                            header: "Pays",
                            accessor: (e) => <Badge variant="secondary" className="font-mono">{e.countryCode || "—"}</Badge>,
                            className: "w-20"
                        }
                    ]}
                />
            </div>
        </AdminLayout>
    );
};
