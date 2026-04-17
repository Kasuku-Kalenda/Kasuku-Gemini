import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import type { MoodleInstance } from '../../../types';
import { Button } from '../../../components/ui/Button';

type View = 'adminMoodleInstances' | 'adminNewMoodleInstance' | 'adminEditMoodleInstance';

interface Props {
  navigateTo: (view: View, id?: string) => void;
}

export const AdminMoodleInstancesPage: React.FC<Props> = ({ navigateTo }) => {
    const [items, setItems] = useState<MoodleInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = async () => {
        setIsLoading(true);
        const result = await adminApi.listMoodleInstances();
        setItems(result.items);
        setIsLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);
    
    return (
        <AdminLayout currentView="adminMoodleInstances" navigateTo={navigateTo as any}>
            <div className="container py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Moodle · Instances</h1>
                    <Button onClick={() => navigateTo('adminNewMoodleInstance')}>Créer</Button>
                </div>

                {isLoading ? <p>Loading...</p> : (
                    <div className="grid gap-3">
                        {items.map((it) => (
                            <div key={it.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{it.name}</div>
                                    <div className="text-sm text-muted-foreground">{it.baseUrl}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => navigateTo('adminEditMoodleInstance', it.id)}>Éditer</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
