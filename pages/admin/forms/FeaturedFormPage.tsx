import React, { useState, useEffect } from 'react';
import { FeaturedForm } from '../../../components/admin/FeaturedForm';
import { adminApi } from '../../../services/adminApi';
import type { FeaturedItem } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';

interface FeaturedFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const FeaturedFormPage: React.FC<FeaturedFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<FeaturedItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getFeatured(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminFeatured" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminFeatured" navigateTo={() => {}}><p>Featured Item not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminFeatured" navigateTo={onSave as any}>
            <FeaturedForm 
                mode={mode}
                initialData={initialData}
                onSave={onSave}
            />
        </AdminLayout>
    );
};