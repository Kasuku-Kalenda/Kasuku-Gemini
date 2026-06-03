import React, { useState, useRef } from 'react';
import { uploadFile } from '../../services/apiClient';

type UploadFolder = 'events' | 'timelines' | 'moments' | 'modules' | 'avatars' | 'misc';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  label: string;
  className?: string;
}

export const ImageUploadInput: React.FC<Props> = ({ value, onChange, folder, label, className }) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file, folder);
      onChange(url);
      setMode('url');
    } catch {
      alert('Erreur lors de l\'upload. Réessayez.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-2">
        {(['url', 'upload'] as const).map(m => (
          <button key={m} type="button"
            onClick={() => { setMode(m); if (m === 'upload') fileRef.current?.click(); }}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${mode === m ? 'bg-white shadow text-primary font-medium' : 'text-muted-foreground'}`}>
            {m === 'url' ? '🔗 URL' : uploading ? '⏳ Upload…' : '📁 Fichier'}
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://…"
        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {value && (
        <div className="rounded-xl overflow-hidden border bg-muted h-32 flex items-center justify-center mt-2">
          <img src={value} alt="" className="h-full w-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
};
