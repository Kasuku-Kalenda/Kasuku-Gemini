import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { TrainingModule } from '../../types';
import { Button } from '../../components/ui/Button';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { Badge } from '../../components/ui/Badge';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminNewModule' | 'adminEditModule';

interface AdminModulesPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

export const AdminModulesPage: React.FC<AdminModulesPageProps> = ({ navigateTo }) => {
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadModules = async () => {
        setIsLoading(true);
        const result = await adminApi.listModules();
        setModules(result.items);
        setIsLoading(false);
    }

    useEffect(() => {
        loadModules();
    }, []);

    const handleDelete = async (module: TrainingModule) => {
      if (window.confirm(`Voulez-vous vraiment supprimer le module "${module.title}" ?`)) {
        await adminApi.deleteModule(module.id);
        loadModules();
      }
    }

    return (
        <AdminLayout currentView="adminModules" navigateTo={navigateTo as any}>
            <div className="container py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Modules de Formation</h1>
                        <p className="text-muted-foreground">Gérez les contenus pédagogiques et les liens Moodle.</p>
                    </div>
                    <Button onClick={() => navigateTo('adminNewModule')} className="rounded-full px-6">
                        + Nouveau module
                    </Button>
                </div>

                <AdminDataTable
                    data={modules}
                    isLoading={isLoading}
                    searchKey="title"
                    searchPlaceholder="Rechercher un module..."
                    onEdit={(m) => navigateTo('adminEditModule', m.id)}
                    onDelete={handleDelete}
                    columns={[
                        {
                            header: "Module",
                            accessor: (m) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {m.moduleType === 'moodle' ? 'M' : 'K'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-secondary">{m.title}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{m.slug}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: "Type",
                            accessor: (m) => (
                                <Badge variant={m.moduleType === 'moodle' ? 'secondary' : 'outline'} className="uppercase text-[9px]">
                                    {m.moduleType === 'moodle' ? 'Moodle LTI' : 'Interne'}
                                </Badge>
                            )
                        },
                        {
                            header: "Niveau",
                            accessor: (m) => <span className="text-sm font-medium">{m.level || "—"}</span>
                        },
                        {
                            header: "Langue",
                            accessor: (m) => <Badge variant="outline" className="uppercase">{m.language || "—"}</Badge>
                        },
                        {
                            header: "Source",
                            accessor: (m) => {
                                const src = m.source;
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
