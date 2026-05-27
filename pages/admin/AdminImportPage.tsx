import React, { useState, useRef, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../services/adminApi';
import type { Event, Theme, TimelineNarrative } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportMode = 'events' | 'moments';

interface ParsedRow {
  raw: Record<string, string>;
  errors: string[];
  valid: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Parseur CSV robuste (gère quotes, virgules, BOM, CRLF) ──────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[] = [];
  let current = '';
  let inQ = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '"') {
      if (inQ && clean[i + 1] === '"') { current += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === '\n' && !inQ) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const splitLine = (line: string): string[] => {
    const fields: string[] = [];
    let f = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { f += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        fields.push(f.trim());
        f = '';
      } else {
        f += ch;
      }
    }
    fields.push(f.trim());
    return fields;
  };

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitLine(lines[0]).map(h => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = values[j] ?? ''; });
    rows.push(row);
  }
  return { headers, rows };
}

// ─── Templates CSV ────────────────────────────────────────────────────────────

const EVENTS_TEMPLATE = `titre,slug,resume,dateISO,annee,periode,codePays,slugsThemes,imageUrl,imageLegende,sourceLabel,sourceUrl,slugTimeline
"Indépendance du Sénégal","independance-senegal","Le 4 avril 1960, le Sénégal proclame son indépendance de la France. Cet événement historique marque la fin de la colonisation française en Afrique de l'Ouest.","1960-04-04","1960","","SN","histoire-politique","https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Flag_of_Senegal.svg/800px-Flag_of_Senegal.svg.png","Drapeau du Sénégal","Wikipedia","https://fr.wikipedia.org/wiki/Ind%C3%A9pendance_du_S%C3%A9n%C3%A9gal",""
"Première Guerre Mondiale","premiere-guerre-mondiale","La Première Guerre mondiale est un conflit militaire mondial qui oppose les grandes puissances européennes et leurs alliés entre 1914 et 1918. Cet événement transforme profondément l'ordre mondial.","","","1914-1918","","histoire-politique","","","",""
`;

const MOMENTS_TEMPLATE = `slugTimeline,titre,recit,typeDuration,dateExact,textePeriode,imageUrl,imageLegende
"nelson-mandela","Naissance à Mvezo","Nelson Mandela naît le 18 juillet 1918 dans le village de Mvezo, en Afrique du Sud. Fils d'un chef tribal de la tribu Thembu, il grandit dans un contexte de ségrégation raciale.","date","1918-07-18","","https://example.com/mandela-young.jpg","Nelson Mandela jeune"
"nelson-mandela","Emprisonnement à Robben Island","Condamné à la prison à vie pour sabotage et activités de résistance, Nelson Mandela est incarcéré à Robben Island. Il y passera 18 des 27 années de détention.","date","1964-06-12","","",""
"nelson-mandela","Apartheid - Années sombres","La politique d'apartheid institutionnalise la ségrégation raciale dans toute l'Afrique du Sud. Les Noirs sont dépossédés de leurs droits civiques et contraints de vivre dans des zones réservées.","period","","1948-1991","",""
`;

function downloadCSV(content: string, filename: string) {
  const bom = '\uFEFF'; // UTF-8 BOM pour Excel
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Slugify ──────────────────────────────────────────────────────────────────

const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

// ─── Validation et import événements ─────────────────────────────────────────

function validateEventRow(row: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!row['titre'] || row['titre'].length < 3) errors.push('Titre requis (min 3 car.)');
  if (!row['resume'] || row['resume'].length < 40) errors.push('Résumé requis (min 40 car.)');
  if (row['dateiso'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['dateiso'])) errors.push('dateISO format invalide (AAAA-MM-JJ)');
  if (row['annee'] && isNaN(parseInt(row['annee'], 10))) errors.push('Année invalide');
  if (row['codepays'] && row['codepays'].length !== 2) errors.push('Code pays : 2 lettres (ex: SN)');
  return errors;
}

