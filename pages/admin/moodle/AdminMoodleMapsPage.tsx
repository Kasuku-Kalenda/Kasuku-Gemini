import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import type { MoodleCourseMap } from '../../../types';
import { Button } from '../../../components/ui/Button';

type View = 'adminMoodleMaps' | 'adminNewMoodleMap' | 'adminEditMoodleMap';

interface Props {
  navigateTo: (view: View, id?: string) => void;
}

export const AdminMoodleMapsPage: React.FC<Props> = ({ navigateTo }) => {
    const [items, setItems] = useState<MoodleCourseMap[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = async () => {
        setIsLoading(true);
        const result = await adminApi.listMoodleMaps();
        setItems(result.items);
        setIsLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);
    
    return (
        <AdminLayout currentView="adminMoodleMaps" navigateTo={navigateTo as any}>
            <div className="container py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Moodle · Mappings</h1>
                    <Button onClick={() => navigateTo('adminNewMoodleMap')}>Créer</Button>
                </div>

                {isLoading ? <p>Loading...</p> : (
                    <div className="grid gap-3">
                        {items.map((it) => (
                            <div key={it.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Module: {it.moduleId}</div>
                                    <div className="text-sm text-muted-foreground">mode: {it.mode} • courseId: {it.courseId ?? '—'} • packageId: {it.packageId ?? '—'}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => navigateTo('adminEditMoodleMap', it.id)}>Éditer</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
