import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import type { MoodleCourse } from '../../../types';
import { Button } from '../../../components/ui/Button';

type View = 'adminMoodleCourses' | 'adminNewMoodleCourse' | 'adminEditMoodleCourse';

interface Props {
  navigateTo: (view: View, id?: string) => void;
}

export const AdminMoodleCoursesPage: React.FC<Props> = ({ navigateTo }) => {
    const [items, setItems] = useState<MoodleCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = async () => {
        setIsLoading(true);
        const result = await adminApi.listMoodleCourses();
        setItems(result.items);
        setIsLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);
    
    return (
        <AdminLayout currentView="adminMoodleCourses" navigateTo={navigateTo as any}>
            <div className="container py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Moodle · Cours</h1>
                    <Button onClick={() => navigateTo('adminNewMoodleCourse')}>Créer</Button>
                </div>

                {isLoading ? <p>Loading...</p> : (
                    <div className="grid gap-3">
                        {items.map((it) => (
                            <div key={it.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{it.fullname}</div>
                                    <div className="text-sm text-muted-foreground">{it.shortname} • inst: {it.instanceId} • remoteId: {it.remoteCourseId}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => navigateTo('adminEditMoodleCourse', it.id)}>Éditer</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
