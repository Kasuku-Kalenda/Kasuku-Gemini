import React, { useState, useEffect } from 'react';
import { MoodleMapForm } from '../../../../components/admin/moodle/MoodleMapForm';
import { adminApi } from '../../../../services/adminApi';
import type { MoodleCourseMap } from '../../../../types';
import { AdminLayout } from '../../../../components/admin/AdminLayout';

interface Props {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const MoodleMapFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<MoodleCourseMap | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getMoodleMap(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminMoodleMaps" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminMoodleMaps" navigateTo={() => {}}><p>Map not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminMoodleMaps" navigateTo={onSave as any}>
            <div className="container py-6">
                <h1 className="text-xl font-semibold mb-4">{mode === 'create' ? 'Créer un mapping' : 'Éditer le mapping'}</h1>
                <MoodleMapForm
                    mode={mode}
                    id={id ?? undefined}
                    initialData={initialData}
                    onSave={onSave}
                />
            </div>
        </AdminLayout>
    );
};
