--
-- PostgreSQL database dump
--

\restrict oOCLJIdtG0BIYfJ2yaMLcSxVf1jgc0fxENNPn88gIIp61CfKrwgrLhlBGM8G7td

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: content_status; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.content_status AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE public.content_status OWNER TO kasuku;

--
-- Name: media_type; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.media_type AS ENUM (
    'image',
    'video',
    'audio',
    'pdf',
    'document'
);


ALTER TYPE public.media_type OWNER TO kasuku;

--
-- Name: person_role; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.person_role AS ENUM (
    'protagonist',
    'witness',
    'author',
    'organizer',
    'opponent',
    'victim',
    'other'
);


ALTER TYPE public.person_role OWNER TO kasuku;

--
-- Name: place_role; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.place_role AS ENUM (
    'primary',
    'related',
    'origin',
    'destination'
);


ALTER TYPE public.place_role OWNER TO kasuku;

--
-- Name: place_type; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.place_type AS ENUM (
    'continent',
    'country',
    'region',
    'city',
    'site',
    'virtual'
);


ALTER TYPE public.place_type OWNER TO kasuku;

--
-- Name: relation_type; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.relation_type AS ENUM (
    'cause',
    'consequence',
    'concurrent',
    'response',
    'context',
    'related'
);


ALTER TYPE public.relation_type OWNER TO kasuku;

--
-- Name: reliability_type; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.reliability_type AS ENUM (
    'confirmed',
    'probable',
    'contested',
    'unknown'
);


ALTER TYPE public.reliability_type OWNER TO kasuku;

--
-- Name: temporal_type; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.temporal_type AS ENUM (
    'exact_date',
    'date_range',
    'approximate',
    'unknown'
);


ALTER TYPE public.temporal_type OWNER TO kasuku;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: kasuku
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'editor',
    'contributor',
    'viewer'
);


ALTER TYPE public.user_role OWNER TO kasuku;

--
-- Name: fn_record_event_revision(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_record_event_revision() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO event_revisions (event_id, changed_by, change_type, previous_data)
    VALUES (
      OLD.id,
      NEW.updated_by,
      CASE
        WHEN NEW.status = 'published' AND OLD.status != 'published'    THEN 'publish'
        WHEN NEW.status = 'archived'  AND OLD.status != 'archived'     THEN 'archive'
        WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL      THEN 'delete'
        WHEN NEW.deleted_at IS NULL     AND OLD.deleted_at IS NOT NULL  THEN 'restore'
        ELSE 'update'
      END,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_record_event_revision() OWNER TO kasuku;

--
-- Name: fn_refresh_story_dates(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_refresh_story_dates() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_story_id UUID;
BEGIN
  v_story_id := COALESCE(NEW.story_id, OLD.story_id);

  UPDATE stories SET
    computed_start_date = (
      SELECT MIN(e.start_date)
      FROM story_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.story_id  = v_story_id
        AND e.start_date IS NOT NULL
        AND e.deleted_at IS NULL
    ),
    computed_end_date = (
      SELECT MAX(COALESCE(e.end_date, e.start_date))
      FROM story_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.story_id  = v_story_id
        AND e.start_date IS NOT NULL
        AND e.deleted_at IS NULL
    )
  WHERE id = v_story_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.fn_refresh_story_dates() OWNER TO kasuku;

--
-- Name: fn_set_published_at(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_set_published_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_set_published_at() OWNER TO kasuku;

--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_set_updated_at() OWNER TO kasuku;

--
-- Name: fn_update_event_search_vector(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_update_event_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.content, ''))), 'C');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_event_search_vector() OWNER TO kasuku;

--
-- Name: fn_update_module_search_vector(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_update_module_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_module_search_vector() OWNER TO kasuku;

--
-- Name: fn_update_people_search_vector(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_update_people_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.bio,  ''))), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_people_search_vector() OWNER TO kasuku;

--
-- Name: fn_update_story_search_vector(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.fn_update_story_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B');
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_story_search_vector() OWNER TO kasuku;

--
-- Name: update_featured_items_updated_at(); Type: FUNCTION; Schema: public; Owner: kasuku
--

CREATE FUNCTION public.update_featured_items_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.update_featured_items_updated_at() OWNER TO kasuku;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: event_media; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_media (
    event_id uuid NOT NULL,
    media_id uuid NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL,
    is_cover boolean DEFAULT false NOT NULL
);


ALTER TABLE public.event_media OWNER TO kasuku;

--
-- Name: event_modules; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_modules (
    event_id uuid NOT NULL,
    module_id uuid NOT NULL
);


ALTER TABLE public.event_modules OWNER TO kasuku;

--
-- Name: TABLE event_modules; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.event_modules IS 'Un module devient accessible partout où l''événement auquel il est rattaché apparaît.';


--
-- Name: event_people; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_people (
    event_id uuid NOT NULL,
    person_id uuid NOT NULL,
    role public.person_role DEFAULT 'other'::public.person_role NOT NULL,
    note text
);


ALTER TABLE public.event_people OWNER TO kasuku;

--
-- Name: COLUMN event_people.note; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.event_people.note IS 'Précision libre sur le rôle dans cet événement spécifique.';


--
-- Name: event_places; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_places (
    event_id uuid NOT NULL,
    place_id uuid NOT NULL,
    role public.place_role DEFAULT 'primary'::public.place_role NOT NULL
);


ALTER TABLE public.event_places OWNER TO kasuku;

--
-- Name: event_relations; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    related_event_id uuid NOT NULL,
    relation_type public.relation_type NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_no_self_relation CHECK ((event_id <> related_event_id))
);


ALTER TABLE public.event_relations OWNER TO kasuku;

--
-- Name: TABLE event_relations; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.event_relations IS 'Graphe causal et contextuel entre événements. Alimente la vue Explorer.';


--
-- Name: COLUMN event_relations.relation_type; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.event_relations.relation_type IS 'cause | consequence | concurrent | response | context | related';


--
-- Name: COLUMN event_relations.description; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.event_relations.description IS 'Explication narrative de la relation entre les deux événements.';


--
-- Name: event_revisions; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    change_type character varying(20) NOT NULL,
    previous_data jsonb,
    change_note text
);


ALTER TABLE public.event_revisions OWNER TO kasuku;

--
-- Name: TABLE event_revisions; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.event_revisions IS 'Historique complet et immuable des modifications sur les événements.';


--
-- Name: COLUMN event_revisions.change_type; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.event_revisions.change_type IS 'create | update | publish | archive | restore | delete';


--
-- Name: COLUMN event_revisions.previous_data; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.event_revisions.previous_data IS 'Snapshot JSON de la ligne events avant modification. Permet rollback.';


--
-- Name: COLUMN event_revisions.change_note; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.event_revisions.change_note IS 'Note descriptive optionnelle du contributeur sur la modification.';


--
-- Name: event_themes; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.event_themes (
    event_id uuid NOT NULL,
    theme_id uuid NOT NULL
);


ALTER TABLE public.event_themes OWNER TO kasuku;

--
-- Name: events; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    lang character varying(5) DEFAULT 'fr'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    summary text,
    content text,
    contributors jsonb DEFAULT '[]'::jsonb NOT NULL,
    temporal_type public.temporal_type DEFAULT 'exact_date'::public.temporal_type NOT NULL,
    start_date date,
    end_date date,
    display_date character varying(255),
    approx_century smallint,
    approx_decade smallint,
    annual_recurrence boolean DEFAULT false NOT NULL,
    primary_country_code character varying(2),
    primary_place_id uuid,
    featured boolean DEFAULT false NOT NULL,
    featured_position smallint,
    reliability public.reliability_type DEFAULT 'confirmed'::public.reliability_type NOT NULL,
    source_label text,
    source_url text,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector,
    CONSTRAINT chk_events_approx_century CHECK (((approx_century IS NULL) OR ((approx_century >= '-50'::integer) AND (approx_century <= 21)))),
    CONSTRAINT chk_events_approx_decade CHECK (((approx_decade IS NULL) OR (((approx_decade)::integer % 10) = 0))),
    CONSTRAINT chk_events_date_range CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT chk_events_featured_pos CHECK (((featured_position IS NULL) OR (featured = true))),
    CONSTRAINT chk_events_temporal_dates CHECK ((((temporal_type = 'exact_date'::public.temporal_type) AND (start_date IS NOT NULL)) OR ((temporal_type = 'date_range'::public.temporal_type) AND (start_date IS NOT NULL) AND (end_date IS NOT NULL)) OR ((temporal_type = 'approximate'::public.temporal_type) AND ((approx_century IS NOT NULL) OR (approx_decade IS NOT NULL))) OR (temporal_type = 'unknown'::public.temporal_type)))
);


ALTER TABLE public.events OWNER TO kasuku;

--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.events IS 'Objet central de Kasuku. Tout part d''un événement.';


--
-- Name: COLUMN events.lang; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.lang IS 'Langue de rédaction principale du contenu (fr, en, ar, sw...).';


--
-- Name: COLUMN events.contributors; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.contributors IS 'Crédits libres : auteurs, chercheurs, institutions sources. Non lié à users.';


--
-- Name: COLUMN events.display_date; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.display_date IS 'Libellé textuel libre affiché en UI, indépendant des dates machine.';


--
-- Name: COLUMN events.approx_century; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.approx_century IS 'Utilisé quand temporal_type = approximate. 20 = XXe siècle.';


--
-- Name: COLUMN events.approx_decade; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.approx_decade IS 'Granularité décennie, toujours multiple de 10 (1960, 1970...).';


--
-- Name: COLUMN events.annual_recurrence; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.annual_recurrence IS 'TRUE = réapparaît chaque année à la date anniversaire (calendrier "aujourd''hui dans l''histoire").';


--
-- Name: COLUMN events.primary_country_code; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.primary_country_code IS 'Code pays ISO pour filtrage rapide sans join sur places.';


--
-- Name: COLUMN events.featured_position; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.featured_position IS 'Ordre en page d''accueil. NULL si non mis en avant.';


--
-- Name: COLUMN events.reliability; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.reliability IS 'Niveau de certitude historique : confirmed, probable, contested, unknown.';


--
-- Name: COLUMN events.source_label; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.source_label IS 'Référence bibliographique de la source principale.';


--
-- Name: COLUMN events.deleted_at; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.deleted_at IS 'Soft delete. Un événement effacé n''est jamais détruit en base.';


--
-- Name: COLUMN events.search_vector; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.events.search_vector IS 'Vecteur full-text pondéré (A=title, B=summary, C=content). Mis à jour par trigger.';


--
-- Name: featured_items; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.featured_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_type character varying(10) NOT NULL,
    event_id uuid,
    story_id uuid,
    module_id uuid,
    title_override text,
    subtitle_override text,
    image_url_override text,
    cta_label text DEFAULT 'Découvrir'::text NOT NULL,
    cta_to text NOT NULL,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date DEFAULT (CURRENT_DATE + '30 days'::interval) NOT NULL,
    display_order smallint DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT chk_featured_single_source CHECK ((((
CASE
    WHEN (event_id IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (story_id IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (module_id IS NOT NULL) THEN 1
    ELSE 0
END) = 1)),
    CONSTRAINT chk_featured_type_fk CHECK (((((source_type)::text = 'event'::text) AND (event_id IS NOT NULL)) OR (((source_type)::text = 'story'::text) AND (story_id IS NOT NULL)) OR (((source_type)::text = 'module'::text) AND (module_id IS NOT NULL)))),
    CONSTRAINT featured_items_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['event'::character varying, 'story'::character varying, 'module'::character varying])::text[])))
);


ALTER TABLE public.featured_items OWNER TO kasuku;

--
-- Name: kalenda_events; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.kalenda_events (
    kalenda_id uuid NOT NULL,
    event_id uuid NOT NULL
);


ALTER TABLE public.kalenda_events OWNER TO kasuku;

--
-- Name: TABLE kalenda_events; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.kalenda_events IS 'Contenu sélectionné dans un Kalenda. Dépendances résolues à l''export.';


--
-- Name: kalenda_modules; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.kalenda_modules (
    kalenda_id uuid NOT NULL,
    module_id uuid NOT NULL
);


ALTER TABLE public.kalenda_modules OWNER TO kasuku;

--
-- Name: kalenda_stories; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.kalenda_stories (
    kalenda_id uuid NOT NULL,
    story_id uuid NOT NULL
);


ALTER TABLE public.kalenda_stories OWNER TO kasuku;

--
-- Name: TABLE kalenda_stories; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.kalenda_stories IS 'Sélectionner un récit n''inclut pas automatiquement ses événements dans le Kalenda.';


--
-- Name: kalenda_themes; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.kalenda_themes (
    kalenda_id uuid NOT NULL,
    theme_id uuid NOT NULL
);


ALTER TABLE public.kalenda_themes OWNER TO kasuku;

--
-- Name: kalendas; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.kalendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    version character varying(20) DEFAULT '1.0.0'::character varying NOT NULL,
    region character varying(255),
    cover_url text,
    target_lang character varying(5),
    offline_size_bytes bigint,
    last_exported_at timestamp with time zone,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kalendas OWNER TO kasuku;

--
-- Name: TABLE kalendas; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.kalendas IS 'Paquet de contenus sélectionnés pour déploiement local hors-ligne.';


--
-- Name: COLUMN kalendas.version; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.kalendas.version IS 'Versioning sémantique du paquet (ex: 1.2.0).';


--
-- Name: COLUMN kalendas.region; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.kalendas.region IS 'Zone géographique cible du déploiement (champ libre).';


--
-- Name: COLUMN kalendas.target_lang; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.kalendas.target_lang IS 'Langue principale pour ce déploiement.';


--
-- Name: COLUMN kalendas.last_exported_at; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.kalendas.last_exported_at IS 'Dernière génération physique du fichier de paquet.';


--
-- Name: media; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.media_type NOT NULL,
    url text NOT NULL,
    title text NOT NULL,
    description text,
    lang character varying(5),
    creators jsonb DEFAULT '[]'::jsonb NOT NULL,
    creation_year smallint,
    publication_date date,
    source text,
    publisher text,
    edition text,
    isbn character varying(20),
    credit text,
    license character varying(100),
    rights_expiry date,
    duration_s integer,
    width integer,
    height integer,
    size_bytes bigint,
    mime_type character varying(100),
    alt_text text,
    transcript_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_media_year CHECK (((creation_year IS NULL) OR ((creation_year >= 1) AND (creation_year <= 2100))))
);


ALTER TABLE public.media OWNER TO kasuku;

--
-- Name: TABLE media; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.media IS 'Ressources documentaires : images, vidéos, audios, PDFs.';


--
-- Name: COLUMN media.creators; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.media.creators IS 'Tableau JSON de créateurs avec rôle libre. Non lié à la table users.';


--
-- Name: COLUMN media.creation_year; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.media.creation_year IS 'Année de création de l''œuvre originale (≠ date d''upload).';


--
-- Name: COLUMN media.source; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.media.source IS 'Institution ou fonds d''origine : "Archives nationales du Mali", "INA".';


--
-- Name: COLUMN media.publisher; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.media.publisher IS 'Éditeur au sens bibliographique : "Présence Africaine", "L''Harmattan".';


--
-- Name: COLUMN media.rights_expiry; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.media.rights_expiry IS 'Permet d''alerter sur les droits expirant prochainement.';


--
-- Name: COLUMN media.transcript_url; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.media.transcript_url IS 'Transcription textuelle pour accessibilité et indexation full-text.';


--
-- Name: module_themes; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.module_themes (
    module_id uuid NOT NULL,
    theme_id uuid NOT NULL
);


ALTER TABLE public.module_themes OWNER TO kasuku;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    lang character varying(5) DEFAULT 'fr'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    summary text,
    thumbnail_url text,
    duration_minutes integer,
    level character varying(20),
    content jsonb DEFAULT '[]'::jsonb NOT NULL,
    contributors jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector,
    CONSTRAINT chk_modules_duration CHECK (((duration_minutes IS NULL) OR (duration_minutes > 0))),
    CONSTRAINT chk_modules_level CHECK (((level IS NULL) OR ((level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying])::text[]))))
);


ALTER TABLE public.modules OWNER TO kasuku;

--
-- Name: TABLE modules; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.modules IS 'Module pédagogique = cours rattaché à un ou plusieurs événements.';


--
-- Name: COLUMN modules.level; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.modules.level IS 'beginner | intermediate | advanced.';


--
-- Name: COLUMN modules.content; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.modules.content IS 'Blocs structurés : text, video, image, audio, quiz, resource.';


--
-- Name: COLUMN modules.contributors; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.modules.contributors IS 'Crédits libres : auteurs, experts, institutions. Non lié à users.';


--
-- Name: people; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.people (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    birth_date date,
    death_date date,
    birth_place_id uuid,
    nationality character varying(2),
    bio text,
    photo_url text,
    wikipedia_url text,
    search_vector tsvector,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_people_dates CHECK (((death_date IS NULL) OR (birth_date IS NULL) OR (death_date >= birth_date)))
);


ALTER TABLE public.people OWNER TO kasuku;

--
-- Name: TABLE people; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.people IS 'Personnalités historiques, politiques, culturelles, scientifiques.';


--
-- Name: COLUMN people.birth_place_id; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.people.birth_place_id IS 'Lieu de naissance lié à la table places.';


--
-- Name: COLUMN people.nationality; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.people.nationality IS 'Nationalité principale ISO 3166-1. Non restrictif : une personne peut être liée à plusieurs pays via event_people.';


--
-- Name: COLUMN people.search_vector; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.people.search_vector IS 'Vecteur full-text mis à jour par trigger.';


--
-- Name: places; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    place_type public.place_type DEFAULT 'city'::public.place_type NOT NULL,
    country_code character varying(2),
    parent_id uuid,
    lat numeric(9,6),
    lng numeric(9,6),
    wikipedia_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.places OWNER TO kasuku;

--
-- Name: TABLE places; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.places IS 'Géographie hiérarchique. Ex : Afrique → Congo → Kinshasa → Cité de l''OUA.';


--
-- Name: COLUMN places.country_code; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.places.country_code IS 'ISO 3166-1 alpha-2. NULL pour continents et lieux virtuels.';


--
-- Name: COLUMN places.parent_id; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.places.parent_id IS 'Hiérarchie : ville → région → pays → continent.';


--
-- Name: COLUMN places.lat; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.places.lat IS 'Latitude WGS84. NULL si localisation inconnue ou virtuelle.';


--
-- Name: COLUMN places.lng; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.places.lng IS 'Longitude WGS84. NULL si localisation inconnue ou virtuelle.';


--
-- Name: stories; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    lang character varying(5) DEFAULT 'fr'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    summary text,
    cover_url text,
    contributors jsonb DEFAULT '[]'::jsonb NOT NULL,
    computed_start_date date,
    computed_end_date date,
    status public.content_status DEFAULT 'draft'::public.content_status NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector,
    type character varying(20) DEFAULT 'evenement'::character varying NOT NULL,
    CONSTRAINT chk_stories_type CHECK (((type)::text = ANY ((ARRAY['evenement'::character varying, 'personnage'::character varying, 'thematique'::character varying])::text[])))
);


ALTER TABLE public.stories OWNER TO kasuku;

--
-- Name: TABLE stories; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.stories IS 'Récit = suite ordonnée d''événements avec enrichissement narratif contextuel par angle.';


--
-- Name: COLUMN stories.cover_url; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.stories.cover_url IS 'URL directe de l''image de couverture (stockée dans MinIO).';


--
-- Name: COLUMN stories.contributors; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.stories.contributors IS 'Crédits libres : auteurs, narrateurs, rédacteurs. Non lié à users.';


--
-- Name: COLUMN stories.computed_start_date; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.stories.computed_start_date IS 'MIN(start_date) des événements du récit. Calculé automatiquement par trigger.';


--
-- Name: COLUMN stories.computed_end_date; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.stories.computed_end_date IS 'MAX(start_date ou end_date) des événements du récit. Calculé automatiquement par trigger.';


--
-- Name: COLUMN stories.type; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.stories.type IS 'Catégorie du récit : evenement (chronologie), personnage (biographie), thematique (essai).';


--
-- Name: story_events; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.story_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    story_id uuid NOT NULL,
    event_id uuid NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL,
    lang character varying(5),
    narrative_text text,
    narrative_audio_url text,
    narrative_video_url text,
    quote text,
    quote_author text,
    cta jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_story_event_id uuid
);


ALTER TABLE public.story_events OWNER TO kasuku;

--
-- Name: TABLE story_events; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.story_events IS 'Junction Story ↔ Event avec enrichissement narratif contextuel. Cœur de la proposition Kasuku.';


--
-- Name: COLUMN story_events."position"; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.story_events."position" IS 'Ordre de l''événement dans le récit (0-based).';


--
-- Name: COLUMN story_events.narrative_text; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.story_events.narrative_text IS 'Texte narratif propre à cet angle du récit (peut différer selon le Story).';


--
-- Name: COLUMN story_events.cta; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.story_events.cta IS 'Call-to-action : {"label":"...","url":"...","type":"link|module|event"}';


--
-- Name: COLUMN story_events.source_story_event_id; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.story_events.source_story_event_id IS 'ID du StoryEvent original dont ce StoryEvent a été cloné (traçabilité, non contraignant).';


--
-- Name: story_media; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.story_media (
    story_id uuid NOT NULL,
    media_id uuid NOT NULL,
    is_cover boolean DEFAULT false NOT NULL
);


ALTER TABLE public.story_media OWNER TO kasuku;

--
-- Name: story_themes; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.story_themes (
    story_id uuid NOT NULL,
    theme_id uuid NOT NULL
);


ALTER TABLE public.story_themes OWNER TO kasuku;

--
-- Name: taggables; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.taggables (
    tag_id uuid NOT NULL,
    entity_type character varying(20) NOT NULL,
    entity_id uuid NOT NULL
);


ALTER TABLE public.taggables OWNER TO kasuku;

--
-- Name: TABLE taggables; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.taggables IS 'Association polymorphique tags ↔ entités.';


--
-- Name: COLUMN taggables.entity_type; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.taggables.entity_type IS 'Nom logique de l''entité : event, story, module, media.';


--
-- Name: COLUMN taggables.entity_id; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.taggables.entity_id IS 'UUID de l''entité cible (pas de FK formelle car polymorphique).';


--
-- Name: tags; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.tags OWNER TO kasuku;

--
-- Name: TABLE tags; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.tags IS 'Mots-clés libres et légers. Pas hiérarchiques. Complémentaires aux thèmes.';


--
-- Name: themes; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    parent_id uuid,
    color character varying(7),
    icon character varying(100),
    "position" smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.themes OWNER TO kasuku;

--
-- Name: TABLE themes; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.themes IS 'Classification hiérarchique. Thème sans parent = catégorie racine (ex: Histoire, Culture, Science).';


--
-- Name: COLUMN themes.parent_id; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.themes.parent_id IS 'NULL = thème racine. Sinon = sous-thème.';


--
-- Name: COLUMN themes.color; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.themes.color IS 'Code couleur hex pour l''affichage UI. Ex: #E63946';


--
-- Name: COLUMN themes.icon; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.themes.icon IS 'Identifiant d''icône ou URL SVG associée au thème.';


--
-- Name: COLUMN themes."position"; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.themes."position" IS 'Ordre d''affichage entre thèmes du même niveau hiérarchique.';


