"use client";
import React, { useEffect, useState } from 'react';

export const ScormPlayer: React.FC<{ baseUrl: string }> = ({ baseUrl }) => {
  const [entry, setEntry] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function init() {
        try {
            // In a real scenario, this would be more robust. Here, we assume a common entry point.
            // A better way would be to parse the imsmanifest.xml properly.
            // For now, we'll try common entry points.
            const possibleEntries = ['index.html', 'index_lms.html', 'story.html', 'story_html5.html'];
            
            for (const entryFile of possibleEntries) {
                const url = `${baseUrl}${entryFile}`;
                try {
                    const res = await fetch(url, { method: 'HEAD' });
                    if (res.ok && isMounted) {
                        setEntry(url);
                        break;
                    }
                } catch (e) {
                    // Ignore fetch errors, try next entry
                }
            }
        } catch(e) {
            console.error("Error finding SCORM entry point", e);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    }
    init();

    return () => { isMounted = false; }
  }, [baseUrl]);

  useEffect(() => {
    // Mock the SCORM API for compatibility with many packages
    (window as any).API = {
      LMSInitialize: () => "true",
      LMSSetValue: (k: string, v: string) => { console.log(`SCORM SET: ${k}=${v}`); localStorage.setItem(`scorm_${k}`, v); return "true"; },
      LMSGetValue: (k: string) => { const val = localStorage.getItem(`scorm_${k}`) ?? ""; console.log(`SCORM GET: ${k}=${val}`); return val; },
      LMSCommit: () => "true",
      LMSFinish: () => "true",
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "No error",
      LMSGetDiagnostic: () => "No error",
    };
    (window as any).API_1484_11 = (window as any).API; // For SCORM 2004

    return () => { 
        delete (window as any).API; 
        delete (window as any).API_1484_11; 
    };
  }, []);

  if (isLoading) {
      return <div className="p-4 text-center">Loading SCORM package...</div>;
  }

  if (!entry) {
    return <div className="p-4 text-center text-destructive">Could not find a valid entry point for this SCORM package.</div>;
  }

  return (
    <div className="w-full h-[80vh] rounded-2xl overflow-hidden border bg-card shadow-soft">
      <iframe className="w-full h-full" src={entry} title="SCORM Content Player" frameBorder="0" allowFullScreen />
    </div>
  );
}