async function importEvents(rows: Record<string, string>[]): Promise<ImportResult> {
  const [themeRes, timelineRes] = await Promise.all([
    adminApi.listThemes(),
    adminApi.listTimelines(),
  ]);
  const allThemes  = (themeRes as unknown as { items: Theme[] })?.items ?? themeRes as unknown as Theme[];
  const allTimelines = timelineRes.items ?? [];

  const themeBySlug: Record<string, Theme> = {};
  (allThemes as Theme[]).forEach(t => { themeBySlug[t.slug] = t; });
  const timelineBySlug: Record<string, TimelineNarrative> = {};
  allTimelines.forEach(t => { timelineBySlug[t.slug] = t; });

  let imported = 0;
  let skipped = 0;
  const importErrors: string[] = [];

  for (const row of rows) {
    const errs = validateEventRow(row);
    if (errs.length > 0) { skipped++; continue; }

    const themeSlugs = (row['slugsthemes'] || row['themes_slugs'] || '').split(',').map(s => s.trim()).filter(Boolean);
    const themes = themeSlugs.map(s => themeBySlug[s]).filter(Boolean) as Theme[];

    const title = row['titre'];
    const slug  = row['slug'] || slugify(title);
    const year  = row['annee'] ? parseInt(row['annee'], 10) : undefined;
    const timelineSlug = row['slugtimeline'] || row['timeline_slug'] || '';
    const timeline = timelineSlug ? timelineBySlug[timelineSlug] : undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await adminApi.createEvent({
        title, slug,
        summary:     row['resume'],
        dateISO:     row['dateiso']  || undefined,
        year,
        period:      row['periode']  || undefined,
        countryCode: row['codepays'] || undefined,
        themes,
        media: row['imageurl'] ? [{ type: 'image', url: row['imageurl'], caption: row['imagelegende'] || undefined }] : [],
        sources: row['sourcelabel'] && row['sourceurl'] ? [{ label: row['sourcelabel'], url: row['sourceurl'] }] : [],
        timelineId:   timeline?.id,
        timelineSlug: timeline?.slug,
      } as any);
      imported++;
    } catch (err) {
      importErrors.push(`Ligne "${title}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { imported, skipped, errors: importErrors };
}

// ─── Validation et import moments ────────────────────────────────────────────

function validateMomentRow(row: Record<string, string>, timelineSlugs: Set<string>, eventSlugs: Set<string>): string[] {
  const errors: string[] = [];
  const tlSlug = row['slugtimeline'] || row['slug_timeline'] || '';
  const evSlug = row['slugevenement'] || row['slug_evenement'] || row['slugevent'] || '';
  if (!tlSlug) errors.push('slugTimeline requis');
  else if (!timelineSlugs.has(tlSlug)) errors.push(`Timeline "${tlSlug}" introuvable`);
  if (!evSlug) errors.push('slugEvenement requis — chaque moment doit référencer un événement existant');
  else if (!eventSlugs.has(evSlug)) errors.push(`Événement "${evSlug}" introuvable`);
  if (!row['recit'] || row['recit'].length < 10) errors.push('Récit requis (min 10 car.)');
  if (row['dateexact'] && !/^\d{4}-\d{2}-\d{2}$/.test(row['dateexact'])) errors.push('dateExact format invalide (AAAA-MM-JJ)');
  return errors;
}

async function importMoments(rows: Record<string, string>[]): Promise<ImportResult> {
  // Charger timelines ET événements pour résoudre les slugs
  const [{ items: allTimelines }, eventsRes] = await Promise.all([
    adminApi.listTimelines(),
    adminApi.listEvents({ limit: 5000 }),
  ]);

  const timelineBySlug: Record<string, TimelineNarrative> = {};
  allTimelines.forEach(t => { timelineBySlug[t.slug] = t; });
  const timelineSlugs = new Set(Object.keys(timelineBySlug));

  const eventBySlug: Record<string, Event> = {};
  (eventsRes.items ?? []).forEach((e: Event) => { if (e.slug) eventBySlug[e.slug] = e; });
  const eventSlugs = new Set(Object.keys(eventBySlug));

  // Grouper les moments par timeline
  const momentsByTimeline: Record<string, TimelineNarrative['moments']> = {};
  let skipped = 0;
  const importErrors: string[] = [];
  let imported = 0;

  for (const row of rows) {
    const errs = validateMomentRow(row, timelineSlugs, eventSlugs);
    if (errs.length > 0) { skipped++; importErrors.push(...errs); continue; }

    const tlSlug = row['slugtimeline'] || row['slug_timeline'] || '';
    const evSlug = row['slugevenement'] || row['slug_evenement'] || row['slugevent'] || '';
    if (!momentsByTimeline[tlSlug]) momentsByTimeline[tlSlug] = [];

    const ev = eventBySlug[evSlug];
    const typeDuration = (row['typeduration'] || row['type_date'] || 'date') as 'date' | 'period';
    const moment: TimelineNarrative['moments'][0] = {
      id:          `mom${crypto.randomUUID()}`,
      timelineId:  timelineBySlug[tlSlug].id,
      eventId:     ev.id,                          // ← résolu depuis le slug
      title:       row['titre'] || ev.title,
      narrative:   row['recit'],                   // mappé vers narrativeText côté API
      timeType:    typeDuration === 'period' ? 'period' : 'date',
      dateExact:   row['dateexact'] || null,
      periodText:  row['texteperiode'] || row['texte_periode'] || null,
      position:    momentsByTimeline[tlSlug].length,
      media: row['imageurl'] ? [{
        id: `med${crypto.randomUUID()}`,
        type: 'image' as const,
        url: row['imageurl'],
        caption: row['imagelegende'] || undefined,
      }] : [],
    };

    momentsByTimeline[tlSlug].push(moment);
    imported++;
  }

  // Mettre à jour chaque timeline
  for (const [slug, newMoments] of Object.entries(momentsByTimeline)) {
    const tl = timelineBySlug[slug];
    if (!tl) continue;
    // Charger les moments existants depuis le détail de la timeline
    const tlDetail = await adminApi.getTimeline(tl.id);
    const existing = tlDetail?.moments ?? [];
    const merged = [...existing, ...newMoments];
    const sorted = merged.sort((a, b) => {
      const ta = a.dateExact ? new Date(a.dateExact + 'T12:00:00Z').getTime() : Infinity;
      const tb = b.dateExact ? new Date(b.dateExact + 'T12:00:00Z').getTime() : Infinity;
      return ta - tb;
    }).map((m, i) => ({ ...m, position: i }));
    await adminApi.updateTimeline(tl.id, {
      ...tl,
      moments: sorted as TimelineNarrative['moments'],
    } as any);
  }

  return { imported, skipped, errors: importErrors };
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AdminImportPageProps {
  navigateTo: (view: string) => void;
}

export const AdminImportPage: React.FC<AdminImportPageProps> = ({ navigateTo }) => {
  const [mode, setMode] = useState<ImportMode>('events');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const text = await file.text();
    const { headers: h, rows } = parseCSV(text);
    setHeaders(h);

    // Valider chaque ligne
    let timelineSlugs: Set<string> = new Set();
    if (mode === 'moments') {
      const { items: tls } = await adminApi.listTimelines();
      timelineSlugs = new Set(tls.map(t => t.slug));
    }

    const parsed: ParsedRow[] = rows.map(row => {
      const errors = mode === 'events'
        ? validateEventRow(row)
        : validateMomentRow(row, timelineSlugs);
      return { raw: row, errors, valid: errors.length === 0 };
    });
    setParsedRows(parsed);
  }, [mode]);

  const handleImport = async () => {
    setIsImporting(true);
    const validRows = parsedRows.filter(r => r.valid).map(r => r.raw);
    try {
      const res = mode === 'events'
        ? await importEvents(validRows)
        : await importMoments(validRows);
      setResult(res);
      setParsedRows([]);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: [String(err)] });
    }
    setIsImporting(false);
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;
  const PREVIEW_MAX = 20;

  return (
    <AdminLayout currentView="adminImport" navigateTo={navigateTo as any}>
      <div className="max-w-5xl mx-auto space-y-8 py-2">

        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-secondary">Import en masse</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez jusqu'à 1 000 événements ou moments de timeline depuis un fichier CSV (compatible Excel).
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
          {([
            { key: 'events', label: '📅 Événements calendrier' },
            { key: 'moments', label: '🎬 Moments de timeline' },
          ] as { key: ImportMode; label: string }[]).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setMode(tab.key); setParsedRows([]); setResult(null); setFileName(''); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === tab.key ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Résultat import */}
        {result && (
          <div className={`rounded-xl p-5 border ${result.errors.length > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-green-50 border-green-200'}`}>
            <h3 className={`font-bold mb-2 ${result.errors.length > 0 ? 'text-destructive' : 'text-green-700'}`}>
              {result.errors.length > 0 ? '⚠️ Import partiel' : '✅ Import réussi'}
            </h3>
            <ul className="text-sm space-y-1">
              <li><strong>{result.imported}</strong> {mode === 'events' ? 'événement(s)' : 'moment(s)'} importé(s)</li>
              {result.skipped > 0 && <li className="text-amber-700"><strong>{result.skipped}</strong> ligne(s) ignorée(s) (données invalides)</li>}
              {result.errors.map((e, i) => <li key={i} className="text-destructive">{e}</li>)}
            </ul>
          </div>
        )}

        {/* Zone d'upload */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Étape 1 — Téléchargez le modèle
            </h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadCSV(
                mode === 'events' ? EVENTS_TEMPLATE : MOMENTS_TEMPLATE,
                mode === 'events' ? 'kasuku-import-evenements.csv' : 'kasuku-import-moments.csv'
              )}
              className="gap-2"
            >
              ⬇️ Télécharger le modèle CSV
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              Ouvrez dans Excel, remplissez les lignes (ne modifiez pas les en-têtes), sauvegardez en CSV.
            </p>
          </div>

          {/* Description des colonnes */}
          <div className="bg-muted/50 rounded-xl p-4 text-xs space-y-1 border">
            <p className="font-bold text-sm mb-2">Colonnes {mode === 'events' ? 'événements' : 'moments'} :</p>
            {mode === 'events' ? (
              <table className="w-full text-left">
                <thead><tr className="border-b"><th className="py-1 pr-4 font-bold">Colonne</th><th className="py-1 font-bold">Description</th><th className="py-1 pl-4 font-bold">Requis ?</th></tr></thead>
                <tbody className="text-muted-foreground">
                  {[
                    ['titre', 'Titre de l\'événement', '✅ Oui'],
                    ['slug', 'Identifiant URL (auto-généré si vide)', '—'],
                    ['resume', 'Résumé (min 40 caractères)', '✅ Oui'],
                    ['dateISO', 'Date précise (AAAA-MM-JJ)', '—'],
                    ['annee', 'Année seule (ex: 1960)', '—'],
                    ['periode', 'Période texte (ex: 1914-1918)', '—'],
                    ['codePays', 'Code pays 2 lettres (ex: SN)', '—'],
                    ['slugsThemes', 'Slugs thèmes séparés par virgule', '—'],
                    ['imageUrl', 'URL image principale', '—'],
                    ['imageLegende', 'Légende de l\'image', '—'],
                    ['sourceLabel', 'Nom de la source', '—'],
                    ['sourceUrl', 'URL de la source', '—'],
                    ['slugTimeline', 'Slug du parcours à lier', '—'],
                  ].map(([col, desc, req]) => (
                    <tr key={col} className="border-b border-muted">
                      <td className="py-1 pr-4 font-mono text-primary">{col}</td>
                      <td className="py-1">{desc}</td>
                      <td className="py-1 pl-4">{req}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead><tr className="border-b"><th className="py-1 pr-4 font-bold">Colonne</th><th className="py-1 font-bold">Description</th><th className="py-1 pl-4 font-bold">Requis ?</th></tr></thead>
                <tbody className="text-muted-foreground">
                  {[
                    ['slugTimeline',  'Slug du parcours cible',                         '✅ Oui'],
                    ['slugEvenement', 'Slug de l\'événement à lier (doit exister)',      '✅ Oui'],
                    ['recit',         'Récit narratif du moment (min 10 car.)',          '✅ Oui'],
                    ['titre',         'Titre du moment (optionnel, hérite de l\'évén.)', '—'],
                    ['typeDuration',  '"date" ou "period"',                              '—'],
                    ['dateExact',     'Date précise (AAAA-MM-JJ)',                       '—'],
                    ['textePeriode',  'Texte de période (ex: Été 1944)',                 '—'],
                    ['imageUrl',      'URL de l\'illustration',                          '—'],
                    ['imageLegende',  'Légende de l\'image',                             '—'],
                  ].map(([col, desc, req]) => (
                    <tr key={col} className="border-b border-muted">
                      <td className="py-1 pr-4 font-mono text-primary">{col}</td>
                      <td className="py-1">{desc}</td>
                      <td className="py-1 pl-4">{req}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Upload */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
            Étape 2 — Importez votre fichier
          </h2>

          <div
            className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-4xl mb-3">📂</div>
            <p className="font-semibold text-secondary">
              {fileName ? `📄 ${fileName}` : 'Cliquez pour sélectionner un fichier CSV'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Format CSV (UTF-8 recommandé) — jusqu'à 1 000 lignes</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </section>

        {/* Prévisualisation */}
        {parsedRows.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Étape 3 — Vérification
              </h2>
              <div className="flex gap-3 text-sm">
                <span className="text-green-700 font-bold">✅ {validCount} valide{validCount > 1 ? 's' : ''}</span>
                {invalidCount > 0 && <span className="text-destructive font-bold">❌ {invalidCount} erreur{invalidCount > 1 ? 's' : ''}</span>}
              </div>
            </div>

            {/* Tableau prévisualisation */}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left font-bold w-8">#</th>
                    <th className="p-2 text-left font-bold w-24">Statut</th>
                    {headers.slice(0, 4).map(h => (
                      <th key={h} className="p-2 text-left font-bold">{h}</th>
                    ))}
                    <th className="p-2 text-left font-bold">Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, PREVIEW_MAX).map((row, i) => (
                    <tr key={i} className={`border-t ${row.valid ? '' : 'bg-destructive/5'}`}>
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">
                        {row.valid
                          ? <span className="text-green-700 font-bold">✅ OK</span>
                          : <span className="text-destructive font-bold">❌ Erreur</span>}
                      </td>
                      {headers.slice(0, 4).map(h => (
                        <td key={h} className="p-2 max-w-[150px] truncate" title={row.raw[h]}>
                          {row.raw[h] || <span className="text-muted-foreground italic">vide</span>}
                        </td>
                      ))}
                      <td className="p-2 text-destructive text-[10px]">
                        {row.errors.join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > PREVIEW_MAX && (
                <div className="p-3 text-center text-xs text-muted-foreground bg-muted/50 border-t">
                  … et <strong>{parsedRows.length - PREVIEW_MAX}</strong> autres lignes non affichées
                  ({parsedRows.slice(PREVIEW_MAX).filter(r => !r.valid).length} erreurs supplémentaires)
                </div>
              )}
            </div>

            {/* Bouton d'import */}
            {validCount > 0 && (
              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="gap-2 min-w-[240px]"
                >
                  {isImporting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Import en cours…
                    </>
                  ) : (
                    <>⬆️ Importer {validCount} {mode === 'events' ? 'événement' : 'moment'}{validCount > 1 ? 's' : ''}</>
                  )}
                </Button>
                {invalidCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Les {invalidCount} ligne{invalidCount > 1 ? 's' : ''} en erreur seront ignorées.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </AdminLayout>
  );
};
