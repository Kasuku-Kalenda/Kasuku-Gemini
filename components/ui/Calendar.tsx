
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import type { Event } from '../../types';
import { THEME_COLORS } from '../../constants';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { formatDate } from '../../utils/helpers';


type CalendarProps = {
  mode: 'single';
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  eventsByDayOfYear?: Record<string, Event[]>; // Expects "MM-DD" keys
  onMonthChange?: (date: Date) => void;
};

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, className, eventsByDayOfYear, onMonthChange }) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date());

  useEffect(() => {
    if (selected) {
      if (selected.getUTCFullYear() !== currentDate.getUTCFullYear() || selected.getUTCMonth() !== currentDate.getUTCMonth()) {
        setCurrentDate(new Date(selected));
      }
    }
  }, [selected]);

  useEffect(() => {
    onMonthChange?.(currentDate);
  }, [currentDate, onMonthChange]);

  const startOfMonth = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
  const startDate = new Date(startOfMonth);
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());
  
  const days = [];
  let day = new Date(startDate);
  
  while (days.length < 42) {
    days.push(new Date(day));
    day.setUTCDate(day.getUTCDate() + 1);
  }

  const handlePrevMonth = () => {
    setCurrentDate(current => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(current => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)));
  };
  
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(current => new Date(Date.UTC(current.getUTCFullYear(), newMonth, 1)));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(current => new Date(Date.UTC(newYear, current.getUTCMonth(), 1)));
  };
  
  const isSameDay = (d1: Date, d2: Date) => d1.getUTCFullYear() === d2.getUTCFullYear() && d1.getUTCMonth() === d2.getUTCMonth() && d1.getUTCDate() === d2.getUTCDate();

  const startYear = 1900;
  const endYear = new Date().getFullYear() + 5;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  const months = Array.from({ length: 12 }, (_, i) => 
      new Date(0, i).toLocaleString('default', { month: 'long' })
  );

  return (
    <div className={`p-2 sm:p-4 ${className}`}>
      <div className="flex justify-between items-center mb-6 px-1">
        <button 
          onClick={handlePrevMonth} 
          className="p-3 rounded-full hover:bg-primary/10 active:bg-primary/20 active:scale-90 transition-all text-secondary flex items-center justify-center" 
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1">
          <div className="relative group">
            <select 
              value={currentDate.getUTCMonth()} 
              onChange={handleMonthChange}
              className="appearance-none bg-transparent pl-2 pr-2 py-1 text-base sm:text-lg font-black uppercase tracking-tight text-secondary cursor-pointer hover:text-primary transition-colors focus:outline-none text-center"
              aria-label="Select month"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
          <div className="relative group">
            <select 
              value={currentDate.getUTCFullYear()} 
              onChange={handleYearChange}
              className="appearance-none bg-transparent pl-2 pr-2 py-1 text-base sm:text-lg font-black uppercase tracking-tight text-secondary cursor-pointer hover:text-primary transition-colors focus:outline-none text-center"
              aria-label="Select year"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleNextMonth} 
          className="p-3 rounded-full hover:bg-primary/10 active:bg-primary/20 active:scale-90 transition-all text-secondary flex items-center justify-center" 
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs sm:text-sm text-muted-foreground font-medium">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d}>
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 mt-2">
        {days.map((d, i) => {
          const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
          const dayOfMonth = d.getUTCDate().toString().padStart(2, '0');
          const dayOfYearKey = `${month}-${dayOfMonth}`;
          const dayEvents = eventsByDayOfYear?.[dayOfYearKey] || [];
          const hasEvents = dayEvents.length > 0;
          const hasModule = dayEvents.some(e => e.trainingModules && e.trainingModules.length > 0);
          
          const formattedDate = formatDate(d);
          const ariaLabel = hasModule ? `${formattedDate} — training module available` : formattedDate;
          const isSelected = selected && isSameDay(d, selected);
          const isCurrentMonth = d.getUTCMonth() === currentDate.getUTCMonth();

          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              disabled={!isCurrentMonth}
              title={hasModule ? "Training module available" : ""}
              aria-label={ariaLabel}
              className={`day w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center rounded-full text-xs sm:text-sm transition-colors relative mx-auto focus-visible:ring-2 focus-visible:ring-primary/60 outline-none
                ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90 selected' : ''}
                ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                ${!selected && isSameDay(d, new Date()) ? 'border border-primary' : ''}
                ${isCurrentMonth && hasEvents && !isSelected ? 'bg-primary/10 font-medium' : ''}
              `}
            >
              <span>{d.getUTCDate()}</span>
              {hasModule && isCurrentMonth && (
                 <GraduationCapIcon className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
              )}
              {hasEvents && !hasModule && isCurrentMonth && (
                <div className="absolute bottom-1 flex justify-center items-center space-x-0.5">
                  {dayEvents.slice(0, 3).map((event, index) => {
                    const themeSlug = event.themes[0]?.slug;
                    const color = themeSlug ? THEME_COLORS[themeSlug] : '#ccc';
                    return <span key={index} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }}></span>;
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  );
};
