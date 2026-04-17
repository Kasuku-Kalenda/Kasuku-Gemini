
import React from 'react';
import type { Media } from '../types';

interface MediaGalleryProps {
  media: Media[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  if (!media || media.length === 0) {
    return null;
  }

  const mainMedia = media[0];

  return (
    <div>
      <div className="rounded-xl overflow-hidden shadow-soft">
        {mainMedia.type === 'image' ? (
          <img 
            src={mainMedia.url} 
            alt={mainMedia.caption || 'Event image'}
            className="w-full h-auto object-cover"
          />
        ) : (
          <video controls src={mainMedia.url} className="w-full h-auto" />
        )}
      </div>
      {mainMedia.caption && (
        <p className="text-sm text-center text-muted-foreground mt-2">{mainMedia.caption}</p>
      )}
    </div>
  );
};
