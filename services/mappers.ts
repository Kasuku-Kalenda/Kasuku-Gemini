/**
 * services/mappers.ts — Normalisation des réponses API → types frontend
 *
 * L'API PostgreSQL retourne des champs camelCase natifs (startDate,
 * primaryCountryCode…). Ce mapper produit la forme attendue par les
 * composants React (dateISO, countryCode, media[], sources[], etc.).
 */

import type { Event, TrainingModule, Creator, Media, Source } from '../types';
import { normalizeMediaUrl } from '../utils/helpers';

// ─── Événement ────────────────────────────────────────────────────────────────

export function mapApiEvent(raw: Record<string, unknown>): Event {
  // Date : PostgreSQL retourne un ISO string ou null
  const startRaw = raw.startDate as string | null | undefined;
  const dateISO  = startRaw ? startRaw.substring(0, 10) : ((raw.dateISO as string | undefined) ?? undefined);
  const year     = dateISO ? parseInt(dateISO.substring(0, 4), 10) : ((raw.year as number | undefined) ?? undefined);

  // Media : priorité à mediaItems (détail complet), sinon thumbnailUrl (liste)
  const thumbnailUrl  = raw.thumbnailUrl  as string | null | undefined;
  const rawMediaItems = raw.mediaItems    as Array<{
    id?: string; type?: string; url: string;
    caption?: string | null; credit?: string | null; isCover?: boolean;
  }> | null | undefined;

  const media: Media[] = Array.isArray(rawMediaItems) && rawMediaItems.length > 0
    ? rawMediaItems.map(m => ({
        id:      m.id,
        type:    (m.type === 'video' ? 'video' : 'image') as 'image' | 'video',
        url:     normalizeMediaUrl(m.url) ?? m.url,
        caption: m.caption  ?? undefined,
        credit:  m.credit   ?? undefined,
      }))
    : thumbnailUrl
      ? [{ type: 'image' as const, url: normalizeMediaUrl(thumbnailUrl) ?? thumbnailUrl }]
      : [];

  // Sources : construit depuis sourceLabel / sourceUrl (source unique sur les events)
  const sourceLabel = raw.sourceLabel as string | null | undefined;
  const sourceUrl   = raw.sourceUrl   as string | null | undefined;
  const sources: Source[] = sourceLabel
    ? [{ label: sourceLabel, url: sourceUrl ?? '' }]
    : (Array.isArray(raw.sources) ? (raw.sources as Source[]) : []);

  // trainingModules : construit depuis modules[] (retourné sur /slug/:slug)
  const rawModules = (raw.modules ?? raw.trainingModules) as Array<Record<string, unknown>> | undefined;
  const trainingModules: TrainingModule[] | undefined =
    Array.isArray(rawModules) && rawModules.length > 0
      ? rawModules.map(m => ({
          id:          m.id as string,
          slug:        m.slug as string,
          title:       m.title as string,
          summary:     (m.summary as string | undefined) ?? '',
          level:       (m.level as TrainingModule['level'] | undefined) ?? null,
          durationMin: (m.durationMin as number | undefined) ?? null,
          objectives:  [],
          creators:    [],
          sponsors:    [],
          sections:    [],
          eventIds:    [],
          updatedAt:   (m.updatedAt as string | undefined) ?? '',
        }))
      : undefined;

  // Contributors : storé tantôt comme JSON array de strings, tantôt comme
  // la string JSON '[]' (bug historique d'insertion). On normalise toujours
  // en string[] pour que EventForm.getValues('contributors').join() ne crashe pas.
  const rawContributors = raw.contributors;
  const contributors: string[] = Array.isArray(rawContributors)
    ? (rawContributors as unknown[]).map(c =>
        typeof c === 'string' ? c : typeof c === 'object' && c !== null ? (c as any).name ?? '' : ''
      ).filter(Boolean)
    : typeof rawContributors === 'string' && rawContributors.trim() !== '' && rawContributors !== '[]' && rawContributors !== '"[]"'
      ? (() => { try { const p = JSON.parse(rawContributors); return Array.isArray(p) ? p.map(String).filter(Boolean) : []; } catch { return []; } })()
      : [];

  return {
    // ── Champs natifs ────────────────────────────────────────────────────────
    id:                  raw.id as string,
    slug:                raw.slug as string,
    lang:                raw.lang as string | undefined,
    title:               raw.title as string,
    summary:             (raw.summary as string | undefined) ?? '',
    startDate:           startRaw ?? undefined,
    endDate:             raw.endDate as string | undefined,
    displayDate:         raw.displayDate as string | undefined,
    temporalType:        raw.temporalType as Event['temporalType'],
    approxCentury:       raw.approxCentury as number | null | undefined,
    approxDecade:        raw.approxDecade  as number | null | undefined,
    annualRecurrence:    raw.annualRecurrence as boolean | undefined,
    primaryCountryCode:  (raw.primaryCountryCode as string | undefined) ?? undefined,
    primaryPlaceName:    raw.primaryPlaceName as string | undefined,
    thumbnailUrl:        thumbnailUrl ?? undefined,
    sourceLabel:         sourceLabel ?? undefined,
    sourceUrl:           sourceUrl ?? undefined,
    reliability:         raw.reliability as Event['reliability'],
    contributors,
    featured:            raw.featured as boolean | undefined,
    status:              raw.status as Event['status'],
    publishedAt:         raw.publishedAt as string | undefined,
    createdAt:           raw.createdAt as string | undefined,
    updatedAt:           raw.updatedAt as string | undefined,

    // ── Aliases legacy ───────────────────────────────────────────────────────
    dateISO,
    year,
    period:              (raw.displayDate as string | undefined) ?? undefined,
    countryCode:         (raw.primaryCountryCode as string | undefined) ?? undefined,

    // ── Relations normalisées ────────────────────────────────────────────────
    themes:          Array.isArray(raw.themes) ? (raw.themes as Event['themes']) : [],
    people:          Array.isArray(raw.people) ? (raw.people as any[]) : [],
    heritageItems:   Array.isArray(raw.heritageItems) ? (raw.heritageItems as any[]) : [],
    media,
    sources,
    trainingModules,

    // ── Liens parcours ───────────────────────────────────────────────────────
    timelineSlug:      (raw.timelineSlug as string | null | undefined) ?? null,
    timelineTitle:     (raw.timelineTitle as string | null | undefined) ?? null,
    timelineThumbnail: (raw.timelineThumbnail as string | null | undefined) ?? null,

    // ── Flags légers (retournés par la liste publique, pas le détail) ────────
    hasModule:   (raw.hasModule as boolean | undefined),
    hasTimeline: (raw.hasTimeline as boolean | undefined),
  };
}

