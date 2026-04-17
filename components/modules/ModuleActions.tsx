"use client";
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { MoodleMapMode } from '../../types';

type Props = {
  mode: MoodleMapMode | undefined | null;
  ltiUrl?: string;
  packageBaseUrl?: string;
  isDownloaded?: boolean;
  navigateTo: (view: 'offlineScorm' | 'offlineH5p', baseUrl: string) => void;
};

export const ModuleActions: React.FC<Props> = ({ mode, ltiUrl, packageBaseUrl, isDownloaded, navigateTo }) => {
  const [downloading, setDownloading] = useState(false);

  async function downloadOffline() {
    if (!packageBaseUrl) return;
    setDownloading(true);
    try {
      // In a real PWA, you'd fetch the manifest, parse asset URLs, and add them all to the cache.
      // For this simulation, we'll just alert the user. The service worker will handle caching on-demand.
      alert("Package is being made available for offline use. Future visits to this content will be served from cache.");
    } finally {
      setDownloading(false);
    }
  }

  if (mode === "LTI" && ltiUrl) {
    return <Button onClick={() => window.open(ltiUrl, '_blank')} className="rounded-2xl">Ouvrir via LTI</Button>;
  }

  if (mode === "OFFLINE" && packageBaseUrl) {
    const type = packageBaseUrl.includes('h5p') ? 'offlineH5p' : 'offlineScorm';
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
            variant="secondary" 
            className="rounded-2xl" 
            onClick={() => navigateTo(type, packageBaseUrl)}
        >
          Lire hors-ligne
        </Button>
        <Button 
            className="rounded-2xl" 
            disabled={downloading} 
            onClick={downloadOffline}
        >
          {downloading ? "Préparation…" : isDownloaded ? "Mettre à jour" : "Télécharger pour offline"}
        </Button>
      </div>
    );
  }

  return null;
}
