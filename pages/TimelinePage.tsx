import React, { useState, useEffect, useRef } from 'react';
import type { Event, TimelineNarrative, Media, MomentResource } from '../types';
import { CardMediaPreview } from '../components/MediaGallery';
import { getTimelineBySlug, getEvents } from '../services/api';
import { formatDate } from '../utils/helpers';
import { THEME_COLORS } from '../constants';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

interface TimelinePageProps {
  onViewEvent: (event: Event) => void;
  timelineSlug?: string | null;
  initialEventId?: string | null;
  onBack: () => void;
}

// ── Interface unifiée ─────────────────────────────────────────────────────────
interface NarrativeSlide {
    id: string;
    title: string;
    description: string;
    dateLabel: string;
    year?: number;
    sortTimestamp: number;        // timestamp ms pour tri fiable (Infinity = sans date)
    media: Media[];               // tableau complet (images + vidéos)
    themes: { id: string; name: string; slug: string }[];
    resources: MomentResource[];           // ressources complémentaires (moments uniquement)
    originalType: 'intro' | 'moment' | 'event';
    refObject: any;
}

// ── Helper : extrait une année d'un texte (ex: "Été 1944", "1943", "XIXe") ───
const extractYear = (text?: string | null): number | null => {
    if (!text) return null;
    const m = text.match(/\b(\d{3,4})\b/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    return y >= 100 && y <= 2200 ? y : null;
};

// ── Helper : date → timestamp de tri fiable ───────────────────────────────────
// Priorité : dateISO exact > yearNum > year extrait de periodText > Infinity
const toSortTs = (
    dateISO?: string | null,
    yearNum?: number | null,
    periodText?: string | null,
): number => {
    if (dateISO) {
        const ts = new Date(
            dateISO.length === 10 ? dateISO + 'T12:00:00Z' : dateISO
        ).getTime();
        if (!isNaN(ts)) return ts;
    }
    if (yearNum && !isNaN(yearNum)) {
        return new Date(`${yearNum}-07-01T12:00:00Z`).getTime();
    }
    const y = extractYear(periodText);
    if (y) return new Date(`${y}-07-01T12:00:00Z`).getTime();
    return Infinity;
};

// ── Icônes par type de ressource ─────────────────────────────────────────────
const RESOURCE_ICONS: Record<string, string> = {
    audio: '🎵', video: '🎬', image: '🖼️', pdf: '📄', link: '🔗',
};
const RESOURCE_LABELS: Record<string, string> = {
    audio: 'Audio', video: 'Vidéo', image: 'Image', pdf: 'PDF', link: 'Lien',
};

// ── Helper : ouvre une URL, y compris les data: URLs (bloquées par target=_blank) ──
const openUrl = (url: string, filename = 'fichier') => {
    if (!url) return;
    if (url.startsWith('data:')) {
        // Convertit le data URL en Blob pour contourner le blocage navigateur
        try {
            const [header, b64] = url.split(',');
            const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            const win = window.open(blobUrl, '_blank');
            // Libère la mémoire une fois la fenêtre chargée (ou après 30 s)
            if (win) win.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true });
            else setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
        } catch {
            // Dernier recours : téléchargement direct
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
        }
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

// ── Composant : une ressource ─────────────────────────────────────────────────
// Note : dans la carte (overflow-hidden, espace limité) on n'embarque pas
// de lecteur audio inline — tous les types utilisent le même bouton openUrl.
const MomentResourceItem: React.FC<{ resource: MomentResource }> = ({ resource }) => (
    <button
        type="button"
        onClick={e => { e.stopPropagation(); openUrl(resource.url, resource.title); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-white/60 hover:bg-white/90 active:bg-white rounded-2xl border border-white/50 transition-all group/res text-left"
    >
        <span className="text-base leading-none flex-shrink-0">
            {RESOURCE_ICONS[resource.type] ?? '📎'}
        </span>
        <span className="flex-1 truncate text-[11px] font-bold text-secondary">
            {resource.title}
        </span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-50 group-hover/res:opacity-100 transition-opacity flex-shrink-0">
            {RESOURCE_LABELS[resource.type] ?? resource.type} ↗
        </span>
    </button>
);

// ── Slide d'introduction (toujours en position 0) ────────────────────────────
const buildIntroSlide = (tl: TimelineNarrative): NarrativeSlide => ({
    id: `${tl.id}__intro`,
    title: tl.title,
    description: tl.longDescription || tl.shortDescription || '',
    dateLabel: tl.periodLabel || '',
    year: undefined,
    sortTimestamp: -Infinity,   // toujours premier
    media: tl.thumbnail ? [{ id: 'intro-thumb', type: 'image' as const, url: tl.thumbnail }] : [],
    themes: [],
    resources: [],
    originalType: 'intro',
    refObject: tl,
});

export const TimelinePage: React.FC<TimelinePageProps> = ({
    onViewEvent, timelineSlug, initialEventId, onBack,
}) => {
    const [timeline, setTimeline] = useState<TimelineNarrative | null>(null);
    const [slides, setSlides] = useState<NarrativeSlide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [expandedId, setExpandedId]   = useState<string | null>(null);

    useEffect(() => {
        const loadContent = async () => {
            if (!timelineSlug) { setIsLoading(false); return; }

            setIsLoading(true);
            const tl = await getTimelineBySlug(timelineSlug);
            setTimeline(tl);

            if (!tl) { setIsLoading(false); return; }

            // ── 1. Slide d'introduction (toujours en premier) ────────────
            const introSlide = buildIntroSlide(tl);

            // ── 2. Moments natifs ────────────────────────────────────────
            const momentSlides: NarrativeSlide[] = (tl.moments ?? []).map(m => ({
                id: m.id,
                title: m.title,
                description: m.narrative,
                dateLabel: m.timeType === 'date' && m.dateExact
                    ? formatDate(new Date(m.dateExact + 'T12:00:00Z'))
                    : (m.periodText || ''),
                year: m.dateExact ? new Date(m.dateExact + 'T12:00:00Z').getFullYear() : undefined,
                sortTimestamp: toSortTs(m.dateExact, null, m.periodText),
                media: (m.media ?? []).length > 0
                    ? m.media!
                    : tl.thumbnail ? [{ id: 'fallback', type: 'image' as const, url: tl.thumbnail }] : [],
                themes: [],
                resources: m.resources ?? [],
                originalType: 'moment' as const,
                refObject: m,
            }));

            // ── 3. Événements du calendrier liés ────────────────────────
            const allEvents = await getEvents();
            const linkedEvents = allEvents.filter(
                e => e.timelineId === tl.id || e.timelineSlug === tl.slug
            );
            const eventSlides: NarrativeSlide[] = linkedEvents.map(e => ({
                id: e.id,
                title: e.title,
                description: e.summary,
                dateLabel: e.dateISO
                    ? formatDate(new Date(e.dateISO + 'T12:00:00Z'))
                    : (e.period || String(e.year || '')),
                year: e.year || (e.dateISO ? new Date(e.dateISO + 'T12:00:00Z').getFullYear() : undefined),
                sortTimestamp: toSortTs(e.dateISO, e.year, e.period),
                media: (e.media ?? []).length > 0
                    ? e.media!
                    : tl.thumbnail ? [{ id: 'fallback', type: 'image' as const, url: tl.thumbnail }] : [],
                themes: e.themes,
                resources: [],      // les événements du calendrier n'ont pas de ressources de moment
                originalType: 'event' as const,
                refObject: e,
            }));

            // ── 4. Fusion : déduplique moments et événements par id ──────
            const momentIds = new Set(momentSlides.map(s => s.id));
            const uniqueEventSlides = eventSlides.filter(s => !momentIds.has(s.id));

            // ── 5. Tri chronologique par timestamp ───────────────────────
            const chronoSlides = [...momentSlides, ...uniqueEventSlides].sort(
                (a, b) => a.sortTimestamp - b.sortTimestamp
            );

            // ── 6. Intro toujours en position 0 ─────────────────────────
            const allSlides = [introSlide, ...chronoSlides];
            setSlides(allSlides);

            // Positionnement initial sur un événement spécifique
            if (initialEventId) {
                const idx = allSlides.findIndex(s => s.id === initialEventId);
                setActiveIndex(idx !== -1 ? idx : 0);
            }

            setIsLoading(false);
        };
        loadContent();
    }, [timelineSlug, initialEventId]);

    const goNext = () => { setActiveIndex(prev => Math.min(prev + 1, slides.length - 1)); setExpandedId(null); };
    const goPrev = () => { setActiveIndex(prev => Math.max(prev - 1, 0)); setExpandedId(null); };

    const touchStart = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart.current === null) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (diff > 50) goNext();
        if (diff < -50) goPrev();
        touchStart.current = null;
    };

    // ── Chargement ────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-light font-sans">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-xl" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] animate-pulse">
                    Chargement du parcours…
                </p>
            </div>
        );
    }

    if (!timeline) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-light font-sans">
                <div className="p-8 bg-white rounded-[3rem] shadow-soft border border-border max-w-sm">
                    <p className="text-xl font-black text-secondary uppercase tracking-tight mb-3">Parcours Indisponible</p>
                    <p className="text-muted-foreground mb-8 text-sm font-medium">
                        Ce récit n'existe pas ou est en cours de rédaction.
                    </p>
                    <Button onClick={onBack} className="rounded-full px-8 py-6 h-auto font-black uppercase tracking-[0.2em] text-[10px] w-full">
                        Retour aux récits
                    </Button>
                </div>
            </div>
        );
    }

    const activeSlide = slides[activeIndex];
    const isIntro = activeSlide?.originalType === 'intro';
    const contentCount = slides.length - 1; // sans la slide intro
    const accentColor = activeSlide?.themes?.[0]
        ? (THEME_COLORS[activeSlide.themes[0].slug] || '#E67E22')
        : '#E67E22';

    return (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5] overflow-hidden flex flex-col h-screen select-none font-sans">

            {/* Fond ambiant dynamique */}
            <div
                className="absolute inset-0 opacity-10 blur-[150px] transition-colors duration-[1500ms] ease-in-out pointer-events-none"
                style={{ backgroundColor: isIntro ? '#2C3E50' : accentColor }}
            />

            {/* Barre de navigation */}
            <header
              className="relative z-10 px-6 pb-4 flex items-center justify-between flex-shrink-0"
              style={{ paddingTop: 'max(2.5rem, var(--sat, 0px))' }}
            >
                <button
                    onClick={onBack}
                    className="p-4 bg-white/50 backdrop-blur-2xl border border-white/40 rounded-full shadow-lg hover:bg-white/80 transition-all active:scale-90 flex items-center justify-center group"
                >
                    <ArrowLeftIcon className="h-6 w-6 text-secondary group-hover:-translate-x-0.5 transition-transform" />
                </button>

                <div className="text-center px-4">
                    <h2 className="text-xl sm:text-2xl font-black text-secondary uppercase tracking-tight leading-none mb-2">
                        {timeline.title}
                    </h2>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                        <p className="text-[11px] text-primary uppercase tracking-[0.3em] font-black">
                            {isIntro
                                ? 'Introduction'
                                : `Moment ${activeIndex} / ${contentCount}`}
                        </p>
                        <div className="h-[2px] w-8 bg-primary/30 rounded-full" />
                    </div>
                </div>

                <div className="w-14 hidden sm:block" />
            </header>

            {/* Carousel immersif */}
            <div
                className="flex-1 relative flex items-center justify-center px-4 overflow-visible"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <button
                    onClick={goPrev}
                    disabled={activeIndex === 0}
                    className="absolute left-2 sm:left-10 z-40 p-3 sm:p-6 rounded-full bg-white/50 backdrop-blur-3xl border border-white/50 shadow-xl disabled:opacity-0 disabled:pointer-events-none transition-all hover:bg-white/70 active:scale-90 flex items-center justify-center"
                >
                    <ChevronLeftIcon className="h-5 w-5 sm:h-8 sm:w-8 text-secondary" />
                </button>
                <button
                    onClick={goNext}
                    disabled={activeIndex === slides.length - 1}
                    className="absolute right-2 sm:right-10 z-40 p-3 sm:p-6 rounded-full bg-white/50 backdrop-blur-3xl border border-white/50 shadow-xl disabled:opacity-0 disabled:pointer-events-none transition-all hover:bg-white/70 active:scale-90 flex items-center justify-center"
                >
                    <ChevronRightIcon className="h-5 w-5 sm:h-8 sm:w-8 text-secondary" />
                </button>

                <div className="relative w-full max-w-5xl flex items-center justify-center" style={{ height: 'min(620px, calc(100svh - 260px))' }}>
                    {slides.map((slide, idx) => {
                        const offset = idx - activeIndex;
                        const isFocused = offset === 0;
                        const isPrev = offset === -1;
                        const isNext = offset === 1;
                        const isFar = Math.abs(offset) > 1;
                        const isSlideIntro = slide.originalType === 'intro';

                        return (
                            <div
                                key={slide.id}
                                onClick={() => {
                                    if (isPrev) goPrev();
                                    else if (isNext) goNext();
                                    // Focused card: navigation is via explicit CTA buttons inside
                                }}
                                className={`absolute transition-all duration-[800ms] w-[310px] sm:w-[480px] rounded-[3.5rem] overflow-hidden border backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] cursor-pointer group/card
                                    ${isFocused ? 'z-30 scale-100 opacity-100 translate-x-0 rotate-0 translate-y-0' : ''}
                                    ${isPrev ? 'z-20 -translate-x-[65%] sm:-translate-x-[90%] scale-90 opacity-30 blur-[4px] -rotate-6 -translate-y-4' : ''}
                                    ${isNext ? 'z-20 translate-x-[65%] sm:translate-x-[90%] scale-90 opacity-30 blur-[4px] rotate-6 -translate-y-4' : ''}
                                    ${isFar ? 'opacity-0 scale-75 pointer-events-none' : ''}
                                    ${isSlideIntro ? 'border-secondary/20 bg-secondary/5' : 'border-white/50 bg-white/40'}
                                `}
                            >
                                {/* Image / Vidéo de couverture */}
                                <div className="h-72 relative overflow-hidden">
                                    <CardMediaPreview
                                        media={slide.media}
                                        isFocused={isFocused}
                                        fallbackUrl="https://picsum.photos/800/600"
                                    />
                                    <div className={`absolute inset-0 pointer-events-none ${isSlideIntro ? 'bg-gradient-to-t from-secondary/70 via-secondary/20 to-transparent' : 'bg-gradient-to-t from-black/20 to-transparent'}`} />

                                    {/* Badge intro */}
                                    {isSlideIntro ? (
                                        <div className="absolute top-8 left-8 px-5 py-2.5 bg-secondary/80 backdrop-blur-xl rounded-2xl text-white text-[10px] font-black tracking-[0.2em] border border-white/20 uppercase shadow-xl">
                                            📖 Introduction
                                        </div>
                                    ) : (
                                        /* Badge date */
                                        slide.dateLabel && (
                                            <div className="absolute top-8 left-8 px-5 py-2.5 bg-black/50 backdrop-blur-xl rounded-2xl text-white text-[10px] font-black tracking-[0.2em] border border-white/20 uppercase shadow-xl">
                                                {slide.dateLabel}
                                            </div>
                                        )
                                    )}


                                    {/* Période sur la slide intro */}
                                    {isSlideIntro && slide.dateLabel && (
                                        <div className="absolute bottom-6 left-8 right-8">
                                            <p className="text-white/80 text-xs font-black uppercase tracking-widest">
                                                {slide.dateLabel}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Contenu textuel */}
                                <div className={`p-6 sm:p-8 flex flex-col bg-white/10 ${isSlideIntro ? 'min-h-[160px]' : 'flex-1'}`}>
                                    {isSlideIntro && timeline.subtitle && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                                            {timeline.subtitle}
                                        </p>
                                    )}

                                    {/* Date — visible sur toutes les slides non-intro */}
                                    {!isSlideIntro && slide.dateLabel && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-px w-5 rounded-full bg-primary/50" />
                                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                                                {slide.dateLabel}
                                            </p>
                                        </div>
                                    )}

                                    <h3 className={`font-black text-secondary leading-tight mb-3 tracking-tight group-hover/card:text-primary transition-colors ${isSlideIntro ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl'}`}>
                                        {slide.title}
                                    </h3>

                                    {/* Description avec "Lire plus" */}
                                    {slide.description && (
                                        <div onClick={e => e.stopPropagation()}>
                                            <p className={`text-dark/75 text-sm leading-relaxed font-medium transition-all ${
                                                isFocused && expandedId === slide.id
                                                    ? 'line-clamp-none'
                                                    : isFocused && slide.resources.length > 0
                                                        ? 'line-clamp-2'
                                                        : isFocused
                                                            ? 'line-clamp-4'
                                                            : 'line-clamp-2'
                                            }`}>
                                                {slide.description}
                                            </p>
                                            {isFocused && slide.description.length > 180 && slide.originalType !== 'event' && (
                                                <button
                                                    className="mt-1.5 text-[11px] font-black text-primary uppercase tracking-widest hover:underline"
                                                    onClick={e => { e.stopPropagation(); setExpandedId(id => id === slide.id ? null : slide.id); }}
                                                >
                                                    {expandedId === slide.id ? 'Réduire ↑' : 'Lire plus ↓'}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Ressources complémentaires (moments uniquement, carte focalisée) ── */}
                                    {isFocused && slide.originalType === 'moment' && slide.resources.length > 0 && (
                                        <div className="mt-3" onClick={e => e.stopPropagation()}>
                                            <div className="h-px bg-black/8 mb-3" />
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-2.5">
                                                Ressources
                                            </p>
                                            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                                {slide.resources.map((res, ri) => (
                                                    <MomentResourceItem key={res.id ?? ri} resource={res} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA — Voir l'événement (event slides) */}
                                    {isFocused && slide.originalType === 'event' && (
                                        <div className="mt-3" onClick={e => e.stopPropagation()}>
                                            {/* Afficher quelques lignes de la description */}
                                            <button
                                                onClick={() => onViewEvent(slide.refObject)}
                                                className="inline-flex items-center gap-2 mt-2 bg-secondary text-white px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-secondary/90 active:scale-95 transition-all shadow-sm"
                                            >
                                                Voir l'événement
                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {/* Pied de la slide intro : nombre de moments */}
                                    {isSlideIntro && contentCount > 0 && isFocused && (
                                        <div className="mt-auto pt-3">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                    {contentCount} moment{contentCount > 1 ? 's' : ''} à explorer →
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Thèmes sur les slides événement */}
                                    {!isSlideIntro && slide.themes.length > 0 && (
                                        <div className="mt-auto pt-2 flex flex-wrap gap-2">
                                            {slide.themes.map(t => (
                                                <Badge
                                                    key={t.id}
                                                    style={{ backgroundColor: THEME_COLORS[t.slug] || '#ccc', border: 'none', color: '#fff' }}
                                                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.12em] shadow-sm"
                                                >
                                                    {t.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Barre de navigation chronologique */}
            <div
              className="px-6 pt-6 sm:pt-10 relative z-10 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent flex-shrink-0"
              style={{ paddingBottom: 'max(1.5rem, var(--sab, 0px))' }}
            >
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10">
                    <div className="relative h-1.5 w-full bg-black/5 rounded-full overflow-visible">
                        <div
                            className="absolute h-full bg-primary transition-all duration-1000 rounded-full shadow-[0_0_30px_rgba(230,126,34,0.6)]"
                            style={{ width: `${((activeIndex) / Math.max(slides.length - 1, 1)) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex justify-between px-0 items-center">
                            {slides.map((s, i) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setActiveIndex(i)}
                                    className={`no-min-h relative flex items-center justify-center p-2 transition-all duration-700 ${i === activeIndex ? 'scale-150' : 'scale-100'}`}
                                >
                                    <div className={`h-3.5 w-3.5 rounded-full border-4 border-[#FAF8F5] shadow-xl transition-all duration-500 ${i <= activeIndex ? 'bg-primary' : 'bg-black/10'}`} />
                                    {(i === 0 || i === slides.length - 1 || i === activeIndex) && (
                                        <span className={`absolute -top-10 text-[10px] font-black whitespace-nowrap uppercase tracking-tighter transition-colors duration-500 ${i === activeIndex ? 'text-primary' : 'text-secondary/40'}`}>
                                            {s.originalType === 'intro' ? 'Intro' : (s.year || '…')}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2 opacity-50">
                        <span className="flex items-center gap-2">
                            <div className="h-px w-6 bg-current" /> ORIGINES
                        </span>
                        <div className="flex items-center gap-3 bg-white/40 px-6 py-2 rounded-full border border-white/60 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                            <span>GLISSER POUR NAVIGUER</span>
                        </div>
                        <span className="flex items-center gap-2">
                            PRÉSENT <div className="h-px w-6 bg-current" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
