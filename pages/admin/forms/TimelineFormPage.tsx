import React, { useState, useEffect } from 'react';
import { TimelineForm } from '../../../components/admin/TimelineForm';
import { adminApi } from '../../../services/adminApi';
import type { TimelineNarrative } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { ArrowLeftIcon } from '../../../components/icons/ArrowLeftIcon';
import { useNavigation } from '../../../core/navigation';
import type { AppView } from '../../../core/navigation';

interface Props {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const TimelineFormPage: React.FC<Props> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<TimelineNarrative | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { navigate } = useNavigation();

    const navigateTo = (v: string, itemId?: string) =>
        navigate(v as AppView, itemId ? { id: itemId } : undefined);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getTimeline(id).then(data => {
                if (data) setInitialData(data); else setNotFound(true);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return (
            <AdminLayout currentView="adminTimelines" navigateTo={navigateTo as any}>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (notFound) {
        return (
            <AdminLayout currentView="adminTimelines" navigateTo={navigateTo as any}>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-lg font-semibold text-destructive">Parcours introuvable.</p>
                    <button onClick={() => navigate('adminTimelines')} className="text-primary underline text-sm">← Retour à la liste</button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentView="adminTimelines" navigateTo={navigateTo as any}>
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8 flex items-center justify-between">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 text-sm text-primary hover:underline font-bold uppercase tracking-wider"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Retour à la liste
                    </button>
                    <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">
                        {mode === 'create' ? 'Nouveau Parcours' : 'Édition du Parcours'}
                    </h1>
                </div>
                <TimelineForm mode={mode} initialData={initialData} onSave={onSave} />
            </div>
        </AdminLayout>
    );
};
