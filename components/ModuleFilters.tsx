import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Slider } from './ui/Slider';
import { getModuleCreators } from '../services/api';

export interface Filters {
  level: string;
  lang: string;
  minDuration: number;
  maxDuration: number;
  types: {
    video: boolean;
    audio: boolean;
    pdf: boolean;
    quiz: boolean;
  };
  creator: string;
}

interface ModuleFiltersProps {
  onFilterChange: (filters: Partial<Filters>) => void;
}

export const ModuleFilters: React.FC<ModuleFiltersProps> = ({ onFilterChange }) => {
  const [levels, setLevels] = useState<string[]>([]);
  const [lang, setLang] = useState('');
  const [duration, setDuration] = useState(180);
  const [types, setTypes] = useState({ video: false, audio: false, pdf: false, quiz: false });
  const [creators, setCreators] = useState<{ id: string; name: string }[]>([]);
  const [selectedCreator, setSelectedCreator] = useState('');
  
  useEffect(() => {
    getModuleCreators().then(setCreators);
  }, []);

  const handleLevelChange = (level: string, checked: boolean) => {
    const newLevels = checked ? [...levels, level] : levels.filter(l => l !== level);
    setLevels(newLevels);
    // Note: API only supports one level, so we send the last selected one
    onFilterChange({ level: newLevels[newLevels.length-1] || '' });
  };
  
  const handleTypeChange = (type: keyof Filters['types'], checked: boolean) => {
    const newTypes = { ...types, [type]: checked };
    setTypes(newTypes);
    onFilterChange({ types: newTypes });
  }
  
  const handleReset = () => {
    setLevels([]);
    setLang('');
    setDuration(180);
    const resetTypes = { video: false, audio: false, pdf: false, quiz: false };
    setTypes(resetTypes);
    setSelectedCreator('');
    onFilterChange({ level: '', lang: '', maxDuration: 180, types: resetTypes, creator: '' });
  };

  return (
    <div className="p-4 bg-card rounded-2xl shadow-soft border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Filtres</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>Réinitialiser</Button>
      </div>
      
      <div className="space-y-6">
        {/* Level */}
        <div>
          <h4 className="font-semibold mb-2">Niveau</h4>
          <div className="space-y-2">
            {['Débutant', 'Intermédiaire', 'Avancé'].map(level => (
                <Checkbox key={level} label={level} checked={levels.includes(level)} onChange={e => handleLevelChange(level, e.target.checked)} />
            ))}
          </div>
        </div>
        
        {/* Language */}
        <div>
          <h4 className="font-semibold mb-2">Langue</h4>
          <select value={lang} onChange={e => { setLang(e.target.value); onFilterChange({lang: e.target.value})}} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none transition bg-white text-sm">
            <option value="">Toutes</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        
        {/* Duration */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Durée (max)</h4>
                <span className="text-sm text-muted-foreground">{duration} min</span>
            </div>
            <Slider value={duration} min={0} max={180} step={15} onChange={e => setDuration(Number(e.target.value))} onMouseUp={() => onFilterChange({maxDuration: duration})} />
        </div>

        {/* Resource Type */}
        <div>
          <h4 className="font-semibold mb-2">Types de ressources</h4>
          <div className="space-y-2">
            {(['video', 'audio', 'pdf', 'quiz'] as const).map(type => (
                <Checkbox key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} checked={types[type]} onChange={e => handleTypeChange(type, e.target.checked)} />
            ))}
          </div>
        </div>

        {/* Creator */}
        <div>
          <h4 className="font-semibold mb-2">Créateur</h4>
          <select value={selectedCreator} onChange={e => { setSelectedCreator(e.target.value); onFilterChange({creator: e.target.value})}} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none transition bg-white text-sm">
            <option value="">Tous</option>
            {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

      </div>
    </div>
  );
};