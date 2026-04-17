
import React, { useState, useEffect } from 'react';
import { TimelineForm } from '../../../components/admin/TimelineForm';
import { adminApi } from '../../../services/adminApi';
import type { TimelineNarrative } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { ArrowLeftIcon } from '../../../components/icons/ArrowLeftIcon';

interface Props {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const TimelineFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<TimelineNarrative | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getTimeline(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return (
            <AdminLayout currentView="adminTimelines" navigateTo={() => {}}>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentView="adminTimelines" navigateTo={onSave as any}>
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8 flex items-center justify-between">
                    <button onClick={onSave} className="flex items-center gap-2 text-sm text-primary hover:underline font-bold uppercase tracking-wider">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Retour à la liste
                    </button>
                    <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">
                        {mode === 'create' ? 'Nouveau Parcours' : 'Édition du Parcours'}
                    </h1>
                </div>
                
                <TimelineForm 
                    mode={mode}
                    initialData={initialData}
                    onSave={onSave}
                />
            </div>
        </AdminLayout>
    );
};
