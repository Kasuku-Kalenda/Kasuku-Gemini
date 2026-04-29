import React, { useState, useEffect } from 'react';
import { ModuleForm } from '../../../components/admin/ModuleForm';
import { CourseBuilder } from '../../../components/admin/CourseBuilder';
import { adminApi } from '../../../services/adminApi';
import type { TrainingModule } from '../../../types';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useNavigation } from '../../../core/navigation';
import type { AppView } from '../../../core/navigation';

interface ModuleFormPageProps {
    mode: 'create' | 'edit';
    id?: string | null;
    onSave: () => void;
}

export const ModuleFormPage: React.FC<ModuleFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<TrainingModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const { navigate } = useNavigation();

    const navigateTo = (v: string, itemId?: string) =>
        navigate(v as AppView, itemId ? { id: itemId } : undefined);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getModule(id).then(data => {
                if (data) setInitialData(data); else setNotFound(true);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [id, mode]);

    if (isLoading) {
        return (
            <AdminLayout currentView="adminModules" navigateTo={navigateTo as any}>
                <div className="flex items-center justify-center py-24 text-muted-foreground">Chargement…</div>
            </AdminLayout>
        );
    }

    if (notFound) {
        return (
            <AdminLayout currentView="adminModules" navigateTo={navigateTo as any}>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-lg font-semibold text-destructive">Module introuvable.</p>
                    <button onClick={() => navigate('adminModules')} className="text-primary underline text-sm">← Retour à la liste</button>
                </div>
            </AdminLayout>
        );
    }

    const isMoodle = initialData?.moduleType === 'moodle';

    return (
        <AdminLayout currentView="adminModules" navigateTo={navigateTo as any}>
            {isMoodle
                ? <ModuleForm mode={mode} initialData={initialData} onSave={onSave} />
                : <CourseBuilder mode={mode} initialData={initialData} onSave={onSave} />
            }
        </AdminLayout>
    );
};
