import React, { useState, useEffect } from 'react';
import { FeaturedForm } from '../../../components/admin/FeaturedForm';
import { adminApi } from '../../../services/adminApi';
import type { FeaturedItem } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useNavigation } from '../../../core/navigation';
import type { AppView } from '../../../core/navigation';

interface FeaturedFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const FeaturedFormPage: React.FC<FeaturedFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<FeaturedItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { navigate } = useNavigation();

    const navigateTo = (v: string, itemId?: string) =>
        navigate(v as AppView, itemId ? { id: itemId } : undefined);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getFeatured(id).then(data => {
                if (data) {
                    setInitialData(data);
                } else {
                    setNotFound(true);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return (
            <AdminLayout currentView="adminFeatured" navigateTo={navigateTo as any}>
                <div className="flex items-center justify-center py-24 text-muted-foreground">
                    Chargement…
                </div>
            </AdminLayout>
        );
    }

    if (notFound) {
        return (
            <AdminLayout currentView="adminFeatured" navigateTo={navigateTo as any}>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-lg font-semibold text-destructive">Élément introuvable.</p>
                    <button
                        onClick={() => navigate('adminFeatured')}
                        className="text-primary underline text-sm"
                    >
                        ← Retour à la liste
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentView="adminFeatured" navigateTo={navigateTo as any}>
            <FeaturedForm
                mode={mode}
                initialData={initialData}
                onSave={onSave}
            />
        </AdminLayout>
    );
};
