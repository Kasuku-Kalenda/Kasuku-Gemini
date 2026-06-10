-- ============================================================
--  Migration 026 — Modèle LMS des modules (sections / leçons)
-- ------------------------------------------------------------
--  Le front web et l'admin attendent un modèle de cours structuré
--  (sections → leçons, objectifs, quiz, ressources, intégration
--  Moodle, certificat). La table `modules` ne stockait que `content`
--  (blocs plats) + `contributors`. On ajoute les colonnes LMS pour
--  qu'un module créé en admin s'affiche à l'identique sur web ET natif.
--
--  Idempotent : ADD COLUMN IF NOT EXISTS (rejouable à chaque déploiement).
--  Mapping postgres.js camelCase : module_type→moduleType,
--  moodle_course_url→moodleCourseUrl, final_quiz→finalQuiz,
--  has_certificate→hasCertificate, certificate_name→certificateName, etc.
-- ============================================================

-- Structure du cours : [{ id, title, description, order, lessons:[
--   { id, title, type:'video'|'audio'|'pdf'|'text'|'quiz', durationMin,
--     url, content, transcript, order, quiz } ], quiz }]
ALTER TABLE modules ADD COLUMN IF NOT EXISTS sections         JSONB        NOT NULL DEFAULT '[]';

-- Objectifs pédagogiques : ["...", "..."]
ALTER TABLE modules ADD COLUMN IF NOT EXISTS objectives       JSONB        NOT NULL DEFAULT '[]';

-- 'internal' (sections/leçons Kasuku) | 'moodle' (cours externe)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS module_type      VARCHAR(20)  NOT NULL DEFAULT 'internal';

-- Intégration Moodle (modules externes)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS moodle_course_url  TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS moodle_instance_id TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS moodle_course_id   TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS moodle_mode        VARCHAR(10);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS moodle_package_id  TEXT;

-- Évaluation finale : { id, title, passingScore, questions:[
--   { question, type:'multiple_choice'|'true_false', options, correctIndex,
--     correctBool, explanation } ] }
ALTER TABLE modules ADD COLUMN IF NOT EXISTS final_quiz       JSONB;

-- Ressources complémentaires : [{ type:'audio'|'video'|'image'|'pdf'|'link'|
--   'event'|'timeline', title, url, eventId, timelineSlug, description }]
ALTER TABLE modules ADD COLUMN IF NOT EXISTS resources        JSONB        NOT NULL DEFAULT '[]';

-- Certificat de fin de module
ALTER TABLE modules ADD COLUMN IF NOT EXISTS has_certificate  BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS certificate_name TEXT;

-- Association à un récit (timeline) — optionnelle
ALTER TABLE modules ADD COLUMN IF NOT EXISTS timeline_slug    TEXT;

COMMENT ON COLUMN modules.sections   IS 'Cours structuré : sections → leçons (video/audio/pdf/text/quiz). Modèle LMS partagé web + natif.';
COMMENT ON COLUMN modules.objectives IS 'Objectifs pédagogiques (array de chaînes).';
COMMENT ON COLUMN modules.module_type IS 'internal | moodle.';
COMMENT ON COLUMN modules.final_quiz IS 'Quiz final du module (Quiz JSON).';
COMMENT ON COLUMN modules.resources  IS 'Ressources complémentaires (CourseResource[]).';
