import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { Theme } from '../../types';
import { Button } from '../../components/ui/Button';
import { AdminDataTable } from '../../components/admin/AdminDataTable';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminNewTheme' | 'adminEditTheme';

interface AdminThemesPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

export const AdminThemesPage: React.FC<AdminThemesPageProps> = ({ navigateTo }) => {
    const [data, setData] = useState<{ items: Theme[] }>({ items: [] });
    const [isLoading, setIsLoading] = useState(true);

    const loadThemes = async () => {
        setIsLoading(true);
        const result = await adminApi.listThemes();
        setData(result);
        setIsLoading(false);
    }

    useEffect(() => {
        loadThemes();
    }, []);

     const handleDelete = async (theme: Theme) => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le thème "${theme.name}" ?`)) {
        await adminApi.deleteTheme(theme.id);
        loadThemes(); // Refresh list
      }
    }

    const columns = [
        { header: 'Nom', accessor: 'name' as keyof Theme, className: 'font-bold text-dark' },
        { header: 'Slug', accessor: 'slug' as keyof Theme, className: 'text-muted-foreground font-mono text-xs' },
    ];

    return (
        <AdminLayout currentView="adminThemes" navigateTo={navigateTo as any}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Thèmes</h1>
                        <p className="text-muted-foreground">Gérez les catégories thématiques de vos événements.</p>
                    </div>
                    <Button onClick={() => navigateTo('adminNewTheme')} className="rounded-full px-6">
                        + Nouveau Thème
                    </Button>
                </div>

                <AdminDataTable 
                    data={data.items}
                    columns={columns}
                    isLoading={isLoading}
                    onEdit={(theme) => navigateTo('adminEditTheme', theme.id)}
                    onDelete={handleDelete}
                    searchKey="name"
                    searchPlaceholder="Rechercher un thème..."
                />
            </div>
        </AdminLayout>
    );
}
