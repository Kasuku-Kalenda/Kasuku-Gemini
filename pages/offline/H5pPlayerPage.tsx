import React from 'react';
import { H5pPlayer } from '../../components/moodle/H5pPlayer';
import { ArrowLeftIcon } from '../../components/icons/ArrowLeftIcon';

interface H5pPlayerPageProps {
  baseUrl: string;
  onBack: () => void;
}

export const H5pPlayerPage: React.FC<H5pPlayerPageProps> = ({ baseUrl, onBack }) => {
  return (
    <div className="p-4 md:p-6 space-y-4">
       <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary mb-2 hover:underline">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Module
      </button>
      <H5pPlayer baseUrl={baseUrl} />
    </div>
  );
};
