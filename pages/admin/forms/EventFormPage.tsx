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

// ─── Error boundary : evite page blanche si EventForm crashe au rendu ─────────

interface EBState { error: Error | null }

class EventFormErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  EBState
> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
          <p className="text-lg font-semibold text-destructive">
            Erreur lors du chargement du formulaire.
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); this.props.onReset(); }}
            className="text-primary underline text-sm"
          >
            ← Retour à la liste
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Page principale ──────────────────────────────────────────────────────────

export const EventFormPage: React.FC<EventFormPageProps> = ({ mode, id, onSave }) => {
    const [initialData, setInitialData] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { navigate } = useNavigation();

    const navigateTo = (v: string, itemId?: string) =>
        navigate(v as AppView, itemId ? { id: itemId } : undefined);

    useEffect(() => {
        if (mode === 'edit' && id) {
            adminApi.getEvent(id)
                .then(data => {
                    if (data) setInitialData(data); else setNotFound(true);
                })
                .catch(err => {
                    setLoadError(err?.message ?? 'Impossible de charger l\'événement.');
                })
                .finally(() => setIsLoading(false));
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

    if (loadError) {
        return (
            <AdminLayout currentView="adminEvents" navigateTo={navigateTo as any}>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-lg font-semibold text-destructive">Erreur de chargement</p>
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <button onClick={() => navigate('adminEvents')} className="text-primary underline text-sm">← Retour à la liste</button>
                </div>
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
            <EventFormErrorBoundary onReset={() => navigate('adminEvents')}>
                <EventForm mode={mode} initialData={initialData} onSave={onSave} />
            </EventFormErrorBoundary>
        </AdminLayout>
    );
};
