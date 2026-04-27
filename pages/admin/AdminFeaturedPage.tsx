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

    const today = new Date().toISOString().split('T')[0];

    const getVisibility = (item: FeaturedItem) => {
        if (!item.active) return { label: 'Inactif', color: 'bg-gray-100 text-gray-500' };
        if (today < item.startDate) return { label: 'Pas encore visible', color: 'bg-blue-50 text-blue-600' };
        if (today > item.endDate) return { label: 'Expiré', color: 'bg-amber-50 text-amber-600' };
        return { label: '● Visible', color: 'bg-green-50 text-green-700' };
    };

    const columns = [
        {
            header: 'Image',
            accessor: (item: FeaturedItem) => (
                <img
                    src={item.imageUrl || 'https://i.postimg.cc/8cYFbspt/Kasuku-logo.png'}
                    alt={item.title}
                    className="w-12 h-12 rounded-xl object-cover bg-muted"
                    referrerPolicy="no-referrer"
                />
            ),
            className: 'w-16'
        },
        {
            header: 'Titre',
            accessor: (item: FeaturedItem) => (
                <div>
                    <div className="font-bold text-dark">{item.title}</div>
                    {item.ctaTo && <div className="text-xs text-muted-foreground mt-0.5">→ {item.ctaTo}</div>}
                </div>
            ),
        },
        {
            header: 'Période',
            accessor: (item: FeaturedItem) => (
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                    <div>{item.startDate}</div>
                    <div>→ {item.endDate}</div>
                </div>
            ),
            className: 'w-32'
        },
        {
            header: 'Ordre',
            accessor: (item: FeaturedItem) => (
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{item.order}</span>
            ),
            className: 'w-16 text-center'
        },
        {
            header: 'Visibilité',
            accessor: (item: FeaturedItem) => {
                const v = getVisibility(item);
                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${v.color}`}>
                        {v.label}
                    </span>
                );
            },
            className: 'w-36'
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
