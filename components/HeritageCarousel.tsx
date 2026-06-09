import React, { useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type HeritageCategory = 'mask' | 'proverb' | 'symbol' | 'recipe' | 'craft' | 'music' | 'other';

export interface HeritageItem {
  id: string;
  slug: string;
  title: string;
  category?: string;
  coverUrl?: string | null;
  summary?: string | null;
  countryCode?: string | null;
}

interface HeritageCarouselProps {
  items: HeritageItem[];
  onSelect?: (item: HeritageItem) => void;
  onViewAll?: () => void;
}

// ── Category meta ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<HeritageCategory, { label: string; emoji: string; bg: string }> = {
  mask:    { label: 'Masque',    emoji: '🎭', bg: 'bg-amber-100 text-amber-800' },
  proverb: { label: 'Proverbe',  emoji: '💬', bg: 'bg-blue-100 text-blue-800'  },
  symbol:  { label: 'Symbole',   emoji: '🔯', bg: 'bg-purple-100 text-purple-800' },
  recipe:  { label: 'Recette',   emoji: '🍲', bg: 'bg-green-100 text-green-800' },
  craft:   { label: 'Artisanat', emoji: '🏺', bg: 'bg-orange-100 text-orange-800' },
  music:   { label: 'Musique',   emoji: '🎵', bg: 'bg-pink-100 text-pink-800'  },
  other:   { label: 'Patrimoine',emoji: '🌍', bg: 'bg-gray-100 text-gray-700'  },
};

function getCategoryMeta(cat?: string) {
  return CATEGORY_META[(cat as HeritageCategory) ?? 'other'] ?? CATEGORY_META.other;
}

// ── Card ──────────────────────────────────────────────────────────────────────

const HeritageCard: React.FC<{ item: HeritageItem; onClick?: () => void }> = ({ item, onClick }) => {
  const meta = getCategoryMeta(item.category);

  return (
    <div
      onClick={onClick}
      className={`shrink-0 w-44 sm:w-52 rounded-2xl overflow-hidden bg-card border border-border shadow-soft
        flex flex-col cursor-pointer group transition-transform active:scale-95 hover:shadow-md`}
    >
      {/* Cover image */}
      <div className="relative h-28 bg-muted overflow-hidden">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">
            {meta.emoji}
          </div>
        )}
        {/* Category badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg}`}>
          {meta.emoji} {meta.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="font-semibold text-sm text-dark leading-snug line-clamp-2">{item.title}</p>
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.summary}</p>
        )}
        {item.countryCode && (
          <p className="text-[10px] text-muted-foreground mt-auto">{item.countryCode}</p>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const HeritageCarousel: React.FC<HeritageCarouselProps> = ({ items, onSelect, onViewAll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏛️</span>
        <h3 className="text-lg font-bold text-secondary">Patrimoine associé</h3>
        <span className="text-xs text-muted-foreground">{items.length} élément{items.length > 1 ? 's' : ''}</span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="ml-auto text-xs text-primary font-semibold hover:underline"
          >
            Voir tout →
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map(item => (
          <div key={item.id} className="snap-start">
            <HeritageCard item={item} onClick={() => onSelect?.(item)} />
          </div>
        ))}
      </div>
    </section>
  );
};
