import React, { useState, useEffect } from 'react';
import { EventForm } from '../../../components/admin/EventForm';
import { adminApi } from '../../../services/adminApi';
import type { Event } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';

interface EventFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const EventFormPage: React.FC<EventFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getEvent(id).then(data => {
                setInitialData(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return <AdminLayout currentView="adminEvents" navigateTo={() => {}}><p>Loading form...</p></AdminLayout>;
    }
    
    if (mode === 'edit' && !initialData) {
        return <AdminLayout currentView="adminEvents" navigateTo={() => {}}><p>Event not found.</p></AdminLayout>
    }

    return (
        <AdminLayout currentView="adminEvents" navigateTo={onSave as any}>
            <EventForm 
                mode={mode}
                initialData={initialData}
                onSave={onSave}
            />
        </AdminLayout>
    );
};