import React, { useState, useEffect } from 'react';
import { ModuleForm } from '../../../components/admin/ModuleForm';
import { adminApi } from '../../../services/adminApi';
import type { TrainingModule } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';

interface ModuleFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const ModuleFormPage: React.FC<ModuleFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<TrainingModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getModule(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminModules" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminModules" navigateTo={() => {}}><p>Module not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminModules" navigateTo={onSave as any}>
            <ModuleForm 
                mode={mode}
                initialData={initialData}
                onSave={onSave}
            />
        </AdminLayout>
    );
};