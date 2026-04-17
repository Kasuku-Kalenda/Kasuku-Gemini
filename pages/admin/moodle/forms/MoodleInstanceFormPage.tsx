import React, { useState, useEffect } from 'react';
import { MoodleInstanceForm } from '../../../../components/admin/moodle/MoodleInstanceForm';
import { adminApi } from '../../../../services/adminApi';
import type { MoodleInstance } from '../../../../types';
import { AdminLayout } from '../../../../components/admin/AdminLayout';

interface Props {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const MoodleInstanceFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<MoodleInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getMoodleInstance(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminMoodleInstances" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminMoodleInstances" navigateTo={() => {}}><p>Instance not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminMoodleInstances" navigateTo={onSave as any}>
            <div className="container py-6">
                <h1 className="text-xl font-semibold mb-4">{mode === 'create' ? 'Créer une instance Moodle' : 'Éditer l’instance'}</h1>
                <MoodleInstanceForm 
                    mode={mode}
                    id={id ?? undefined}
                    initialData={initialData}
                    onSave={onSave}
                />
            </div>
        </AdminLayout>
    );
};
