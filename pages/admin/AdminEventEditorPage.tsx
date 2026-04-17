import React from 'react';
import { AdminEventEditor } from '../../components/admin/AdminEventEditor';
import { useEvent, useEventMutation } from '../../hooks/useEvents';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { EventFormData } from '../../lib/validations/admin';

interface AdminEventEditorPageProps {
  id?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Page de conteneur pour l'édition d'événements.
 * Gère la logique de récupération et de mutation des données.
 */
export const AdminEventEditorPage: React.FC<AdminEventEditorPageProps> = ({ id, onSave, onCancel }) => {
  const { event, isLoading: isFetching, error: fetchError } = useEvent(id || null);
  const { createEvent, updateEvent, isMutating, mutationError } = useEventMutation();

  const handleSubmit = async (data: EventFormData) => {
    try {
      if (id) {
        await updateEvent(id, data);
      } else {
        await createEvent(data);
      }
      onSave();
    } catch (err) {
      // L'erreur est déjà gérée par le hook useEventMutation (mutationError)
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  return (
    <AdminLayout currentView="adminEvents" navigateTo={onCancel as any}>
      <div className="container py-6">
        <AdminEventEditor
          initialData={event}
          onSubmit={handleSubmit}
          isLoading={isFetching}
          error={fetchError || mutationError}
          onCancel={onCancel}
        />
      </div>
    </AdminLayout>
  );
};
