-- ============================================================================
-- 028_seed_heritage_items.sql — 30 patrimoines culturels de démonstration
-- Idempotent : upsert heritage_items (ON CONFLICT slug DO UPDATE) ; resources
-- remplacées (DELETE scoped + INSERT) ; liens events/themes ON CONFLICT DO NOTHING.
-- Médias Wikimedia vérifiés HTTP 200 à la génération. Liens par slug (no-op si absent).
-- ============================================================================

-- Masque Dan (Deangle)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('masque-dan', 'fr', 'Masque Dan (Deangle)', 'mask', 'Masque sculpté du peuple Dan de Côte d''Ivoire et du Liberia, au visage lisse et aux traits idéalisés. Utilisé lors des cérémonies d''initiation et de justice coutumière.', 'Art précolonial', 'CI', 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Dan_mask-romanceor.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Masque Ngil (Fang)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('masque-ngil-fang', 'fr', 'Masque Ngil (Fang)', 'mask', 'Masque blanc allongé de la société secrète Ngil chez les Fang du Gabon et du Cameroun, chargé de fonctions de justice et de maintien de l''ordre social.', 'XIXe siècle', 'GA', 'https://upload.wikimedia.org/wikipedia/commons/2/27/0871_6286c_Helmet_mask%2C_Fang%2C_Gabon_%285615278388%29.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Masque Kifwebe (Songye/Luba)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('masque-kifwebe-songye', 'fr', 'Masque Kifwebe (Songye/Luba)', 'mask', 'Masque strié caractéristique des peuples Songye et Luba de la RD Congo, porté lors de rites de pouvoir et de funérailles, incarnant des forces surnaturelles.', 'Art précolonial', 'CD', 'https://upload.wikimedia.org/wikipedia/commons/1/15/Antropomorf_gelaatsmasker_%28kifwebe%29_van_de_Luba-Songye%2C_anoniem%2C_ca_1920%2C_MAS.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Masque Gèlèdè (Yoruba)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('masque-gelede-yoruba', 'fr', 'Masque Gèlèdè (Yoruba)', 'mask', 'Spectacle masqué Gèlèdè des Yoruba du Bénin, du Nigeria et du Togo, célébrant le pouvoir des femmes et des ancêtres. Inscrit au patrimoine immatériel de l''UNESCO.', 'Patrimoine UNESCO', 'BJ', 'https://upload.wikimedia.org/wikipedia/commons/2/2c/British_Museum_Room_25_Gelede_mask_Yoruba_people_17022019_5003.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Masque Punu (Mukudj)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('masque-punu-okuyi', 'fr', 'Masque Punu (Mukudj)', 'mask', 'Masque blanc féminin des Punu du Gabon, au visage serein recouvert de kaolin, dansé sur échasses lors du rite Okuyi en hommage aux ancêtres.', 'Art précolonial', 'GA', 'https://upload.wikimedia.org/wikipedia/commons/1/19/Punu_mask_Gabon.JPG', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Sankofa (symbole Adinkra)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('symbole-sankofa-adinkra', 'fr', 'Sankofa (symbole Adinkra)', 'symbol', 'Symbole adinkra akan figurant un oiseau tournant la tête vers l''arrière : « reviens chercher ce que tu as oublié ». Emblème de la mémoire et de l''apprentissage du passé.', 'Culture Akan', 'GH', 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Sankofa_%28Adinkra%29.png', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Ânkh — croix de vie égyptienne
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('symbole-ankh-egypte', 'fr', 'Ânkh — croix de vie égyptienne', 'symbol', 'Hiéroglyphe en forme de croix surmontée d''une boucle, symbole de la vie éternelle dans l''Égypte ancienne, tenu par les dieux et les pharaons.', 'Égypte antique', 'EG', 'https://upload.wikimedia.org/wikipedia/commons/6/61/Ankh%2C_Djed_%26_Was.png', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Croix de Lalibela (Éthiopie)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('croix-lalibela-ethiopie', 'fr', 'Croix de Lalibela (Éthiopie)', 'symbol', 'Croix copte éthiopienne ornée d''entrelacs, emblème du christianisme orthodoxe d''Éthiopie, associée aux églises monolithes de Lalibela taillées dans la roche.', 'XIIe–XIIIe siècle', 'ET', 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Bete_Giyorgis_03.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Gye Nyame (Adinkra)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('symbole-gye-nyame', 'fr', 'Gye Nyame (Adinkra)', 'symbol', 'Symbole adinkra le plus répandu, signifiant « sauf Dieu » : expression de la suprématie et de l''omniprésence divine dans la pensée akan.', 'Culture Akan', 'GH', 'https://upload.wikimedia.org/wikipedia/commons/1/12/Gye_nyame_%28Adinkra%29.png', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- « Il faut tout un village pour élever un enfant »
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('proverbe-village-enfant', 'fr', '« Il faut tout un village pour élever un enfant »', 'proverb', 'Proverbe panafricain rappelant que l''éducation d''un enfant est l''affaire de toute la communauté, et non des seuls parents. Pilier des solidarités traditionnelles.', 'Sagesse africaine', NULL, 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Children_in_a_village_playing_rope_jumping.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Proverbe akan : « La sagesse est comme un baobab »
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('proverbe-akan-sagesse', 'fr', 'Proverbe akan : « La sagesse est comme un baobab »', 'proverb', '« La sagesse est comme un baobab : nul ne peut l''embrasser de ses seuls bras. » Proverbe akan sur le caractère collectif et inépuisable du savoir.', 'Culture Akan', 'GH', 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Baobab_%28Adansonia_digitata%29%2C_parque_nacional_Makgadikgadi_Pans%2C_Botsuana%2C_2018-07-30%2C_DD_03-08_PAN.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Proverbe mandingue : la parole du griot
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('proverbe-mandingue-parole', 'fr', 'Proverbe mandingue : la parole du griot', 'proverb', '« La parole appartient à trois personnes : celui qui la dit, celui qui l''écoute et celui qui la rapporte. » Sagesse mandingue sur la responsabilité du verbe.', 'Empire du Mali', 'ML', 'https://upload.wikimedia.org/wikipedia/commons/5/5b/GriotsSambala.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Jollof rice
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('recette-jollof-rice', 'fr', 'Jollof rice', 'recipe', 'Plat de riz cuit dans une sauce tomate épicée, emblème festif partagé du Nigeria au Sénégal. Sa paternité nourrit une rivalité culinaire bon enfant entre nations.', 'Cuisine ouest-africaine', 'NG', 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Jollof_rice_with_vegetable.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Couscous (Maghreb)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('recette-couscous-maghreb', 'fr', 'Couscous (Maghreb)', 'recipe', 'Semoule de blé roulée à la main, cuite à la vapeur et servie avec légumes et viandes. Savoir-faire et pratiques du couscous inscrits à l''UNESCO en 2020.', 'Patrimoine UNESCO', 'MA', 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Couscous_osbanes_de_sardines.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Injera (Éthiopie / Érythrée)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('recette-injera-ethiopie', 'fr', 'Injera (Éthiopie / Érythrée)', 'recipe', 'Galette spongieuse au levain à base de teff, base du repas éthiopien et érythréen, servie comme assiette et couvert commun pour partager les sauces (wot).', 'Cuisine est-africaine', 'ET', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Injera_from_ivory_teff.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Thiéboudienne (Sénégal)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('recette-thieboudienne-senegal', 'fr', 'Thiéboudienne (Sénégal)', 'recipe', 'Plat national sénégalais de riz au poisson et légumes mijotés dans une sauce tomate. Le « ceebu jën » est inscrit au patrimoine immatériel de l''UNESCO.', 'Patrimoine UNESCO', 'SN', 'https://upload.wikimedia.org/wikipedia/commons/5/51/Thieboudienne.JPG', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Pagne Kente (Ashanti)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('artisanat-kente-ashanti', 'fr', 'Pagne Kente (Ashanti)', 'craft', 'Étoffe tissée en bandes aux motifs géométriques éclatants, portée par la royauté ashanti et ewe du Ghana. Chaque motif et couleur porte un nom et un sens.', 'Royaume Ashanti', 'GH', 'https://upload.wikimedia.org/wikipedia/commons/0/06/Different_Kente_cloth%2C_Tafi%2C_Volta_region.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Bogolan (bògòlanfini)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('artisanat-bogolan-mali', 'fr', 'Bogolan (bògòlanfini)', 'craft', 'Textile malien teint à la boue fermentée selon une technique bambara, aux motifs symboliques blancs sur fond sombre. Devenu emblème de l''identité culturelle ouest-africaine.', 'Culture bambara', 'ML', 'https://upload.wikimedia.org/wikipedia/commons/a/aa/BogolanMali4.JPG', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Bronzes du Bénin
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('artisanat-bronzes-benin', 'fr', 'Bronzes du Bénin', 'craft', 'Plaques et têtes en alliage de cuivre du royaume du Bénin (actuel Nigeria), chefs-d''œuvre de fonte à la cire perdue. Pillés en 1897, ils font l''objet de restitutions.', 'XIIIe–XIXe siècle', 'NG', 'https://upload.wikimedia.org/wikipedia/commons/4/42/Benin_Bronzes%2C_Horniman_Museum.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Terres cuites de Nok
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('artisanat-terre-cuite-nok', 'fr', 'Terres cuites de Nok', 'craft', 'Statuettes en terre cuite de la civilisation Nok du Nigeria, parmi les plus anciennes sculptures figuratives d''Afrique subsaharienne, aux têtes stylisées caractéristiques.', '-500 à 200 ap. J.-C.', 'NG', 'https://upload.wikimedia.org/wikipedia/commons/1/15/Erected_Nok_Terracotta.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Vannerie Agaseke (Rwanda)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('artisanat-vannerie-agaseke', 'fr', 'Vannerie Agaseke (Rwanda)', 'craft', 'Paniers tressés rwandais au couvercle conique, dits « paniers de la paix », ornés de motifs en spirale. Offerts en signe de confiance et d''union.', 'Artisanat traditionnel', 'RW', 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Igiseke.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Kora — harpe-luth mandingue
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('musique-kora', 'fr', 'Kora — harpe-luth mandingue', 'music', 'Harpe-luth à 21 cordes des griots mandingues d''Afrique de l''Ouest, à la caisse faite d''une demi-calebasse. Instrument de la mémoire généalogique et des épopées.', 'Tradition griotique', 'SN', 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Jali_Fily_Cissokho_-_Kora-Player.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Djembé
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('musique-djembe', 'fr', 'Djembé', 'music', 'Tambour en gobelet recouvert d''une peau de chèvre, joué à mains nues, originaire de l''aire mandingue (Guinée, Mali). Cœur des ensembles percussifs ouest-africains.', 'Empire mandingue', 'GN', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Djemb%C3%A9%27s.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Mbira (sanza shona)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('musique-mbira', 'fr', 'Mbira (sanza shona)', 'music', 'Lamellophone shona du Zimbabwe aux lames métalliques pincées, central dans les cérémonies bira d''invocation des ancêtres. Aussi appelé « piano à pouces ».', 'Culture shona', 'ZW', 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Holding_an_mbira_dzavadzimu.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Tambour parlant (dùndún)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('musique-tambour-parlant', 'fr', 'Tambour parlant (dùndún)', 'music', 'Tambour à tension variable en sablier dont la hauteur imite les tons des langues yoruba : il « parle » et transmet proverbes et messages à distance.', 'Culture yoruba', 'NG', 'https://upload.wikimedia.org/wikipedia/commons/2/26/TalkingDrum.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Balafon — Sosso-Bala
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('musique-balafon-sosso-bala', 'fr', 'Balafon — Sosso-Bala', 'music', 'Xylophone à calebasses de l''aire mandingue. Le Sosso-Bala, balafon sacré du Mali historique, est lié à Soundiata Keïta et inscrit au patrimoine de l''UNESCO.', 'XIIIe siècle', 'GN', 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Balafon_%28Aly_Keita%29_Unterfahrt_2010-03-11-001.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Les griots (djeli)
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('tradition-griot-djeli', 'fr', 'Les griots (djeli)', 'other', 'Maîtres de la parole, généalogistes et musiciens héréditaires de l''Afrique de l''Ouest. Gardiens de l''histoire orale, ils transmettent les épopées des empires sahéliens.', 'Empires du Sahel', 'ML', 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Balafon_griot_%281%29.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- L'épopée de Soundiata
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('epopee-soundiata', 'fr', 'L''épopée de Soundiata', 'other', 'Récit fondateur de l''Empire du Mali narrant l''ascension de Soundiata Keïta. Transmis oralement par les griots depuis huit siècles, monument de la littérature orale africaine.', 'XIIIe siècle', 'ML', 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Founderofthemali.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Manuscrits de Tombouctou
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('manuscrits-tombouctou', 'fr', 'Manuscrits de Tombouctou', 'other', 'Dizaines de milliers de manuscrits savants (astronomie, droit, médecine) issus de Tombouctou, preuve de l''éclat intellectuel de l''Afrique médiévale et de son université.', 'XIIIe–XVIe siècle', 'ML', 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Timbuktu-manuscripts-astronomy-mathematics.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- Art rupestre du Tassili n'Ajjer
INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, published_at) VALUES
  ('art-rupestre-tassili', 'fr', 'Art rupestre du Tassili n''Ajjer', 'other', 'Milliers de peintures et gravures rupestres du Sahara algérien, témoignant d''un Sahara verdoyant peuplé d''éleveurs il y a des millénaires. Patrimoine mondial de l''UNESCO.', 'Néolithique', 'DZ', 'https://upload.wikimedia.org/wikipedia/commons/7/75/The_Tanzoumaitak_cave_painting_in_Tassili_n%27ajjer.jpg', 'published', now())
ON CONFLICT (slug) DO UPDATE SET
  lang=EXCLUDED.lang, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary,
  period=EXCLUDED.period, country_code=EXCLUDED.country_code, cover_url=EXCLUDED.cover_url,
  status=EXCLUDED.status, published_at=COALESCE(heritage_items.published_at, EXCLUDED.published_at), updated_at=now();

-- ── Ressources (remplacement idempotent, limité aux items du seed) ──
DELETE FROM heritage_resources WHERE heritage_item_id IN (SELECT id FROM heritage_items WHERE slug IN ('masque-dan', 'masque-ngil-fang', 'masque-kifwebe-songye', 'masque-gelede-yoruba', 'masque-punu-okuyi', 'symbole-sankofa-adinkra', 'symbole-ankh-egypte', 'croix-lalibela-ethiopie', 'symbole-gye-nyame', 'proverbe-village-enfant', 'proverbe-akan-sagesse', 'proverbe-mandingue-parole', 'recette-jollof-rice', 'recette-couscous-maghreb', 'recette-injera-ethiopie', 'recette-thieboudienne-senegal', 'artisanat-kente-ashanti', 'artisanat-bogolan-mali', 'artisanat-bronzes-benin', 'artisanat-terre-cuite-nok', 'artisanat-vannerie-agaseke', 'musique-kora', 'musique-djembe', 'musique-mbira', 'musique-tambour-parlant', 'musique-balafon-sosso-bala', 'tradition-griot-djeli', 'epopee-soundiata', 'manuscrits-tombouctou', 'art-rupestre-tassili'));

INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Dan_(peuple)', 'Le peuple Dan — Wikipédia', 'Wikipédia', 0 FROM heritage_items WHERE slug='masque-dan';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Fang_mask_Louvre_MH65-104-1.jpg', 'Art statuaire fang', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='masque-ngil-fang';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Luba_(peuple)', 'Les Luba — Wikipédia', 'Wikipédia', 0 FROM heritage_items WHERE slug='masque-kifwebe-songye';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://ich.unesco.org/fr/RL/le-patrimoine-oral-gelede-00002', 'Gèlèdè — UNESCO', 'UNESCO', 0 FROM heritage_items WHERE slug='masque-gelede-yoruba';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/1/14/Gyaman_Adinkra_Symbols.jpg', 'Symboles adinkra', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='symbole-sankofa-adinkra';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Adinkra', 'Les symboles Adinkra — Wikipédia', 'Wikipédia', 1 FROM heritage_items WHERE slug='symbole-sankofa-adinkra';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Lalibela', 'Lalibela — Wikipédia', 'Wikipédia', 0 FROM heritage_items WHERE slug='croix-lalibela-ethiopie';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://ich.unesco.org/fr/RL/les-savoir-faire-savoirs-pratiques-et-traditions-lies-a-la-production-et-a-la-consommation-du-couscous-01602', 'Le couscous — UNESCO', 'UNESCO', 0 FROM heritage_items WHERE slug='recette-couscous-maghreb';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://ich.unesco.org/fr/RL/le-ceebu-jen-un-plat-culinaire-du-senegal-01884', 'Ceebu jën — UNESCO', 'UNESCO', 0 FROM heritage_items WHERE slug='recette-thieboudienne-senegal';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/0/06/Different_Kente_cloth%2C_Tafi%2C_Volta_region.jpg', 'Détail d''un tissage kente', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='artisanat-kente-ashanti';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/7/76/Benin_Bronze_Head.jpg', 'Tête en bronze du Bénin', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='artisanat-bronzes-benin';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Bronzes_du_Bénin', 'Bronzes du Bénin — Wikipédia', 'Wikipédia', 1 FROM heritage_items WHERE slug='artisanat-bronzes-benin';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://en.wikipedia.org/wiki/Kora_(instrument)', 'The kora — Wikipedia', 'Wikipedia', 0 FROM heritage_items WHERE slug='musique-kora';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'audio', 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Village_Drums_of_Freedom_%E2%80%93_Black_Africa%28djembe_mix%29.ogg', 'Écouter le djembé', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='musique-djembe';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'audio', 'https://upload.wikimedia.org/wikipedia/commons/6/68/Souake_-_solo_de_sanza%2C_C%C3%B4te_d%27Ivoire_Face_A.ogg', 'Écouter la sanza (mbira)', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='musique-mbira';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Tambour_parlant', 'Le tambour parlant — Wikipédia', 'Wikipédia', 0 FROM heritage_items WHERE slug='musique-tambour-parlant';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'audio', 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Le_son_du_balafon_de_Neba_Solo.ogg', 'Écouter le balafon (Neba Solo)', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='musique-balafon-sosso-bala';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://ich.unesco.org/fr/RL/lespace-culturel-du-sosso-bala-00009', 'Le Sosso-Bala — UNESCO', 'UNESCO', 1 FROM heritage_items WHERE slug='musique-balafon-sosso-bala';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'audio', 'https://upload.wikimedia.org/wikipedia/commons/0/0f/PDP-CH_-_Kofi_Kofi_with_Baoul%C3%A9_people_-_Ns%C3%A8li_ouanga_dj%C3%A9_-_Chant_de_griot_par_Kofi_Kofi_-_s%27accompagnant_au_kot%C3%A9_-_Africavox-gt10-ax68.flac', 'Chant de griot (Kofi Kofi)', 'Wikimedia Commons / Africavox', 0 FROM heritage_items WHERE slug='tradition-griot-djeli';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Soundiata_Keïta', 'Soundiata Keïta — Wikipédia', 'Wikipédia', 0 FROM heritage_items WHERE slug='epopee-soundiata';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/3/39/Timbuktu-manuscripts-astronomy-tables.jpg', 'Page d''un manuscrit de Tombouctou', 'Wikimedia Commons', 0 FROM heritage_items WHERE slug='manuscrits-tombouctou';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Manuscrits_de_Tombouctou', 'Manuscrits de Tombouctou — Wikipédia', 'Wikipédia', 1 FROM heritage_items WHERE slug='manuscrits-tombouctou';
INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position) SELECT id, 'link', 'https://fr.wikipedia.org/wiki/Tassili_n''Ajjer', 'Tassili n''Ajjer — Wikipédia', 'Wikipédia', 0 FROM heritage_items WHERE slug='art-rupestre-tassili';

-- ── Liens événements (event_heritage_items) ──
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-indep-cote-ivoire-1960' AND h.slug='masque-dan' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-griot-tradition-orale-afrique' AND h.slug='masque-dan' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-indep-cameroun-1960' AND h.slug='masque-ngil-fang' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='independance-du-congo-leopoldville' AND h.slug='masque-kifwebe-songye' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-fondation-royaume-kongo-1390' AND h.slug='masque-kifwebe-songye' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-oyo-17e-siecle' AND h.slug='masque-gelede-yoruba' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-nigeria-1960' AND h.slug='masque-gelede-yoruba' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-indep-cameroun-1960' AND h.slug='masque-punu-okuyi' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='independance-du-ghana' AND h.slug='symbole-sankofa-adinkra' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-ashanti-fondation-1701' AND h.slug='symbole-sankofa-adinkra' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-toutankhamon-decouverte-tombe-1922' AND h.slug='symbole-ankh-egypte' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-hatshepsout-pharaonne-egypte' AND h.slug='symbole-ankh-egypte' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-axoum-apogee-4e-siecle' AND h.slug='croix-lalibela-ethiopie' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-ashanti-fondation-1701' AND h.slug='symbole-gye-nyame' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-griot-tradition-orale-afrique' AND h.slug='proverbe-village-enfant' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='independance-du-ghana' AND h.slug='proverbe-akan-sagesse' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-sundiata-epopee-manding' AND h.slug='proverbe-mandingue-parole' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-fondation-empire-mali-1235' AND h.slug='proverbe-mandingue-parole' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-nigeria-1960' AND h.slug='recette-jollof-rice' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='independance-du-ghana' AND h.slug='recette-jollof-rice' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-maroc-1956' AND h.slug='recette-couscous-maghreb' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-tunisie-1956' AND h.slug='recette-couscous-maghreb' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-algerie-1962' AND h.slug='recette-couscous-maghreb' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-bataille-adoua-1896' AND h.slug='recette-injera-ethiopie' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-senegal-1960' AND h.slug='recette-thieboudienne-senegal' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-leopold-senghor-president-1960' AND h.slug='recette-thieboudienne-senegal' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-ashanti-fondation-1701' AND h.slug='artisanat-kente-ashanti' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='independance-du-ghana' AND h.slug='artisanat-kente-ashanti' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-nkrumah-panafricanisme-1958' AND h.slug='artisanat-kente-ashanti' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-indep-mali-1960' AND h.slug='artisanat-bogolan-mali' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-fondation-empire-mali-1235' AND h.slug='artisanat-bogolan-mali' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-oyo-17e-siecle' AND h.slug='artisanat-bronzes-benin' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-traite-berlin-1885' AND h.slug='artisanat-bronzes-benin' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-civilisation-nok-art-africain' AND h.slug='artisanat-terre-cuite-nok' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-genocide-rwanda-1994' AND h.slug='artisanat-vannerie-agaseke' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-griot-tradition-orale-afrique' AND h.slug='musique-kora' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-sundiata-epopee-manding' AND h.slug='musique-kora' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-senegal-1960' AND h.slug='musique-kora' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-independance-guinee-1958' AND h.slug='musique-djembe' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-ahmed-sekou-toure-guinea-non' AND h.slug='musique-djembe' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-grandes-zimbabwe-construction' AND h.slug='musique-mbira' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-zimbabwe-independance-1980' AND h.slug='musique-mbira' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-empire-oyo-17e-siecle' AND h.slug='musique-tambour-parlant' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-sundiata-epopee-manding' AND h.slug='musique-balafon-sosso-bala' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-soundiata-keita-roi-mali' AND h.slug='musique-balafon-sosso-bala' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-griot-tradition-orale-afrique' AND h.slug='tradition-griot-djeli' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-fondation-empire-mali-1235' AND h.slug='tradition-griot-djeli' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-sundiata-epopee-manding' AND h.slug='epopee-soundiata' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-soundiata-keita-roi-mali' AND h.slug='epopee-soundiata' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-fondation-empire-mali-1235' AND h.slug='epopee-soundiata' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-universite-tombouctou-1327' AND h.slug='manuscrits-tombouctou' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-mansa-musa-pelerinage-1324' AND h.slug='manuscrits-tombouctou' ON CONFLICT DO NOTHING;
INSERT INTO event_heritage_items (event_id, heritage_item_id) SELECT e.id, h.id FROM events e, heritage_items h WHERE e.slug='seed-traite-transsaharienne-antiquite' AND h.slug='art-rupestre-tassili' ON CONFLICT DO NOTHING;

-- ── Liens thèmes (heritage_themes) ──
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-dan' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-ngil-fang' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-ngil-fang' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-kifwebe-songye' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-gelede-yoruba' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-gelede-yoruba' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='masque-punu-okuyi' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='symbole-sankofa-adinkra' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='symbole-sankofa-adinkra' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='symbole-ankh-egypte' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='symbole-ankh-egypte' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='croix-lalibela-ethiopie' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='croix-lalibela-ethiopie' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='symbole-gye-nyame' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='proverbe-village-enfant' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='proverbe-akan-sagesse' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='proverbe-mandingue-parole' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='recette-jollof-rice' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='recette-couscous-maghreb' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='recette-injera-ethiopie' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='recette-thieboudienne-senegal' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-kente-ashanti' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-bogolan-mali' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-bronzes-benin' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-bronzes-benin' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-terre-cuite-nok' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-terre-cuite-nok' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='artisanat-vannerie-agaseke' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='musique-kora' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='musique-djembe' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='musique-mbira' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='musique-mbira' AND t.slug='spiritualite' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='musique-tambour-parlant' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='musique-balafon-sosso-bala' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='tradition-griot-djeli' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='tradition-griot-djeli' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='epopee-soundiata' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='epopee-soundiata' AND t.slug='culture' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='manuscrits-tombouctou' AND t.slug='science' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='manuscrits-tombouctou' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='art-rupestre-tassili' AND t.slug='histoire' ON CONFLICT DO NOTHING;
INSERT INTO heritage_themes (heritage_item_id, theme_id) SELECT h.id, t.id FROM heritage_items h, themes t WHERE h.slug='art-rupestre-tassili' AND t.slug='culture' ON CONFLICT DO NOTHING;