// ─── Module ───────────────────────────────────────────────────────────────────
// L'API retourne thumbnailUrl / durationMinutes / contributors / level en
// minuscule. Ce mapper normalise vers TrainingModule.

function normalizeLevel(raw: unknown): TrainingModule['level'] {
  if (!raw) return null;
  const s = String(raw);
  const map: Record<string, TrainingModule['level']> = {
    beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
    débutant: 'Débutant', intermédiaire: 'Intermédiaire', avancé: 'Avancé',
    Beginner: 'Beginner', Intermediate: 'Intermediate', Advanced: 'Advanced',
    Débutant: 'Débutant', Intermédiaire: 'Intermédiaire', Avancé: 'Avancé',
  };
  return map[s] ?? (s as TrainingModule['level']);
}

export function mapApiModule(raw: Record<string, unknown>): TrainingModule {
  // contributors → creators (liste publique, pas d'ID ni avatar)
  const rawContribs = raw.contributors as Array<{ name: string; role?: string; avatarUrl?: string }> | undefined;
  const creators: Creator[] = Array.isArray(rawContribs)
    ? rawContribs.map((c, i) => ({
        id:        c.name ?? String(i),   // API list n'expose pas d'ID pour les creators
        name:      c.name ?? '',
        avatarUrl: c.avatarUrl,
      }))
    : [];

  return {
    id:          raw.id as string,
    title:       raw.title as string,
    slug:        raw.slug as string,
    summary:     (raw.summary as string | undefined) ?? '',
    durationMin: (raw.durationMinutes as number | null | undefined) ?? null,
    level:       normalizeLevel(raw.level),
    objectives:  Array.isArray(raw.objectives) ? (raw.objectives as string[]) : [],
    language:    (raw.lang as string | undefined) ?? undefined,
    thumbnail:   (raw.thumbnailUrl as string | null | undefined) ?? undefined,
    creators,
    sponsors:    [],
    sections:    Array.isArray(raw.sections) ? (raw.sections as any[]) : [],
    updatedAt:   (raw.updatedAt as string | undefined) ?? '',
    eventIds:    Array.isArray(raw.eventIds) ? (raw.eventIds as string[]) : [],
    tags:        Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    moduleType:  (raw.moduleType as 'internal' | 'moodle' | undefined) ?? 'internal',
    moodleCourseUrl:  raw.moodleCourseUrl  as string | undefined,
    moodleInstanceId: raw.moodleInstanceId as string | null | undefined,
    moodleCourseId:   raw.moodleCourseId   as string | null | undefined,
    moodleMode:       raw.moodleMode       as 'lti' | 'offline' | 'url' | null | undefined,
    moodlePackageId:  raw.moodlePackageId  as string | null | undefined,
    timelineSlug:     raw.timelineSlug     as string | null | undefined,
    resources:        Array.isArray(raw.resources) ? (raw.resources as any[]) : undefined,
    finalQuiz:        raw.finalQuiz        as any | null | undefined,
    hasCertificate:   raw.hasCertificate   as boolean | undefined,
    certificateName:  raw.certificateName  as string | null | undefined,
  };
}

