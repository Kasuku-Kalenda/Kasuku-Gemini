import React from 'react';
import { ScormPlayer } from '../../components/moodle/ScormPlayer';
import { ArrowLeftIcon } from '../../components/icons/ArrowLeftIcon';

interface ScormPlayerPageProps {
  baseUrl: string;
  onBack: () => void;
}

export const ScormPlayerPage: React.FC<ScormPlayerPageProps> = ({ baseUrl, onBack }) => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary mb-2 hover:underline">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Module
      </button>
      <ScormPlayer baseUrl={baseUrl} />
    </div>
  );
};
