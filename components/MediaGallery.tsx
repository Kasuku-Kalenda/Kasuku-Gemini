import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Media } from '../types';

const MAX_MEDIA = 5;

// ─── Lecteur vidéo style reel ─────────────────────────────────────────────────

interface VideoReelProps {
  src: string;
  isActive: boolean;
}

const VideoReel: React.FC<VideoReelProps> = ({ src, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTap, setShowTap] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autoplay / pause selon si c'est le media actif
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
    // Flash tap indicator
    setShowTap(true);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setShowTap(false), 600);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const next = !videoRef.current.muted;
    videoRef.current.muted = next;
    setIsMuted(next);
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !videoRef.current.duration) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div
      className="relative w-full h-full bg-black cursor-pointer select-none"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        muted
        playsInline
        loop
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Flash play/pause */}
      {showTap && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm animate-ping-once">
            {isPlaying
              ? <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg className="w-7 h-7 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            }
          </div>
        </div>
      )}

      {/* Icône play quand en pause */}
      {!isPlaying && !showTap && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-18 h-18 w-16 h-16 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <svg className="w-8 h-8 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Badge VIDÉO */}
      <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        VIDÉO
      </div>

      {/* Barre de contrôles en bas */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-black/80 to-transparent"
        onClick={e => e.stopPropagation()}
      >
        {/* Barre de progression cliquable */}
        <div
          className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-[11px] font-mono">
            {fmt(duration * progress / 100)} / {fmt(duration)}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors border border-white/20"
          >
            {isMuted ? (
              // Muet
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
              </svg>
            ) : (
              // Son activé
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Galerie principale (EventDetailPage) ────────────────────────────────────

interface MediaGalleryProps {
  media: Media[];
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef<number | null>(null);

  if (!media || media.length === 0) return null;

  const items = media.slice(0, MAX_MEDIA);
  const current = items[activeIndex];
  const isVideo = current?.type === 'video';

  const goPrev = () => setActiveIndex(i => Math.max(0, i - 1));
  const goNext = () => setActiveIndex(i => Math.min(items.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 40) goNext();
    if (diff < -40) goPrev();
    touchStart.current = null;
  };

  return (
    <div className="space-y-3">
      {/* Zone principale */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black shadow-soft"
        style={{
          aspectRatio: isVideo ? '9/16' : '16/9',
          maxHeight: isVideo ? '72vh' : '480px',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isVideo ? (
          <VideoReel src={current.url} isActive={true} />
        ) : (
          <img
            src={current.url}
            alt={current.caption || ''}
            className="w-full h-full object-contain"
          />
        )}

        {/* Flèches de navigation */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white text-xl flex items-center justify-center border border-white/20 disabled:opacity-0 hover:bg-black/60 transition-all"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex === items.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white text-xl flex items-center justify-center border border-white/20 disabled:opacity-0 hover:bg-black/60 transition-all"
            >
              ›
            </button>
          </>
        )}

        {/* Compteur + dots */}
        {items.length > 1 && (
          <>
            <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold border border-white/20">
              {activeIndex + 1} / {items.length}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all pointer-events-auto ${
                    i === activeIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Légende + crédit */}
      {(current.caption || current.credit) && (
        <div className="text-sm text-center text-muted-foreground px-4">
          {current.caption && <p className="font-medium">{current.caption}</p>}
          {current.credit && <p className="text-xs opacity-60 mt-0.5">© {current.credit}</p>}
        </div>
      )}

      {/* Bande de miniatures (3+ médias) */}
      {items.length >= 3 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-0.5">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex
                  ? 'border-primary shadow-md scale-105'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-black flex items-center justify-center text-white text-base">
                  ▶
                </div>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Aperçu média pour les cartes carousel (DateTimeline, Timeline) ──────────

interface CardMediaPreviewProps {
  media: Media[];
  isFocused: boolean;
  fallbackUrl?: string;
}

export const CardMediaPreview: React.FC<CardMediaPreviewProps> = ({
  media, isFocused, fallbackUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const touchStart = useRef<number | null>(null);

  const items = media.length > 0 ? media : [];
  const current = items[mediaIndex] ?? null;
  const isVideo = current?.type === 'video';
  const imgUrl = current?.url || fallbackUrl;

  // Autoplay vidéo quand la carte est au premier plan
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    if (isFocused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isFocused, isVideo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 40 && mediaIndex < items.length - 1) setMediaIndex(i => i + 1);
    if (diff < -40 && mediaIndex > 0) setMediaIndex(i => i - 1);
    touchStart.current = null;
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={current!.url}
            className="w-full h-full object-cover"
            muted
            playsInline
            loop
          />
          {/* Badge vidéo */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[9px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
            Vidéo
          </div>
        </>
      ) : imgUrl ? (
        <img
          src={imgUrl}
          alt=""
          className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${
            isFocused ? 'scale-110' : 'scale-100 group-hover/card:scale-105'
          }`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
      )}

      {/* Dots multi-médias */}
      {items.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === mediaIndex
                  ? 'w-3 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50'
              } ${item.type === 'video' ? 'bg-red-400' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Badge "N photos" si plusieurs images */}
      {items.length > 1 && isFocused && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-[9px] font-bold border border-white/20">
          {mediaIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
};
