import React, { useState, useEffect } from 'react';
import { ThemeForm } from '../../../components/admin/ThemeForm';
import { adminApi } from '../../../services/adminApi';
import type { Theme } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';

interface ThemeFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const ThemeFormPage: React.FC<ThemeFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<Theme | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getTheme(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminThemes" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminThemes" navigateTo={() => {}}><p>Theme not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminThemes" navigateTo={onSave as any}>
            <ThemeForm 
                mode={mode}
                initialData={initialData}
                onSave={onSave}
            />
        </AdminLayout>
    );
};