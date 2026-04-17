import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { adminApi } from '../../../services/adminApi';
import type { MoodleOfflinePackage } from '../../../types';
import { Button } from '../../../components/ui/Button';

type View = 'adminMoodlePackages' | 'adminNewMoodlePackage' | 'adminEditMoodlePackage' | 'adminMoodlePackageUpload';

interface Props {
  navigateTo: (view: View, id?: string) => void;
}

export const AdminMoodlePackagesPage: React.FC<Props> = ({ navigateTo }) => {
    const [items, setItems] = useState<MoodleOfflinePackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = async () => {
        setIsLoading(true);
        const result = await adminApi.listMoodlePackages();
        setItems(result.items);
        setIsLoading(false);
    }

    useEffect(() => {
        loadItems();
    }, []);
    
    return (
        <AdminLayout currentView="adminMoodlePackages" navigateTo={navigateTo as any}>
            <div className="container py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Moodle · Packages</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigateTo('adminMoodlePackageUpload')}>Uploader SCORM/H5P</Button>
                        <Button onClick={() => navigateTo('adminNewMoodlePackage')}>Créer</Button>
                    </div>
                </div>

                {isLoading ? <p>Loading...</p> : (
                    <div className="grid gap-3">
                        {items.map((it) => (
                            <div key={it.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    <div className="text-sm text-muted-foreground">{it.type} • dispo: {String(it.isAvailable)}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => navigateTo('adminEditMoodlePackage', it.id)}>Éditer</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