// ─── Sérialiseur : EventFormData → corps de requête API ───────────────────────
// Utilisé par adminApi pour les créations/modifications d'événements.

export function serializeEventForApi(data: Record<string, unknown>): Record<string, unknown> {
  return {
    title:               data.title,
    slug:                data.slug,
    summary:             data.summary ?? null,
    content:             data.content ?? null,
    lang:                data.lang ?? 'fr',
    temporalType:        data.temporalType ?? 'exact_date',
    // dateISO (legacy form) ou startDate (nouveau)
    startDate:           data.startDate ?? data.dateISO ?? null,
    endDate:             data.endDate ?? null,
    displayDate:         data.displayDate ?? data.period ?? null,
    approxCentury:       data.approxCentury ?? null,
    approxDecade:        data.approxDecade ?? null,
    annualRecurrence:    data.annualRecurrence ?? false,
    // countryCode (legacy) ou primaryCountryCode (nouveau)
    primaryCountryCode:  data.primaryCountryCode ?? data.countryCode ?? null,
    primaryPlaceId:      data.primaryPlaceId ?? null,
    // media[] → transmis tel quel ; l'API extrait thumbnailUrl + event_media en interne
    media:               (data.media as Media[] | undefined) ?? [],
    sourceLabel:         data.sourceLabel ?? (data.sources as Source[] | undefined)?.[0]?.label ?? null,
    sourceUrl:           data.sourceUrl   ?? (data.sources as Source[] | undefined)?.[0]?.url  ?? null,
    reliability:         data.reliability ?? 'confirmed',
    contributors:        Array.isArray(data.contributors) ? data.contributors : [],
    featured:            data.featured ?? false,
    featuredPosition:    data.featuredPosition ?? null,
    status:              data.status ?? 'draft',
    themeIds:            data.themeIds ?? [],
    personIds:           data.personIds ?? [],
    heritageItemIds:     data.heritageItemIds ?? [],
  };
}
