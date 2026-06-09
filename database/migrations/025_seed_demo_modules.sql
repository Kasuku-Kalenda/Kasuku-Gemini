-- ============================================================
--  Migration 025 — Seed : 10 modules pédagogiques de démonstration
-- ------------------------------------------------------------
--  Objectif (issue native #24) : montrer TOUTES les possibilités
--  des modules — chaque type de bloc (text, image, video, audio,
--  quiz, resource), des contributeurs, des vignettes (URLs, pas de
--  base64) et des liens vers des événements réels + des thèmes.
--
--  Idempotent : INSERT ... ON CONFLICT (slug) DO UPDATE.
--  migrate.sh rejoue tous les fichiers à chaque déploiement : les
--  liens événements/thèmes utilisent ON CONFLICT DO NOTHING et un
--  JOIN par slug (sans correspondance → 0 ligne, sans effet de bord).
--
--  Médias : images = Wikimedia Commons (Special:FilePath, hotlink
--  stable) ; vidéos/audio = YouTube (TED-Ed, archives musicales) ;
--  ressources = Wikipédia FR / UNESCO. Toutes les URLs ont été
--  vérifiées (HTTP 200 / oEmbed) au moment du seed.
-- ============================================================

-- ── 1. Mansa Moussa et l'empire du Mali (intermédiaire) ──────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-mansa-moussa-empire-mali', 'fr',
  'Mansa Moussa et l''âge d''or de l''empire du Mali',
  $sum$Sur les routes de l'or et du sel, découvrez l'empire du Mali, sa capitale du savoir Tombouctou et le pèlerinage légendaire de l'homme le plus riche de l'histoire.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Mansa_Musa.jpg?width=1200',
  26, 'intermediate',
  $json$[
    {"type":"text","body":"Au XIIIe siècle, l'empire du Mali s'impose comme la plus grande puissance d'Afrique de l'Ouest. Fondé vers 1235 par Soundiata Keïta après sa victoire de Kirina, il s'étend des rives de l'Atlantique aux boucles du fleuve Niger.\n\nSa prospérité repose sur le contrôle des routes transsahariennes, par lesquelles transitent l'or des mines du Bambouk et le sel des mines de Taghaza."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Mansa_Musa.jpg?width=1200","alt":"Mansa Moussa tenant un globe d'or, Atlas catalan (1375)","credit":"Abraham Cresques / Wikimedia Commons"},
    {"type":"text","body":"En 1324, le mansa (« roi des rois ») Moussa entreprend un pèlerinage à La Mecque resté légendaire. Sa caravane compte des milliers de personnes et des chameaux chargés d'or.\n\nÀ son passage au Caire, il distribue tant d'or que le cours du métal s'effondre pour plusieurs années — un témoignage spectaculaire de la richesse du Mali."},
    {"type":"video","url":"https://www.youtube.com/watch?v=O3YJMaL55TM","title":"Mansa Moussa, l'un des hommes les plus riches de l'histoire (TED-Ed)"},
    {"type":"text","body":"De retour, Mansa Moussa fait de Tombouctou un foyer intellectuel majeur. Il y fait bâtir la mosquée Djingareyber et attire savants et architectes.\n\nL'université de Sankoré et ses bibliothèques feront de la ville un centre du savoir islamique rayonnant sur tout le monde musulman."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Great_Mosque_of_Djenn%C3%A9_1.jpg?width=1200","alt":"La Grande Mosquée de Djenné, chef-d'œuvre de l'architecture soudano-sahélienne","credit":"Wikimedia Commons"},
    {"type":"audio","url":"https://www.youtube.com/watch?v=bOBe-wE5CWM","title":"La kora et la tradition orale des griots (Toumani Diabaté)","duration_s":360},
    {"type":"quiz","question":"Quelle destination Mansa Moussa rejoint-il lors de son célèbre pèlerinage de 1324 ?","options":["La Mecque","Le Caire","Jérusalem","Tombouctou"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Mansa_Moussa","label":"Article Wikipédia : Mansa Moussa"},
    {"type":"resource","url":"https://whc.unesco.org/fr/list/119","label":"UNESCO — Tombouctou, patrimoine mondial"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Aïssata Koné","role":"author"},
    {"name":"Institut des civilisations sahéliennes","role":"institution"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-31 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 2. L'Égypte ancienne (débutant) ─────────────────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-egypte-ancienne-pharaons', 'fr',
  'L''Égypte ancienne : pharaons, pyramides et hiéroglyphes',
  $sum$Trois mille ans de civilisation au bord du Nil : de l'unification du pays aux pharaons légendaires, plongez dans l'un des plus grands héritages de l'humanité.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/All_Gizah_Pyramids.jpg?width=1200',
  22, 'beginner',
  $json$[
    {"type":"text","body":"Pendant près de trois mille ans, la civilisation de l'Égypte antique a prospéré le long du Nil. De l'unification du pays par Ménès vers 3100 av. J.-C. jusqu'à la mort de Cléopâtre en 30 av. J.-C., trente dynasties se succèdent.\n\nÉcriture hiéroglyphique, médecine, architecture monumentale : l'héritage égyptien continue de fasciner le monde entier."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/All_Gizah_Pyramids.jpg?width=1200","alt":"Les pyramides de Gizeh","credit":"Wikimedia Commons"},
    {"type":"video","url":"https://www.youtube.com/watch?v=H7JjNzQ_g0s","title":"Comment les pyramides de Gizeh ont-elles été construites ? (TED-Ed)"},
    {"type":"text","body":"Quelques figures dominent cette longue histoire : Hatchepsout, l'une des rares femmes pharaons ; Akhenaton, qui imposa le culte d'un dieu unique, Aton ; Ramsès II, bâtisseur d'Abou Simbel ; Toutânkhamon, dont la tombe intacte fut découverte en 1922 ; et Cléopâtre VII, dernière souveraine de l'Égypte indépendante."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Hatshepsut.jpg?width=1200","alt":"Statue de la reine-pharaon Hatchepsout","credit":"Metropolitan Museum / Wikimedia Commons"},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/CairoEgMuseumTaaMaskMostlyPhotographed.jpg?width=1200","alt":"Le masque funéraire d'or de Toutânkhamon","credit":"Musée égyptien du Caire / Wikimedia Commons"},
    {"type":"quiz","question":"En quelle année la tombe intacte de Toutânkhamon a-t-elle été découverte ?","options":["1899","1922","1936","1954"],"answer":1},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/%C3%89gypte_antique","label":"Article Wikipédia : L'Égypte antique"},
    {"type":"resource","url":"https://www.youtube.com/watch?v=ezJvDKFW3eA","label":"Vidéo : lire les hiéroglyphes au Musée égyptien"}
  ]$json$::jsonb,
  $json$[
    {"name":"Pr. Karim Benali","role":"expert"},
    {"name":"Musée égyptien du Caire","role":"institution"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-30 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 3. Les empires d'Afrique de l'Ouest (avancé) ────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-empires-afrique-ouest', 'fr',
  'Ghana, Mali, Songhaï : les grands empires d''Afrique de l''Ouest',
  $sum$Huit siècles d'empires bâtis sur l'or et le sel. Du Ghana médiéval à la chute du Songhaï, comprenez les civilisations qui dominèrent le Sahel.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Great_Mosque_of_Djenn%C3%A9_1.jpg?width=1200',
  32, 'advanced',
  $json$[
    {"type":"text","body":"Entre le VIIIe et le XVIe siècle, trois grands empires se succèdent en Afrique de l'Ouest : le Ghana, le Mali puis le Songhaï. Chacun étend sa domination sur les routes du commerce transsaharien.\n\nLeur puissance repose sur le contrôle de l'or, du sel et des grandes cités marchandes comme Gao, Tombouctou et Djenné."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Great_Mosque_of_Djenn%C3%A9_1.jpg?width=1200","alt":"La Grande Mosquée de Djenné, ancienne cité marchande du Sahel","credit":"Wikimedia Commons"},
    {"type":"text","body":"Le sel du Sahara s'échangeait presque à parité avec l'or du Sud : deux ressources vitales qui firent la fortune des souverains.\n\nSous l'askia Mohammed, le Songhaï atteint son apogée et fait du pèlerinage à La Mecque un acte politique autant que religieux. L'empire s'effondre en 1591, vaincu à Tondibi par une armée saadienne dotée d'armes à feu."},
    {"type":"video","url":"https://www.youtube.com/watch?v=O3YJMaL55TM","title":"L'or du Sahel et le commerce transsaharien (TED-Ed)"},
    {"type":"audio","url":"https://www.youtube.com/watch?v=-cLAwAOi-hA","title":"« Jarabi » à la kora (Toumani et Sidiki Diabaté)","duration_s":300},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Great_Zimbabwe_Closeup.jpg?width=1200","alt":"Le Grand Zimbabwe — autre grande cité-État africaine, à titre de comparaison","credit":"Wikimedia Commons"},
    {"type":"quiz","question":"Quelle ville fut la capitale de l'empire songhaï ?","options":["Gao","Tombouctou","Djenné","Niani"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Empire_songha%C3%AF","label":"Article Wikipédia : Empire songhaï"},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Empire_du_Ghana","label":"Article Wikipédia : Empire du Ghana"}
  ]$json$::jsonb,
  $json$[
    {"name":"Pr. Ibrahima Diallo","role":"author"},
    {"name":"Institut des civilisations sahéliennes","role":"institution"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-29 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 4. Nelson Mandela et l'apartheid (débutant) ─────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-mandela-apartheid', 'fr',
  'Nelson Mandela et la chute de l''apartheid',
  $sum$De l'instauration de l'apartheid en 1948 à la première élection libre de 1994 : le combat d'un homme et d'un peuple pour l'égalité en Afrique du Sud.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Nelson_Mandela_1994.jpg?width=1200',
  24, 'beginner',
  $json$[
    {"type":"text","body":"Instauré en 1948 par le Parti national, l'apartheid (« séparation » en afrikaans) organise en Afrique du Sud une ségrégation raciale systématique.\n\nLa population est classée par « race » ; les droits politiques, la liberté de circulation et l'accès à la terre sont refusés à la majorité noire."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Nelson_Mandela_1994.jpg?width=1200","alt":"Nelson Mandela en 1994","credit":"Wikimedia Commons"},
    {"type":"video","url":"https://www.youtube.com/watch?v=ke4kVFycpYY","title":"Comment l'apartheid est-il arrivé, et comment a-t-il pris fin ? (TED-Ed)"},
    {"type":"text","body":"Figure de l'ANC, Nelson Mandela est condamné en 1964 à la prison à vie. Il passera vingt-sept ans en détention, dont dix-huit sur l'île de Robben Island.\n\nLibéré en 1990 sous la pression interne et internationale, il négocie la fin pacifique de l'apartheid et devient en 1994 le premier président sud-africain élu au suffrage universel."},
    {"type":"quiz","question":"En quelle année Nelson Mandela a-t-il été libéré après vingt-sept ans de prison ?","options":["1985","1990","1994","1976"],"answer":1},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Apartheid","label":"Article Wikipédia : Apartheid"},
    {"type":"resource","url":"https://whc.unesco.org/fr/list/916","label":"UNESCO — Île de Robben"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Thabo Mokoena","role":"expert"},
    {"name":"Fondation Nelson Mandela","role":"institution"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-28 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 5. Le panafricanisme (avancé) ───────────────────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-panafricanisme-nkrumah-oua', 'fr',
  'Le panafricanisme : de Nkrumah à l''Union africaine',
  $sum$De la diaspora aux « États-Unis d'Afrique » : l'histoire d'un idéal d'unité, des premiers congrès panafricains à la fondation de l'OUA en 1963.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Kwame_Nkrumah_%28JFKWHP-AR6409-A%29.jpg?width=1200',
  35, 'advanced',
  $json$[
    {"type":"text","body":"Le panafricanisme naît au début du XXe siècle dans la diaspora, avec des penseurs comme W. E. B. Du Bois et Marcus Garvey. Il affirme l'unité et la solidarité des peuples d'ascendance africaine.\n\nLes congrès panafricains, puis les indépendances, transposent cet idéal sur le continent lui-même."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Kwame_Nkrumah_%28JFKWHP-AR6409-A%29.jpg?width=1200","alt":"Kwame Nkrumah, premier président du Ghana et héraut du panafricanisme","credit":"Bibliothèque JFK / Wikimedia Commons"},
    {"type":"text","body":"Le 25 mai 1963, trente-deux États fondent à Addis-Abeba l'Organisation de l'unité africaine (OUA). Kwame Nkrumah y plaide pour des « États-Unis d'Afrique ».\n\nDevenue l'Union africaine en 2002, l'organisation demeure le cadre de la coopération continentale ; le 25 mai est célébré comme la Journée de l'Afrique."},
    {"type":"quiz","question":"Dans quelle ville fut fondée, en 1963, l'Organisation de l'unité africaine ?","options":["Addis-Abeba","Accra","Le Caire","Dakar"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Organisation_de_l%27unit%C3%A9_africaine","label":"Article Wikipédia : Organisation de l'unité africaine"},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Kwame_Nkrumah","label":"Article Wikipédia : Kwame Nkrumah"}
  ]$json$::jsonb,
  $json$[
    {"name":"Pr. Aimé Mboup","role":"author"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-27 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 6. Les indépendances africaines (intermédiaire) ─────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-independances-africaines', 'fr',
  'Les indépendances africaines (1956-1962)',
  $sum$En quinze ans, un continent se libère. Du Ghana de Nkrumah à « l'année de l'Afrique » 1960, retour sur la vague des indépendances et ses défis.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Patrice_Lumumba%2C_1960.jpg?width=1200',
  30, 'intermediate',
  $json$[
    {"type":"text","body":"Au lendemain de la Seconde Guerre mondiale, le vent des indépendances souffle sur l'Afrique. En une quinzaine d'années, la quasi-totalité du continent se libère de la tutelle coloniale.\n\nLe Ghana de Kwame Nkrumah ouvre la voie en 1957 ; trois ans plus tard, dix-sept pays accèdent à la souveraineté lors de la seule année 1960."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Patrice_Lumumba%2C_1960.jpg?width=1200","alt":"Patrice Lumumba, premier Premier ministre du Congo indépendant, 1960","credit":"Wikimedia Commons"},
    {"type":"text","body":"1960 est restée dans l'histoire comme « l'année de l'Afrique ». Du Sénégal au Congo, de la Côte d'Ivoire au Cameroun, les drapeaux coloniaux sont remplacés par ceux des jeunes nations.\n\nMais l'indépendance politique ne règle pas tout : frontières héritées, dépendance économique et ingérences marqueront les décennies suivantes."},
    {"type":"text","body":"L'Algérie fait figure d'exception : son indépendance, arrachée en 1962, est le fruit d'une guerre de huit ans d'une violence extrême.\n\nAu Congo belge, l'assassinat de Patrice Lumumba en 1961 illustre lui aussi le prix payé pour l'émancipation."},
    {"type":"quiz","question":"Quel pays fut, en 1957, la première colonie d'Afrique subsaharienne à devenir indépendante ?","options":["Le Ghana","La Guinée","Le Sénégal","Le Congo"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Patrice_Lumumba","label":"Article Wikipédia : Patrice Lumumba"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Fatou Ndiaye","role":"author"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-26 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 7. La traite négrière atlantique (intermédiaire) ────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-traite-negriere-atlantique', 'fr',
  'La traite négrière atlantique et la route des esclaves',
  $sum$Du commerce triangulaire à la Porte du Non-Retour : comprendre l'une des plus grandes tragédies de l'histoire et les résistances qu'elle a suscitées.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Toussaint_Louverture.jpg?width=1200',
  28, 'intermediate',
  $json$[
    {"type":"text","body":"Du XVIe au XIXe siècle, la traite atlantique déporte des millions d'Africains vers les Amériques. Ce « commerce triangulaire » relie l'Europe, l'Afrique et le Nouveau Monde.\n\nDes armes et des produits manufacturés sont échangés sur les côtes africaines contre des captifs, vendus ensuite comme esclaves dans les plantations."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Toussaint_Louverture.jpg?width=1200","alt":"Toussaint Louverture, figure de la révolution haïtienne","credit":"Wikimedia Commons"},
    {"type":"text","body":"Sur la côte du Bénin actuel, Ouidah fut l'un des principaux ports négriers. La « Route des esclaves » y mène à la « Porte du Non-Retour », mémorial du dernier pas sur le sol africain.\n\nEn 1791, la révolte de Saint-Domingue, menée notamment par Toussaint Louverture, ébranle ce système et aboutit à la première république noire : Haïti."},
    {"type":"quiz","question":"Combien de continents reliait le « commerce triangulaire » de la traite atlantique ?","options":["Deux","Trois","Quatre","Cinq"],"answer":1},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Traite_atlantique","label":"Article Wikipédia : Traite atlantique"},
    {"type":"resource","url":"https://whc.unesco.org/fr/list/26","label":"UNESCO — Île de Gorée, mémoire de la traite"},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Toussaint_Louverture","label":"Article Wikipédia : Toussaint Louverture"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Kofi Mensah","role":"author"},
    {"name":"UNESCO — La Route de l'esclave","role":"institution"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-25 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 8. La Négritude (intermédiaire) ─────────────────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-negritude-renaissance-culturelle', 'fr',
  'La Négritude et la renaissance culturelle africaine',
  $sum$Césaire, Senghor, Damas, Cheikh Anta Diop : comment une génération d'intellectuels a réhabilité fièrement l'identité et l'histoire des peuples noirs.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/L%C3%A9opold_S%C3%A9dar_Senghor.jpg?width=1200',
  24, 'intermediate',
  $json$[
    {"type":"text","body":"Dans les années 1930, à Paris, des étudiants venus d'Afrique et des Antilles — Aimé Césaire, Léopold Sédar Senghor et Léon-Gontran Damas — forgent le concept de Négritude.\n\nIl s'agit de revendiquer fièrement l'identité et les valeurs des peuples noirs, longtemps niées par la colonisation."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/L%C3%A9opold_S%C3%A9dar_Senghor.jpg?width=1200","alt":"Léopold Sédar Senghor, poète de la Négritude et premier président du Sénégal","credit":"Wikimedia Commons"},
    {"type":"text","body":"Le mouvement nourrit une véritable renaissance culturelle. L'historien sénégalais Cheikh Anta Diop bouleverse les savoirs en démontrant l'africanité de l'Égypte ancienne et l'ancienneté des civilisations noires.\n\nPoésie, essais et recherche scientifique convergent pour réhabiliter l'apport de l'Afrique à l'histoire universelle."},
    {"type":"quiz","question":"Quels trois écrivains sont considérés comme les fondateurs de la Négritude ?","options":["Césaire, Senghor et Damas","Diop, Senghor et Sembène","Césaire, Fanon et Glissant","Senghor, Hampâté Bâ et Kourouma"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/N%C3%A9gritude","label":"Article Wikipédia : Négritude"},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Cheikh_Anta_Diop","label":"Article Wikipédia : Cheikh Anta Diop"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Mariama Bâ","role":"author"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-24 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 9. Résistances à la colonisation (avancé) ───────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-resistances-colonisation', 'fr',
  'Résistances africaines à la colonisation',
  $sum$Loin d'être passive, l'Afrique a résisté. De Samori Touré à la victoire éthiopienne d'Adoua, redécouvrez les combats contre la conquête coloniale.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Menelik_II_of_Ethiopia.jpg?width=1200',
  30, 'advanced',
  $json$[
    {"type":"text","body":"Loin d'avoir été passive, l'Afrique a opposé à la colonisation des résistances multiples : guerres, diplomatie, soulèvements religieux et révoltes populaires.\n\nDe Samori Touré en Afrique de l'Ouest aux guerriers zoulous en Afrique australe, ces résistances ont parfois tenu les puissances européennes en échec pendant des décennies."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Menelik_II_of_Ethiopia.jpg?width=1200","alt":"L'empereur Ménélik II d'Éthiopie, vainqueur de la bataille d'Adoua","credit":"Wikimedia Commons"},
    {"type":"text","body":"Le 1er mars 1896, à Adoua, l'armée éthiopienne de l'empereur Ménélik II écrase les troupes italiennes. C'est la première grande victoire d'un État africain contre une puissance coloniale européenne.\n\nElle fait de l'Éthiopie un symbole d'indépendance pour tout le continent et, plus tard, pour les mouvements panafricains."},
    {"type":"quiz","question":"Lors de quelle bataille de 1896 l'Éthiopie a-t-elle vaincu l'Italie ?","options":["Adoua","Isandlwana","Omdourman","Tondibi"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Bataille_d%27Adoua","label":"Article Wikipédia : Bataille d'Adoua"},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Samori_Tour%C3%A9","label":"Article Wikipédia : Samori Touré"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Yaw Boateng","role":"author"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-23 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();

-- ── 10. Figures de femmes africaines (débutant) ─────────────
INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, published_at)
VALUES (
  'demo-figures-femmes-africaines', 'fr',
  'Reines, artistes et militantes : figures de femmes africaines',
  $sum$Des reines guerrières aux prix Nobel : un panorama des femmes qui ont marqué l'histoire africaine, d'Amina de Zazzau à Wangari Maathai.$sum$,
  'https://commons.wikimedia.org/wiki/Special:FilePath/Wangari_Maathai_in_2001.jpg?width=1200',
  18, 'beginner',
  $json$[
    {"type":"text","body":"L'histoire africaine est jalonnée de figures féminines puissantes : reines guerrières, souveraines bâtisseuses, artistes et militantes.\n\nLongtemps reléguées au second plan des récits, elles retrouvent aujourd'hui la place qui leur revient."},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Wangari_Maathai_in_2001.jpg?width=1200","alt":"Wangari Maathai, prix Nobel de la paix 2004","credit":"Wikimedia Commons"},
    {"type":"text","body":"Au XVIe siècle, Amina de Zazzau (actuel Nigeria) règne sur une cité haoussa qu'elle agrandit par de nombreuses campagnes militaires. On lui attribue la construction de remparts encore appelés « murs d'Amina ».\n\nQuatre siècles plus tard, la chanteuse Miriam Makeba, « Mama Africa », porte la voix de l'Afrique sur les scènes du monde, tandis que la Kényane Wangari Maathai devient en 2004 la première Africaine lauréate du prix Nobel de la paix."},
    {"type":"audio","url":"https://www.youtube.com/watch?v=kaMK3tHy_Ok","title":"Miriam Makeba — « Pata Pata »","duration_s":180},
    {"type":"image","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Miriam_Makeba_%281969%29.jpg?width=1200","alt":"Miriam Makeba, « Mama Africa », en 1969","credit":"Wikimedia Commons"},
    {"type":"quiz","question":"Qui fut, en 2004, la première femme africaine à recevoir le prix Nobel de la paix ?","options":["Wangari Maathai","Miriam Makeba","Ellen Johnson Sirleaf","Amina de Zazzau"],"answer":0},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Wangari_Maathai","label":"Article Wikipédia : Wangari Maathai"},
    {"type":"resource","url":"https://fr.wikipedia.org/wiki/Amina_de_Zaria","label":"Article Wikipédia : Amina de Zazzau"}
  ]$json$::jsonb,
  $json$[
    {"name":"Dr. Nana Asante","role":"author"}
  ]$json$::jsonb,
  'published', TIMESTAMPTZ '2026-05-22 09:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, summary=EXCLUDED.summary, thumbnail_url=EXCLUDED.thumbnail_url,
  duration_minutes=EXCLUDED.duration_minutes, level=EXCLUDED.level, content=EXCLUDED.content,
  contributors=EXCLUDED.contributors, status=EXCLUDED.status, published_at=EXCLUDED.published_at, updated_at=now();


-- ============================================================
--  Liens THÈMES (module_themes) — par slug, idempotents
-- ============================================================
INSERT INTO module_themes (module_id, theme_id)
SELECT m.id, t.id
FROM (VALUES
  ('demo-mansa-moussa-empire-mali',        ARRAY['histoire','personnages','geographie','spiritualite']),
  ('demo-egypte-ancienne-pharaons',        ARRAY['histoire','culture','science','spiritualite']),
  ('demo-empires-afrique-ouest',           ARRAY['histoire','geographie','politique']),
  ('demo-mandela-apartheid',               ARRAY['personnages','politique','histoire']),
  ('demo-panafricanisme-nkrumah-oua',      ARRAY['politique','personnages','histoire']),
  ('demo-independances-africaines',        ARRAY['histoire','politique']),
  ('demo-traite-negriere-atlantique',      ARRAY['histoire','geographie']),
  ('demo-negritude-renaissance-culturelle',ARRAY['culture','personnages']),
  ('demo-resistances-colonisation',        ARRAY['histoire','politique','personnages']),
  ('demo-figures-femmes-africaines',       ARRAY['personnages','culture'])
) AS z(slug, themes)
JOIN modules m ON m.slug = z.slug
JOIN themes  t ON t.slug = ANY(z.themes)
ON CONFLICT DO NOTHING;


-- ============================================================
--  Liens ÉVÉNEMENTS (event_modules) — par slug, idempotents
--  Un slug absent du JOIN ne produit aucune ligne (sans effet).
-- ============================================================
INSERT INTO event_modules (event_id, module_id)
SELECT e.id, m.id
FROM (VALUES
  ('demo-mansa-moussa-empire-mali',        ARRAY['seed-mansa-musa-pelerinage-1324','seed-fondation-empire-mali-1235','seed-soundiata-keita-roi-mali','seed-universite-tombouctou-1327','seed-sundiata-epopee-manding']),
  ('demo-egypte-ancienne-pharaons',        ARRAY['seed-menes-unification-egypte','seed-hatshepsout-pharaonne-egypte','seed-akhenaton-aton-monotheisme-egypte','seed-toutankhamon-decouverte-tombe-1922','seed-cleopatre-vii-egypte-51-av-jc','seed-ramses-ii-kadesh-1274']),
  ('demo-empires-afrique-ouest',           ARRAY['seed-empire-ghana-medieval-8e','seed-empire-songhai-fondation-gao','seed-askia-mohammad-songhai-pelerinage','seed-chute-empire-songhai-1591','seed-empire-oyo-17e-siecle']),
  ('demo-mandela-apartheid',               ARRAY['seed-apartheid-instauration-1948','seed-nelson-mandela-emprisonnement-1964','seed-nelson-mandela-liberation-1990','seed-apartheid-abolition-1994','seed-steve-biko-mort-1977']),
  ('demo-panafricanisme-nkrumah-oua',      ARRAY['seed-nkrumah-panafricanisme-1958','seed-oua-fondation-1963','seed-kwame-nkrumah-naissance-1909','seed-thomas-sankara-president-burkina-1983']),
  ('demo-independances-africaines',        ARRAY['independance-du-ghana','seed-annee-afrique-1960','seed-independance-guinee-1958','seed-independance-algerie-1962','seed-indep-congo-belge-1960']),
  ('demo-traite-negriere-atlantique',      ARRAY['seed-traite-negriere-debut-16e','seed-route-des-esclaves-ouidah-benin','seed-abolition-esclavage-france-1848','seed-toussaint-louverture-1791']),
  ('demo-negritude-renaissance-culturelle',ARRAY['seed-negritude-mouvement-aime-cesaire','seed-leopold-senghor-president-1960','seed-cheikh-anta-diop-civilisation-noire']),
  ('demo-resistances-colonisation',        ARRAY['seed-resistance-samori-toure','seed-bataille-adoua-1896','seed-soulèvement-mau-mau-1952','seed-bataille-isandlwana-1879','seed-usman-dan-fodio-djihad-1804']),
  ('demo-figures-femmes-africaines',       ARRAY['seed-amina-reine-zazzau-16e','seed-makeba-mama-africa','seed-wangari-maathai-nobel-2004','seed-hatshepsout-pharaonne-egypte'])
) AS z(slug, events)
JOIN modules m ON m.slug = z.slug
JOIN events  e ON e.slug = ANY(z.events)
ON CONFLICT DO NOTHING;
