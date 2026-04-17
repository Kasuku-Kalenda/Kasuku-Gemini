import React, { useState, useEffect } from 'react';
import { MoodlePackageForm } from '../../../../components/admin/moodle/MoodlePackageForm';
import { adminApi } from '../../../../services/adminApi';
import type { MoodleOfflinePackage } from '../../../../types';
import { AdminLayout } from '../../../../components/admin/AdminLayout';

interface Props {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const MoodlePackageFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<MoodleOfflinePackage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getMoodlePackage(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminMoodlePackages" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminMoodlePackages" navigateTo={() => {}}><p>Package not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminMoodlePackages" navigateTo={onSave as any}>
            <div className="container py-6">
                <h1 className="text-xl font-semibold mb-4">{mode === 'create' ? 'Créer un package' : 'Éditer le package'}</h1>
                <MoodlePackageForm 
                    mode={mode}
                    id={id ?? undefined}
                    initialData={initialData}
                    onSave={onSave}
                />
            </div>
        </AdminLayout>
    );
};
