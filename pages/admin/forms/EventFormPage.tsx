import React, { useState, useEffect } from 'react';
import { EventForm } from '../../../components/admin/EventForm';
import { adminApi } from '../../../services/adminApi';
import type { Event } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useNavigation } from '../../../core/navigation';
import type { AppView } from '../../../core/navigation';

interface EventFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const EventFormPage: React.FC<EventFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { navigate } = useNavigation();

    const navigateTo = (v: string, itemId?: string) =>
        navigate(v as AppView, itemId ? { id: itemId } : undefined);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getEvent(id).then(data => {
                if (data) setInitialData(data); else setNotFound(true);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return (
            <AdminLayout currentView="adminEvents" navigateTo={navigateTo as any}>
                <div className="flex items-center justify-center py-24 text-muted-foreground">Chargement…</div>
            </AdminLayout>
        );
    }

    if (notFound) {
        return (
            <AdminLayout currentView="adminEvents" navigateTo={navigateTo as any}>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-lg font-semibold text-destructive">Événement introuvable.</p>
                    <button onClick={() => navigate('adminEvents')} className="text-primary underline text-sm">← Retour à la liste</button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentView="adminEvents" navigateTo={navigateTo as any}>
            <EventForm mode={mode} initialData={initialData} onSave={onSave} />
        </AdminLayout>
    );
};