--
-- Name: translations; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.translations (
    entity_type character varying(20) NOT NULL,
    entity_id uuid NOT NULL,
    lang character varying(5) NOT NULL,
    field character varying(50) NOT NULL,
    value text NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    translated_by uuid,
    translated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.translations OWNER TO kasuku;

--
-- Name: TABLE translations; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.translations IS 'Traductions multilingues Option B. Fallback automatique vers langue source si traduction absente.';


--
-- Name: COLUMN translations.entity_type; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.translations.entity_type IS 'Nom logique de l''entité : event, story, module, theme, place, person, media, kalenda.';


--
-- Name: COLUMN translations.lang; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.translations.lang IS 'Code langue BCP 47 : en, sw, ar, pt, ha, yo, am, ln, so, rw, mg...';


--
-- Name: COLUMN translations.field; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.translations.field IS 'Nom du champ traduit (title, summary, content, bio, alt_text...).';


--
-- Name: COLUMN translations.value; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.translations.value IS 'Valeur traduite du champ. Pour content (JSON), valeur stringifiée.';


--
-- Name: COLUMN translations.status; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.translations.status IS 'draft | reviewed | published.';


--
-- Name: users; Type: TABLE; Schema: public; Owner: kasuku
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role public.user_role DEFAULT 'contributor'::public.user_role NOT NULL,
    avatar_url text,
    password_hash text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO kasuku;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON TABLE public.users IS 'Comptes éditoriaux internes. Ne pas confondre avec les contributeurs de contenu (JSONB libre).';


--
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.users.role IS 'admin > editor > contributor > viewer';


--
-- Name: COLUMN users.is_active; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON COLUMN public.users.is_active IS 'FALSE = compte désactivé sans suppression physique.';


--
-- Name: v_annual_calendar; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_annual_calendar AS
 SELECT id,
    slug,
    lang,
    title,
    summary,
    start_date,
    primary_country_code,
    reliability,
    (EXTRACT(year FROM start_date))::integer AS original_year,
    (EXTRACT(month FROM start_date))::integer AS month,
    (EXTRACT(day FROM start_date))::integer AS day
   FROM public.events e
  WHERE ((annual_recurrence = true) AND (start_date IS NOT NULL) AND (status = 'published'::public.content_status) AND (deleted_at IS NULL));


ALTER VIEW public.v_annual_calendar OWNER TO kasuku;

--
-- Name: VIEW v_annual_calendar; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_annual_calendar IS 'Événements récurrents annuels. Filtrer : WHERE month = X AND day = Y.';


--
-- Name: v_event_graph; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_event_graph AS
 SELECT er.relation_type,
    er.description,
    e1.id AS from_id,
    e1.slug AS from_slug,
    e1.title AS from_title,
    e1.start_date AS from_date,
    e2.id AS to_id,
    e2.slug AS to_slug,
    e2.title AS to_title,
    e2.start_date AS to_date
   FROM ((public.event_relations er
     JOIN public.events e1 ON ((e1.id = er.event_id)))
     JOIN public.events e2 ON ((e2.id = er.related_event_id)))
  WHERE ((e1.status = 'published'::public.content_status) AND (e1.deleted_at IS NULL) AND (e2.status = 'published'::public.content_status) AND (e2.deleted_at IS NULL));


ALTER VIEW public.v_event_graph OWNER TO kasuku;

--
-- Name: VIEW v_event_graph; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_event_graph IS 'Graphe de relations causales entre événements publiés. Alimente la vue Explorer.';


--
-- Name: v_events_published; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_events_published AS
 SELECT e.id,
    e.slug,
    e.lang,
    e.title,
    e.summary,
    e.temporal_type,
    e.start_date,
    e.end_date,
    e.display_date,
    e.approx_century,
    e.approx_decade,
    e.annual_recurrence,
    e.primary_country_code,
    p.name AS primary_place_name,
    p.place_type AS primary_place_type,
    e.featured,
    e.featured_position,
    e.reliability,
    e.contributors,
    e.published_at,
    e.created_at,
    e.updated_at
   FROM (public.events e
     LEFT JOIN public.places p ON ((p.id = e.primary_place_id)))
  WHERE ((e.status = 'published'::public.content_status) AND (e.deleted_at IS NULL));


ALTER VIEW public.v_events_published OWNER TO kasuku;

--
-- Name: VIEW v_events_published; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_events_published IS 'Événements publiés et non supprimés. Vue principale pour l''API publique.';


--
-- Name: v_media_rights_expiring; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_media_rights_expiring AS
 SELECT id,
    type,
    title,
    license,
    credit,
    rights_expiry,
    (rights_expiry - CURRENT_DATE) AS days_remaining
   FROM public.media
  WHERE ((rights_expiry IS NOT NULL) AND (rights_expiry >= CURRENT_DATE))
  ORDER BY rights_expiry;


ALTER VIEW public.v_media_rights_expiring OWNER TO kasuku;

--
-- Name: VIEW v_media_rights_expiring; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_media_rights_expiring IS 'Ressources avec droits expirant prochainement. Filtrer : WHERE days_remaining <= 90.';


--
-- Name: v_modules_published; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_modules_published AS
 SELECT id,
    slug,
    lang,
    title,
    summary,
    thumbnail_url,
    duration_minutes,
    level,
    contributors,
    published_at,
    created_at
   FROM public.modules m
  WHERE ((status = 'published'::public.content_status) AND (deleted_at IS NULL));


ALTER VIEW public.v_modules_published OWNER TO kasuku;

--
-- Name: VIEW v_modules_published; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_modules_published IS 'Modules publiés. Vue principale pour l''API publique des cours.';


--
-- Name: v_stories_published; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_stories_published AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(255) AS slug,
    NULL::character varying(5) AS lang,
    NULL::character varying(255) AS title,
    NULL::text AS summary,
    NULL::text AS cover_url,
    NULL::date AS computed_start_date,
    NULL::date AS computed_end_date,
    NULL::jsonb AS contributors,
    NULL::timestamp with time zone AS published_at,
    NULL::timestamp with time zone AS created_at,
    NULL::bigint AS event_count;


ALTER VIEW public.v_stories_published OWNER TO kasuku;

--
-- Name: VIEW v_stories_published; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_stories_published IS 'Récits publiés avec nombre d''événements et bornes temporelles calculées.';


--
-- Name: v_translation_gaps; Type: VIEW; Schema: public; Owner: kasuku
--

CREATE VIEW public.v_translation_gaps AS
 SELECT 'event'::text AS entity_type,
    e.id AS entity_id,
    e.title AS entity_title,
    l.lang,
    f.field,
    (EXISTS ( SELECT 1
           FROM public.translations t
          WHERE (((t.entity_type)::text = 'event'::text) AND (t.entity_id = e.id) AND ((t.lang)::text = l.lang) AND ((t.field)::text = f.field)))) AS is_translated
   FROM ((public.events e
     CROSS JOIN ( VALUES ('en'::text), ('sw'::text), ('ar'::text), ('pt'::text)) l(lang))
     CROSS JOIN ( VALUES ('title'::text), ('summary'::text)) f(field))
  WHERE ((e.status = 'published'::public.content_status) AND (e.deleted_at IS NULL));


ALTER VIEW public.v_translation_gaps OWNER TO kasuku;

--
-- Name: VIEW v_translation_gaps; Type: COMMENT; Schema: public; Owner: kasuku
--

COMMENT ON VIEW public.v_translation_gaps IS 'Champs manquants par langue cible sur les événements publiés. Tableau de bord éditorial.';


--
-- Data for Name: event_media; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_media (event_id, media_id, "position", is_cover) FROM stdin;
da2ef1e1-f26f-449d-8755-d202d85190dc	f06257f9-860c-4507-b607-7cf91cb8bcbb	0	t
2b6d500f-099f-40a1-9c29-35cbacc5f589	4acb3bec-cf70-48ff-bf8a-7ed433e72884	0	t
8ada64df-6cb7-4372-a761-692d2bf9bda1	f6d6fdc0-9ac5-455e-942d-0aa25671cfc3	0	t
ffd4d8c8-cd49-43b7-bc8b-b35091c3b032	ffaf4b85-b5d6-4254-ac28-1f1a905717c1	0	t
3b067fc9-ad4e-4ccc-b2ac-3f9a5397ef77	39cd197d-3baf-440f-b483-c33f04c35935	0	t
9d309066-fbc5-43b4-927c-5100ccd8584d	98c1dde9-09f4-4c69-a54e-e686fc1fec29	0	t
583cf076-d324-47d7-ba70-8b1976c27c7a	209efe34-dcee-4165-9439-4e49cdee41b0	0	t
d1340f79-945d-4761-a672-3834f253f481	93fc7aca-641f-46a7-bfe7-9c0c6c8f9458	0	t
06449c91-1e8b-4efd-97a1-2ed81e1eea1e	605c5033-2671-4b2d-a32b-708bfdeda840	0	t
acb05470-9994-4748-a818-e9ed130efe47	68970dfc-711c-4bfc-be62-2a8d85a95d48	0	t
f1abb40d-fe67-4375-99b3-1f4820698433	b52c8d63-8121-4dfa-82d0-3c8968b7a795	0	t
498f23d6-f6e3-48e1-8227-df6a8a92f272	4515a4db-170d-4465-b28a-85032dd989bd	0	t
56cefb88-401a-4607-a5a7-9568b788c310	ea3b3191-524d-4294-bdb8-8efec87e37e8	0	t
55d15224-2391-4501-aee0-9efcf8e68a96	fb14822b-e060-44bb-95cf-657bfa84f1c8	0	t
ef89b7b9-ce78-465a-9ae3-7ef7380da92a	2bb68dde-021c-4b5c-bffc-8adc071cd28e	0	t
7f8cc721-59f8-49f2-8f49-b31436417969	a773e032-2e8e-46ed-a4e1-bd31db8d2084	0	t
ef4c4a59-203c-4c61-a090-caebcf0d2a35	24475494-d7de-40e4-88a6-98505ca514f7	0	t
2966b262-5998-4938-932e-c49666db4a57	a728b752-c4b0-43fc-9504-59e922bb1b0e	0	t
6c50bb88-c424-4e8d-be3a-29d2f5aafca3	9382267b-1b55-49f4-8590-544aff0913c3	0	t
f0aac8cf-3710-4799-a117-34729ef9f8aa	fc9013aa-5bed-4449-9005-2cfa36129b4a	0	t
ca7588f1-1e09-4841-9a1d-9b22e8eb5139	ce5466e9-0eec-4e00-8e08-ad8068b19bdc	0	t
514497e8-d322-4c95-a5e4-c95187cf0e13	47f62695-d85f-44f5-8a15-22da8202ad25	0	t
d79b86d3-86a1-464a-a3d1-41903f717262	8e0f4b7f-ccc5-4c64-98dd-e6b4c4ac54fe	0	t
17db2f05-cdff-42c8-965b-3a988a82c96c	9ca99ea1-730b-405a-b0da-02ffb6f79a61	0	t
e8a7c80f-c2f8-495c-a784-e8437b04e42a	8fe9b143-8476-4e9a-8a69-6be060b474e9	0	t
10fef26f-6b9d-4cd2-a532-b03857b25d14	2b8bb090-2422-454c-9a6d-7288107635ca	0	t
3176d638-94c5-41ac-8b37-8511ea7ffc80	2df86494-45d4-4132-bca2-3a8fc320152b	0	t
860ca4cf-4059-4321-bd90-229c3ee2078f	93dd309b-1ef2-4de0-a9e7-0df24f1765db	0	t
0cfe7a93-f7b8-4bfa-817c-6ed07dbe265f	8c19f324-a42b-436b-bdcd-a9906ea9280e	0	t
23e6872b-502c-40a7-a5c3-bc8251882732	dee75a47-131b-481d-a1e1-2fe6365c876d	0	t
89fc27f1-cdae-4de7-8f69-cb1b51efbf3f	a9611aea-f3b4-4747-b029-a6432bce8af4	0	t
76aff9ca-c8a9-41e3-a626-0e97fddf8c21	ec60e580-2cfc-45b9-a988-b027382ad224	0	t
a8a84b63-5ea8-42d5-ba42-3a35710c2529	b6970f1b-c797-448c-93b7-e80fb1f8b12b	0	t
d616116b-fae3-489f-82f8-60605159a20b	90c25585-9033-4f95-8a2c-a9bf2049a783	0	t
98f7f729-ebfc-42a3-b9b5-0e0a8550772a	bfe9db31-1b24-42d6-855e-0b7af79d2d76	0	t
2e515d14-a241-49e4-8616-25e49f2d65bd	3c340f1d-bb71-4700-ae72-71dc93cb0dbe	0	t
4d95acfa-5272-42c5-8009-fde2f813e807	059553b8-4e3c-40c9-a757-203f197c85b9	0	t
960adda0-4375-4cfd-a51d-28d12207a751	244fc133-75c8-402b-8501-90b2095be121	0	t
cdec0adf-9b2f-4788-9f0f-31d437dc88c6	6c45fa99-e621-443d-b06f-6b17183747db	0	t
e745faf0-084b-499a-a0f5-2262984268d4	c39f0698-82b5-4ba3-8c81-9fa360cab487	0	t
98b321fe-a8d9-4f1b-8279-7e2d100bb631	850d1704-6ce4-43e0-aea6-1d2b7ce56e94	0	t
c79ae6a1-1797-4c37-a21f-f14bdaa17fb9	33e13956-ca58-4096-ae73-8c9ab44547a4	0	t
095682c2-1170-489e-a4fa-31a2f0a3985b	506f2c50-ce35-43ad-af15-1a8f35a749e4	0	t
18f5ab21-6096-4405-922c-fdb3425cde3f	4dd3e7a4-1004-4926-a33f-94f055447e9c	0	t
2b32ee89-e361-421e-99a4-05419755e6b1	efcb3f99-aabb-46ec-8500-f8319296767f	0	t
9b587451-fe9a-496e-a348-b979b4083a51	ec719a03-e6cb-4ccf-a7a7-9b680acdb84a	0	t
c0657f37-fc68-4908-b518-0bd0039ecb7d	59437969-36b9-4dd6-b5fe-88886b7a1186	0	t
249326c5-bc28-4d8e-859a-d993574f6e27	0dc60608-79c7-4a37-b064-e0982f0af381	0	t
249326c5-bc28-4d8e-859a-d993574f6e27	30211d87-80c3-4fa7-a820-3c2d7c0b5f78	0	t
b884c7c0-8fc2-45da-937a-c776f367d423	af8f7e61-c576-40d3-bd65-0bb1456d52a6	0	t
da67e68a-47a8-4a30-8472-07b5520813c9	af905248-20dc-43cc-8a2c-725d22efd53e	0	t
da67e68a-47a8-4a30-8472-07b5520813c9	fd4059c7-3167-4204-b20e-d0137183ad79	0	t
5100b2d5-c823-4157-bdd9-08a6d6d67e0f	2999dc14-adb6-4efe-bea7-0084d395fc28	0	t
d05fbd8b-1b28-4a81-8787-09e339811435	1b0f2a4c-9d21-4149-bb91-ee9d776f450e	0	t
d05fbd8b-1b28-4a81-8787-09e339811435	ed85ea13-a4e2-4aa1-82de-550bf40775bf	0	t
00c32598-a7d8-4958-9913-eec3f9afd1cf	5a0c76ad-6691-4b7e-896f-b37e556597da	0	t
1d930139-5167-40b1-9642-2c4b66a7556c	727666bd-c648-458f-8619-80f1585288cc	0	t
6070fbaa-a61d-4e63-8e86-1befc13f0460	7005e63f-a7d8-4aa3-b7ca-dd01abb587eb	0	t
b81ea18a-285f-4d72-ae29-e447d602526f	a49423ea-3ce8-4d4b-8db9-6be30ec5205e	0	t
404baec8-a325-4253-b615-11c0572e0eea	38ad3698-f67a-49ee-ab35-6ce346111b83	0	t
404baec8-a325-4253-b615-11c0572e0eea	2b29e03e-85f8-42cb-85dd-a5a0cc98e507	0	t
1a7b1f61-2e90-4cd2-8dee-736755a2d78a	6f892543-ca4f-4854-b7ab-b1ce0c5f294a	0	t
1f3fe16c-2a2e-4194-88d8-e5804d9df5be	22e37327-af13-4f13-9be8-8be39e9e400c	0	t
\.


--
-- Data for Name: event_modules; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_modules (event_id, module_id) FROM stdin;
\.


--
-- Data for Name: event_people; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_people (event_id, person_id, role, note) FROM stdin;
\.


--
-- Data for Name: event_places; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_places (event_id, place_id, role) FROM stdin;
\.


--
-- Data for Name: event_relations; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_relations (id, event_id, related_event_id, relation_type, description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: event_revisions; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_revisions (id, event_id, changed_by, changed_at, change_type, previous_data, change_note) FROM stdin;
2806e1f2-bc90-498d-b67f-8de70263a62c	da2ef1e1-f26f-449d-8755-d202d85190dc	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-04-30 08:18:16.439562+00	update	{"id": "da2ef1e1-f26f-449d-8755-d202d85190dc", "lang": "fr", "slug": "independance-du-congo-leopoldville", "title": "Indépendance du Congo-Léopoldville", "status": "published", "content": null, "summary": "Le 30 juin 1960, le Congo belge accède à l'indépendance et devient la République du Congo sous la présidence de Joseph Kasavubu et le premier ministère de Patrice Lumumba.", "end_date": null, "featured": false, "created_at": "2026-04-30T07:41:44.002945+00:00", "created_by": "9ebe8438-d4b8-4ecd-89b8-923040a276a3", "deleted_at": null, "source_url": "https://fr.wikipedia.org/wiki/Ind%C3%A9pendance_du_Congo", "start_date": "1960-06-30", "updated_at": "2026-04-30T07:41:44.002945+00:00", "updated_by": "9ebe8438-d4b8-4ecd-89b8-923040a276a3", "reliability": "confirmed", "contributors": "[]", "display_date": null, "published_at": null, "source_label": "Histoire de l'Afrique", "approx_decade": null, "search_vector": "'1960':9B '30':7B 'a':14B 'acced':13B 'belg':12B 'congo':4A,11B,22B 'congo-leopoldvill':3A 'devient':18B 'independ':1A,16B 'joseph':27B 'juin':8B 'kasavubu':28B 'leopoldvill':5A 'lumumb':35B 'minister':32B 'patric':34B 'premi':31B 'president':25B 'republ':20B 'sous':23B", "temporal_type": "exact_date", "approx_century": null, "primary_place_id": null, "annual_recurrence": true, "featured_position": null, "primary_country_code": "CD"}	\N
e2531037-d2c1-4b0b-b619-e9eb61cc85b1	e0c0c261-3304-42bb-9c0a-94cdc03492e6	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-04-30 14:17:33.123799+00	publish	{"id": "e0c0c261-3304-42bb-9c0a-94cdc03492e6", "lang": "fr", "slug": "test", "title": "Test", "status": "draft", "content": null, "summary": "djjqhkjqdhq qkdhlkqdhjkqjd mqkhjlkhdlqhd kjqhkldqldjjhdjhqdjk", "end_date": null, "featured": false, "created_at": "2026-04-30T10:28:36.686492+00:00", "created_by": "9ebe8438-d4b8-4ecd-89b8-923040a276a3", "deleted_at": null, "source_url": null, "start_date": "2026-04-30", "updated_at": "2026-04-30T10:28:36.686492+00:00", "updated_by": "9ebe8438-d4b8-4ecd-89b8-923040a276a3", "reliability": "confirmed", "contributors": "[]", "display_date": null, "published_at": null, "source_label": null, "approx_decade": null, "search_vector": "'djjqhkjqdhq':2B 'kjqhkldqldjjhdjhqdjk':5B 'mqkhjlkhdlqhd':4B 'qkdhlkqdhjkqjd':3B 'test':1A", "temporal_type": "exact_date", "approx_century": null, "primary_place_id": null, "annual_recurrence": false, "featured_position": null, "primary_country_code": "ZA"}	\N
\.


--
-- Data for Name: event_themes; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.event_themes (event_id, theme_id) FROM stdin;
1a7b1f61-2e90-4cd2-8dee-736755a2d78a	21898156-ddc2-41c4-a1da-b6f632b29d5a
e745faf0-084b-499a-a0f5-2262984268d4	21898156-ddc2-41c4-a1da-b6f632b29d5a
d79b86d3-86a1-464a-a3d1-41903f717262	21898156-ddc2-41c4-a1da-b6f632b29d5a
17db2f05-cdff-42c8-965b-3a988a82c96c	21898156-ddc2-41c4-a1da-b6f632b29d5a
76aff9ca-c8a9-41e3-a626-0e97fddf8c21	21898156-ddc2-41c4-a1da-b6f632b29d5a
b0c84619-dba0-4099-9154-a5640aa2b34a	21898156-ddc2-41c4-a1da-b6f632b29d5a
9bcc4534-01eb-42e4-989d-8d7be7acaafb	21898156-ddc2-41c4-a1da-b6f632b29d5a
631b942f-a59e-4dca-b2fe-a6ade00b3666	21898156-ddc2-41c4-a1da-b6f632b29d5a
7ca73ddd-c125-4232-8f1b-b3edc78173f5	21898156-ddc2-41c4-a1da-b6f632b29d5a
3b067fc9-ad4e-4ccc-b2ac-3f9a5397ef77	21898156-ddc2-41c4-a1da-b6f632b29d5a
583cf076-d324-47d7-ba70-8b1976c27c7a	21898156-ddc2-41c4-a1da-b6f632b29d5a
095682c2-1170-489e-a4fa-31a2f0a3985b	21898156-ddc2-41c4-a1da-b6f632b29d5a
18f5ab21-6096-4405-922c-fdb3425cde3f	21898156-ddc2-41c4-a1da-b6f632b29d5a
10fef26f-6b9d-4cd2-a532-b03857b25d14	21898156-ddc2-41c4-a1da-b6f632b29d5a
9077c221-ce3e-4c41-a0fd-2cf3f4db585b	21898156-ddc2-41c4-a1da-b6f632b29d5a
40a895e9-998f-432b-ade9-f81ecb55a478	21898156-ddc2-41c4-a1da-b6f632b29d5a
249326c5-bc28-4d8e-859a-d993574f6e27	21898156-ddc2-41c4-a1da-b6f632b29d5a
711d0ed1-efb7-4e89-a4b1-7eee6d9a54fe	21898156-ddc2-41c4-a1da-b6f632b29d5a
11277ead-e6ae-47c8-a023-e8f106bb39f1	21898156-ddc2-41c4-a1da-b6f632b29d5a
a8a84b63-5ea8-42d5-ba42-3a35710c2529	21898156-ddc2-41c4-a1da-b6f632b29d5a
2b6d500f-099f-40a1-9c29-35cbacc5f589	21898156-ddc2-41c4-a1da-b6f632b29d5a
d1340f79-945d-4761-a672-3834f253f481	21898156-ddc2-41c4-a1da-b6f632b29d5a
f0aac8cf-3710-4799-a117-34729ef9f8aa	21898156-ddc2-41c4-a1da-b6f632b29d5a
3176d638-94c5-41ac-8b37-8511ea7ffc80	21898156-ddc2-41c4-a1da-b6f632b29d5a
860ca4cf-4059-4321-bd90-229c3ee2078f	21898156-ddc2-41c4-a1da-b6f632b29d5a
22c76d18-c3b8-4dcb-a1c2-3146a219ac6a	21898156-ddc2-41c4-a1da-b6f632b29d5a
2966b262-5998-4938-932e-c49666db4a57	21898156-ddc2-41c4-a1da-b6f632b29d5a
1d930139-5167-40b1-9642-2c4b66a7556c	21898156-ddc2-41c4-a1da-b6f632b29d5a
9d309066-fbc5-43b4-927c-5100ccd8584d	21898156-ddc2-41c4-a1da-b6f632b29d5a
ffd4d8c8-cd49-43b7-bc8b-b35091c3b032	21898156-ddc2-41c4-a1da-b6f632b29d5a
d616116b-fae3-489f-82f8-60605159a20b	21898156-ddc2-41c4-a1da-b6f632b29d5a
98f7f729-ebfc-42a3-b9b5-0e0a8550772a	21898156-ddc2-41c4-a1da-b6f632b29d5a
8b1e13b8-38fe-4997-a0d4-041c635e2b93	21898156-ddc2-41c4-a1da-b6f632b29d5a
73d99908-3f79-42ea-9243-52bce912764c	21898156-ddc2-41c4-a1da-b6f632b29d5a
b14c16da-ce8d-4dbe-a3db-06efaf99b56a	be78eafb-a2a5-43c2-b460-22147c80d952
de7626dc-7bfd-4d38-aa15-e20084ff637f	be78eafb-a2a5-43c2-b460-22147c80d952
40b4aa00-9d65-443f-aa6d-6213d51b6da4	be78eafb-a2a5-43c2-b460-22147c80d952
474e1053-3036-4206-a600-80d060d605e7	be78eafb-a2a5-43c2-b460-22147c80d952
b884c7c0-8fc2-45da-937a-c776f367d423	be78eafb-a2a5-43c2-b460-22147c80d952
94ea82d2-4a6d-4fa1-96c8-b2f7a027ad34	be78eafb-a2a5-43c2-b460-22147c80d952
1cfba0c0-063b-4ef3-bba0-d8dc3b0eaf67	be78eafb-a2a5-43c2-b460-22147c80d952
7328bf8a-45f1-42db-9305-b22ead4b9c10	be78eafb-a2a5-43c2-b460-22147c80d952
eddaa76e-b136-413c-b75e-706fd618eec5	be78eafb-a2a5-43c2-b460-22147c80d952
da2ef1e1-f26f-449d-8755-d202d85190dc	38635d1a-53c1-48bf-9ff7-6256b06f08b4
9d739dac-c29d-497a-8826-c0e3e4f9223c	38635d1a-53c1-48bf-9ff7-6256b06f08b4
5f7d2b8c-e25a-45ce-bc24-137679249a76	38635d1a-53c1-48bf-9ff7-6256b06f08b4
5356026c-9a49-44be-a820-be1121ce43bf	38635d1a-53c1-48bf-9ff7-6256b06f08b4
10b6f917-a503-4970-a330-c17c26d8ac1e	38635d1a-53c1-48bf-9ff7-6256b06f08b4
9b169cae-0646-4c35-bfd9-1ffd38f266bf	38635d1a-53c1-48bf-9ff7-6256b06f08b4
dcf79cbb-c4db-4195-8166-5b589e0343a2	38635d1a-53c1-48bf-9ff7-6256b06f08b4
d2029588-3e0c-48c4-91bd-9f698c2b4003	38635d1a-53c1-48bf-9ff7-6256b06f08b4
ca7588f1-1e09-4841-9a1d-9b22e8eb5139	38635d1a-53c1-48bf-9ff7-6256b06f08b4
1a873c7b-1b7f-4969-9a67-e70251731a8a	38635d1a-53c1-48bf-9ff7-6256b06f08b4
ef4c4a59-203c-4c61-a090-caebcf0d2a35	38635d1a-53c1-48bf-9ff7-6256b06f08b4
2e515d14-a241-49e4-8616-25e49f2d65bd	38635d1a-53c1-48bf-9ff7-6256b06f08b4
b81ea18a-285f-4d72-ae29-e447d602526f	38635d1a-53c1-48bf-9ff7-6256b06f08b4
960adda0-4375-4cfd-a51d-28d12207a751	38635d1a-53c1-48bf-9ff7-6256b06f08b4
667e5e4b-2831-43b5-a8dd-317571330738	38635d1a-53c1-48bf-9ff7-6256b06f08b4
498f23d6-f6e3-48e1-8227-df6a8a92f272	a9541837-e0b0-49c1-b78c-f1fc909224ca
43a52891-09c2-4083-8b4a-23300f95080d	a9541837-e0b0-49c1-b78c-f1fc909224ca
e8a7c80f-c2f8-495c-a784-e8437b04e42a	38635d1a-53c1-48bf-9ff7-6256b06f08b4
514497e8-d322-4c95-a5e4-c95187cf0e13	38635d1a-53c1-48bf-9ff7-6256b06f08b4
6c50bb88-c424-4e8d-be3a-29d2f5aafca3	38635d1a-53c1-48bf-9ff7-6256b06f08b4
7b2f65e9-9c6c-4cc3-9c1e-18c5eac73bd8	38635d1a-53c1-48bf-9ff7-6256b06f08b4
82f581c1-c525-4db0-b78d-caf4e007f024	a9541837-e0b0-49c1-b78c-f1fc909224ca
98b321fe-a8d9-4f1b-8279-7e2d100bb631	a9541837-e0b0-49c1-b78c-f1fc909224ca
c0657f37-fc68-4908-b518-0bd0039ecb7d	a9541837-e0b0-49c1-b78c-f1fc909224ca
0cfe7a93-f7b8-4bfa-817c-6ed07dbe265f	c26fe9b2-4bd1-4cb5-a1f3-5c2460af1005
3eecefe4-a3b8-45d8-acf0-c65fd7a2c0f1	c26fe9b2-4bd1-4cb5-a1f3-5c2460af1005
da67e68a-47a8-4a30-8472-07b5520813c9	6962255d-f1f2-40c7-996d-2e1863103c33
d05fbd8b-1b28-4a81-8787-09e339811435	6962255d-f1f2-40c7-996d-2e1863103c33
3057a1c1-e67f-4874-b794-c08d24681347	6962255d-f1f2-40c7-996d-2e1863103c33
f1abb40d-fe67-4375-99b3-1f4820698433	49806f09-f5bc-4368-a2ce-75038c9ff938
56cefb88-401a-4607-a5a7-9568b788c310	49806f09-f5bc-4368-a2ce-75038c9ff938
55d15224-2391-4501-aee0-9efcf8e68a96	49806f09-f5bc-4368-a2ce-75038c9ff938
23e6872b-502c-40a7-a5c3-bc8251882732	49806f09-f5bc-4368-a2ce-75038c9ff938
89fc27f1-cdae-4de7-8f69-cb1b51efbf3f	49806f09-f5bc-4368-a2ce-75038c9ff938
c961b11b-43ee-4c95-b4df-5d8da5e2719d	49806f09-f5bc-4368-a2ce-75038c9ff938
7f8cc721-59f8-49f2-8f49-b31436417969	49806f09-f5bc-4368-a2ce-75038c9ff938
c79ae6a1-1797-4c37-a21f-f14bdaa17fb9	49806f09-f5bc-4368-a2ce-75038c9ff938
cc394b94-f303-460f-ae6c-c02fe6aaaaf3	49806f09-f5bc-4368-a2ce-75038c9ff938
ef89b7b9-ce78-465a-9ae3-7ef7380da92a	49806f09-f5bc-4368-a2ce-75038c9ff938
2b32ee89-e361-421e-99a4-05419755e6b1	49806f09-f5bc-4368-a2ce-75038c9ff938
9b587451-fe9a-496e-a348-b979b4083a51	49806f09-f5bc-4368-a2ce-75038c9ff938
acb05470-9994-4748-a818-e9ed130efe47	49806f09-f5bc-4368-a2ce-75038c9ff938
c96d9360-4992-4ce0-8d28-d2b8017bce01	49806f09-f5bc-4368-a2ce-75038c9ff938
c7ce4a5d-e37c-4736-a74b-d5d2bd4e5c41	49806f09-f5bc-4368-a2ce-75038c9ff938
5100b2d5-c823-4157-bdd9-08a6d6d67e0f	49806f09-f5bc-4368-a2ce-75038c9ff938
6070fbaa-a61d-4e63-8e86-1befc13f0460	49806f09-f5bc-4368-a2ce-75038c9ff938
404baec8-a325-4253-b615-11c0572e0eea	49806f09-f5bc-4368-a2ce-75038c9ff938
69d482b0-e658-4f58-a48d-6e6f1e49aa31	49806f09-f5bc-4368-a2ce-75038c9ff938
cdec0adf-9b2f-4788-9f0f-31d437dc88c6	49806f09-f5bc-4368-a2ce-75038c9ff938
3f643111-879d-4163-8a3b-3989581b791d	49806f09-f5bc-4368-a2ce-75038c9ff938
4d95acfa-5272-42c5-8009-fde2f813e807	49806f09-f5bc-4368-a2ce-75038c9ff938
06449c91-1e8b-4efd-97a1-2ed81e1eea1e	49806f09-f5bc-4368-a2ce-75038c9ff938
00c32598-a7d8-4958-9913-eec3f9afd1cf	49806f09-f5bc-4368-a2ce-75038c9ff938
8ada64df-6cb7-4372-a761-692d2bf9bda1	49806f09-f5bc-4368-a2ce-75038c9ff938
f497106d-5362-4f31-a744-6750706a1f56	49806f09-f5bc-4368-a2ce-75038c9ff938
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.events (id, slug, lang, title, summary, content, contributors, temporal_type, start_date, end_date, display_date, approx_century, approx_decade, annual_recurrence, primary_country_code, primary_place_id, featured, featured_position, reliability, source_label, source_url, status, published_at, created_by, updated_by, created_at, updated_at, deleted_at, search_vector) FROM stdin;
da2ef1e1-f26f-449d-8755-d202d85190dc	independance-du-congo-leopoldville	fr	Indépendance du Congo-Léopoldville	Le 30 juin 1960, le Congo belge accède à l indépendance et devient la République du Congo sous la présidence de Joseph Kasavubu et le premier ministère de Patrice Lumumba.	\N	"[]"	exact_date	1960-06-30	\N	\N	\N	\N	t	CD	\N	f	\N	confirmed	Wikipedia	https://fr.wikipedia.org/wiki/Independance_du_Congo	published	\N	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-04-30 07:41:44.002945+00	2026-04-30 08:18:16.439562+00	\N	'1960':9B '30':7B 'a':14B 'acced':13B 'belg':12B 'congo':4A,11B,22B 'congo-leopoldvill':3A 'devient':18B 'independ':1A,16B 'joseph':27B 'juin':8B 'kasavubu':28B 'leopoldvill':5A 'lumumb':35B 'minister':32B 'patric':34B 'premi':31B 'president':25B 'republ':20B 'sous':23B
e0c0c261-3304-42bb-9c0a-94cdc03492e6	test	fr	Test	djjqhkjqdhq qkdhlkqdhjkqjd mqkhjlkhdlqhd kjqhkldqldjjhdjhqdjk	\N	"[]"	exact_date	2026-04-30	\N	\N	\N	\N	f	ZA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 14:17:33.123799+00	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-04-30 10:28:36.686492+00	2026-04-30 14:17:33.123799+00	\N	'djjqhkjqdhq':2B 'kjqhkldqldjjhdjhqdjk':5B 'mqkhjlkhdlqhd':4B 'qkdhlkqdhjkqjd':3B 'test':1A
f1abb40d-fe67-4375-99b3-1f4820698433	seed-fondation-empire-mali-1235	fr	Fondation de l'Empire du Mali	Soundiata Keïta défait Soumangourou Kanté à la bataille de Kirina et fonde l'Empire du Mali, qui deviendra l'un des plus grands empires de l'Afrique médiévale.	\N	[]	exact_date	1235-01-01	\N	1235	\N	\N	f	ML	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/MaliEmpire.png/800px-MaliEmpire.png	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':12B 'afriqu':33B 'bataill':14B 'def':9B 'deviendr':24B 'empir':4A,20B,30B 'fond':18B 'fondat':1A 'grand':29B 'kant':11B 'keit':8B 'kirin':16B 'mal':6A,22B 'medieval':34B 'plus':28B 'soumangourou':10B 'soundiat':7B
3057a1c1-e67f-4874-b794-c08d24681347	seed-mansa-musa-pelerinage-1324	fr	Pèlerinage de Mansa Musa à La Mecque	Le roi du Mali Mansa Musa effectue son célèbre pèlerinage à La Mecque avec une caravane de 60 000 hommes et des tonnes d'or, épatant le monde et faisant connaître la richesse de l'Afrique.	\N	[]	exact_date	1324-01-01	\N	1324	\N	\N	f	ML	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mansa_Musa.jpg/800px-Mansa_Musa.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'000':26B '60':25B 'a':5A,18B 'afriqu':43B 'caravan':23B 'celebr':16B 'connaitr':38B 'effectu':14B 'epat':33B 'fais':37B 'homm':27B 'mal':11B 'mans':3A,12B 'mecqu':7A,20B 'mond':35B 'mus':4A,13B 'or':32B 'pelerinag':1A,17B 'richess':40B 'roi':9B 'ton':30B
498f23d6-f6e3-48e1-8227-df6a8a92f272	seed-universite-tombouctou-1327	fr	Apogée de l'Université de Tombouctou	La mosquée-université de Sankoré à Tombouctou atteint son apogée sous Mansa Musa avec 25 000 étudiants, devenant le plus grand centre de savoir islamique en Afrique subsaharienne.	\N	[]	approximate	\N	\N	XIVe siècle	14	\N	f	ML	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Timbuktu_Sankore_Mosque.jpg/800px-Timbuktu_Sankore_Mosque.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'000':23B '25':22B 'a':13B 'afriqu':34B 'apoge':1A,17B 'atteint':15B 'centr':29B 'deven':25B 'etudi':24B 'grand':28B 'islam':32B 'mans':19B 'mosque':9B 'mosquee-universit':8B 'mus':20B 'plus':27B 'sankor':12B 'savoir':31B 'sous':18B 'subsaharien':35B 'tombouctou':6A,14B 'universit':4A,10B
56cefb88-401a-4607-a5a7-9568b788c310	seed-chute-empire-songhai-1591	fr	Chute de l'Empire Songhaï à Tondibi	Les forces marocaines du sultan Ahmad al-Mansour défont l'armée songhaï à la bataille de Tondibi, mettant fin à l'un des plus grands empires d'Afrique de l'Ouest.	\N	[]	exact_date	1591-03-12	\N	12 mars 1591	\N	\N	f	ML	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':6A,21B,28B 'afriqu':36B 'ahmad':13B 'al':15B 'al-mansour':14B 'arme':19B 'bataill':23B 'chut':1A 'defont':17B 'empir':4A,34B 'fin':27B 'forc':9B 'grand':33B 'le':8B 'mansour':16B 'marocain':10B 'met':26B 'ouest':39B 'plus':32B 'songh':5A,20B 'sultan':12B 'tondib':7A,25B
55d15224-2391-4501-aee0-9efcf8e68a96	seed-fondation-royaume-kongo-1390	fr	Fondation du Royaume Kongo	Le Royaume Kongo est fondé par Lukeni lua Nimi, devenant l'un des royaumes les plus puissants d'Afrique centrale avec une organisation politique sophistiquée.	\N	[]	approximate	\N	\N	fin XIVe siècle	14	\N	f	CD	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'afriqu':23B 'central':24B 'deven':14B 'fond':9B 'fondat':1A 'kongo':4A,7B 'le':19B 'lu':12B 'luken':11B 'nim':13B 'organis':27B 'plus':20B 'polit':28B 'puiss':21B 'royaum':3A,6B,18B 'sophistique':29B
8ada64df-6cb7-4372-a761-692d2bf9bda1	seed-pyramides-meroe-fondation	fr	Construction des pyramides de Méroé	Le royaume de Koush construit ses célèbres pyramides à Méroé (actuel Soudan), témoignage d'une civilisation nubienne florissante héritière de l'Égypte pharaonique.	\N	[]	approximate	\N	\N	IIIe siècle av. J.-C.	-3	\N	f	SD	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sudan_Meroe_Pyramids_01a.jpg/800px-Sudan_Meroe_Pyramids_01a.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':14B 'actuel':16B 'celebr':12B 'civilis':21B 'construct':1A 'construit':10B 'egypt':27B 'flor':23B 'heritier':24B 'koush':9B 'mero':5A,15B 'nubien':22B 'pharaon':28B 'pyramid':3A,13B 'royaum':7B 'soudan':17B 'temoignag':18B
23e6872b-502c-40a7-a5c3-bc8251882732	seed-empire-axoum-apogee-4e-siecle	fr	Apogée du Royaume d'Aksoum	Le Royaume d'Aksoum atteint son apogée au IVe siècle, contrôlant les routes commerciales entre l'Afrique, l'Arabie et le monde méditerranéen, et adoptant le christianisme comme religion d'État.	\N	[]	approximate	\N	\N	IVe siècle	4	\N	f	ET	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Aksum_Obelisk.jpg/800px-Aksum_Obelisk.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'adopt':30B 'afriqu':22B 'aksoum':5A,9B 'apoge':1A,12B 'arab':24B 'atteint':10B 'christian':32B 'comm':33B 'commercial':19B 'control':16B 'entre':20B 'etat':36B 'ive':14B 'le':17B 'mediterraneen':28B 'mond':27B 'religion':34B 'rout':18B 'royaum':3A,7B 'siecl':15B
89fc27f1-cdae-4de7-8f69-cb1b51efbf3f	seed-grandes-zimbabwe-construction	fr	Construction du Grand Zimbabwe	Le Grand Zimbabwe, capitale d'un puissant empire bantou, est construit entre le XIe et le XVe siècle — le plus grand complexe de pierre d'Afrique subsaharienne ancienne.	\N	[]	approximate	\N	\N	XIe-XVe siècle	13	\N	f	ZW	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Great-Zimbabwe-2012.jpg/800px-Great-Zimbabwe-2012.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'afriqu':30B 'ancien':32B 'bantou':13B 'capital':8B 'complex':26B 'construct':1A 'construit':15B 'empir':12B 'entre':16B 'grand':3A,6B,25B 'pierr':28B 'plus':24B 'puiss':11B 'siecl':22B 'subsaharien':31B 'xi':18B 'xve':21B 'zimbabw':4A,7B
9d739dac-c29d-497a-8826-c0e3e4f9223c	seed-traite-berlin-1885	fr	Conférence de Berlin — partage de l'Afrique	Quatorze puissances européennes se réunissent à Berlin pour établir les règles du partage colonial de l'Afrique, dessinant des frontières artificielles qui façonneront le continent pour des siècles.	\N	[]	date_range	1884-11-15	1885-02-26	1884-1885	\N	\N	f	DE	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':13B 'afriqu':7A,24B 'artificiel':28B 'berlin':3A,14B 'colonial':21B 'conferent':1A 'continent':32B 'dessin':25B 'etabl':16B 'europeen':10B 'facon':30B 'frontier':27B 'le':17B 'partag':4A,20B 'puissanc':9B 'quatorz':8B 'regl':18B 'reun':12B 'siecl':35B
cdec0adf-9b2f-4788-9f0f-31d437dc88c6	seed-independance-ghana-1957	fr	Indépendance du Ghana	Le Ghana devient le premier pays d'Afrique subsaharienne à accéder à l'indépendance sous la direction de Kwame Nkrumah, ouvrant la voie au mouvement panafricain.	\N	[]	exact_date	1957-03-06	\N	6 mars 1957	\N	\N	f	GH	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Flag_of_Ghana.svg/800px-Flag_of_Ghana.svg.png	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':13B,15B 'acced':14B 'afriqu':11B 'devient':6B 'direct':20B 'ghan':3A,5B 'independ':1A,17B 'kwam':22B 'mouv':28B 'nkrumah':23B 'ouvr':24B 'panafricain':29B 'pay':9B 'premi':8B 'sous':18B 'subsaharien':12B 'voi':26B
5f7d2b8c-e25a-45ce-bc24-137679249a76	seed-independance-guinee-1958	fr	Indépendance de la Guinée	La Guinée vote 'Non' au référendum de De Gaulle et déclare son indépendance sous Sékou Touré, devenant le seul territoire francophone à rejeter la Communauté française.	\N	[]	exact_date	1958-10-02	\N	2 octobre 1958	\N	\N	f	GN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':26B 'communaut':29B 'declar':15B 'deven':21B 'francais':30B 'francophon':25B 'gaull':13B 'guine':4A,6B 'independ':1A,17B 'non':8B 'referendum':10B 'rejet':27B 'sekou':19B 'seul':23B 'sous':18B 'territoir':24B 'tour':20B 'vot':7B
e745faf0-084b-499a-a0f5-2262984268d4	seed-annee-afrique-1960	fr	L'Année de l'Afrique — 17 indépendances	En 1960, dix-sept nations africaines accèdent à l'indépendance en une seule année, marquant un tournant décisif dans la décolonisation du continent africain.	\N	[]	approximate	\N	\N	1960	\N	1960	f	\N	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'17':6A '1960':9B 'a':16B 'accedent':15B 'africain':14B,32B 'afriqu':5A 'anne':2A,22B 'continent':31B 'decis':26B 'decolonis':29B 'dix':11B 'dix-sept':10B 'independ':7A,18B 'marqu':23B 'nation':13B 'sept':12B 'seul':21B 'tourn':25B
5356026c-9a49-44be-a820-be1121ce43bf	seed-independance-senegal-1960	fr	Indépendance du Sénégal	Le Sénégal proclame son indépendance de la France le 20 août 1960 sous la présidence de Léopold Sédar Senghor, poète et premier chef d'État du pays.	\N	[]	exact_date	1960-08-20	\N	20 août 1960	\N	\N	f	SN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':15B '20':13B 'aout':14B 'chef':26B 'etat':28B 'franc':11B 'independ':1A,8B 'leopold':20B 'pay':30B 'poet':23B 'premi':25B 'president':18B 'proclam':6B 'sedar':21B 'senegal':3A,5B 'senghor':22B 'sous':16B
10b6f917-a503-4970-a330-c17c26d8ac1e	seed-independance-nigeria-1960	fr	Indépendance du Nigeria	Le Nigeria, la nation la plus peuplée d'Afrique, accède à l'indépendance du Royaume-Uni le 1er octobre 1960 sous Nnamdi Azikiwe.	\N	[]	exact_date	1960-10-01	\N	1er octobre 1960	\N	\N	f	NG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':24B '1er':22B 'a':14B 'acced':13B 'afriqu':12B 'azikiw':27B 'independ':1A,16B 'nation':7B 'nigeri':3A,5B 'nnamd':26B 'octobr':23B 'peuple':10B 'plus':9B 'royaum':19B 'royaume-un':18B 'sous':25B 'uni':20B
b14c16da-ce8d-4dbe-a3db-06efaf99b56a	seed-assassinat-lumumba-1961	fr	Assassinat de Patrice Lumumba	Le premier Premier ministre du Congo indépendant, Patrice Lumumba, est assassiné avec la complicité de la CIA et de la Belgique, devenant un martyr de l'indépendance africaine.	\N	[]	exact_date	1961-01-17	\N	17 janvier 1961	\N	\N	f	CD	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Patrice_Lumumba.jpg/800px-Patrice_Lumumba.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'africain':32B 'assassin':15B 'assassinat':1A 'belgiqu':25B 'ci':21B 'complicit':18B 'congo':10B 'deven':26B 'independ':11B,31B 'lumumb':4A,13B 'martyr':28B 'ministr':8B 'patric':3A,12B 'premi':6B,7B
3f643111-879d-4163-8a3b-3989581b791d	seed-oua-fondation-1963	fr	Fondation de l'Organisation de l'Unité Africaine	32 nations africaines fondent l'OUA à Addis-Abeba, premier cadre institutionnel pour l'unité panafricaine et la défense de la souveraineté africaine.	\N	[]	exact_date	1963-05-25	\N	25 mai 1963	\N	\N	f	ET	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'32':9B 'a':15B 'abeb':18B 'addis':17B 'addis-abeb':16B 'africain':8A,11B,32B 'cadr':20B 'defens':28B 'fondat':1A 'fondent':12B 'institutionnel':21B 'nation':10B 'organis':4A 'oua':14B 'panafricain':25B 'premi':19B 'souverainet':31B 'unit':7A,24B
98b321fe-a8d9-4f1b-8279-7e2d100bb631	seed-apartheid-abolition-1994	fr	Fin de l'Apartheid — Élection de Nelson Mandela	Nelson Mandela remporte les premières élections démocratiques d'Afrique du Sud, mettant fin à 46 ans d'apartheid et inaugurant la 'nation arc-en-ciel'.	\N	[]	exact_date	1994-04-27	\N	27 avril 1994	\N	\N	f	ZA	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/800px-Nelson_Mandela_1994.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'46':23B 'a':22B 'afriqu':17B 'an':24B 'apartheid':4A,26B 'arc':32B 'arc-en-ciel':31B 'ciel':34B 'democrat':15B 'elect':5A,14B 'fin':1A,21B 'inaugur':28B 'le':12B 'mandel':8A,10B 'met':20B 'nation':30B 'nelson':7A,9B 'premier':13B 'remport':11B 'sud':19B
c961b11b-43ee-4c95-b4df-5d8da5e2719d	seed-royaume-dahomey-1600	fr	Fondation du Royaume du Dahomey	Le Royaume du Dahomey est fondé au début du XVIIe siècle dans l'actuel Bénin, connu pour ses redoutables guerrières Agojie (les 'Amazones du Dahomey') et son armée organisée.	\N	[]	approximate	\N	\N	début XVIIe siècle	17	\N	f	BJ	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':19B 'agoj':26B 'amazon':28B 'arme':33B 'benin':20B 'connu':21B 'dahomey':5A,9B,30B 'debut':13B 'fond':11B 'fondat':1A 'guerrier':25B 'le':27B 'organise':34B 'redout':24B 'royaum':3A,7B 'siecl':16B 'xvii':15B
7f8cc721-59f8-49f2-8f49-b31436417969	seed-empire-zoulou-chaka-1816	fr	Fondation de l'Empire Zoulou par Chaka	Chaka Zoulou unifie les clans zulus et fonde un puissant empire militaire en Afrique du Sud, révolutionnant la tactique militaire avec la formation en 'cornes de buffle'.	\N	[]	exact_date	1816-01-01	\N	1816	\N	\N	f	ZA	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Shaka_Zulu.jpg/800px-Shaka_Zulu.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'afriqu':21B 'buffl':34B 'chak':7A,8B 'clan':12B 'corn':32B 'empir':4A,18B 'fond':15B 'fondat':1A 'format':30B 'le':11B 'militair':19B,27B 'puiss':17B 'revolution':24B 'sud':23B 'tactiqu':26B 'unif':10B 'zoulou':5A,9B 'zulus':13B
9b169cae-0646-4c35-bfd9-1ffd38f266bf	seed-bataille-adoua-1896	fr	Bataille d'Adoua — Victoire de l'Éthiopie	L'armée éthiopienne du Négus Ménélik II inflige une défaite écrasante aux forces italiennes à Adoua, faisant de l'Éthiopie le seul pays africain à repousser la colonisation européenne.	\N	[]	exact_date	1896-03-01	\N	1er mars 1896	\N	\N	f	ET	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Battle_of_Adwa.jpg/800px-Battle_of_Adwa.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':22B,32B 'adou':3A,23B 'africain':31B 'arme':9B 'bataill':1A 'colonis':35B 'defait':17B 'ecras':18B 'ethiop':7A,27B 'ethiopien':10B 'europeen':36B 'fais':24B 'forc':20B 'ii':14B 'inflig':15B 'italien':21B 'menelik':13B 'negus':12B 'pay':30B 'repouss':33B 'seul':29B 'victoir':4A
e8a7c80f-c2f8-495c-a784-e8437b04e42a	seed-resistance-samori-toure	fr	Résistance de Samori Touré contre la France	L'Almamy Samori Touré mène une résistance acharnée contre la colonisation française pendant près de 16 ans (1882-1898), créant un empire en Afrique de l'Ouest avant sa capture.	\N	[]	date_range	1882-01-01	1898-09-29	1882-1898	\N	\N	f	GN	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Samori_Tour%C3%A9.jpg/800px-Samori_Tour%C3%A9.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1898':26B '16':23B '1882':25B 'acharne':15B 'afriqu':31B 'almamy':9B 'an':24B 'avant':35B 'captur':37B 'colonis':18B 'contr':5A,16B 'cre':27B 'empir':29B 'franc':7A 'francais':19B 'men':12B 'ouest':34B 'pend':20B 'pre':21B 'resist':1A,14B 'samor':3A,10B 'tour':4A,11B
69d482b0-e658-4f58-a48d-6e6f1e49aa31	seed-soundiata-keita-roi-mali	fr	Soundiata Keïta, fondateur de l'Empire du Mali	Soundiata Keïta, le 'Lion du Manding', surmonte une enfance marquée par la maladie et le bannissement pour devenir le fondateur de l'Empire du Mali et héros de l'épopée mandingue.	\N	[]	approximate	\N	\N	XIIIe siècle	13	\N	f	ML	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'bann':24B 'deven':26B 'empir':6A,31B 'enfanc':17B 'epope':38B 'fondateur':3A,28B 'heros':35B 'keit':2A,10B 'lion':12B 'mal':8A,33B 'malad':21B 'manding':14B 'mandingu':39B 'marque':18B 'soundiat':1A,9B 'surmont':15B
514497e8-d322-4c95-a5e4-c95187cf0e13	seed-nkrumah-panafricanisme-1958	fr	Première Conférence des États Africains Indépendants	Kwame Nkrumah organise à Accra la première conférence des États africains indépendants, posant les bases du panafricanisme institutionnel et prônant les États-Unis d'Afrique.	\N	[]	exact_date	1958-04-15	\N	15 avril 1958	\N	\N	f	GH	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kwame_Nkrumah.jpg/800px-Kwame_Nkrumah.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':10B 'accra':11B 'africain':5A,17B 'afriqu':32B 'bas':21B 'conferent':2A,14B 'etat':4A,16B,29B 'etats-un':28B 'independ':6A,18B 'institutionnel':24B 'kwam':7B 'le':20B,27B 'nkrumah':8B 'organis':9B 'panafrican':23B 'pos':19B 'premier':1A,13B 'pron':26B 'unis':30B
d79b86d3-86a1-464a-a3d1-41903f717262	seed-canal-suez-inauguration-1869	fr	Inauguration du Canal de Suez	Le Canal de Suez est inauguré le 17 novembre 1869 en Égypte, transformant le commerce maritime mondial et renforçant l'importance géostratégique de l'Afrique du Nord.	\N	[]	exact_date	1869-11-17	\N	17 novembre 1869	\N	\N	f	EG	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Suez_Canal_2015.jpg/800px-Suez_Canal_2015.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'17':13B '1869':15B 'afriqu':30B 'canal':3A,7B 'commerc':20B 'egypt':17B 'geostrateg':27B 'import':26B 'inaugur':1A,11B 'maritim':21B 'mondial':22B 'nord':32B 'novembr':14B 'renforc':24B 'su':5A,9B 'transform':18B
17db2f05-cdff-42c8-965b-3a988a82c96c	seed-nationalisation-canal-suez-1956	fr	Nationalisation du Canal de Suez par Nasser	Le président égyptien Gamal Abdel Nasser nationalise le Canal de Suez le 26 juillet 1956, déclenchant la crise de Suez et affirmant la souveraineté égyptienne face aux puissances coloniales.	\N	[]	exact_date	1956-07-26	\N	26 juillet 1956	\N	\N	f	EG	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Gamal_Abdel_Nasser.jpg/800px-Gamal_Abdel_Nasser.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1956':22B '26':20B 'abdel':12B 'affirm':29B 'canal':3A,16B 'colonial':36B 'cris':25B 'declench':23B 'egyptien':10B,32B 'fac':33B 'gamal':11B 'juillet':21B 'nass':7A,13B 'nationalis':1A,14B 'president':9B 'puissanc':35B 'souverainet':31B 'su':5A,18B,27B
c79ae6a1-1797-4c37-a21f-f14bdaa17fb9	seed-empire-kanem-bornou-9e-siecle	fr	Fondation de l'Empire du Kanem	L'Empire du Kanem, l'un des plus anciens États d'Afrique centrale, est fondé autour du lac Tchad au IXe siècle, contrôlant les routes transsahariennes pendant des siècles.	\N	[]	approximate	\N	\N	IXe siècle	9	\N	f	TD	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'afriqu':18B 'ancien':15B 'autour':22B 'central':19B 'control':29B 'empir':4A,8B 'etat':16B 'fond':21B 'fondat':1A 'ixe':27B 'kanem':6A,10B 'lac':24B 'le':30B 'pend':33B 'plus':14B 'rout':31B 'siecl':28B,35B 'tchad':25B 'transsaharien':32B
76aff9ca-c8a9-41e3-a626-0e97fddf8c21	seed-traite-negriere-debut-16e	fr	Début de la traite négrière transatlantique	Les premiers esclaves africains sont déportés vers les Amériques, inaugurant trois siècles de traite transatlantique qui déportera entre 10 et 12 millions d'Africains.	\N	[]	approximate	\N	\N	début XVIe siècle	16	\N	f	\N	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'10':25B '12':27B 'africain':10B,30B 'amer':15B 'debut':1A 'deport':12B,23B 'entre':24B 'esclav':9B 'inaugur':16B 'le':7B,14B 'million':28B 'negrier':5A 'premi':8B 'siecl':18B 'trait':4A,20B 'transatlant':6A,21B 'trois':17B 'ver':13B
dcf79cbb-c4db-4195-8166-5b589e0343a2	seed-independance-maroc-1956	fr	Indépendance du Maroc	Le Maroc recouvre son indépendance de la France et de l'Espagne le 2 mars 1956, avec le retour du sultan Mohammed V exilé en 1953.	\N	[]	exact_date	1956-03-02	\N	2 mars 1956	\N	\N	f	MA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1953':29B '1956':19B '2':17B 'espagn':15B 'exil':27B 'franc':11B 'independ':1A,8B 'mar':18B 'maroc':3A,5B 'mohammed':25B 'recouvr':6B 'retour':22B 'sultan':24B 'v':26B
d2029588-3e0c-48c4-91bd-9f698c2b4003	seed-independance-tunisie-1956	fr	Indépendance de la Tunisie	La Tunisie proclame son indépendance de la France le 20 mars 1956 sous la direction de Habib Bourguiba, après des années de lutte nationaliste du Néo-Destour.	\N	[]	exact_date	1956-03-20	\N	20 mars 1956	\N	\N	f	TN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1956':16B '20':14B 'anne':25B 'apre':23B 'bourguib':22B 'destour':32B 'direct':19B 'franc':12B 'habib':21B 'independ':1A,9B 'lutt':27B 'mar':15B 'national':28B 'neo':31B 'neo-destour':30B 'proclam':7B 'sous':17B 'tunis':4A,6B
ca7588f1-1e09-4841-9a1d-9b22e8eb5139	seed-independance-algerie-1962	fr	Indépendance de l'Algérie	Après 8 ans de guerre d'indépendance contre la France (1954-1962), l'Algérie proclame son indépendance le 5 juillet 1962, au terme d'un conflit qui fit plus d'un million de morts.	\N	[]	exact_date	1962-07-05	\N	5 juillet 1962	\N	\N	f	DZ	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1962':16B '1954':15B '1962':25B '5':23B '8':6B 'alger':4A,18B 'an':7B 'apre':5B 'confl':30B 'contr':12B 'fit':32B 'franc':14B 'guerr':9B 'independ':1A,11B,21B 'juillet':24B 'million':36B 'mort':38B 'plus':33B 'proclam':19B 'term':27B
b0c84619-dba0-4099-9154-a5640aa2b34a	seed-toussaint-louverture-1791	fr	Révolution haïtienne — révolte de Saint-Domingue	La révolte des esclaves de Saint-Domingue sous Toussaint Louverture débute le 22 août 1791, menant à la première République noire indépendante du monde en 1804.	\N	[]	exact_date	1791-08-22	\N	22 août 1791	\N	\N	f	HT	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Toussaint_Louverture.jpg/800px-Toussaint_Louverture.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1791':23B '1804':34B '22':21B 'a':25B 'aout':22B 'debut':19B 'domingu':7A,15B 'esclav':11B 'haitien':2A 'independ':30B 'louvertur':18B 'men':24B 'mond':32B 'noir':29B 'premier':27B 'republ':28B 'revolt':3A,9B 'revolu':1A 'saint':6A,14B 'saint-domingu':5A,13B 'sous':16B 'toussaint':17B
9bcc4534-01eb-42e4-989d-8d7be7acaafb	seed-abolition-esclavage-france-1848	fr	Abolition de l'esclavage dans les colonies françaises	Victor Schoelcher fait adopter le décret du 27 avril 1848 abolissant définitivement l'esclavage dans toutes les colonies françaises, libérant environ 250 000 personnes.	\N	[]	exact_date	1848-04-27	\N	27 avril 1848	\N	\N	f	FR	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'000':31B '1848':18B '250':30B '27':16B 'abol':19B 'abolit':1A 'adopt':12B 'avril':17B 'colon':7A,26B 'decret':14B 'definit':20B 'environ':29B 'esclavag':4A,22B 'fait':11B 'francais':8A,27B 'le':6A,25B 'liber':28B 'person':32B 'schoelch':10B 'tout':24B 'victor':9B
cc394b94-f303-460f-ae6c-c02fe6aaaaf3	seed-empire-ashanti-fondation-1701	fr	Fondation du Royaume Ashanti	Osei Tutu Ier unifie les clans Akan et fonde le Royaume Ashanti dans l'actuel Ghana autour du symbole du Tabouret d'Or, créant un État centralisé et puissant.	\N	[]	approximate	\N	\N	début XVIIIe siècle	18	\N	f	GH	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':19B 'akan':11B 'ashant':4A,16B 'autour':21B 'centralis':31B 'clan':10B 'cre':28B 'etat':30B 'fond':13B 'fondat':1A 'ghan':20B 'ier':7B 'le':9B 'or':27B 'osei':5B 'puiss':33B 'royaum':3A,15B 'symbol':23B 'tabouret':25B 'tutu':6B 'unif':8B
631b942f-a59e-4dca-b2fe-a6ade00b3666	seed-dinshaway-incident-1906	fr	Incident de Denshawai — résistance égyptienne	L'incident de Denshawai en 1906, lors duquel des paysans égyptiens furent pendus après une altercation avec des officiers britanniques, galvanisa le nationalisme égyptien.	\N	[]	exact_date	1906-06-13	\N	13 juin 1906	\N	\N	f	EG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1906':11B 'alterc':21B 'apre':19B 'britann':25B 'denshaw':3A,9B 'duquel':13B 'egyptien':5A,16B,29B 'galvanis':26B 'incident':1A,7B 'lor':12B 'national':28B 'offici':24B 'paysan':15B 'pendus':18B 'resist':4A
de7626dc-7bfd-4d38-aa15-e20084ff637f	seed-kwame-nkrumah-naissance-1909	fr	Naissance de Kwame Nkrumah	Kwame Nkrumah naît le 21 septembre 1909 à Nkroful au Ghana (alors Gold Coast). Il deviendra le premier président du Ghana indépendant et père du panafricanisme moderne.	\N	[]	exact_date	1909-09-21	\N	21 septembre 1909	\N	\N	f	GH	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kwame_Nkrumah.jpg/800px-Kwame_Nkrumah.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1909':11B '21':9B 'a':12B 'alor':16B 'coast':18B 'deviendr':20B 'ghan':15B,25B 'gold':17B 'independ':26B 'kwam':3A,5B 'modern':31B 'naissanc':1A 'nait':7B 'nkroful':13B 'nkrumah':4A,6B 'panafrican':30B 'per':28B 'premi':22B 'president':23B 'septembr':10B
40b4aa00-9d65-443f-aa6d-6213d51b6da4	seed-leopold-senghor-president-1960	fr	Léopold Sédar Senghor — premier président du Sénégal	Léopold Sédar Senghor, poète et théoricien de la Négritude, devient le premier président du Sénégal indépendant en 1960, incarnant la rencontre entre culture africaine et universalisme.	\N	[]	exact_date	1960-09-05	\N	5 septembre 1960	\N	\N	f	SN	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Senghor-1987.jpg/800px-Senghor-1987.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':25B 'africain':31B 'cultur':30B 'devient':17B 'entre':29B 'incarn':26B 'independ':23B 'leopold':1A,8B 'negritud':16B 'poet':11B 'premi':4A,19B 'president':5A,20B 'rencontr':28B 'sedar':2A,9B 'senegal':7A,22B 'senghor':3A,10B 'theoricien':13B 'universal':33B
ef89b7b9-ce78-465a-9ae3-7ef7380da92a	seed-empire-oyo-17e-siecle	fr	Apogée de l'Empire Oyo	L'Empire Oyo (actuel Nigeria) atteint son apogée au XVIIe-XVIIIe siècle, dominant le commerce et la politique en Afrique de l'Ouest grâce à sa redoutable cavalerie.	\N	[]	approximate	\N	\N	XVIIe siècle	17	\N	f	NG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':31B 'actuel':9B 'afriqu':26B 'apoge':1A,13B 'atteint':11B 'cavaler':34B 'commerc':21B 'domin':19B 'empir':4A,7B 'grac':30B 'nigeri':10B 'ouest':29B 'oyo':5A,8B 'polit':24B 'redout':33B 'siecl':18B 'xvii':16B,17B 'xviie-xvii':15B
6c50bb88-c424-4e8d-be3a-29d2f5aafca3	seed-nelson-mandela-liberation-1990	fr	Libération de Nelson Mandela	Nelson Mandela est libéré le 11 février 1990 après 27 ans d'emprisonnement sur Robben Island, annonçant la fin prochaine de l'apartheid en Afrique du Sud.	\N	[]	exact_date	1990-02-11	\N	11 février 1990	\N	\N	f	ZA	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/800px-Nelson_Mandela_1994.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'11':10B '1990':12B '27':14B 'afriqu':29B 'an':15B 'annonc':21B 'apartheid':27B 'apre':13B 'emprison':17B 'fevri':11B 'fin':23B 'island':20B 'liber':1A,8B 'mandel':4A,6B 'nelson':3A,5B 'prochain':24B 'robben':19B 'sud':31B
7ca73ddd-c125-4232-8f1b-b3edc78173f5	seed-traite-transsaharienne-antiquite	fr	La route transsaharienne de l'or et du sel	Les caravanes transsahariennes relient l'Afrique subsaharienne au Maghreb et à la Méditerranée depuis l'Antiquité, transportant l'or, le sel, les esclaves et les savoirs.	\N	[]	approximate	\N	\N	Antiquité - Moyen Âge	5	\N	f	\N	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':20B 'afriqu':15B 'antiquit':25B 'caravan':11B 'depuis':23B 'esclav':32B 'le':10B,31B,34B 'maghreb':18B 'mediterrane':22B 'or':6A,28B 'relient':13B 'rout':2A 'savoir':35B 'sel':9A,30B 'subsaharien':16B 'transport':26B 'transsaharien':3A,12B
3b067fc9-ad4e-4ccc-b2ac-3f9a5397ef77	seed-hatshepsout-pharaonne-egypte	fr	Hatshepsout — pharaonne d'Égypte	Hatshepsout règne sur l'Égypte ancienne comme pharaon vers 1478-1458 av. J.-C., menant des expéditions commerciales au Pays de Pount et construisant son majestueux temple de Deir el-Bahari.	\N	[]	approximate	\N	\N	1478-1458 av. J.-C.	-10	\N	f	EG	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Hatshepsut-SmithsonianMag.jpg/800px-Hatshepsut-SmithsonianMag.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1458':15B '1478':14B 'ancien':10B 'av':16B 'bahar':36B 'comm':11B 'commercial':22B 'construis':28B 'deir':33B 'egypt':4A,9B 'el':35B 'el-bahar':34B 'expedit':21B 'hatshepsout':1A,5B 'majestu':30B 'men':19B 'pay':24B 'pharaon':2A,12B 'pount':26B 'regn':6B 'templ':31B 'ver':13B
583cf076-d324-47d7-ba70-8b1976c27c7a	seed-toutankhamon-decouverte-tombe-1922	fr	Découverte de la tombe de Toutânkhamon	L'archéologue Howard Carter découvre le 4 novembre 1922 la tombe intacte du pharaon Toutânkhamon dans la Vallée des Rois, révélant au monde les trésors inestimables de l'Égypte ancienne.	\N	[]	exact_date	1922-11-04	\N	4 novembre 1922	\N	\N	f	EG	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Tutankhamen_Egyptian_Museum.jpg/800px-Tutankhamen_Egyptian_Museum.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1922':15B '4':13B 'ancien':36B 'archeologu':8B 'cart':10B 'decouvert':1A 'decouvr':11B 'egypt':35B 'howard':9B 'inestim':32B 'intact':18B 'le':30B 'mond':29B 'novembr':14B 'pharaon':20B 'revel':27B 'rois':26B 'tomb':4A,17B 'toutankhamon':6A,21B 'tresor':31B 'valle':24B
095682c2-1170-489e-a4fa-31a2f0a3985b	seed-indep-cote-ivoire-1960	fr	Indépendance de la Côte d'Ivoire	La Côte d'Ivoire proclame son indépendance de la France le 7 août 1960 sous Félix Houphouët-Boigny, qui restera au pouvoir jusqu'en 1993.	\N	[]	exact_date	1960-08-07	\N	7 août 1960	\N	\N	f	CI	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':20B '1993':32B '7':18B 'aout':19B 'boigny':25B 'cot':4A,8B 'felix':22B 'franc':16B 'houphouet':24B 'houphouet-boigny':23B 'independ':1A,13B 'ivoir':6A,10B 'jusqu':30B 'pouvoir':29B 'proclam':11B 'rest':27B 'sous':21B
18f5ab21-6096-4405-922c-fdb3425cde3f	seed-indep-cameroun-1960	fr	Indépendance du Cameroun	Le Cameroun, ancienne colonie franco-britannique, accède à l'indépendance le 1er janvier 1960 sous la présidence d'Ahmadou Ahidjo.	\N	[]	exact_date	1960-01-01	\N	1er janvier 1960	\N	\N	f	CM	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':18B '1er':16B 'a':12B 'acced':11B 'ahidjo':24B 'ahmadou':23B 'ancien':6B 'britann':10B 'cameroun':3A,5B 'colon':7B 'franco':9B 'franco-britann':8B 'independ':1A,14B 'janvi':17B 'president':21B 'sous':19B
10fef26f-6b9d-4cd2-a532-b03857b25d14	seed-indep-congo-belge-1960	fr	Indépendance du Congo belge	Le Congo belge accède à l'indépendance le 30 juin 1960, Patrice Lumumba devient Premier ministre et Kasavubu président de la République Démocratique du Congo.	\N	[]	exact_date	1960-06-30	\N	30 juin 1960	\N	\N	f	CD	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Patrice_Lumumba.jpg/800px-Patrice_Lumumba.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':15B '30':13B 'a':9B 'acced':8B 'belg':4A,7B 'congo':3A,6B,29B 'democrat':27B 'devient':18B 'independ':1A,11B 'juin':14B 'kasavubu':22B 'lumumb':17B 'ministr':20B 'patric':16B 'premi':19B 'president':23B 'republ':26B
2b32ee89-e361-421e-99a4-05419755e6b1	seed-indep-somalie-1960	fr	Indépendance de la Somalie	La Somalie italienne et le Somaliland britannique fusionnent pour former la République somalienne indépendante le 1er juillet 1960.	\N	[]	exact_date	1960-07-01	\N	1er juillet 1960	\N	\N	f	SO	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':22B '1er':20B 'britann':11B 'form':14B 'fusionnent':12B 'independ':1A,18B 'italien':7B 'juillet':21B 'republ':16B 'somal':4A,6B 'somalien':17B 'somaliland':10B
9b587451-fe9a-496e-a348-b979b4083a51	seed-indep-mali-1960	fr	Indépendance du Mali	Le Soudan français (futur Mali) accède à l'indépendance le 22 septembre 1960 après la dissolution de la Fédération du Mali avec le Sénégal, sous Modibo Keïta.	\N	[]	exact_date	1960-09-22	\N	22 septembre 1960	\N	\N	f	ML	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':16B '22':14B 'a':10B 'acced':9B 'apre':17B 'dissolu':19B 'feder':22B 'franc':6B 'futur':7B 'independ':1A,12B 'keit':30B 'mal':3A,8B,24B 'modibo':29B 'senegal':27B 'septembr':15B 'soudan':5B 'sous':28B
9077c221-ce3e-4c41-a0fd-2cf3f4db585b	seed-revolution-egyptienne-1952	fr	Révolution égyptienne de 1952	Les Officiers Libres conduits par Mohammed Naguib et Gamal Abdel Nasser renversent le roi Farouk et établissent la République d'Égypte, mettant fin à la monarchie et à l'influence britannique.	\N	[]	exact_date	1952-07-23	\N	23 juillet 1952	\N	\N	f	EG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1952':4A 'a':28B,32B 'abdel':14B 'britann':35B 'conduit':8B 'egypt':25B 'egyptien':2A 'etabl':21B 'farouk':19B 'fin':27B 'gamal':13B 'influenc':34B 'le':5B 'libr':7B 'met':26B 'mohammed':10B 'monarch':30B 'naguib':11B 'nass':15B 'offici':6B 'renversent':16B 'republ':23B 'revolu':1A 'roi':18B
1a873c7b-1b7f-4969-9a67-e70251731a8a	seed-soulèvement-mau-mau-1952	fr	Soulèvement Mau Mau au Kenya	Le mouvement Mau Mau, principalement composé de Kikuyu, se soulève contre la colonisation britannique au Kenya, menant à une répression brutale et à l'emprisonnement de Jomo Kenyatta.	\N	[]	date_range	1952-10-20	1960-01-12	1952-1960	\N	\N	f	KE	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':23B,28B 'britann':19B 'brutal':26B 'colonis':18B 'compos':11B 'contr':16B 'emprison':30B 'jomo':32B 'keni':5A,21B 'kenyatt':33B 'kikuyu':13B 'mau':2A,3A,8B,9B 'men':22B 'mouv':7B 'principal':10B 'repress':25B 'soulev':1A,15B
474e1053-3036-4206-a600-80d060d605e7	seed-thomas-sankara-president-burkina-1983	fr	Thomas Sankara prend le pouvoir au Burkina Faso	Le capitaine Thomas Sankara arrive au pouvoir au Burkina Faso le 4 août 1983 et renomme le pays. Il mène une révolution sociale radicale avant son assassinat en 1987.	\N	[]	exact_date	1983-08-04	\N	4 août 1983	\N	\N	f	BF	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Thomas_Sankara.jpg/800px-Thomas_Sankara.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1983':22B '1987':37B '4':20B 'aout':21B 'arriv':13B 'assassinat':35B 'avant':33B 'burkin':7A,17B 'capitain':10B 'faso':8A,18B 'men':28B 'pay':26B 'pouvoir':5A,15B 'prend':3A 'radical':32B 'renomm':24B 'revolu':30B 'sankar':2A,12B 'social':31B 'thom':1A,11B
c0657f37-fc68-4908-b518-0bd0039ecb7d	seed-apartheid-instauration-1948	fr	Instauration de l'Apartheid en Afrique du Sud	Le Parti National remporte les élections en Afrique du Sud en 1948 et instaure le système de l'apartheid — ségrégation raciale institutionnalisée qui perdurera jusqu'en 1994.	\N	[]	exact_date	1948-06-01	\N	1948	\N	\N	f	ZA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1948':20B '1994':35B 'afriqu':6A,16B 'apartheid':4A,27B 'elect':14B 'instaur':1A,22B 'institutionnalise':30B 'jusqu':33B 'le':13B 'national':11B 'part':10B 'perdur':32B 'racial':29B 'remport':12B 'segreg':28B 'sud':8A,18B 'system':24B
43a52891-09c2-4083-8b4a-23300f95080d	seed-civilisation-nok-art-africain	fr	Civilisation Nok — art africain préhistorique	La civilisation Nok (actuel Nigeria), datant de 1500 av. J.-C. à 500 ap. J.-C., produit les premières sculptures en terre cuite d'Afrique subsaharienne, témoignage d'une sophistication artistique remarquable.	\N	[]	approximate	\N	\N	1500 av. J.-C. - 500 ap. J.-C.	-10	\N	f	NG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1500':13B '500':18B 'a':17B 'actuel':9B 'africain':4A 'afriqu':30B 'ap':19B 'art':3A 'artist':36B 'av':14B 'civilis':1A,7B 'cuit':28B 'dat':11B 'le':23B 'nigeri':10B 'nok':2A,8B 'prehistor':5A 'premier':24B 'produit':22B 'remarqu':37B 'sculptur':25B 'sophist':35B 'subsaharien':31B 'temoignag':32B 'terr':27B
acb05470-9994-4748-a818-e9ed130efe47	seed-empire-ghana-medieval-8e	fr	Apogée de l'Empire de Ghana médiéval	L'Empire de Ghana (actuelle Mauritanie/Mali), surnommé 'Pays de l'or', atteint son apogée aux VIIIe-XIe siècles contrôlant le commerce aurifère transsaharien.	\N	[]	approximate	\N	\N	VIIIe-XIe siècle	9	\N	f	MR	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':12B 'apoge':1A,21B 'atteint':19B 'aurifer':30B 'commerc':29B 'control':27B 'empir':4A,9B 'ghan':6A,11B 'mauritanie/mali':13B 'medieval':7A 'or':18B 'pay':15B 'siecl':26B 'surnomm':14B 'transsaharien':31B 'vii':24B 'viiie-x':23B 'xi':25B
c96d9360-4992-4ce0-8d28-d2b8017bce01	seed-mutapa-empire-15e	fr	Empire du Mutapa — successeur du Grand Zimbabwe	L'Empire du Mutapa (actuel Zimbabwe/Mozambique) s'épanouit au XVe siècle, contrôlant les mines d'or et le commerce avec la côte est africaine et les marchands arabes et portugais.	\N	[]	approximate	\N	\N	XVe siècle	15	\N	f	ZW	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':12B 'africain':31B 'arab':35B 'commerc':26B 'control':19B 'cot':29B 'empir':1A,9B 'epanou':15B 'grand':6A 'le':20B,33B 'marchand':34B 'min':21B 'mutap':3A,11B 'or':23B 'portug':37B 'siecl':18B 'successeur':4A 'xve':17B 'zimbabw':7A 'zimbabwe/mozambique':13B
40a895e9-998f-432b-ade9-f81ecb55a478	seed-sundiata-epopee-manding	fr	L'Épopée de Soundiata — fondation du Manding	L'épopée de Soundiata Keïta, transmise oralement par les griots pendant des siècles, raconte la fondation de l'Empire du Mali et constitue l'un des plus grands textes de la littérature africaine.	\N	[]	approximate	\N	\N	XIIIe siècle	13	\N	f	ML	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'africain':40B 'constitu':30B 'empir':26B 'epope':2A,9B 'fondat':5A,23B 'grand':35B 'griot':17B 'keit':12B 'le':16B 'litteratur':39B 'mal':28B 'manding':7A 'oral':14B 'pend':18B 'plus':34B 'racont':21B 'siecl':20B 'soundiat':4A,11B 'text':36B 'transmis':13B
249326c5-bc28-4d8e-859a-d993574f6e27	seed-griot-tradition-orale-afrique	fr	La tradition des griots en Afrique de l'Ouest	Les griots, dépositaires de la mémoire collective en Afrique de l'Ouest, jouent depuis des millénaires un rôle crucial de gardiens de l'histoire, musiciens et conseillers des rois.	\N	[]	unknown	\N	\N	Millénaire	\N	\N	f	\N	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'afriqu':6A,18B 'collect':16B 'conseiller':36B 'crucial':28B 'depositair':12B 'depuis':23B 'gardien':30B 'griot':4A,11B 'histoir':33B 'jouent':22B 'le':10B 'memoir':15B 'millenair':25B 'musicien':34B 'ouest':9A,21B 'rois':38B 'rol':27B 'tradit':2A
0cfe7a93-f7b8-4bfa-817c-6ed07dbe265f	seed-cheikh-anta-diop-civilisation-noire	fr	Cheikh Anta Diop — 'Nations nègres et Culture'	L'historien sénégalais Cheikh Anta Diop publie en 1954 'Nations nègres et Culture', démontrant l'origine africaine de la civilisation égyptienne et posant les bases de l'afrocentrisme scientifique.	\N	[]	exact_date	1954-01-01	\N	1954	\N	\N	f	SN	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Cheikh_Anta_Diop.jpg/800px-Cheikh_Anta_Diop.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1954':16B 'africain':24B 'afrocentr':35B 'anta':2A,12B 'bas':32B 'cheikh':1A,11B 'civilis':27B 'cultur':7A,20B 'demontr':21B 'diop':3A,13B 'egyptien':28B 'historien':9B 'le':31B 'nation':4A,17B 'negr':5A,18B 'origin':23B 'pos':30B 'publ':14B 'scientif':36B 'senegal':10B
b884c7c0-8fc2-45da-937a-c776f367d423	seed-amina-reine-zazzau-16e	fr	Reine Amina de Zazzau — guerrière haoussa	La reine Amina règne sur Zazzau (actuel Nigeria) au XVIe siècle, étendant le royaume par des campagnes militaires victorieuses et facilitant le commerce transsaharien.	\N	[]	approximate	\N	\N	XVIe siècle	16	\N	f	NG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':13B 'amin':2A,9B 'campagn':23B 'commerc':29B 'etend':18B 'facilit':27B 'guerrier':5A 'haouss':6A 'militair':24B 'nigeri':14B 'regn':10B 'rein':1A,8B 'royaum':20B 'siecl':17B 'transsaharien':30B 'victori':25B 'xvi':16B 'zazzau':4A,12B
711d0ed1-efb7-4e89-a4b1-7eee6d9a54fe	seed-usman-dan-fodio-djihad-1804	fr	Djihad d'Usman dan Fodio — Califat de Sokoto	L'érudit et réformateur Usman dan Fodio lance un jihad en 1804 qui renverse les États haoussa corrompus et fonde le Califat de Sokoto, le plus grand État pré-colonial d'Afrique de l'Ouest.	\N	[]	exact_date	1804-02-21	\N	1804	\N	\N	f	NG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1804':20B 'afriqu':41B 'califat':6A,30B 'colonial':39B 'corrompus':26B 'dan':4A,14B 'djihad':1A 'erud':10B 'etat':24B,36B 'fodio':5A,15B 'fond':28B 'grand':35B 'haouss':25B 'jihad':18B 'lanc':16B 'le':23B 'ouest':44B 'plus':34B 'pre':38B 'pre-colonial':37B 'reform':12B 'renvers':22B 'sokoto':8A,32B 'usman':3A,13B
11277ead-e6ae-47c8-a023-e8f106bb39f1	seed-bataille-isandlwana-1879	fr	Bataille d'Isandlwana — victoire zouloue	Les guerriers zoulois infligent le 22 janvier 1879 la plus lourde défaite militaire jamais subie par l'armée britannique en Afrique, tuant plus de 1 300 soldats impériaux.	\N	[]	exact_date	1879-01-22	\N	22 janvier 1879	\N	\N	f	ZA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1':30B '1879':13B '22':11B '300':31B 'afriqu':26B 'arme':23B 'bataill':1A 'britann':24B 'defait':17B 'guerri':7B 'imperial':33B 'infligent':9B 'isandlwan':3A 'jam':19B 'janvi':12B 'le':6B 'lourd':16B 'militair':18B 'plus':15B,28B 'soldat':32B 'sub':20B 'tu':27B 'victoir':4A 'zoulois':8B 'zoulou':5A
a8a84b63-5ea8-42d5-ba42-3a35710c2529	seed-deir-el-bahari-hatshepsout-temple	fr	Temple de Deir el-Bahari — chef-d'œuvre égyptien	Le temple funéraire de la pharaonne Hatshepsout à Deir el-Bahari, construit vers 1458 av. J.-C., est l'un des chefs-d'œuvre de l'architecture de l'Égypte ancienne.	\N	[]	approximate	\N	\N	vers 1458 av. J.-C.	-15	\N	f	EG	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mortuary_Temple_of_Hatshepsut_edit2.jpg/800px-Mortuary_Temple_of_Hatshepsut_edit2.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1458':26B 'a':19B 'ancien':44B 'architectur':40B 'av':27B 'bahar':6A,23B 'chef':8A,35B 'chef-d':7A 'chefs-d':34B 'construit':24B 'deir':3A,20B 'egypt':43B 'egyptien':11A 'el':5A,22B 'el-bahar':4A,21B 'funerair':14B 'hatshepsout':18B 'oeuvr':10A,37B 'pharaon':17B 'templ':1A,13B 'ver':25B
2b6d500f-099f-40a1-9c29-35cbacc5f589	seed-menes-unification-egypte	fr	Mènes unifie l'Égypte — naissance d'un empire	Mènes (ou Narmer) unifie la Haute et la Basse Égypte vers 3100 av. J.-C., fondant la première dynastie pharaonique et l'un des premiers États de l'histoire humaine.	\N	[]	approximate	\N	\N	vers 3100 av. J.-C.	-31	\N	f	EG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'3100':20B 'av':21B 'bass':17B 'dynast':27B 'egypt':4A,18B 'empir':8A 'etat':34B 'fond':24B 'haut':14B 'histoir':37B 'humain':38B 'men':1A,9B 'naissanc':5A 'narm':11B 'pharaon':28B 'premi':33B 'premier':26B 'unif':2A,12B 'ver':19B
06449c91-1e8b-4efd-97a1-2ed81e1eea1e	seed-carthage-fondation-814-av-jc	fr	Fondation de Carthage	Selon la tradition, la reine Didon (Élissa) fonde Carthage en 814 av. J.-C. sur les côtes de l'actuelle Tunisie. La cité deviendra la puissance dominante de la Méditerranée occidentale.	\N	[]	approximate	\N	\N	814 av. J.-C.	-9	\N	f	TN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'814':14B 'actuel':23B 'av':15B 'carthag':3A,12B 'cit':26B 'cot':20B 'deviendr':27B 'didon':9B 'domin':30B 'eliss':10B 'fond':11B 'fondat':1A 'le':19B 'mediterrane':33B 'occidental':34B 'puissanc':29B 'rein':8B 'selon':4B 'tradit':6B 'tunis':24B
d1340f79-945d-4761-a672-3834f253f481	seed-hannibal-alpes-218-av-jc	fr	Hannibal traverse les Alpes	Le général carthaginois Hannibal Barca franchit les Alpes avec ses éléphants en 218 av. J.-C. pour attaquer Rome, menant la deuxième guerre punique et entrant dans la légende militaire.	\N	[]	approximate	\N	\N	218 av. J.-C.	-10	\N	f	TN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'218':17B 'alpe':4A,12B 'attaqu':22B 'av':18B 'barc':9B 'carthaginois':7B 'deuxiem':26B 'eleph':15B 'entrant':30B 'franch':10B 'general':6B 'guerr':27B 'hannibal':1A,8B 'le':3A,11B 'legend':33B 'men':24B 'militair':34B 'puniqu':28B 'rom':23B 'travers':2A
94ea82d2-4a6d-4fa1-96c8-b2f7a027ad34	seed-cleopatre-vii-egypte-51-av-jc	fr	Cléopâtre VII, dernière pharaonne	Cléopâtre VII, dernière reine de la dynastie ptolémaïque d'Égypte, règne à partir de 51 av. J.-C. Elle allie génie politique, maîtrise des langues et culture hellénistique pour maintenir l'indépendance égyptienne.	\N	[]	approximate	\N	\N	51-30 av. J.-C.	-10	\N	f	EG	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kleopatra-VII.-Altes-Museum-Berlin1.jpg/800px-Kleopatra-VII.-Altes-Museum-Berlin1.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'51':19B 'a':16B 'alli':24B 'av':20B 'cleopatr':1A,5B 'cultur':31B 'dernier':3A,7B 'dynast':11B 'egypt':14B 'egyptien':37B 'gen':25B 'hellenist':32B 'independ':36B 'langu':29B 'mainten':34B 'maitris':27B 'part':17B 'pharaon':4A 'polit':26B 'ptolema':12B 'regn':15B 'rein':8B 'vii':2A,6B
c7ce4a5d-e37c-4736-a74b-d5d2bd4e5c41	seed-empire-byzantin-afrique-nord	fr	Reconquête byzantine de l'Afrique du Nord	Le général Bélisaire reconquiert l'Afrique du Nord pour l'Empire byzantin en 533-534 ap. J.-C., mettant fin au royaume vandale et rétablissant la domination romaine sur Carthage.	\N	[]	approximate	\N	\N	533-534	-10	\N	f	TN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-534':22B '533':21B 'afriqu':5A,13B 'ap':23B 'belisair':10B 'byzantin':2A,19B 'carthag':37B 'domin':34B 'empir':18B 'fin':27B 'general':9B 'met':26B 'nord':7A,15B 'reconquet':1A 'reconquiert':11B 'retabl':32B 'romain':35B 'royaum':29B 'vandal':30B
da67e68a-47a8-4a30-8472-07b5520813c9	seed-expansion-islam-afrique-nord-7e	fr	Conquête arabe de l'Afrique du Nord	Les armées arabo-musulmanes conquièrent l'Afrique du Nord entre 647 et 709, transformant profondément la culture et la religion du Maghreb et ouvrant la voie à l'islamisation du continent.	\N	[]	approximate	\N	\N	647-709	-10	\N	f	TN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'647':19B '709':21B 'a':35B 'afriqu':5A,15B 'arab':2A 'arabo':11B 'arabo-musulman':10B 'arme':9B 'conquet':1A 'conquierent':13B 'continent':39B 'cultur':25B 'entre':18B 'islamis':37B 'le':8B 'maghreb':30B 'musulman':12B 'nord':7A,17B 'ouvr':32B 'profond':23B 'religion':28B 'transform':22B 'voi':34B
5100b2d5-c823-4157-bdd9-08a6d6d67e0f	seed-royaumes-nubie-kush-antiquite	fr	Royaumes de Nubie et de Koush	Les royaumes nubiens de Kerma, Napata et Méroé (actuel Soudan) rivalisent avec l'Égypte pendant des millénaires, développant une civilisation propre avec une écriture, des pyramides et une religion distinctes.	\N	[]	approximate	\N	\N	2500-350 av. J.-C.	-20	\N	f	SD	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Meroe_Sudan_pyramids.JPG/800px-Meroe_Sudan_pyramids.JPG	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':15B 'civilis':26B 'developp':24B 'distinct':36B 'ecritur':30B 'egypt':20B 'kerm':11B 'koush':6A 'le':7B 'mero':14B 'millenair':23B 'napat':12B 'nub':3A 'nubien':9B 'pend':21B 'propr':27B 'pyramid':32B 'religion':35B 'rivalisent':17B 'royaum':1A,8B 'soudan':16B
d05fbd8b-1b28-4a81-8787-09e339811435	seed-ethiopie-christianisme-4e-siecle	fr	Adoption du christianisme en Éthiopie	Le roi d'Aksoum Ézana adopte le christianisme comme religion d'État vers 330 ap. J.-C., faisant de l'Éthiopie l'un des premiers États chrétiens du monde.	\N	[]	approximate	\N	\N	vers 330 ap. J.-C.	4	\N	f	ET	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'330':19B 'adopt':1A,11B 'aksoum':9B 'ap':20B 'chretien':32B 'christian':3A,13B 'comm':14B 'etat':17B,31B 'ethiop':5A,26B 'ezan':10B 'fais':23B 'mond':34B 'premi':30B 'religion':15B 'roi':7B 'ver':18B
00c32598-a7d8-4958-9913-eec3f9afd1cf	seed-arc-de-triomphe-carthage-septimius-severus	fr	Septime Sévère — premier empereur africain de Rome	Septime Sévère, né à Leptis Magna (actuelle Libye) en 145, devient en 193 le premier empereur romain d'origine africaine, régnant sur Rome jusqu'à sa mort en 211.	\N	[]	approximate	\N	\N	193 ap. J.-C.	-10	\N	f	LY	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'145':17B '193':20B '211':36B 'a':11B,32B 'actuel':14B 'africain':5A,27B 'devient':18B 'empereur':4A,23B 'jusqu':31B 'lept':12B 'liby':15B 'magn':13B 'mort':34B 'origin':26B 'premi':3A,22B 'regn':28B 'rom':7A,30B 'romain':24B 'septim':1A,8B 'sever':2A,9B
ef4c4a59-203c-4c61-a090-caebcf0d2a35	seed-guerre-abyssinie-italienne-1935	fr	Invasion italienne de l'Éthiopie	L'Italie fasciste de Mussolini envahit l'Éthiopie en octobre 1935, utilisant des gaz de combat contre les troupes de Hailé Sélassié dans ce qui devient un symbole de résistance africaine.	\N	[]	date_range	1935-10-03	1936-05-05	1935-1936	\N	\N	f	ET	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1935':16B 'africain':36B 'combat':21B 'contr':22B 'devient':31B 'envah':11B 'ethiop':5A,13B 'fascist':8B 'gaz':19B 'hail':26B 'invas':1A 'ital':7B 'italien':2A 'le':23B 'mussolin':10B 'octobr':15B 'resist':35B 'selass':27B 'symbol':33B 'troup':24B 'utilis':17B
f0aac8cf-3710-4799-a117-34729ef9f8aa	seed-jomo-kenyatta-uhuru-1963	fr	Indépendance du Kenya sous Jomo Kenyatta	Le Kenya accède à l'indépendance le 12 décembre 1963 sous Jomo Kenyatta, qui avait été emprisonné par les Britanniques pendant 9 ans lors du soulèvement Mau Mau.	\N	[]	exact_date	1963-12-12	\N	12 décembre 1963	\N	\N	f	KE	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'12':14B '1963':16B '9':28B 'a':10B 'acced':9B 'an':29B 'britann':26B 'decembr':15B 'emprison':23B 'ete':22B 'independ':1A,12B 'jomo':5A,18B 'keni':3A,8B 'kenyatt':6A,19B 'le':25B 'lor':30B 'mau':33B,34B 'pend':27B 'soulev':32B 'sous':4A,17B
3176d638-94c5-41ac-8b37-8511ea7ffc80	seed-julius-nyerere-tanzanie-ujamaa	fr	Julius Nyerere et l'Ujamaa en Tanzanie	Julius Nyerere, premier président de Tanzanie, développe la philosophie de l'Ujamaa (socialisme africain) à partir de 1967, cherchant à construire une voie africaine du développement.	\N	[]	exact_date	1967-02-05	\N	5 février 1967	\N	\N	f	TZ	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1967':25B 'a':22B,27B 'africain':21B,31B 'cherch':26B 'construir':28B 'developp':14B,33B 'julius':1A,8B 'nyerer':2A,9B 'part':23B 'philosoph':16B 'premi':10B 'president':11B 'social':20B 'tanzan':7A,13B 'ujama':5A,19B 'voi':30B
1cfba0c0-063b-4ef3-bba0-d8dc3b0eaf67	seed-steve-biko-mort-1977	fr	Mort de Steve Biko en détention	Steve Biko, fondateur du Mouvement de Conscience Noire en Afrique du Sud, meurt le 12 septembre 1977 à la suite de tortures subies en garde à vue, devenant un symbole de la lutte anti-apartheid.	\N	[]	exact_date	1977-09-12	\N	12 septembre 1977	\N	\N	f	ZA	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Steve_Biko.jpg/800px-Steve_Biko.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'12':21B '1977':23B 'a':24B,32B 'afriqu':16B 'anti':41B 'anti-apartheid':40B 'apartheid':42B 'biko':4A,8B 'conscienc':13B 'detent':6A 'deven':34B 'fondateur':9B 'gard':31B 'lutt':39B 'meurt':19B 'mort':1A 'mouv':11B 'noir':14B 'septembr':22B 'stev':3A,7B 'sub':29B 'sud':18B 'suit':26B 'symbol':36B 'tortur':28B 'vu':33B
860ca4cf-4059-4321-bd90-229c3ee2078f	seed-felix-houphouet-boigny-pere-fondateur	fr	Félix Houphouët-Boigny — père de la nation ivoirienne	Félix Houphouët-Boigny, cofondateur du Rassemblement Démocratique Africain, négocie l'indépendance de la Côte d'Ivoire et la dirige pendant 33 ans (1960-1993), symbolisant le 'miracle ivoirien'.	\N	[]	approximate	\N	\N	1960-1993	\N	1960	f	CI	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1993':34B '1960':33B '33':31B 'africain':18B 'an':32B 'boigny':4A,13B 'cofond':14B 'cot':24B 'democrat':17B 'dirig':29B 'felix':1A,10B 'houphouet':3A,12B 'houphouet-boigny':2A,11B 'independ':21B 'ivoir':26B 'ivoirien':9A,38B 'miracl':37B 'nation':8A 'negoc':19B 'pend':30B 'per':5A 'rassembl':16B 'symbolis':35B
22c76d18-c3b8-4dcb-a1c2-3146a219ac6a	seed-rwenzururu-kingdom-ouganda	fr	Mouvement d'indépendance du Rwanda	La révolution hutu de 1959 au Rwanda (Révolution Sociale) renverse la monarchie tutsie et conduit à l'indépendance en 1962 sous Grégoire Kayibanda, premier président.	\N	[]	exact_date	1962-07-01	\N	1er juillet 1962	\N	\N	f	RW	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1959':10B '1962':25B 'a':21B 'conduit':20B 'gregoir':27B 'hutu':8B 'independ':3A,23B 'kayiband':28B 'monarch':17B 'mouv':1A 'premi':29B 'president':30B 'renvers':15B 'revolu':7B,13B 'rwand':5A,12B 'social':14B 'sous':26B 'tuts':18B
2e515d14-a241-49e4-8616-25e49f2d65bd	seed-liberation-namibie-swapo-1990	fr	Indépendance de la Namibie	La Namibie accède à l'indépendance le 21 mars 1990 après 75 ans de domination allemande puis sud-africaine, Sam Nujoma de la SWAPO devient le premier président.	\N	[]	exact_date	1990-03-21	\N	21 mars 1990	\N	\N	f	NA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1990':14B '21':12B '75':16B 'a':8B 'acced':7B 'africain':24B 'allemand':20B 'an':17B 'apre':15B 'devient':30B 'domin':19B 'independ':1A,10B 'mar':13B 'namib':4A,6B 'nujom':26B 'premi':32B 'president':33B 'puis':21B 'sam':25B 'sud':23B 'sud-africain':22B 'swapo':29B
2966b262-5998-4938-932e-c49666db4a57	seed-genocide-rwanda-1994	fr	Génocide des Tutsi au Rwanda	Entre avril et juillet 1994, environ 800 000 Tutsi et Hutu modérés sont massacrés au Rwanda en 100 jours, dans l'un des génocides les plus rapides de l'histoire moderne.	\N	[]	date_range	1994-04-07	1994-07-15	avril-juillet 1994	\N	\N	f	RW	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'000':13B '100':23B '1994':10B '800':12B 'avril':7B 'entre':6B 'environ':11B 'genocid':1A,29B 'histoir':35B 'hutu':16B 'jour':24B 'juillet':9B 'le':30B 'massacr':19B 'moder':17B 'modern':36B 'plus':31B 'rapid':32B 'rwand':5A,21B 'tuts':3A,14B
3eecefe4-a3b8-45d8-acf0-c65fd7a2c0f1	seed-wangari-maathai-nobel-2004	fr	Wangari Maathai — Prix Nobel de la Paix 2004	La Kenyane Wangari Maathai reçoit le Prix Nobel de la Paix en 2004 pour son mouvement Ceinture Verte qui a planté 47 millions d'arbres, devenant la première Africaine à recevoir ce prix.	\N	[]	exact_date	2004-10-08	\N	8 octobre 2004	\N	\N	f	KE	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Wangari_Maathai_in_2005.jpg/800px-Wangari_Maathai_in_2005.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'2004':8A,21B '47':30B 'a':28B,38B 'africain':37B 'arbre':33B 'ceintur':25B 'deven':34B 'kenyan':10B 'maath':2A,12B 'million':31B 'mouv':24B 'nobel':4A,16B 'paix':7A,19B 'plant':29B 'premier':36B 'prix':3A,15B,41B 'recevoir':39B 'recoit':13B 'vert':26B 'wangar':1A,11B
7328bf8a-45f1-42db-9305-b22ead4b9c10	seed-makeba-mama-africa	fr	Miriam Makeba — 'Mama Africa'	La chanteuse sud-africaine Miriam Makeba devient la voix internationale de la lutte anti-apartheid, exilée pendant 31 ans, portant la musique africaine sur les scènes mondiales.	\N	[]	approximate	\N	\N	années 1960	\N	1960	f	ZA	\N	f	\N	confirmed	\N	https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Miriam_Makeba%2C_1974.jpg/800px-Miriam_Makeba%2C_1974.jpg	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'31':24B 'afric':4A 'africain':9B,29B 'an':25B 'anti':20B 'anti-apartheid':19B 'apartheid':21B 'chanteux':6B 'devient':12B 'exile':22B 'international':15B 'le':31B 'lutt':18B 'makeb':2A,11B 'mam':3A 'miriam':1A,10B 'mondial':33B 'musiqu':28B 'pend':23B 'port':26B 'scen':32B 'sud':8B 'sud-africain':7B 'voix':14B
1d930139-5167-40b1-9642-2c4b66a7556c	seed-amenhotep-iii-amenophis-egypte	fr	Règne d'Amenhotep III — apogée de l'Égypte	Le règne d'Amenhotep III (1388-1350 av. J.-C.) représente l'apogée de la puissance et de l'art de l'Égypte ancienne, avec la construction du temple de Louxor et des colosses de Memnon.	\N	[]	approximate	\N	\N	1388-1350 av. J.-C.	-10	\N	f	EG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1350':15B '1388':14B 'amenhotep':3A,12B 'ancien':32B 'apoge':5A,21B 'art':28B 'av':16B 'coloss':42B 'construct':35B 'egypt':8A,31B 'iii':4A,13B 'louxor':39B 'memnon':44B 'puissanc':24B 'regn':1A,10B 'represent':19B 'templ':37B
9d309066-fbc5-43b4-927c-5100ccd8584d	seed-akhenaton-aton-monotheisme-egypte	fr	Akhenaton et la révolution religieuse d'Aton	Le pharaon Akhenaton (1353-1336 av. J.-C.) instaure le culte monothéiste d'Aton et fonde la nouvelle capitale Akhetaton (Amarna), dans la première révolution religieuse monothéiste connue.	\N	[]	approximate	\N	\N	1353-1336 av. J.-C.	-10	\N	f	EG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1336':12B '1353':11B 'akhenaton':1A,10B 'akhetaton':27B 'amarn':28B 'aton':7A,21B 'av':13B 'capital':26B 'connu':35B 'cult':18B 'fond':23B 'instaur':16B 'monothe':19B,34B 'nouvel':25B 'pharaon':9B 'premier':31B 'religi':5A,33B 'revolu':4A,32B
ffd4d8c8-cd49-43b7-bc8b-b35091c3b032	seed-ramses-ii-kadesh-1274	fr	Bataille de Qadesh — traité de paix Ramsès II	La bataille de Qadesh (vers 1274 av. J.-C.) entre Ramsès II et les Hittites aboutit au premier traité de paix écrit de l'histoire, conservé au musée d'Istanbul.	\N	[]	approximate	\N	\N	vers 1274 av. J.-C.	-13	\N	f	EG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1274':14B 'about':24B 'av':15B 'bataill':1A,10B 'conserv':34B 'ecrit':30B 'entre':18B 'histoir':33B 'hittit':23B 'ii':8A,20B 'istanbul':38B 'le':22B 'muse':36B 'paix':6A,29B 'premi':26B 'qadesh':3A,12B 'rams':7A,19B 'trait':4A,27B 'ver':13B
7b2f65e9-9c6c-4cc3-9c1e-18c5eac73bd8	seed-patrice-lumumba-discours-independance	fr	Discours de Patrice Lumumba pour l'indépendance	Lors de la cérémonie d'indépendance du Congo le 30 juin 1960, Patrice Lumumba prononce un discours historique dénonçant l'humiliation coloniale et réclamant la dignité du peuple congolais.	\N	[]	exact_date	1960-06-30	\N	30 juin 1960	\N	\N	f	CD	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':19B '30':17B 'ceremon':11B 'colonial':29B 'congo':15B 'congol':36B 'denonc':26B 'dignit':33B 'discour':1A,24B 'histor':25B 'humili':28B 'independ':7A,13B 'juin':18B 'lor':8B 'lumumb':4A,21B 'patric':3A,20B 'peupl':35B 'prononc':22B 'reclam':31B
d616116b-fae3-489f-82f8-60605159a20b	seed-imperialisme-leopold-ii-congo-1885	fr	État Indépendant du Congo de Léopold II	Le roi Léopold II de Belgique s'approprie le Congo comme possession personnelle en 1885, instaurant un régime d'exploitation brutal qui fera des millions de morts.	\N	[]	date_range	1885-05-29	1908-11-15	1885-1908	\N	\N	f	CD	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1885':22B 'appropr':15B 'belgiqu':13B 'brutal':28B 'comm':18B 'congo':4A,17B 'etat':1A 'exploit':27B 'fer':30B 'ii':7A,11B 'independ':2A 'instaur':23B 'leopold':6A,10B 'million':32B 'mort':34B 'personnel':20B 'possess':19B 'regim':25B 'roi':9B
82f581c1-c525-4db0-b78d-caf4e007f024	seed-route-des-esclaves-ouidah-benin	fr	La Route des Esclaves à Ouidah	Ouidah (actuel Bénin) est l'un des principaux ports de départ de la traite négrière, d'où partirent des centaines de milliers d'Africains vers les Amériques du XVIe au XIXe siècle.	\N	[]	approximate	\N	\N	XVIe-XIXe siècle	17	\N	f	BJ	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':5A 'actuel':8B 'africain':30B 'amer':33B 'benin':9B 'centain':26B 'depart':17B 'esclav':4A 'le':32B 'milli':28B 'negrier':21B 'ouidah':6A,7B 'part':24B 'port':15B 'principal':14B 'rout':2A 'siecl':38B 'trait':20B 'ver':31B 'xix':37B 'xvi':35B
98f7f729-ebfc-42a3-b9b5-0e0a8550772a	seed-negritude-mouvement-aime-cesaire	fr	Naissance du mouvement de la Négritude	Aimé Césaire, Léopold Sédar Senghor et Léon-Gontran Damas fondent à Paris dans les années 1930 le mouvement de la Négritude, revendiquant la fierté des cultures africaines contre le colonialisme.	\N	[]	approximate	\N	\N	années 1930	\N	1930	f	SN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1930':23B 'a':18B 'africain':34B 'aim':7B 'anne':22B 'cesair':8B 'colonial':37B 'contr':35B 'cultur':33B 'dam':16B 'fiert':31B 'fondent':17B 'gontran':15B 'le':21B 'leon':14B 'leon-gontran':13B 'leopold':9B 'mouv':3A,25B 'naissanc':1A 'negritud':6A,28B 'paris':19B 'revendiqu':29B 'sedar':10B 'senghor':11B
6070fbaa-a61d-4e63-8e86-1befc13f0460	seed-empire-bornou-lac-tchad	fr	Empire du Bornou — puissance du lac Tchad	L'Empire du Bornou (actuel Nigeria/Niger/Tchad/Cameroun), successeur du Kanem, est l'un des plus durables de l'histoire africaine, existant du IXe au XIXe siècle.	\N	[]	approximate	\N	\N	IXe-XIXe siècle	14	\N	f	NG	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'actuel':12B 'africain':26B 'bornou':3A,11B 'durabl':22B 'empir':1A,9B 'exist':27B 'histoir':25B 'ixe':29B 'kanem':16B 'lac':6A 'nigeria/niger/tchad/cameroun':13B 'plus':21B 'puissanc':4A 'siecl':32B 'successeur':14B 'tchad':7A 'xix':31B
b81ea18a-285f-4d72-ae29-e447d602526f	seed-guerre-boers-afrique-sud-1899	fr	Guerre des Boers	La Guerre des Boers (1899-1902) oppose l'Empire britannique aux républiques boers du Transvaal et de l'Orange State. Les Britanniques inventent les camps de concentration où périssent 26 000 Boers et 20 000 Africains noirs.	\N	[]	date_range	1899-10-11	1902-05-31	1899-1902	\N	\N	f	ZA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'-1902':9B '000':34B,38B '1899':8B '20':37B '26':33B 'africain':39B 'boer':3A,7B,16B,35B 'britann':13B,25B 'camp':28B 'concentr':30B 'empir':12B 'guerr':1A,5B 'inventent':26B 'le':24B,27B 'noir':40B 'oppos':10B 'orang':22B 'per':32B 'republ':15B 'stat':23B 'transvaal':18B
eddaa76e-b136-413c-b75e-706fd618eec5	seed-nelson-mandela-emprisonnement-1964	fr	Emprisonnement de Nelson Mandela — procès de Rivonia	Nelson Mandela est condamné à la prison à vie lors du procès de Rivonia en 1964 pour sabotage contre le régime d'apartheid. Il restera emprisonné 27 ans sur Robben Island.	\N	[]	exact_date	1964-06-11	\N	11 juin 1964	\N	\N	f	ZA	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1964':23B '27':34B 'a':12B,15B 'an':35B 'apartheid':30B 'condamn':11B 'contr':26B 'emprison':1A,33B 'island':38B 'lor':17B 'mandel':4A,9B 'nelson':3A,8B 'prison':14B 'proc':5A,19B 'regim':28B 'rest':32B 'rivoni':7A,21B 'robben':37B 'sabotag':25B 'vi':16B
960adda0-4375-4cfd-a51d-28d12207a751	seed-angola-independance-1975	fr	Indépendance de l'Angola	L'Angola accède à l'indépendance du Portugal le 11 novembre 1975 après 14 ans de guerre de libération menée par le MPLA, le FNLA et l'UNITA, plongeant aussitôt dans une guerre civile.	\N	[]	exact_date	1975-11-11	\N	11 novembre 1975	\N	\N	f	AO	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'11':14B '14':18B '1975':16B 'a':8B 'acced':7B 'an':19B 'angol':4A,6B 'apre':17B 'aussitot':34B 'civil':38B 'fnla':29B 'guerr':21B,37B 'independ':1A,10B 'liber':23B 'mene':24B 'mpla':27B 'novembr':15B 'plong':33B 'portugal':12B 'unit':32B
667e5e4b-2831-43b5-a8dd-317571330738	seed-mozambique-independance-1975	fr	Indépendance du Mozambique	Le Mozambique accède à l'indépendance du Portugal le 25 juin 1975 sous Samora Machel et le Frelimo, après 10 ans de guerre de libération.	\N	[]	exact_date	1975-06-25	\N	25 juin 1975	\N	\N	f	MZ	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'10':23B '1975':15B '25':13B 'a':7B 'acced':6B 'an':24B 'apre':22B 'frelimo':21B 'guerr':26B 'independ':1A,9B 'juin':14B 'liber':28B 'machel':18B 'mozamb':3A,5B 'portugal':11B 'samor':17B 'sous':16B
4d95acfa-5272-42c5-8009-fde2f813e807	seed-zimbabwe-independance-1980	fr	Indépendance du Zimbabwe	Le Zimbabwe accède à l'indépendance le 18 avril 1980 sous Robert Mugabe, mettant fin à la Rhodésie blanche et au régime de Ian Smith, après une longue guerre de libération.	\N	[]	exact_date	1980-04-18	\N	18 avril 1980	\N	\N	f	ZW	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'18':11B '1980':13B 'a':7B,19B 'acced':6B 'apre':29B 'avril':12B 'blanch':22B 'fin':18B 'guerr':32B 'ian':27B 'independ':1A,9B 'liber':34B 'longu':31B 'met':17B 'mugab':16B 'regim':25B 'rhodes':21B 'robert':15B 'smith':28B 'sous':14B 'zimbabw':3A,5B
8b1e13b8-38fe-4997-a0d4-041c635e2b93	seed-ahmed-sekou-toure-guinea-non	fr	Ahmed Sékou Touré — Le 'Non' historique	Ahmed Sékou Touré, premier président de la Guinée, prononce le 25 août 1958 son célèbre discours devant de Gaulle : 'Nous préférons la pauvreté dans la liberté à la richesse dans l'esclavage'.	\N	[]	exact_date	1958-08-25	\N	25 août 1958	\N	\N	f	GN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1958':19B '25':17B 'a':33B 'ahmed':1A,7B 'aout':18B 'celebr':21B 'dev':23B 'discour':22B 'esclavag':38B 'gaull':25B 'guine':14B 'histor':6A 'libert':32B 'non':5A 'pauvret':29B 'pref':27B 'premi':10B 'president':11B 'prononc':15B 'richess':35B 'sekou':2A,8B 'tour':3A,9B
73d99908-3f79-42ea-9243-52bce912764c	seed-chemin-fer-dakar-niger-1923	fr	Achèvement du chemin de fer Dakar-Niger	Le chemin de fer Dakar-Niger, construit avec le travail forcé des colonisés, relie Dakar au Niger en 1923 dans le cadre de l'exploitation coloniale française de l'AOF.	\N	[]	exact_date	1923-01-01	\N	1923	\N	\N	f	SN	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1923':28B 'achev':1A 'aof':39B 'cadr':31B 'chemin':3A,10B 'colonial':35B 'colonis':22B 'construit':16B 'dakar':7A,14B,24B 'dakar-nig':6A,13B 'exploit':34B 'fer':5A,12B 'forc':20B 'francais':36B 'nig':8A,15B,26B 'rel':23B 'travail':19B
404baec8-a325-4253-b615-11c0572e0eea	seed-empire-songhai-fondation-gao	fr	Fondation de l'Empire Songhaï	L'Empire Songhaï, fondé à Gao (actuel Mali) au XVe siècle sous Sonni Ali, devient le plus grand empire de l'histoire de l'Afrique de l'Ouest, atteignant son apogée sous Askia Mohammad.	\N	[]	approximate	\N	\N	XVe siècle	15	\N	f	ML	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':10B 'actuel':12B 'afriqu':30B 'ali':19B 'apoge':36B 'aski':38B 'atteign':34B 'devient':20B 'empir':4A,7B,24B 'fond':9B 'fondat':1A 'gao':11B 'grand':23B 'histoir':27B 'mal':13B 'mohammad':39B 'ouest':33B 'plus':22B 'siecl':16B 'son':18B 'songh':5A,8B 'sous':17B,37B 'xve':15B
f497106d-5362-4f31-a744-6750706a1f56	seed-askia-mohammad-songhai-pelerinage	fr	Pèlerinage d'Askia Mohammad — Songhaï	Askia Mohammad Ier, souverain de l'Empire Songhaï, effectue son pèlerinage à La Mecque en 1497 avec 500 cavaliers et 300 000 pièces d'or, affirmant le rayonnement international de son empire.	\N	[]	exact_date	1497-01-01	\N	1497	\N	\N	f	ML	\N	f	\N	confirmed	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'000':27B '1497':21B '300':26B '500':23B 'a':17B 'affirm':31B 'aski':3A,6B 'cavali':24B 'effectu':14B 'empir':12B,37B 'ier':8B 'international':34B 'mecqu':19B 'mohammad':4A,7B 'or':30B 'pelerinag':1A,16B 'piec':28B 'rayon':33B 'songh':5A,13B 'souverain':9B
1a7b1f61-2e90-4cd2-8dee-736755a2d78a	le-test-ultime	fr	Le test ultime	Le test test jfjq fjdjd jjdjqdj fjqjfjjf cqjfkljfqjfjqf 	\N	"[]"	exact_date	2026-05-08	\N	\N	\N	\N	f	BF	\N	f	\N	confirmed	\N	\N	published	\N	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-05-01 15:09:27.266287+00	2026-05-01 15:09:27.266287+00	\N	'cqjfkljfqjfjqf':11B 'fjdjd':8B 'fjqjfjjf':10B 'jfjq':7B 'jjdjqdj':9B 'test':2A,5B,6B 'ultim':3A
1f3fe16c-2a2e-4194-88d8-e5804d9df5be	naissance-de-francois	fr	Naissance de Francois	Francpisn fphjpazeofjpoeazf fhzoaiefhoazefhoze ffhoizhfoizehofih fzeh oefhoahfafh f fazihfaoihfahfahofa	\N	"[]"	exact_date	2026-06-19	\N	\N	\N	\N	f	CD	\N	f	\N	confirmed	\N	\N	published	\N	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-05-02 17:05:32.531989+00	2026-05-02 17:05:32.531989+00	\N	'f':10B 'fazihfaoihfahfahof':11B 'ffhoizhfoizehofih':7B 'fhzoaiefhoazefhoz':6B 'fphjpazeofjpoeazf':5B 'francois':3A 'francpisn':4B 'fzeh':8B 'naissanc':1A 'oefhoahfafh':9B
\.


--
-- Data for Name: featured_items; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.featured_items (id, source_type, event_id, story_id, module_id, title_override, subtitle_override, image_url_override, cta_label, cta_to, start_date, end_date, display_order, active, created_at, updated_at, created_by, updated_by) FROM stdin;
94a43b87-bb0f-4f1b-a444-c00c3a4e8ff9	event	1a7b1f61-2e90-4cd2-8dee-736755a2d78a	\N	\N	\N	\N		Voir l'événement	/events/le-test-ultime	2026-05-05	2026-06-04	0	t	2026-05-05 07:54:44.039194+00	2026-05-05 07:54:44.039194+00	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3
a04ee5fa-c756-4151-9817-5c78eaa249b7	event	e745faf0-084b-499a-a0f5-2262984268d4	\N	\N	\N	\N		Voir l'événement	/events/seed-annee-afrique-1960	2026-05-05	2026-06-04	1	t	2026-05-05 09:55:54.098915+00	2026-05-05 09:55:54.098915+00	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3
3758ce1b-1f06-4f93-a05c-f2a3175088fa	story	\N	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	\N	\N	\N		Lire le récit	/timelines/seed-story-lutte-apartheid	2026-05-05	2026-06-04	2	t	2026-05-05 09:56:05.306781+00	2026-05-05 09:56:05.306781+00	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3
45f3f326-3883-4171-a14a-9b51591c03ad	story	\N	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	\N	\N	\N		Lire le récit	/timelines/seed-story-lutte-apartheid	2026-05-05	2026-06-04	0	t	2026-05-05 09:56:14.256417+00	2026-05-05 09:56:14.256417+00	9ebe8438-d4b8-4ecd-89b8-923040a276a3	9ebe8438-d4b8-4ecd-89b8-923040a276a3
\.


--
-- Data for Name: kalenda_events; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.kalenda_events (kalenda_id, event_id) FROM stdin;
\.


--
-- Data for Name: kalenda_modules; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.kalenda_modules (kalenda_id, module_id) FROM stdin;
\.


--
-- Data for Name: kalenda_stories; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.kalenda_stories (kalenda_id, story_id) FROM stdin;
\.


--
-- Data for Name: kalenda_themes; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.kalenda_themes (kalenda_id, theme_id) FROM stdin;
\.


--
-- Data for Name: kalendas; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.kalendas (id, slug, name, description, version, region, cover_url, target_lang, offline_size_bytes, last_exported_at, status, published_at, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.media (id, type, url, title, description, lang, creators, creation_year, publication_date, source, publisher, edition, isbn, credit, license, rights_expiry, duration_s, width, height, size_bytes, mime_type, alt_text, transcript_url, created_by, created_at, updated_at) FROM stdin;
f06257f9-860c-4507-b607-7cf91cb8bcbb	image	https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Flag_of_the_Democratic_Republic_of_the_Congo.svg/320px-Flag_of_the_Democratic_Republic_of_the_Congo.svg.png	Drapeau de la RDC	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikimedia Commons	\N	\N	\N	\N	\N	\N	\N	Drapeau de la RDC	\N	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-04-30 08:18:16.465164+00	2026-04-30 08:18:16.465164+00
4acb3bec-cf70-48ff-bf8a-7ed433e72884	image	https://upload.wikimedia.org/wikipedia/commons/8/85/Abydos_KL_01-01_n01.jpg	Mènes unifie l'Égypte — naissance d'un empire	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:46.618759+00	2026-04-30 20:16:46.618759+00
f6d6fdc0-9ac5-455e-942d-0aa25671cfc3	image	https://upload.wikimedia.org/wikipedia/commons/e/e6/NubianMeroePyramids30sep2005%282%29.jpg	Construction des pyramides de Méroé	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:48.99542+00	2026-04-30 20:16:48.99542+00
ffaf4b85-b5d6-4254-ac28-1f1a905717c1	image	https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Ramses_II_British_Museum.jpg/960px-Ramses_II_British_Museum.jpg	Bataille de Qadesh — traité de paix Ramsès II	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:51.061262+00	2026-04-30 20:16:51.061262+00
39cd197d-3baf-440f-b483-c33f04c35935	image	https://upload.wikimedia.org/wikipedia/commons/7/7b/Seated_Statue_of_Hatshepsut_MET_Hatshepsut2012.jpg	Hatshepsout — pharaonne d'Égypte	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:52.713968+00	2026-04-30 20:16:52.713968+00
98c1dde9-09f4-4c69-a54e-e686fc1fec29	image	https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/GD-EG-Caire-Mus%C3%A9e061.JPG/960px-GD-EG-Caire-Mus%C3%A9e061.JPG	Akhenaton et la révolution religieuse d'Aton	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:54.525075+00	2026-04-30 20:16:54.525075+00
209efe34-dcee-4165-9439-4e49cdee41b0	image	https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/CairoEgMuseumTaaMaskMostlyPhotographed.jpg/960px-CairoEgMuseumTaaMaskMostlyPhotographed.jpg	Découverte de la tombe de Toutânkhamon	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:56.072615+00	2026-04-30 20:16:56.072615+00
93fc7aca-641f-46a7-bfe7-9c0c6c8f9458	image	https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Hannibal_Barca_bust_from_Capua_photo.jpg/960px-Hannibal_Barca_bust_from_Capua_photo.jpg	Hannibal traverse les Alpes	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:57.566467+00	2026-04-30 20:16:57.566467+00
605c5033-2671-4b2d-a32b-708bfdeda840	image	https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Montage_ville_de_Carthage.png/960px-Montage_ville_de_Carthage.png	Fondation de Carthage	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:16:59.115471+00	2026-04-30 20:16:59.115471+00
68970dfc-711c-4bfc-be62-2a8d85a95d48	image	https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Ghana_empire_map.png/960px-Ghana_empire_map.png	Apogée de l'Empire de Ghana médiéval	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:01.898445+00	2026-04-30 20:17:01.898445+00
b52c8d63-8121-4dfa-82d0-3c8968b7a795	image	https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Map_of_the_Mali_Empire.png/960px-Map_of_the_Mali_Empire.png	Fondation de l'Empire du Mali	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:04.120045+00	2026-04-30 20:17:04.120045+00
4515a4db-170d-4465-b28a-85032dd989bd	image	https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Donkeys%2C_Timbuktu.jpg/960px-Donkeys%2C_Timbuktu.jpg	Apogée de l'Université de Tombouctou	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:05.80342+00	2026-04-30 20:17:05.80342+00
ea3b3191-524d-4294-bdb8-8efec87e37e8	image	https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Map_of_the_Songhay_Empire.png/960px-Map_of_the_Songhay_Empire.png	Chute de l'Empire Songhaï à Tondibi	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:07.515128+00	2026-04-30 20:17:07.515128+00
fb14822b-e060-44bb-95cf-657bfa84f1c8	image	https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Flag_of_the_Kingdom_of_Kongo_according_to_Giovanni_Cavazzi_da_Montecuccolo.svg/960px-Flag_of_the_Kingdom_of_Kongo_according_to_Giovanni_Cavazzi_da_Montecuccolo.svg.png	Fondation du Royaume Kongo	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:09.165863+00	2026-04-30 20:17:09.165863+00
2bb68dde-021c-4b5c-bffc-8adc071cd28e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Oyo_Empire_at_Its_Greatest_Extent%2C_c._1780_%285%29.jpg/960px-Oyo_Empire_at_Its_Greatest_Extent%2C_c._1780_%285%29.jpg	Apogée de l'Empire Oyo	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:10.720362+00	2026-04-30 20:17:10.720362+00
a773e032-2e8e-46ed-a4e1-bd31db8d2084	image	https://upload.wikimedia.org/wikipedia/commons/7/73/KingShaka.jpg	Fondation de l'Empire Zoulou par Chaka	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:29.188998+00	2026-04-30 20:17:29.188998+00
24475494-d7de-40e4-88a6-98505ca514f7	image	https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dire_Dawa_Station_Blackshirts_1936.jpg/960px-Dire_Dawa_Station_Blackshirts_1936.jpg	Invasion italienne de l'Éthiopie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:17:32.470299+00	2026-04-30 20:17:32.470299+00
a728b752-c4b0-43fc-9504-59e922bb1b0e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Nyamata_Memorial_Site_13.jpg/960px-Nyamata_Memorial_Site_13.jpg	Génocide des Tutsi au Rwanda	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:01.335651+00	2026-04-30 20:18:01.335651+00
9382267b-1b55-49f4-8590-544aff0913c3	image	https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/960px-Nelson_Mandela_1994.jpg	Libération de Nelson Mandela	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:02.962963+00	2026-04-30 20:18:02.962963+00
fc9013aa-5bed-4449-9005-2cfa36129b4a	image	https://upload.wikimedia.org/wikipedia/commons/b/bb/Jomo_Kenyatta_%28cropped%29_in_June_15th%2C_1966.jpg	Indépendance du Kenya sous Jomo Kenyatta	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:07.942478+00	2026-04-30 20:18:07.942478+00
ce5466e9-0eec-4e00-8e08-ad8068b19bdc	image	https://upload.wikimedia.org/wikipedia/commons/3/30/Algerian_war_collage_wikipedia.jpg	Indépendance de l'Algérie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:10.063918+00	2026-04-30 20:18:10.063918+00
47f62695-d85f-44f5-8a15-22da8202ad25	image	https://upload.wikimedia.org/wikipedia/commons/5/5c/Kwame_Nkrumah_Portrait%2C_The_National_Archives_UK.jpg	Première Conférence des États Africains Indépendants	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:11.595648+00	2026-04-30 20:18:11.595648+00
8e0f4b7f-ccc5-4c64-98dd-e6b4c4ac54fe	image	https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Iss016e019375.jpg/960px-Iss016e019375.jpg	Inauguration du Canal de Suez	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:13.151083+00	2026-04-30 20:18:13.151083+00
9ca99ea1-730b-405a-b0da-02ffb6f79a61	image	https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Port_Said_from_air.jpg/960px-Port_Said_from_air.jpg	Nationalisation du Canal de Suez par Nasser	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:14.759076+00	2026-04-30 20:18:14.759076+00
8fe9b143-8476-4e9a-8a69-6be060b474e9	image	https://upload.wikimedia.org/wikipedia/commons/7/79/Almamy_Samory_Tour%C3%A9.jpg	Résistance de Samori Touré contre la France	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:18:16.292788+00	2026-04-30 20:18:16.292788+00
2b8bb090-2422-454c-9a6d-7288107635ca	image	https://upload.wikimedia.org/wikipedia/commons/0/06/UN_Baluba_camp.jpg	Indépendance du Congo belge	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:19:13.31387+00	2026-04-30 20:19:13.31387+00
2df86494-45d4-4132-bca2-3a8fc320152b	image	https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/President_Nyerere_van_Tanzania%2C_koppen%2C_Bestanddeelnr_928-2879_%28cropped%29.jpg/960px-President_Nyerere_van_Tanzania%2C_koppen%2C_Bestanddeelnr_928-2879_%28cropped%29.jpg	Julius Nyerere et l'Ujamaa en Tanzanie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:19:18.218948+00	2026-04-30 20:19:18.218948+00
93dd309b-1ef2-4de0-a9e7-0df24f1765db	image	https://upload.wikimedia.org/wikipedia/commons/7/76/F%C3%A9lix_Houphou%C3%ABt-Boigny_1962-07-16.jpg	Félix Houphouët-Boigny — père de la nation ivoirienne	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:19:24.516291+00	2026-04-30 20:19:24.516291+00
8c19f324-a42b-436b-bdcd-a9906ea9280e	image	https://upload.wikimedia.org/wikipedia/commons/8/83/Cheikh_Anta_Diop%2C_late_1940s.jpg	Cheikh Anta Diop — 'Nations nègres et Culture'	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:19:26.087045+00	2026-04-30 20:19:26.087045+00
dee75a47-131b-481d-a1e1-2fe6365c876d	image	https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/KingEndybisEthiopia227-235CE.jpg/960px-KingEndybisEthiopia227-235CE.jpg	Apogée du Royaume d'Aksoum	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:19:29.7753+00	2026-04-30 20:19:29.7753+00
a9611aea-f3b4-4747-b029-a6432bce8af4	image	https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Conical_Tower_-_Great_Enclosure_III_%2833736918448%29.jpg/960px-Conical_Tower_-_Great_Enclosure_III_%2833736918448%29.jpg	Construction du Grand Zimbabwe	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:19:31.37315+00	2026-04-30 20:19:31.37315+00
ec60e580-2cfc-45b9-a988-b027382ad224	image	https://upload.wikimedia.org/wikipedia/commons/1/16/Slave_Auction_Ad.jpg	Début de la traite négrière transatlantique	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:02.389913+00	2026-04-30 20:20:02.389913+00
b6970f1b-c797-448c-93b7-e80fb1f8b12b	image	https://upload.wikimedia.org/wikipedia/commons/7/7b/Seated_Statue_of_Hatshepsut_MET_Hatshepsut2012.jpg	Temple de Deir el-Bahari — chef-d'œuvre égyptien	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:04.2407+00	2026-04-30 20:20:04.2407+00
90c25585-9033-4f95-8a2c-a9bf2049a783	image	https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Flag_of_the_Congo_Free_State.svg/960px-Flag_of_the_Congo_Free_State.svg.png	État Indépendant du Congo de Léopold II	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:06.619091+00	2026-04-30 20:20:06.619091+00
bfe9db31-1b24-42d6-855e-0b7af79d2d76	image	https://upload.wikimedia.org/wikipedia/commons/0/04/Aime_Cesaire_2003.jpg	Naissance du mouvement de la Négritude	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:10.936608+00	2026-04-30 20:20:10.936608+00
3c340f1d-bb71-4700-ae72-71dc93cb0dbe	image	https://upload.wikimedia.org/wikipedia/en/7/79/Logo_of_the_SWAPO_Party_of_Namibia.png	Indépendance de la Namibie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:12.446416+00	2026-04-30 20:20:12.446416+00
059553b8-4e3c-40c9-a757-203f197c85b9	image	https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/960px-Flag_of_Zimbabwe.svg.png	Indépendance du Zimbabwe	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:14.344146+00	2026-04-30 20:20:14.344146+00
244fc133-75c8-402b-8501-90b2095be121	image	https://upload.wikimedia.org/wikipedia/commons/a/a6/Sempreatentos...aoperigo%21.jpg	Indépendance de l'Angola	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 20:20:15.851483+00	2026-04-30 20:20:15.851483+00
727666bd-c648-458f-8619-80f1585288cc	image	https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Colossal_Amenhotep_III_British_Museum.jpg/960px-Colossal_Amenhotep_III_British_Museum.jpg	Règne d'Amenhotep III — apogée de l'Égypte	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:31:08.325181+00	2026-05-01 08:31:08.325181+00
af8f7e61-c576-40d3-bd65-0bb1456d52a6	image	https://upload.wikimedia.org/wikipedia/commons/e/eb/Queen_Amina_Statue_%28cropped%29.jpg	Reine Amina de Zazzau — guerrière haoussa	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:31:10.749168+00	2026-05-01 08:31:10.749168+00
c39f0698-82b5-4ba3-8c81-9fa360cab487	image	https://upload.wikimedia.org/wikipedia/commons/c/c2/Colonization_1945_Spanish_script.png	L'Année de l'Afrique — 17 indépendances	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:31:13.701852+00	2026-05-01 08:31:13.701852+00
850d1704-6ce4-43e0-aea6-1d2b7ce56e94	image	https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/960px-Nelson_Mandela_1994.jpg	Fin de l'Apartheid — Élection de Nelson Mandela	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:31:17.443567+00	2026-05-01 08:31:17.443567+00
59437969-36b9-4dd6-b5fe-88886b7a1186	image	https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Monomotapa_Map.jpg/960px-Monomotapa_Map.jpg	Instauration de l'Apartheid en Afrique du Sud	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:31:21.020061+00	2026-05-01 08:31:21.020061+00
5a0c76ad-6691-4b7e-896f-b37e556597da	image	https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Septimius_Severus_busto-Musei_Capitolini.jpg/960px-Septimius_Severus_busto-Musei_Capitolini.jpg	Septime Sévère — premier empereur africain de Rome	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:31:23.243756+00	2026-05-01 08:31:23.243756+00
2b29e03e-85f8-42cb-85dd-a5a0cc98e507	image	https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Map_of_the_Songhay_Empire.png/960px-Map_of_the_Songhay_Empire.png	Fondation de l'Empire Songhaï	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:01.025242+00	2026-05-01 08:32:01.025242+00
ed85ea13-a4e2-4aa1-82de-550bf40775bf	image	https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/960px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg	Adoption du christianisme en Éthiopie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:03.044119+00	2026-05-01 08:32:03.044119+00
fd4059c7-3167-4204-b20e-d0137183ad79	image	https://upload.wikimedia.org/wikipedia/commons/a/a7/%D9%81%D8%AA%D9%88%D8%AD_%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8.jpg	Conquête arabe de l'Afrique du Nord	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:06.159933+00	2026-05-01 08:32:06.159933+00
30211d87-80c3-4fa7-a820-3c2d7c0b5f78	image	https://upload.wikimedia.org/wikipedia/commons/d/df/GriotF%C3%AAte.jpg	La tradition des griots en Afrique de l'Ouest	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:08.317525+00	2026-05-01 08:32:08.317525+00
a49423ea-3ce8-4d4b-8db9-6be30ec5205e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Second_Boer_War_Collage.png/960px-Second_Boer_War_Collage.png	Guerre des Boers	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:10.031867+00	2026-05-01 08:32:10.031867+00
4dd3e7a4-1004-4926-a33f-94f055447e9c	image	https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flag_of_Cameroon.svg/960px-Flag_of_Cameroon.svg.png	Indépendance du Cameroun	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:11.729024+00	2026-05-01 08:32:11.729024+00
506f2c50-ce35-43ad-af15-1a8f35a749e4	image	https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_C%C3%B4te_d%27Ivoire.svg/960px-Flag_of_C%C3%B4te_d%27Ivoire.svg.png	Indépendance de la Côte d'Ivoire	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:13.408532+00	2026-05-01 08:32:13.408532+00
ec719a03-e6cb-4ccf-a7a7-9b680acdb84a	image	https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Flag_of_Mali.svg/960px-Flag_of_Mali.svg.png	Indépendance du Mali	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:14.990147+00	2026-05-01 08:32:14.990147+00
efcb3f99-aabb-46ec-8500-f8319296767f	image	https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Flag_of_Somalia.svg/960px-Flag_of_Somalia.svg.png	Indépendance de la Somalie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:16.694345+00	2026-05-01 08:32:16.694345+00
6c45fa99-e621-443d-b06f-6b17183747db	image	https://upload.wikimedia.org/wikipedia/commons/5/5c/Kwame_Nkrumah_Portrait%2C_The_National_Archives_UK.jpg	Indépendance du Ghana	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:32:18.550431+00	2026-05-01 08:32:18.550431+00
2999dc14-adb6-4efe-bea7-0084d395fc28	image	https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kushite_heartland_and_Kushite_Empire_of_the_25th_dynasty_circa_700_BCE.jpg/960px-Kushite_heartland_and_Kushite_Empire_of_the_25th_dynasty_circa_700_BCE.jpg	Royaumes de Nubie et de Koush	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:33:01.456212+00	2026-05-01 08:33:01.456212+00
7005e63f-a7d8-4aa3-b7ca-dd01abb587eb	image	https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Kanem%E2%80%93Bornu%2C_13th_century.png/960px-Kanem%E2%80%93Bornu%2C_13th_century.png	Empire du Bornou — puissance du lac Tchad	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:00.030985+00	2026-05-01 08:34:00.030985+00
33e13956-ca58-4096-ae73-8c9ab44547a4	image	https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Kanem%E2%80%93Bornu%2C_13th_century.png/960px-Kanem%E2%80%93Bornu%2C_13th_century.png	Fondation de l'Empire du Kanem	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:04.501157+00	2026-05-01 08:34:04.501157+00
38ad3698-f67a-49ee-ab35-6ce346111b83	image	https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Map_of_the_Songhay_Empire.png/960px-Map_of_the_Songhay_Empire.png	Fondation de l'Empire Songhaï	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:06.329659+00	2026-05-01 08:34:06.329659+00
1b0f2a4c-9d21-4149-bb91-ee9d776f450e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg/960px-Addis_abeba%2C_chiesa_della_trinit%C3%A0%2C_esterno_05.jpg	Adoption du christianisme en Éthiopie	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:08.208128+00	2026-05-01 08:34:08.208128+00
af905248-20dc-43cc-8a2c-725d22efd53e	image	https://upload.wikimedia.org/wikipedia/commons/a/a7/%D9%81%D8%AA%D9%88%D8%AD_%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8.jpg	Conquête arabe de l'Afrique du Nord	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:09.770597+00	2026-05-01 08:34:09.770597+00
0dc60608-79c7-4a37-b064-e0982f0af381	image	https://upload.wikimedia.org/wikipedia/commons/d/df/GriotF%C3%AAte.jpg	La tradition des griots en Afrique de l'Ouest	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:12.102682+00	2026-05-01 08:34:12.102682+00
7fe26e8d-a494-4b5f-b26a-a2a073f751d3	image	https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Second_Boer_War_Collage.png/960px-Second_Boer_War_Collage.png	Guerre des Boers	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:17.602259+00	2026-05-01 08:34:17.602259+00
e59ffbcc-fd85-4b68-ba1d-bd64b560274e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flag_of_Cameroon.svg/960px-Flag_of_Cameroon.svg.png	Indépendance du Cameroun	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:34:19.792925+00	2026-05-01 08:34:19.792925+00
f4824efa-9772-4088-ab8e-28057d76377e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Flag_of_Mozambique.svg/960px-Flag_of_Mozambique.svg.png	Indépendance du Mozambique	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:35:03.009836+00	2026-05-01 08:35:03.009836+00
ed9c257f-95ae-4870-aa20-42dbbee4d70e	image	https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/960px-Flag_of_the_African_Union.svg.png	Fondation de l'Organisation de l'Unité Africaine	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:35:17.504496+00	2026-05-01 08:35:17.504496+00
15d6c224-8d1d-4868-abc9-621bf19fffd3	image	https://upload.wikimedia.org/wikipedia/commons/9/9b/Patrice_Lumumba%2C_1960_%28cropped%29.jpg	Discours de Patrice Lumumba pour l'indépendance	\N	\N	[]	\N	\N	\N	\N	\N	\N	Wikipedia	CC-BY-SA	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 08:35:19.665529+00	2026-05-01 08:35:19.665529+00
6f892543-ca4f-4854-b7ab-b1ce0c5f294a	image	http://localhost/storage/events/4bdf059d-eb1b-4151-ab33-2ca9da410667.png		\N	\N	[]	\N	\N	\N	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N		\N	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-05-01 15:09:27.364707+00	2026-05-01 15:09:27.364707+00
22e37327-af13-4f13-9be8-8be39e9e400c	image	http://localhost/storage/events/01ef7398-a4fa-4ce2-aedf-c37c54aa9fff.png		\N	\N	[]	\N	\N	\N	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N		\N	9ebe8438-d4b8-4ecd-89b8-923040a276a3	2026-05-02 17:05:32.582274+00	2026-05-02 17:05:32.582274+00
\.


--
-- Data for Name: module_themes; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.module_themes (module_id, theme_id) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.modules (id, slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at, created_by, updated_by, created_at, updated_at, deleted_at, search_vector) FROM stdin;
\.


--
-- Data for Name: people; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.people (id, slug, name, birth_date, death_date, birth_place_id, nationality, bio, photo_url, wikipedia_url, search_vector, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.places (id, slug, name, place_type, country_code, parent_id, lat, lng, wikipedia_url, created_at) FROM stdin;
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.stories (id, slug, lang, title, summary, cover_url, contributors, computed_start_date, computed_end_date, status, published_at, created_by, updated_by, created_at, updated_at, deleted_at, search_vector, type) FROM stdin;
6d30c0f7-8c72-4d66-85fb-2a58b791815c	seed-story-empire-mali	fr	L'Empire du Mali — de Soundiata à Mansa Musa	De la bataille de Kirina à l'apogée de Mansa Musa, l'épopée de l'Empire du Mali qui domina l'Afrique de l'Ouest pendant deux siècles.	\N	[]	1235-01-01	1324-01-01	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':7A,15B 'afriqu':31B 'apoge':17B 'bataill':12B 'deux':36B 'domin':29B 'empir':2A,25B 'epope':22B 'kirin':14B 'mal':4A,27B 'mans':8A,19B 'mus':9A,20B 'ouest':34B 'pend':35B 'siecl':37B 'soundiat':6A	evenement
7e89d18f-f205-488a-84ab-9785d2684381	seed-story-independances-africaines-1960	fr	L'Année de l'Afrique — 1960	En une seule année, dix-sept nations africaines accèdent à l'indépendance. Plongée dans ces moments historiques qui ont redessiné le continent.	\N	[]	1957-03-06	1960-10-01	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'1960':6A 'a':17B 'accedent':16B 'africain':15B 'afriqu':5A 'anne':2A,10B 'continent':29B 'dix':12B 'dix-sept':11B 'histor':24B 'independ':19B 'moment':23B 'nation':14B 'plonge':20B 'redessin':27B 'sept':13B 'seul':9B	evenement
beb461a5-182a-41f0-98b1-7a370b13aeca	seed-story-resistance-coloniale	fr	Résistances africaines à la colonisation	Des guerriers zoulois aux armées éthiopiennes, comment les peuples africains ont résisté à l'envahisseur colonial européen.	\N	[]	1879-01-22	1960-01-12	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':3A,18B 'africain':2A,15B 'arme':10B 'colonial':21B 'colonis':5A 'comment':12B 'envahisseur':20B 'ethiopien':11B 'europeen':22B 'guerri':7B 'le':13B 'peupl':14B 'resist':1A,17B 'zoulois':8B	thematique
8a8f6233-6d6f-4d44-b301-1a488bda54dd	seed-story-grands-empires-africains	fr	Les Grands Empires de l'Afrique ancienne	Aksoum, Ghana, Kongo, Zimbabwe... Des empires puissants et oubliés qui témoignent de la richesse des civilisations africaines précoloniales.	\N	[]	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'africain':24B 'afriqu':6A 'aksoum':8B 'ancien':7A 'civilis':23B 'empir':3A,13B 'ghan':9B 'grand':2A 'kongo':10B 'le':1A 'oubl':16B 'precolonial':25B 'puiss':14B 'richess':21B 'temoignent':18B 'zimbabw':11B	thematique
ada1a782-593e-4bb0-8697-f2f1140d9b7a	seed-story-egypte-ancienne-pharaons	fr	L'Égypte ancienne — Pharaons et Civilisation	Des premiers pharaons à Cléopâtre, cinq millénaires de civilisation égyptienne, de la naissance de l'écriture à la rencontre avec Rome.	\N	[]	1922-11-04	1922-11-04	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':10B,23B 'ancien':3A 'cinq':12B 'civilis':6A,15B 'cleopatr':11B 'ecritur':22B 'egypt':2A 'egyptien':16B 'millenair':13B 'naissanc':19B 'pharaon':4A,9B 'premi':8B 'rencontr':25B 'rom':27B	evenement
b627ae6b-844f-4b77-a2af-0eae25f4b3f6	seed-story-lutte-apartheid	fr	La lutte contre l'Apartheid en Afrique du Sud	De l'instauration de la ségrégation à la libération de Mandela, le long chemin de la dignité du peuple sud-africain.	\N	[]	1948-06-01	1994-04-27	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'a':16B 'africain':31B 'afriqu':7A 'apartheid':5A 'chemin':23B 'contr':3A 'dignit':26B 'instaur':12B 'liber':18B 'long':22B 'lutt':2A 'mandel':20B 'peupl':28B 'segreg':15B 'sud':9A,30B 'sud-africain':29B	evenement
6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	seed-story-panafricanisme-leaders	fr	Les pères du Panafricanisme	Nkrumah, Lumumba, Nyerere, Sankara... Les visionnaires qui ont rêvé d'une Afrique unie et indépendante.	\N	[]	1909-09-21	1983-08-04	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'afriqu':16B 'independ':19B 'le':1A,9B 'lumumb':6B 'nkrumah':5B 'nyerer':7B 'panafrican':4A 'per':2A 'rev':13B 'sankar':8B 'uni':17B 'visionnair':10B	personnage
d838911c-1f06-4567-8214-e557c27cf577	seed-story-nubie-koush-pyramides	fr	La Nubie et Koush — civilisation des pyramides	Au sud de l'Égypte, les royaumes nubiens développèrent une civilisation originale avec leurs propres pyramides, leur écriture et leurs pharaons noirs.	\N	[]	\N	\N	published	2026-04-30 19:54:40.845542+00	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N	'civilis':5A,18B 'developperent':16B 'ecritur':25B 'egypt':12B 'koush':4A 'le':13B 'leur':21B,27B 'noir':29B 'nub':2A 'nubien':15B 'original':19B 'pharaon':28B 'propr':22B 'pyramid':7A,23B 'royaum':14B 'sud':9B	thematique
\.


--
-- Data for Name: story_events; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.story_events (id, story_id, event_id, "position", lang, narrative_text, narrative_audio_url, narrative_video_url, quote, quote_author, cta, created_at, updated_at, source_story_event_id) FROM stdin;
613067b1-0720-4ffd-add1-a9d21c408891	6d30c0f7-8c72-4d66-85fb-2a58b791815c	f1abb40d-fe67-4375-99b3-1f4820698433	1	fr	En 1235, la bataille de Kirina marque la naissance de l'Empire du Mali. Soundiata Keïta, le 'Lion du Manding', unifie les royaumes mandingues sous une même bannière.	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
edfc13ec-ecb5-4d87-8958-de7d8a467dbc	6d30c0f7-8c72-4d66-85fb-2a58b791815c	69d482b0-e658-4f58-a48d-6e6f1e49aa31	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
a756bc44-4aaf-486b-9014-cb75cd4538aa	6d30c0f7-8c72-4d66-85fb-2a58b791815c	40a895e9-998f-432b-ade9-f81ecb55a478	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
7e043fd4-0eeb-4c18-baaf-e989a73696a8	6d30c0f7-8c72-4d66-85fb-2a58b791815c	3057a1c1-e67f-4874-b794-c08d24681347	4	fr	Un siècle après Soundiata, l'Empire du Mali atteint son apogée sous Mansa Musa. Son pèlerinage à La Mecque en 1324 éblouira le monde arabe et méditerranéen par la démonstration de richesse.	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
67af8e5d-f99f-472d-ac82-d707d7e3f3f1	6d30c0f7-8c72-4d66-85fb-2a58b791815c	498f23d6-f6e3-48e1-8227-df6a8a92f272	5	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
6e6f3cd6-5d6d-424b-8049-adb73028c302	6d30c0f7-8c72-4d66-85fb-2a58b791815c	404baec8-a325-4253-b615-11c0572e0eea	6	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
d9c59a82-6b4c-46f1-b3f1-dc70f6abcc6f	7e89d18f-f205-488a-84ab-9785d2684381	e745faf0-084b-499a-a0f5-2262984268d4	1	fr	1960 est l'année où l'Afrique s'est réveillée. En douze mois, dix-sept nations brisent les chaînes coloniales et proclament leur indépendance.	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
29fd2e28-963f-4c2f-b5d2-4629ded0edbf	7e89d18f-f205-488a-84ab-9785d2684381	cdec0adf-9b2f-4788-9f0f-31d437dc88c6	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
88d94c50-8b93-4a86-93b0-f5b6acdb3b73	7e89d18f-f205-488a-84ab-9785d2684381	5356026c-9a49-44be-a820-be1121ce43bf	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
ba3b8112-a00c-4a8c-a048-d3e115303815	7e89d18f-f205-488a-84ab-9785d2684381	10b6f917-a503-4970-a330-c17c26d8ac1e	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
133adec3-58b2-40bf-ad54-e57a0d204127	7e89d18f-f205-488a-84ab-9785d2684381	095682c2-1170-489e-a4fa-31a2f0a3985b	5	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
bf61499b-0b20-4b1b-bd2d-7e7f1a3a69a2	7e89d18f-f205-488a-84ab-9785d2684381	18f5ab21-6096-4405-922c-fdb3425cde3f	6	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
0b20cca4-1798-4e74-81f7-41351e41f7ea	7e89d18f-f205-488a-84ab-9785d2684381	10fef26f-6b9d-4cd2-a532-b03857b25d14	7	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
13d81dfa-26df-4b79-a6d6-0c417763562b	7e89d18f-f205-488a-84ab-9785d2684381	9b587451-fe9a-496e-a348-b979b4083a51	8	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
baef2e57-e7a7-4fc3-8fa7-0244ea3a65f6	beb461a5-182a-41f0-98b1-7a370b13aeca	9d739dac-c29d-497a-8826-c0e3e4f9223c	1	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
15f766aa-915c-4ead-9e1c-19f45543cadd	beb461a5-182a-41f0-98b1-7a370b13aeca	e8a7c80f-c2f8-495c-a784-e8437b04e42a	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
df2cb1d1-912a-4b16-9e1c-7a3d5ea9252a	beb461a5-182a-41f0-98b1-7a370b13aeca	9b169cae-0646-4c35-bfd9-1ffd38f266bf	3	fr	Le 1er mars 1896, à Adoua, l'armée éthiopienne de Ménélik II inflige aux Italiens la plus cuisante défaite coloniale jamais connue. L'Afrique résiste.	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
20b47f4d-f68f-4225-bee6-08ca972d560c	beb461a5-182a-41f0-98b1-7a370b13aeca	11277ead-e6ae-47c8-a023-e8f106bb39f1	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
00e76276-10f1-4313-985c-9cbd7c19fb7c	beb461a5-182a-41f0-98b1-7a370b13aeca	b81ea18a-285f-4d72-ae29-e447d602526f	5	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
486cf97c-10b6-4a22-b175-aae94f4c3047	beb461a5-182a-41f0-98b1-7a370b13aeca	1a873c7b-1b7f-4969-9a67-e70251731a8a	6	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
ddc98bad-14a5-408d-888a-122c875e7ba7	8a8f6233-6d6f-4d44-b301-1a488bda54dd	23e6872b-502c-40a7-a5c3-bc8251882732	1	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
28b7c628-3c52-4e65-a83a-eb17a41e2ea9	8a8f6233-6d6f-4d44-b301-1a488bda54dd	acb05470-9994-4748-a818-e9ed130efe47	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
7724fdc0-56d6-46a1-82b2-012eba936454	8a8f6233-6d6f-4d44-b301-1a488bda54dd	89fc27f1-cdae-4de7-8f69-cb1b51efbf3f	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
e8f4075e-a75f-4bb7-bac7-389f8696e765	8a8f6233-6d6f-4d44-b301-1a488bda54dd	55d15224-2391-4501-aee0-9efcf8e68a96	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
66e94f38-b49b-42dc-9639-1181ac65ddba	8a8f6233-6d6f-4d44-b301-1a488bda54dd	ef89b7b9-ce78-465a-9ae3-7ef7380da92a	5	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
ae985c30-2508-4e7e-94ca-f0d8c1961b89	8a8f6233-6d6f-4d44-b301-1a488bda54dd	cc394b94-f303-460f-ae6c-c02fe6aaaaf3	6	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
27eb93c1-9f80-4030-a5a9-7e1086ffaa07	8a8f6233-6d6f-4d44-b301-1a488bda54dd	c96d9360-4992-4ce0-8d28-d2b8017bce01	7	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
7513b1f8-913b-486f-81cf-df850ea821bd	ada1a782-593e-4bb0-8697-f2f1140d9b7a	2b6d500f-099f-40a1-9c29-35cbacc5f589	1	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
7d729c6c-1126-48bf-ba87-464ae8c38de7	ada1a782-593e-4bb0-8697-f2f1140d9b7a	3b067fc9-ad4e-4ccc-b2ac-3f9a5397ef77	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
54f60109-bbb0-40dd-a435-99ce1fce9047	ada1a782-593e-4bb0-8697-f2f1140d9b7a	1d930139-5167-40b1-9642-2c4b66a7556c	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
8caf55db-61aa-4b8d-9dbe-97f36b5f18f4	ada1a782-593e-4bb0-8697-f2f1140d9b7a	9d309066-fbc5-43b4-927c-5100ccd8584d	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
55eda201-2950-49bd-b2a0-62f4bdf89914	ada1a782-593e-4bb0-8697-f2f1140d9b7a	ffd4d8c8-cd49-43b7-bc8b-b35091c3b032	5	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
44623d83-d15e-4ebc-9d04-295346a987b5	ada1a782-593e-4bb0-8697-f2f1140d9b7a	94ea82d2-4a6d-4fa1-96c8-b2f7a027ad34	6	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
291ce305-ed7d-4588-930f-de07cc139779	ada1a782-593e-4bb0-8697-f2f1140d9b7a	583cf076-d324-47d7-ba70-8b1976c27c7a	7	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
f25c80a9-d62e-4a7e-ad64-d7654d9015ce	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	c0657f37-fc68-4908-b518-0bd0039ecb7d	1	fr	En 1948, le Parti National afrikaner prend le pouvoir et instaure l'apartheid. Commence alors l'une des périodes les plus sombres de l'histoire africaine.	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
a48891c2-2acc-4adb-9370-2654e49c0152	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	eddaa76e-b136-413c-b75e-706fd618eec5	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
56cc67cb-83d0-4669-9107-557902a30794	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	1cfba0c0-063b-4ef3-bba0-d8dc3b0eaf67	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
5d4e45e7-3c4f-4656-b327-367d9b88ec1d	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	6c50bb88-c424-4e8d-be3a-29d2f5aafca3	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
47413b36-ae5e-4c8f-9e88-cb1049b2a8b5	b627ae6b-844f-4b77-a2af-0eae25f4b3f6	98b321fe-a8d9-4f1b-8279-7e2d100bb631	5	fr	Le 27 avril 1994, pour la première fois, tous les Sud-Africains votent à égalité. Nelson Mandela devient président et la nation arc-en-ciel prend son envol.	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
bda04cf4-ce94-4525-bd41-2926d0b978c2	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	de7626dc-7bfd-4d38-aa15-e20084ff637f	1	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
e583e49d-c001-40be-ade1-835bc4a3fa35	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	514497e8-d322-4c95-a5e4-c95187cf0e13	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
6766cd45-935a-4fbb-ad0a-ec7cc0bbd816	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	cdec0adf-9b2f-4788-9f0f-31d437dc88c6	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
52859913-84c2-4ffe-9d4e-9487f0840517	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	10fef26f-6b9d-4cd2-a532-b03857b25d14	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
d129e934-6c8f-48e9-a202-e42bf24894c0	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	b14c16da-ce8d-4dbe-a3db-06efaf99b56a	5	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
fccf25c4-3563-454b-8e20-662b3e0fce14	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	3f643111-879d-4163-8a3b-3989581b791d	6	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
d5ef3d8f-82eb-434b-ac0f-82fa8e6ae330	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	3176d638-94c5-41ac-8b37-8511ea7ffc80	7	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
9ee6b129-0e0f-430a-a62b-0aacd2ca154f	6b3f524c-c19b-42d1-a1d9-893c3b7a53ce	474e1053-3036-4206-a600-80d060d605e7	8	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
e9a402a5-4f0a-4210-962b-2a630eda1756	d838911c-1f06-4567-8214-e557c27cf577	5100b2d5-c823-4157-bdd9-08a6d6d67e0f	1	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
b1762733-23ac-4089-810f-8d3aaee205e1	d838911c-1f06-4567-8214-e557c27cf577	8ada64df-6cb7-4372-a761-692d2bf9bda1	2	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
686826bb-417d-4e72-b676-a02923985c1e	d838911c-1f06-4567-8214-e557c27cf577	d05fbd8b-1b28-4a81-8787-09e339811435	3	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
1b3b3cef-4dfc-438d-8d22-d1a6e1085a76	d838911c-1f06-4567-8214-e557c27cf577	23e6872b-502c-40a7-a5c3-bc8251882732	4	fr	\N	\N	\N	\N	\N	\N	2026-04-30 19:54:40.845542+00	2026-04-30 19:54:40.845542+00	\N
\.


--
-- Data for Name: story_media; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.story_media (story_id, media_id, is_cover) FROM stdin;
\.


--
-- Data for Name: story_themes; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.story_themes (story_id, theme_id) FROM stdin;
\.


--
-- Data for Name: taggables; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.taggables (tag_id, entity_type, entity_id) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.tags (id, slug, name) FROM stdin;
\.


--
-- Data for Name: themes; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.themes (id, slug, name, description, parent_id, color, icon, "position", created_at) FROM stdin;
21898156-ddc2-41c4-a1da-b6f632b29d5a	histoire	Histoire	\N	\N	#E57C3C	\N	0	2026-04-30 07:41:27.483934+00
a9541837-e0b0-49c1-b78c-f1fc909224ca	culture	Culture & Arts	\N	\N	#9B59D0	\N	1	2026-04-30 19:58:29.897481+00
c26fe9b2-4bd1-4cb5-a1f3-5c2460af1005	science	Science	\N	\N	#00D4AA	\N	2	2026-04-30 19:58:29.897481+00
38635d1a-53c1-48bf-9ff7-6256b06f08b4	politique	Politique	\N	\N	#E63946	\N	3	2026-04-30 19:58:29.897481+00
6962255d-f1f2-40c7-996d-2e1863103c33	spiritualite	Spiritualité	\N	\N	#F5C842	\N	4	2026-04-30 19:58:29.897481+00
49806f09-f5bc-4368-a2ce-75038c9ff938	geographie	Géographie	\N	\N	#3498DB	\N	5	2026-04-30 19:58:29.897481+00
be78eafb-a2a5-43c2-b460-22147c80d952	personnages	Personnages	\N	\N	#E8923A	\N	6	2026-04-30 19:58:29.897481+00
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.translations (entity_type, entity_id, lang, field, value, status, translated_by, translated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kasuku
--

COPY public.users (id, email, name, role, avatar_url, password_hash, is_active, created_at, last_seen_at) FROM stdin;
9ebe8438-d4b8-4ecd-89b8-923040a276a3	admin@kasuku.app	Admin Kasuku	admin	\N	$2a$12$TKHsNllMGpSuJyrS.89nBu9QtXGMeHKOincj3R3D2meNxDAFojxk6	t	2026-04-29 20:45:14.248713+00	\N
\.


--
-- Name: event_media event_media_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_pkey PRIMARY KEY (event_id, media_id);


--
-- Name: event_modules event_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_modules
    ADD CONSTRAINT event_modules_pkey PRIMARY KEY (event_id, module_id);


--
-- Name: event_people event_people_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_people
    ADD CONSTRAINT event_people_pkey PRIMARY KEY (event_id, person_id, role);


--
-- Name: event_places event_places_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_places
    ADD CONSTRAINT event_places_pkey PRIMARY KEY (event_id, place_id, role);


--
-- Name: event_relations event_relations_event_id_related_event_id_relation_type_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_relations
    ADD CONSTRAINT event_relations_event_id_related_event_id_relation_type_key UNIQUE (event_id, related_event_id, relation_type);


--
-- Name: event_relations event_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_relations
    ADD CONSTRAINT event_relations_pkey PRIMARY KEY (id);


--
-- Name: event_revisions event_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_revisions
    ADD CONSTRAINT event_revisions_pkey PRIMARY KEY (id);


--
-- Name: event_themes event_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_themes
    ADD CONSTRAINT event_themes_pkey PRIMARY KEY (event_id, theme_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: events events_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_slug_key UNIQUE (slug);


--
-- Name: featured_items featured_items_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.featured_items
    ADD CONSTRAINT featured_items_pkey PRIMARY KEY (id);


--
-- Name: kalenda_events kalenda_events_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_events
    ADD CONSTRAINT kalenda_events_pkey PRIMARY KEY (kalenda_id, event_id);


--
-- Name: kalenda_modules kalenda_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_modules
    ADD CONSTRAINT kalenda_modules_pkey PRIMARY KEY (kalenda_id, module_id);


--
-- Name: kalenda_stories kalenda_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_stories
    ADD CONSTRAINT kalenda_stories_pkey PRIMARY KEY (kalenda_id, story_id);


--
-- Name: kalenda_themes kalenda_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_themes
    ADD CONSTRAINT kalenda_themes_pkey PRIMARY KEY (kalenda_id, theme_id);


--
-- Name: kalendas kalendas_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalendas
    ADD CONSTRAINT kalendas_pkey PRIMARY KEY (id);


--
-- Name: kalendas kalendas_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalendas
    ADD CONSTRAINT kalendas_slug_key UNIQUE (slug);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: module_themes module_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.module_themes
    ADD CONSTRAINT module_themes_pkey PRIMARY KEY (module_id, theme_id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: modules modules_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_slug_key UNIQUE (slug);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: people people_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_slug_key UNIQUE (slug);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: places places_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_slug_key UNIQUE (slug);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: stories stories_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_slug_key UNIQUE (slug);


--
-- Name: story_events story_events_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_events
    ADD CONSTRAINT story_events_pkey PRIMARY KEY (id);


--
-- Name: story_events story_events_story_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_events
    ADD CONSTRAINT story_events_story_id_event_id_key UNIQUE (story_id, event_id);


--
-- Name: story_media story_media_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_media
    ADD CONSTRAINT story_media_pkey PRIMARY KEY (story_id, media_id);


--
-- Name: story_themes story_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_themes
    ADD CONSTRAINT story_themes_pkey PRIMARY KEY (story_id, theme_id);


--
-- Name: taggables taggables_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.taggables
    ADD CONSTRAINT taggables_pkey PRIMARY KEY (tag_id, entity_type, entity_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: themes themes_slug_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_slug_key UNIQUE (slug);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (entity_type, entity_id, lang, field);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_event_media_cover; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_media_cover ON public.event_media USING btree (event_id) WHERE (is_cover = true);


--
-- Name: idx_event_media_media; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_media_media ON public.event_media USING btree (media_id);


--
-- Name: idx_event_modules_module; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_modules_module ON public.event_modules USING btree (module_id);


--
-- Name: idx_event_people_person; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_people_person ON public.event_people USING btree (person_id);


--
-- Name: idx_event_places_place; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_places_place ON public.event_places USING btree (place_id);


--
-- Name: idx_event_relations_event; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_relations_event ON public.event_relations USING btree (event_id);


--
-- Name: idx_event_relations_related; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_relations_related ON public.event_relations USING btree (related_event_id);


--
-- Name: idx_event_relations_type; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_relations_type ON public.event_relations USING btree (relation_type);


--
-- Name: idx_event_themes_theme; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_event_themes_theme ON public.event_themes USING btree (theme_id);


--
-- Name: idx_events_annual; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_annual ON public.events USING btree (start_date) WHERE (annual_recurrence = true);


--
-- Name: idx_events_century; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_century ON public.events USING btree (approx_century) WHERE (temporal_type = 'approximate'::public.temporal_type);


--
-- Name: idx_events_contributors; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_contributors ON public.events USING gin (contributors);


--
-- Name: idx_events_country; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_country ON public.events USING btree (primary_country_code) WHERE (deleted_at IS NULL);


--
-- Name: idx_events_decade; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_decade ON public.events USING btree (approx_decade) WHERE (temporal_type = 'approximate'::public.temporal_type);


--
-- Name: idx_events_deleted; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_deleted ON public.events USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_events_featured; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_featured ON public.events USING btree (featured_position) WHERE (featured = true);


--
-- Name: idx_events_lang; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_lang ON public.events USING btree (lang);


--
-- Name: idx_events_place; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_place ON public.events USING btree (primary_place_id) WHERE (primary_place_id IS NOT NULL);


--
-- Name: idx_events_reliability; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_reliability ON public.events USING btree (reliability);


--
-- Name: idx_events_search; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_search ON public.events USING gin (search_vector);


--
-- Name: idx_events_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_slug ON public.events USING btree (slug);


--
-- Name: idx_events_start_date; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_start_date ON public.events USING btree (start_date) WHERE (deleted_at IS NULL);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_status ON public.events USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_events_title_trgm; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_events_title_trgm ON public.events USING gin (title public.gin_trgm_ops);


--
-- Name: idx_featured_active; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_featured_active ON public.featured_items USING btree (active, start_date, end_date);


--
-- Name: idx_featured_event_id; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_featured_event_id ON public.featured_items USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: idx_featured_module_id; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_featured_module_id ON public.featured_items USING btree (module_id) WHERE (module_id IS NOT NULL);


--
-- Name: idx_featured_order; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_featured_order ON public.featured_items USING btree (display_order);


--
-- Name: idx_featured_story_id; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_featured_story_id ON public.featured_items USING btree (story_id) WHERE (story_id IS NOT NULL);


--
-- Name: idx_kalendas_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_kalendas_slug ON public.kalendas USING btree (slug);


--
-- Name: idx_kalendas_status; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_kalendas_status ON public.kalendas USING btree (status);


--
-- Name: idx_media_creation_year; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_media_creation_year ON public.media USING btree (creation_year);


--
-- Name: idx_media_creators; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_media_creators ON public.media USING gin (creators);


--
-- Name: idx_media_lang; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_media_lang ON public.media USING btree (lang);


--
-- Name: idx_media_license; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_media_license ON public.media USING btree (license);


--
-- Name: idx_media_rights; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_media_rights ON public.media USING btree (rights_expiry) WHERE (rights_expiry IS NOT NULL);


--
-- Name: idx_media_type; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_media_type ON public.media USING btree (type);


--
-- Name: idx_module_themes_theme; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_module_themes_theme ON public.module_themes USING btree (theme_id);


--
-- Name: idx_modules_lang; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_modules_lang ON public.modules USING btree (lang);


--
-- Name: idx_modules_level; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_modules_level ON public.modules USING btree (level);


--
-- Name: idx_modules_search; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_modules_search ON public.modules USING gin (search_vector);


--
-- Name: idx_modules_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_modules_slug ON public.modules USING btree (slug);


--
-- Name: idx_modules_status; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_modules_status ON public.modules USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_modules_title_trgm; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_modules_title_trgm ON public.modules USING gin (title public.gin_trgm_ops);


--
-- Name: idx_people_nationality; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_people_nationality ON public.people USING btree (nationality);


--
-- Name: idx_people_search; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_people_search ON public.people USING gin (search_vector);


--
-- Name: idx_people_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_people_slug ON public.people USING btree (slug);


--
-- Name: idx_places_country; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_places_country ON public.places USING btree (country_code);


--
-- Name: idx_places_geo; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_places_geo ON public.places USING btree (lat, lng) WHERE ((lat IS NOT NULL) AND (lng IS NOT NULL));


--
-- Name: idx_places_parent; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_places_parent ON public.places USING btree (parent_id);


--
-- Name: idx_places_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_places_slug ON public.places USING btree (slug);


--
-- Name: idx_places_type; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_places_type ON public.places USING btree (place_type);


--
-- Name: idx_revisions_event; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_revisions_event ON public.event_revisions USING btree (event_id, changed_at DESC);


--
-- Name: idx_revisions_type; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_revisions_type ON public.event_revisions USING btree (change_type);


--
-- Name: idx_revisions_user; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_revisions_user ON public.event_revisions USING btree (changed_by);


--
-- Name: idx_stories_dates; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_stories_dates ON public.stories USING btree (computed_start_date, computed_end_date);


--
-- Name: idx_stories_lang; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_stories_lang ON public.stories USING btree (lang);


--
-- Name: idx_stories_search; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_stories_search ON public.stories USING gin (search_vector);


--
-- Name: idx_stories_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_stories_slug ON public.stories USING btree (slug);


--
-- Name: idx_stories_status; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_stories_status ON public.stories USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_stories_title_trgm; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_stories_title_trgm ON public.stories USING gin (title public.gin_trgm_ops);


--
-- Name: idx_story_events_event; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_story_events_event ON public.story_events USING btree (event_id);


--
-- Name: idx_story_events_source; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_story_events_source ON public.story_events USING btree (source_story_event_id) WHERE (source_story_event_id IS NOT NULL);


--
-- Name: idx_story_events_story; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_story_events_story ON public.story_events USING btree (story_id, "position");


--
-- Name: idx_story_media_media; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_story_media_media ON public.story_media USING btree (media_id);


--
-- Name: idx_story_themes_theme; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_story_themes_theme ON public.story_themes USING btree (theme_id);


--
-- Name: idx_taggables_entity; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_taggables_entity ON public.taggables USING btree (entity_type, entity_id);


--
-- Name: idx_taggables_tag; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_taggables_tag ON public.taggables USING btree (tag_id);


--
-- Name: idx_themes_parent; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_themes_parent ON public.themes USING btree (parent_id);


--
-- Name: idx_themes_slug; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_themes_slug ON public.themes USING btree (slug);


--
-- Name: idx_translations_entity; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_translations_entity ON public.translations USING btree (entity_type, entity_id);


--
-- Name: idx_translations_lang; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_translations_lang ON public.translations USING btree (lang);


--
-- Name: idx_translations_status; Type: INDEX; Schema: public; Owner: kasuku
--

CREATE INDEX idx_translations_status ON public.translations USING btree (entity_type, lang, status);


--
-- Name: v_stories_published _RETURN; Type: RULE; Schema: public; Owner: kasuku
--

CREATE OR REPLACE VIEW public.v_stories_published AS
 SELECT s.id,
    s.slug,
    s.lang,
    s.title,
    s.summary,
    s.cover_url,
    s.computed_start_date,
    s.computed_end_date,
    s.contributors,
    s.published_at,
    s.created_at,
    count(se.event_id) AS event_count
   FROM (public.stories s
     LEFT JOIN public.story_events se ON ((se.story_id = s.id)))
  WHERE ((s.status = 'published'::public.content_status) AND (s.deleted_at IS NULL))
  GROUP BY s.id;


--
-- Name: events trg_events_audit; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_events_audit AFTER UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.fn_record_event_revision();


--
-- Name: events trg_events_published_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_events_published_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.fn_set_published_at();


--
-- Name: events trg_events_search_vector; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_events_search_vector BEFORE INSERT OR UPDATE OF title, summary, content ON public.events FOR EACH ROW EXECUTE FUNCTION public.fn_update_event_search_vector();


--
-- Name: events trg_events_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: featured_items trg_featured_items_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_featured_items_updated_at BEFORE UPDATE ON public.featured_items FOR EACH ROW EXECUTE FUNCTION public.update_featured_items_updated_at();


--
-- Name: kalendas trg_kalendas_published_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_kalendas_published_at BEFORE UPDATE ON public.kalendas FOR EACH ROW EXECUTE FUNCTION public.fn_set_published_at();


--
-- Name: kalendas trg_kalendas_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_kalendas_updated_at BEFORE UPDATE ON public.kalendas FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: media trg_media_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: modules trg_modules_published_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_modules_published_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.fn_set_published_at();


--
-- Name: modules trg_modules_search_vector; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_modules_search_vector BEFORE INSERT OR UPDATE OF title, summary ON public.modules FOR EACH ROW EXECUTE FUNCTION public.fn_update_module_search_vector();


--
-- Name: modules trg_modules_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: people trg_people_search_vector; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_people_search_vector BEFORE INSERT OR UPDATE OF name, bio ON public.people FOR EACH ROW EXECUTE FUNCTION public.fn_update_people_search_vector();


--
-- Name: people trg_people_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_people_updated_at BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: stories trg_stories_published_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_stories_published_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.fn_set_published_at();


--
-- Name: stories trg_stories_search_vector; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_stories_search_vector BEFORE INSERT OR UPDATE OF title, summary ON public.stories FOR EACH ROW EXECUTE FUNCTION public.fn_update_story_search_vector();


--
-- Name: stories trg_stories_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: story_events trg_story_events_refresh_dates; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_story_events_refresh_dates AFTER INSERT OR DELETE OR UPDATE ON public.story_events FOR EACH ROW EXECUTE FUNCTION public.fn_refresh_story_dates();


--
-- Name: story_events trg_story_events_updated_at; Type: TRIGGER; Schema: public; Owner: kasuku
--

CREATE TRIGGER trg_story_events_updated_at BEFORE UPDATE ON public.story_events FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: event_media event_media_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_media event_media_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: event_modules event_modules_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_modules
    ADD CONSTRAINT event_modules_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_modules event_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_modules
    ADD CONSTRAINT event_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: event_people event_people_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_people
    ADD CONSTRAINT event_people_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_people event_people_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_people
    ADD CONSTRAINT event_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;


--
-- Name: event_places event_places_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_places
    ADD CONSTRAINT event_places_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_places event_places_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_places
    ADD CONSTRAINT event_places_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: event_relations event_relations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_relations
    ADD CONSTRAINT event_relations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_relations event_relations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_relations
    ADD CONSTRAINT event_relations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_relations event_relations_related_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_relations
    ADD CONSTRAINT event_relations_related_event_id_fkey FOREIGN KEY (related_event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_revisions event_revisions_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_revisions
    ADD CONSTRAINT event_revisions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_revisions event_revisions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_revisions
    ADD CONSTRAINT event_revisions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_themes event_themes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_themes
    ADD CONSTRAINT event_themes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_themes event_themes_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.event_themes
    ADD CONSTRAINT event_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_primary_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_primary_place_id_fkey FOREIGN KEY (primary_place_id) REFERENCES public.places(id) ON DELETE SET NULL;


--
-- Name: events events_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: featured_items featured_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.featured_items
    ADD CONSTRAINT featured_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: featured_items featured_items_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.featured_items
    ADD CONSTRAINT featured_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: featured_items featured_items_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.featured_items
    ADD CONSTRAINT featured_items_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: featured_items featured_items_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.featured_items
    ADD CONSTRAINT featured_items_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: featured_items featured_items_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.featured_items
    ADD CONSTRAINT featured_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kalenda_events kalenda_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_events
    ADD CONSTRAINT kalenda_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: kalenda_events kalenda_events_kalenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_events
    ADD CONSTRAINT kalenda_events_kalenda_id_fkey FOREIGN KEY (kalenda_id) REFERENCES public.kalendas(id) ON DELETE CASCADE;


--
-- Name: kalenda_modules kalenda_modules_kalenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_modules
    ADD CONSTRAINT kalenda_modules_kalenda_id_fkey FOREIGN KEY (kalenda_id) REFERENCES public.kalendas(id) ON DELETE CASCADE;


--
-- Name: kalenda_modules kalenda_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_modules
    ADD CONSTRAINT kalenda_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: kalenda_stories kalenda_stories_kalenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_stories
    ADD CONSTRAINT kalenda_stories_kalenda_id_fkey FOREIGN KEY (kalenda_id) REFERENCES public.kalendas(id) ON DELETE CASCADE;


--
-- Name: kalenda_stories kalenda_stories_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_stories
    ADD CONSTRAINT kalenda_stories_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: kalenda_themes kalenda_themes_kalenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_themes
    ADD CONSTRAINT kalenda_themes_kalenda_id_fkey FOREIGN KEY (kalenda_id) REFERENCES public.kalendas(id) ON DELETE CASCADE;


--
-- Name: kalenda_themes kalenda_themes_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalenda_themes
    ADD CONSTRAINT kalenda_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: kalendas kalendas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalendas
    ADD CONSTRAINT kalendas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kalendas kalendas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.kalendas
    ADD CONSTRAINT kalendas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: media media_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: module_themes module_themes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.module_themes
    ADD CONSTRAINT module_themes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: module_themes module_themes_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.module_themes
    ADD CONSTRAINT module_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: modules modules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: modules modules_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: people people_birth_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_birth_place_id_fkey FOREIGN KEY (birth_place_id) REFERENCES public.places(id) ON DELETE SET NULL;


--
-- Name: places places_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.places(id) ON DELETE SET NULL;


--
-- Name: stories stories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: stories stories_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: story_events story_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_events
    ADD CONSTRAINT story_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: story_events story_events_source_story_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_events
    ADD CONSTRAINT story_events_source_story_event_id_fkey FOREIGN KEY (source_story_event_id) REFERENCES public.story_events(id) ON DELETE SET NULL;


--
-- Name: story_events story_events_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_events
    ADD CONSTRAINT story_events_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: story_media story_media_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_media
    ADD CONSTRAINT story_media_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: story_media story_media_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_media
    ADD CONSTRAINT story_media_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: story_themes story_themes_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_themes
    ADD CONSTRAINT story_themes_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- Name: story_themes story_themes_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.story_themes
    ADD CONSTRAINT story_themes_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;


--
-- Name: taggables taggables_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.taggables
    ADD CONSTRAINT taggables_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: themes themes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.themes(id) ON DELETE SET NULL;


--
-- Name: translations translations_translated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kasuku
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_translated_by_fkey FOREIGN KEY (translated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict oOCLJIdtG0BIYfJ2yaMLcSxVf1jgc0fxENNPn88gIIp61CfKrwgrLhlBGM8G7td

