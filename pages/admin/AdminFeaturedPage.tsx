import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/adminApi';
import type { FeaturedItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { Badge } from '../../components/ui/Badge';

type AdminView = 'adminDashboard' | 'adminEvents' | 'adminModules' | 'adminThemes' | 'adminFeatured' | 'adminNewFeatured' | 'adminEditFeatured';

interface AdminFeaturedPageProps {
  navigateTo: (view: AdminView, id?: string) => void;
}

export const AdminFeaturedPage: React.FC<AdminFeaturedPageProps> = ({ navigateTo }) => {
    const [data, setData] = useState<{ items: FeaturedItem[] }>({ items: [] });
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = async () => {
        setIsLoading(true);
        const result = await adminApi.listFeatured();
        setData(result);
        setIsLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);

    const handleDelete = async (item: FeaturedItem) => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'élément à la une "${item.title}" ?`)) {
        await adminApi.deleteFeatured(item.id);
        loadItems();
      }
    }

    const columns = [
        { 
            header: 'Image', 
            accessor: (item: FeaturedItem) => (
                <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-xl object-cover bg-muted" />
            ),
            className: 'w-16'
        },
        { header: 'Titre', accessor: 'title' as keyof FeaturedItem, className: 'font-bold text-dark' },
        { 
            header: 'Ordre', 
            accessor: (item: FeaturedItem) => (
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{item.order}</span>
            ),
            className: 'w-20 text-center'
        },
        { 
            header: 'Statut', 
            accessor: (item: FeaturedItem) => (
                <Badge variant={item.active ? 'default' : 'secondary'}>
                    {item.active ? 'Actif' : 'Inactif'}
                </Badge>
            ),
            className: 'w-32'
        },
    ];
    
    return (
        <AdminLayout currentView="adminFeatured" navigateTo={navigateTo as any}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestion "À la une"</h1>
                        <p className="text-muted-foreground">Gérez les bannières promotionnelles de la page d'accueil.</p>
                    </div>
                    <Button onClick={() => navigateTo('adminNewFeatured')} className="rounded-full px-6">
                        + Nouvel Élément
                    </Button>
                </div>

                <AdminDataTable 
                    data={data.items}
                    columns={columns}
                    isLoading={isLoading}
                    onEdit={(item) => navigateTo('adminEditFeatured', item.id)}
                    onDelete={handleDelete}
                    searchKey="title"
                    searchPlaceholder="Rechercher par titre..."
                />
            </div>
        </AdminLayout>
    );
};
