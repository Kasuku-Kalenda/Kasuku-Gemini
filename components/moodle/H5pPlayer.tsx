"use client";
import React, { useRef, useEffect } from "react";

export const H5pPlayer: React.FC<{ baseUrl: string }> = ({ baseUrl }) => {
  const ref = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (ref.current && !iframeRef.current) {
      // In a real application, you'd use a library like h5p-standalone
      // to properly initialize and render the H5P content.
      // For this simulation, we'll just embed the content via an iframe,
      // assuming the package has an index.html or similar entry point.
      const iframe = document.createElement("iframe");
      iframe.src = `${baseUrl}index.html`; // Most H5P packages don't have this, but it's a fallback.
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      iframe.title = "H5P Content Player";
      iframe.allowFullscreen = true;

      ref.current.appendChild(iframe);
      iframeRef.current = iframe;
    }
    
    return () => {
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.parentNode.removeChild(iframeRef.current);
        iframeRef.current = null;
      }
    };
  }, [baseUrl]);

  return <div ref={ref} className="w-full h-[80vh] rounded-2xl overflow-hidden border bg-card shadow-soft" />;
};
