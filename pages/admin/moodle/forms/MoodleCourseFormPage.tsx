import React, { useState, useEffect } from 'react';
import { MoodleCourseForm } from '../../../../components/admin/moodle/MoodleCourseForm';
import { adminApi } from '../../../../services/adminApi';
import type { MoodleCourse } from '../../../../types';
import { AdminLayout } from '../../../../components/admin/AdminLayout';

interface Props {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const MoodleCourseFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<MoodleCourse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getMoodleCourse(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminMoodleCourses" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminMoodleCourses" navigateTo={() => {}}><p>Course not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminMoodleCourses" navigateTo={onSave as any}>
             <div className="container py-6">
                <h1 className="text-xl font-semibold mb-4">{mode === 'create' ? 'Créer un cours Moodle' : 'Éditer le cours'}</h1>
                <MoodleCourseForm 
                    mode={mode}
                    id={id ?? undefined}
                    initialData={initialData}
                    onSave={onSave}
                />
            </div>
        </AdminLayout>
    );
};
