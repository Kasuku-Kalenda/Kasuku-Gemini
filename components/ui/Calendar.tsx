
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { TimelineIcon } from '../icons/TimelineIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import type { Event } from '../../types';
import { THEME_COLORS } from '../../constants';
import { formatDate } from '../../utils/helpers';

type CalendarProps = {
  mode: 'single';
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  eventsByDayOfYear?: Record<string, Event[]>; // Expects "MM-DD" keys
  onMonthChange?: (date: Date) => void;
  /** Mois affiché contrôlé depuis l'extérieur (navigation par année depuis la recherche) */
  month?: Date;
};

/** Résout la couleur d'un thème : priorité à la propriété .color (API),
 *  puis fallback sur THEME_COLORS[slug] (mock), puis gris neutre. */
function resolveThemeColor(event: Event): string {
  const theme = event.themes?.[0];
  if (!theme) return '#94a3b8';
  return (theme as any).color || THEME_COLORS[(theme as any).slug ?? ''] || '#94a3b8';
}

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  className,
  eventsByDayOfYear,
  onMonthChange,
  month,
}) => {
  const [currentDate, setCurrentDate] = useState(month || selected || new Date());
  // Ref pour distinguer les changements internes (user) des changements externes (prop `month`)
  const isExternalUpdate = useRef(false);

  // Prop `month` contrôlé depuis l'extérieur — ne pas reboucler vers onMonthChange
  useEffect(() => {
    if (month) {
      isExternalUpdate.current = true;
      setCurrentDate(month);
    }
  }, [month]);

  useEffect(() => {
    if (selected) {
      if (
        selected.getUTCFullYear() !== currentDate.getUTCFullYear() ||
        selected.getUTCMonth() !== currentDate.getUTCMonth()
      ) {
        isExternalUpdate.current = true;
        setCurrentDate(new Date(selected));
      }
    }
  }, [selected]);

  // N'appelle onMonthChange que pour les changements initiés par l'utilisateur (prev/next, selects)
  useEffect(() => {
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }
    onMonthChange?.(currentDate);
  }, [currentDate, onMonthChange]);

  // ── Grille : 42 cases (6 semaines) ──────────────────────────────────────────
  const startOfMonth = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  );
  const startDate = new Date(startOfMonth);
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());

  const days: Date[] = [];
  const day = new Date(startDate);
  while (days.length < 42) {
    days.push(new Date(day));
    day.setUTCDate(day.getUTCDate() + 1);
  }

  const handlePrevMonth = () =>
    setCurrentDate(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1))
    );
  const handleNextMonth = () =>
    setCurrentDate(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1))
    );
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setCurrentDate(
      (c) => new Date(Date.UTC(c.getUTCFullYear(), parseInt(e.target.value, 10), 1))
    );
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setCurrentDate(
      (c) => new Date(Date.UTC(parseInt(e.target.value, 10), c.getUTCMonth(), 1))
    );

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate();

  const today = new Date();

  const startYear = 1900;
  const endYear = new Date().getFullYear() + 5;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );

  return (
    <div className={`p-2 sm:p-4 ${className}`}>
      {/* ── En-tête mois / année ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6 px-1">
        <button
          onClick={handlePrevMonth}
          className="p-3 rounded-full hover:bg-primary/10 active:bg-primary/20 active:scale-90 transition-all text-secondary flex items-center justify-center"
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1">
          <select
            value={currentDate.getUTCMonth()}
            onChange={handleMonthChange}
            className="appearance-none bg-transparent pl-2 pr-2 py-1 text-base sm:text-lg font-black uppercase tracking-tight text-secondary cursor-pointer hover:text-primary transition-colors focus:outline-none text-center"
            aria-label="Sélectionner le mois"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
          <select
            value={currentDate.getUTCFullYear()}
            onChange={handleYearChange}
            className="appearance-none bg-transparent pl-2 pr-2 py-1 text-base sm:text-lg font-black uppercase tracking-tight text-secondary cursor-pointer hover:text-primary transition-colors focus:outline-none text-center"
            aria-label="Sélectionner l'année"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-3 rounded-full hover:bg-primary/10 active:bg-primary/20 active:scale-90 transition-all text-secondary flex items-center justify-center"
          aria-label="Mois suivant"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      {/* ── Jours de la semaine ──────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs sm:text-sm text-muted-foreground font-medium mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* ── Grille des jours ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
          const dayOfMonth = d.getUTCDate().toString().padStart(2, '0');
          const key = `${month}-${dayOfMonth}`;
          const dayEvents = eventsByDayOfYear?.[key] || [];

          const isCurrentMonth = d.getUTCMonth() === currentDate.getUTCMonth();
          const isSelected = selected ? isSameDay(d, selected) : false;
          const isToday = isSameDay(d, today);
          const hasEvents = isCurrentMonth && dayEvents.length > 0;

          // ── Indicateurs ─────────────────────────────────────────────────
          const hasTimeline = hasEvents && dayEvents.some(
            (e) => (e as any).timelineId || (e as any).timelineSlug
          );
          const hasModule = hasEvents && dayEvents.some(
            (e) => (e as any).trainingModules?.length > 0
          );

          // Tooltip aria
          const indicators: string[] = [];
          if (hasTimeline) indicators.push('récit associé');
          if (hasModule) indicators.push('module de formation');
          const ariaLabel = [
            formatDate(d),
            ...indicators,
          ].join(' — ');

          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              disabled={!isCurrentMonth}
              aria-label={ariaLabel}
              title={indicators.length ? indicators.join(' · ') : undefined}
              className={`
                flex flex-col items-center justify-start py-0.5 w-full
                outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset
                rounded-md transition-colors
                ${!isCurrentMonth ? 'opacity-30 cursor-default' : 'cursor-pointer hover:bg-muted/60'}
              `}
            >
              {/* ── Chiffre du jour ─────────────────────────────────────── */}
              <span
                className={`
                  w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full
                  text-xs sm:text-sm transition-colors
                  ${isSelected
                    ? 'bg-primary text-primary-foreground font-bold'
                    : isToday && !isSelected
                      ? 'border-2 border-primary text-primary font-bold'
                      : hasEvents
                        ? 'bg-primary/10 font-semibold text-foreground'
                        : 'text-foreground'
                  }
                `}
              >
                {d.getUTCDate()}
              </span>

              {/* ── Indicateurs (points + icônes) ───────────────────────── */}
              {hasEvents && (
                <div className="flex items-center justify-center gap-[2px] mt-[2px] min-h-[14px]">

                  {/* Points colorés par thème – max 3 */}
                  {dayEvents.slice(0, 3).map((evt, idx) => (
                    <span
                      key={`dot-${idx}`}
                      className="block h-[5px] w-[5px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: resolveThemeColor(evt) }}
                      aria-hidden="true"
                    />
                  ))}

                  {/* Indice récit / parcours */}
                  {hasTimeline && (
                    <TimelineIcon
                      className="h-[11px] w-[11px] text-amber-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}

                  {/* Toque : module de formation */}
                  {hasModule && (
                    <GraduationCapIcon
                      className="h-[11px] w-[11px] text-secondary flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
