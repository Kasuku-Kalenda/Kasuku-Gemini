-- ============================================================
--  Migration 027 — Re-seed des 10 modules démo au modèle LMS
-- ------------------------------------------------------------
--  S'exécute APRÈS 025 (qui crée les lignes + liens événements/thèmes)
--  et APRÈS 026 (qui ajoute les colonnes sections/objectives/...).
--  On remplace le contenu « blocs plats » (content) par le modèle
--  sections → leçons partagé web + natif. `content` est vidé.
--
--  Idempotent : UPDATE … WHERE slug (les lignes existent déjà via 025 ;
--  rejouable à chaque déploiement). Médias = URLs vérifiées (Wikimedia,
--  TED-Ed, Wikipédia, UNESCO). Pas de leçon 'audio' (le <audio> web exige
--  un fichier direct) → la musique est en leçon 'video' (YouTube), les
--  images en ressources 'image'.
-- ============================================================

-- ── 1. Mansa Moussa et l'empire du Mali ─────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — L''empire du Mali',
  content = '[]'::jsonb,
  objectives = $obj$["Situer l'empire du Mali et son apogée au XIVe siècle","Comprendre le rôle des routes transsahariennes (or et sel)","Découvrir le pèlerinage de Mansa Moussa et le rayonnement de Tombouctou"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Naissance d'un empire","order":0,"lessons":[
      {"id":"s1l1","title":"Soundiata et la fondation du Mali","type":"text","order":0,"durationMin":6,"content":"Au XIIIe siècle, l'empire du Mali s'impose comme la plus grande puissance d'Afrique de l'Ouest. Fondé vers 1235 par Soundiata Keïta après sa victoire de Kirina, il s'étend des rives de l'Atlantique aux boucles du fleuve Niger.\n\nSa prospérité repose sur le contrôle des routes transsahariennes, par lesquelles transitent l'or des mines du Bambouk et le sel des mines de Taghaza."},
      {"id":"s1l2","title":"Mansa Moussa, l'un des plus riches de l'histoire","type":"video","order":1,"durationMin":5,"url":"https://www.youtube.com/watch?v=O3YJMaL55TM"}
    ]},
    {"id":"s2","title":"Tombouctou, cité du savoir","order":1,"lessons":[
      {"id":"s2l1","title":"Le pèlerinage de 1324","type":"text","order":0,"durationMin":5,"content":"En 1324, le mansa (« roi des rois ») Moussa entreprend un pèlerinage à La Mecque resté légendaire. Sa caravane compte des milliers de personnes et des chameaux chargés d'or.\n\nÀ son retour, il fait de Tombouctou un foyer intellectuel majeur : la mosquée Djingareyber et l'université de Sankoré rayonnent sur tout le monde musulman."},
      {"id":"s2l2","title":"La kora et la tradition orale des griots","type":"video","order":1,"durationMin":6,"url":"https://www.youtube.com/watch?v=bOBe-wE5CWM"},
      {"id":"s2l3","title":"Quiz — Le pèlerinage","type":"quiz","order":2,"quiz":{"passingScore":60,"questions":[
        {"question":"Quelle destination Mansa Moussa rejoint-il lors de son pèlerinage de 1324 ?","type":"multiple_choice","options":["La Mecque","Le Caire","Jérusalem","Tombouctou"],"correctIndex":0,"explanation":"Il rejoint La Mecque ; son passage au Caire marque durablement les mémoires."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Vers quelle année l'empire du Mali est-il fondé par Soundiata Keïta ?","type":"multiple_choice","options":["935","1235","1492","1600"],"correctIndex":1,"explanation":"La fondation est datée d'environ 1235, après la bataille de Kirina."},
    {"question":"L'or et le sel étaient les deux ressources clés du commerce transsaharien.","type":"true_false","correctBool":true,"explanation":"L'or du Sud s'échangeait presque à parité avec le sel du Sahara."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Mansa Moussa","url":"https://fr.wikipedia.org/wiki/Mansa_Moussa"},
    {"type":"link","title":"UNESCO — Tombouctou, patrimoine mondial","url":"https://whc.unesco.org/fr/list/119"},
    {"type":"image","title":"Mansa Moussa, Atlas catalan (1375)","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Mansa_Musa.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-mansa-moussa-empire-mali';

-- ── 2. L'Égypte ancienne ────────────────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — L''Égypte ancienne',
  content = '[]'::jsonb,
  objectives = $obj$["Situer les grandes périodes de l'Égypte antique","Identifier des pharaons majeurs et leurs apports","Comprendre l'héritage culturel (écriture, architecture)"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Trois mille ans au bord du Nil","order":0,"lessons":[
      {"id":"s1l1","title":"De Ménès à Cléopâtre","type":"text","order":0,"durationMin":6,"content":"Pendant près de trois mille ans, la civilisation de l'Égypte antique a prospéré le long du Nil. De l'unification du pays par Ménès vers 3100 av. J.-C. jusqu'à la mort de Cléopâtre en 30 av. J.-C., trente dynasties se succèdent.\n\nÉcriture hiéroglyphique, médecine, architecture monumentale : l'héritage égyptien fascine toujours."},
      {"id":"s1l2","title":"Comment les pyramides ont-elles été construites ?","type":"video","order":1,"durationMin":5,"url":"https://www.youtube.com/watch?v=H7JjNzQ_g0s"}
    ]},
    {"id":"s2","title":"Pharaons et hiéroglyphes","order":1,"lessons":[
      {"id":"s2l1","title":"Figures marquantes","type":"text","order":0,"durationMin":5,"content":"Hatchepsout, l'une des rares femmes pharaons ; Akhenaton et le culte d'Aton ; Ramsès II, bâtisseur d'Abou Simbel ; Toutânkhamon, dont la tombe intacte fut découverte en 1922 ; Cléopâtre VII, dernière souveraine de l'Égypte indépendante."},
      {"id":"s2l2","title":"Lire les hiéroglyphes","type":"video","order":1,"durationMin":7,"url":"https://www.youtube.com/watch?v=ezJvDKFW3eA"},
      {"id":"s2l3","title":"Quiz — Toutânkhamon","type":"quiz","order":2,"quiz":{"passingScore":60,"questions":[
        {"question":"En quelle année la tombe intacte de Toutânkhamon a-t-elle été découverte ?","type":"multiple_choice","options":["1899","1922","1936","1954"],"correctIndex":1,"explanation":"Howard Carter découvre la tombe en 1922."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Qui aurait unifié la Haute et la Basse-Égypte vers 3100 av. J.-C. ?","type":"multiple_choice","options":["Ménès","Ramsès II","Akhenaton","Cléopâtre"],"correctIndex":0,"explanation":"La tradition attribue l'unification à Ménès (Narmer)."},
    {"question":"Akhenaton a promu le culte d'un dieu unique, Aton.","type":"true_false","correctBool":true,"explanation":"Akhenaton impose un monothéisme solaire autour d'Aton."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : L'Égypte antique","url":"https://fr.wikipedia.org/wiki/%C3%89gypte_antique"},
    {"type":"image","title":"Les pyramides de Gizeh","url":"https://commons.wikimedia.org/wiki/Special:FilePath/All_Gizah_Pyramids.jpg?width=1200"},
    {"type":"image","title":"Le masque de Toutânkhamon","url":"https://commons.wikimedia.org/wiki/Special:FilePath/CairoEgMuseumTaaMaskMostlyPhotographed.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-egypte-ancienne-pharaons';

-- ── 3. Les empires d'Afrique de l'Ouest ─────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — Les empires d''Afrique de l''Ouest',
  content = '[]'::jsonb,
  objectives = $obj$["Distinguer les empires du Ghana, du Mali et du Songhaï","Comprendre l'économie de l'or et du sel","Situer les grandes cités : Gao, Tombouctou, Djenné"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Trois empires successifs","order":0,"lessons":[
      {"id":"s1l1","title":"Du Ghana au Songhaï","type":"text","order":0,"durationMin":7,"content":"Entre le VIIIe et le XVIe siècle, trois grands empires se succèdent en Afrique de l'Ouest : le Ghana, le Mali puis le Songhaï. Chacun étend sa domination sur les routes du commerce transsaharien.\n\nLeur puissance repose sur le contrôle de l'or, du sel et des grandes cités marchandes comme Gao, Tombouctou et Djenné."},
      {"id":"s1l2","title":"L'or du Sahel (vidéo)","type":"video","order":1,"durationMin":5,"url":"https://www.youtube.com/watch?v=O3YJMaL55TM"}
    ]},
    {"id":"s2","title":"Apogée et chute du Songhaï","order":1,"lessons":[
      {"id":"s2l1","title":"L'askia Mohammed et Tondibi","type":"text","order":0,"durationMin":5,"content":"Sous l'askia Mohammed, le Songhaï atteint son apogée et fait du pèlerinage à La Mecque un acte politique autant que religieux. L'empire s'effondre en 1591, vaincu à Tondibi par une armée saadienne dotée d'armes à feu."},
      {"id":"s2l2","title":"Musique mandingue à la kora","type":"video","order":1,"durationMin":6,"url":"https://www.youtube.com/watch?v=-cLAwAOi-hA"},
      {"id":"s2l3","title":"Quiz — La capitale songhaï","type":"quiz","order":2,"quiz":{"passingScore":60,"questions":[
        {"question":"Quelle ville fut la capitale de l'empire songhaï ?","type":"multiple_choice","options":["Gao","Tombouctou","Djenné","Niani"],"correctIndex":0,"explanation":"Gao était la capitale du Songhaï."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Quel empire s'effondre à la bataille de Tondibi en 1591 ?","type":"multiple_choice","options":["Le Songhaï","Le Ghana","Le Mali","Le Kanem-Bornou"],"correctIndex":0,"explanation":"Le Songhaï est vaincu à Tondibi par les Saadiens."},
    {"question":"Le sel du Sahara s'échangeait à très haute valeur, presque à parité avec l'or.","type":"true_false","correctBool":true,"explanation":"Le sel, vital et rare au Sud, valait presque son poids en or."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Empire songhaï","url":"https://fr.wikipedia.org/wiki/Empire_songha%C3%AF"},
    {"type":"link","title":"Article Wikipédia : Empire du Ghana","url":"https://fr.wikipedia.org/wiki/Empire_du_Ghana"},
    {"type":"image","title":"La Grande Mosquée de Djenné","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Great_Mosque_of_Djenn%C3%A9_1.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-empires-afrique-ouest';

-- ── 4. Mandela et l'apartheid ───────────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — Mandela et l''apartheid',
  content = '[]'::jsonb,
  objectives = $obj$["Définir le système de l'apartheid","Retracer le parcours de Nelson Mandela","Comprendre la transition de 1990 à 1994"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Le système de l'apartheid","order":0,"lessons":[
      {"id":"s1l1","title":"Qu'est-ce que l'apartheid ?","type":"text","order":0,"durationMin":5,"content":"Instauré en 1948 par le Parti national, l'apartheid (« séparation » en afrikaans) organise en Afrique du Sud une ségrégation raciale systématique.\n\nLa population est classée par « race » ; les droits politiques, la liberté de circulation et l'accès à la terre sont refusés à la majorité noire."},
      {"id":"s1l2","title":"Comment l'apartheid a-t-il pris fin ?","type":"video","order":1,"durationMin":5,"url":"https://www.youtube.com/watch?v=ke4kVFycpYY"}
    ]},
    {"id":"s2","title":"De la prison à la présidence","order":1,"lessons":[
      {"id":"s2l1","title":"Vingt-sept ans de détention","type":"text","order":0,"durationMin":5,"content":"Figure de l'ANC, Nelson Mandela est condamné en 1964 à la prison à vie. Il passera vingt-sept ans en détention, dont dix-huit sur l'île de Robben Island.\n\nLibéré en 1990, il négocie la fin pacifique de l'apartheid et devient en 1994 le premier président élu au suffrage universel."},
      {"id":"s2l2","title":"Quiz — La libération","type":"quiz","order":1,"quiz":{"passingScore":60,"questions":[
        {"question":"En quelle année Nelson Mandela a-t-il été libéré ?","type":"multiple_choice","options":["1985","1990","1994","1976"],"correctIndex":1,"explanation":"Libéré en 1990, il devient président en 1994."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"En quelle année l'apartheid a-t-il été instauré comme politique d'État ?","type":"multiple_choice","options":["1931","1948","1961","1976"],"correctIndex":1,"explanation":"Le Parti national institue l'apartheid en 1948."},
    {"question":"Nelson Mandela fut le premier président sud-africain élu au suffrage universel.","type":"true_false","correctBool":true,"explanation":"Il est élu en 1994, lors des premières élections multiraciales."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Apartheid","url":"https://fr.wikipedia.org/wiki/Apartheid"},
    {"type":"image","title":"Nelson Mandela (1994)","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Nelson_Mandela_1994.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-mandela-apartheid';

-- ── 5. Le panafricanisme ────────────────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — Le panafricanisme',
  content = '[]'::jsonb,
  objectives = $obj$["Comprendre les racines du panafricanisme","Situer la fondation de l'OUA (1963)","Identifier les grandes figures du mouvement"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Aux racines de l'idéal","order":0,"lessons":[
      {"id":"s1l1","title":"De la diaspora au continent","type":"text","order":0,"durationMin":6,"content":"Le panafricanisme naît au début du XXe siècle dans la diaspora, avec des penseurs comme W. E. B. Du Bois et Marcus Garvey. Il affirme l'unité et la solidarité des peuples d'ascendance africaine.\n\nLes congrès panafricains, puis les indépendances, transposent cet idéal sur le continent lui-même."}
    ]},
    {"id":"s2","title":"L'Organisation de l'unité africaine","order":1,"lessons":[
      {"id":"s2l1","title":"Addis-Abeba, 1963","type":"text","order":0,"durationMin":5,"content":"Le 25 mai 1963, trente-deux États fondent à Addis-Abeba l'Organisation de l'unité africaine (OUA). Kwame Nkrumah y plaide pour des « États-Unis d'Afrique ».\n\nDevenue l'Union africaine en 2002, l'organisation demeure le cadre de la coopération continentale ; le 25 mai est la Journée de l'Afrique."},
      {"id":"s2l2","title":"Quiz — La fondation de l'OUA","type":"quiz","order":1,"quiz":{"passingScore":60,"questions":[
        {"question":"Dans quelle ville fut fondée, en 1963, l'Organisation de l'unité africaine ?","type":"multiple_choice","options":["Addis-Abeba","Accra","Le Caire","Dakar"],"correctIndex":0,"explanation":"L'OUA est fondée à Addis-Abeba, en Éthiopie."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Quel dirigeant ghanéen plaidait pour des « États-Unis d'Afrique » ?","type":"multiple_choice","options":["Kwame Nkrumah","Jomo Kenyatta","Léopold Senghor","Patrice Lumumba"],"correctIndex":0,"explanation":"Nkrumah était un fervent partisan de l'unité continentale."},
    {"question":"L'OUA est devenue l'Union africaine en 2002.","type":"true_false","correctBool":true,"explanation":"L'Union africaine succède à l'OUA en 2002."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : OUA","url":"https://fr.wikipedia.org/wiki/Organisation_de_l%27unit%C3%A9_africaine"},
    {"type":"link","title":"Article Wikipédia : Kwame Nkrumah","url":"https://fr.wikipedia.org/wiki/Kwame_Nkrumah"},
    {"type":"image","title":"Kwame Nkrumah","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Kwame_Nkrumah_%28JFKWHP-AR6409-A%29.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-panafricanisme-nkrumah-oua';

-- ── 6. La traite négrière atlantique ────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — La traite atlantique',
  content = '[]'::jsonb,
  objectives = $obj$["Comprendre le commerce triangulaire","Situer la « Route des esclaves » et Ouidah","Découvrir les résistances et l'abolition"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Le commerce triangulaire","order":0,"lessons":[
      {"id":"s1l1","title":"Trois continents, une tragédie","type":"text","order":0,"durationMin":6,"content":"Du XVIe au XIXe siècle, la traite atlantique déporte des millions d'Africains vers les Amériques. Ce « commerce triangulaire » relie l'Europe, l'Afrique et le Nouveau Monde.\n\nDes armes et des produits manufacturés sont échangés sur les côtes africaines contre des captifs, vendus ensuite comme esclaves dans les plantations."}
    ]},
    {"id":"s2","title":"Ouidah et les résistances","order":1,"lessons":[
      {"id":"s2l1","title":"La Porte du Non-Retour","type":"text","order":0,"durationMin":5,"content":"Sur la côte du Bénin actuel, Ouidah fut l'un des principaux ports négriers. La « Route des esclaves » y mène à la « Porte du Non-Retour ».\n\nEn 1791, la révolte de Saint-Domingue, menée notamment par Toussaint Louverture, aboutit à la première république noire : Haïti."},
      {"id":"s2l2","title":"Quiz — Le commerce triangulaire","type":"quiz","order":1,"quiz":{"passingScore":60,"questions":[
        {"question":"Combien de continents reliait le « commerce triangulaire » ?","type":"multiple_choice","options":["Deux","Trois","Quatre","Cinq"],"correctIndex":1,"explanation":"Europe, Afrique et Amériques : trois continents."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Quelle révolte de 1791 a abouti à la première république noire ?","type":"multiple_choice","options":["Saint-Domingue (Haïti)","La Jamaïque","Le Brésil","La Guadeloupe"],"correctIndex":0,"explanation":"La révolution de Saint-Domingue donne naissance à Haïti."},
    {"question":"Ouidah, sur la côte de l'actuel Bénin, fut un grand port négrier.","type":"true_false","correctBool":true,"explanation":"Ouidah abrite la mémorielle « Porte du Non-Retour »."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Traite atlantique","url":"https://fr.wikipedia.org/wiki/Traite_atlantique"},
    {"type":"link","title":"UNESCO — Île de Gorée","url":"https://whc.unesco.org/fr/list/26"},
    {"type":"image","title":"Toussaint Louverture","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Toussaint_Louverture.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-traite-negriere-atlantique';

-- ── 7. Figures de femmes africaines ─────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — Figures de femmes africaines',
  content = '[]'::jsonb,
  objectives = $obj$["Découvrir des figures féminines majeures de l'histoire africaine","Situer Amina de Zazzau, Miriam Makeba et Wangari Maathai","Valoriser leur rôle politique, artistique et militant"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Reines et guerrières","order":0,"lessons":[
      {"id":"s1l1","title":"Amina de Zazzau","type":"text","order":0,"durationMin":5,"content":"L'histoire africaine est jalonnée de figures féminines puissantes. Au XVIe siècle, Amina de Zazzau (actuel Nigeria) règne sur une cité haoussa qu'elle agrandit par de nombreuses campagnes militaires. On lui attribue la construction de remparts encore appelés « murs d'Amina »."}
    ]},
    {"id":"s2","title":"Voix et combats du XXe siècle","order":1,"lessons":[
      {"id":"s2l1","title":"Mama Africa","type":"video","order":0,"durationMin":3,"url":"https://www.youtube.com/watch?v=kaMK3tHy_Ok"},
      {"id":"s2l2","title":"Makeba et Maathai","type":"text","order":1,"durationMin":4,"content":"La chanteuse Miriam Makeba, « Mama Africa », porte la voix de l'Afrique sur les scènes du monde. La Kényane Wangari Maathai devient en 2004 la première Africaine lauréate du prix Nobel de la paix, pour son action écologique et démocratique."},
      {"id":"s2l3","title":"Quiz — Prix Nobel","type":"quiz","order":2,"quiz":{"passingScore":60,"questions":[
        {"question":"Qui fut, en 2004, la première femme africaine prix Nobel de la paix ?","type":"multiple_choice","options":["Wangari Maathai","Miriam Makeba","Ellen Johnson Sirleaf","Amina de Zazzau"],"correctIndex":0,"explanation":"La Kényane Wangari Maathai, fondatrice du Mouvement de la ceinture verte."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"De quel surnom Miriam Makeba est-elle connue ?","type":"multiple_choice","options":["Mama Africa","La Lionne","La Reine du Nil","Mama Wax"],"correctIndex":0,"explanation":"Miriam Makeba est surnommée « Mama Africa »."},
    {"question":"Amina de Zazzau était une reine guerrière haoussa.","type":"true_false","correctBool":true,"explanation":"Elle agrandit son royaume par de nombreuses campagnes militaires."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Wangari Maathai","url":"https://fr.wikipedia.org/wiki/Wangari_Maathai"},
    {"type":"link","title":"Article Wikipédia : Amina de Zazzau","url":"https://fr.wikipedia.org/wiki/Amina_de_Zaria"},
    {"type":"image","title":"Miriam Makeba (1969)","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Miriam_Makeba_%281969%29.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-figures-femmes-africaines';

-- ── 8. La Négritude ─────────────────────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — La Négritude',
  content = '[]'::jsonb,
  objectives = $obj$["Comprendre le mouvement de la Négritude","Identifier ses fondateurs (Césaire, Senghor, Damas)","Découvrir l'apport de Cheikh Anta Diop"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Naissance d'un mouvement","order":0,"lessons":[
      {"id":"s1l1","title":"Césaire, Senghor, Damas","type":"text","order":0,"durationMin":6,"content":"Dans les années 1930, à Paris, des étudiants venus d'Afrique et des Antilles — Aimé Césaire, Léopold Sédar Senghor et Léon-Gontran Damas — forgent le concept de Négritude.\n\nIl s'agit de revendiquer fièrement l'identité et les valeurs des peuples noirs, longtemps niées par la colonisation."}
    ]},
    {"id":"s2","title":"Une renaissance culturelle","order":1,"lessons":[
      {"id":"s2l1","title":"Cheikh Anta Diop","type":"text","order":0,"durationMin":5,"content":"Le mouvement nourrit une véritable renaissance culturelle. L'historien sénégalais Cheikh Anta Diop bouleverse les savoirs en démontrant l'africanité de l'Égypte ancienne et l'ancienneté des civilisations noires."},
      {"id":"s2l2","title":"Quiz — Les fondateurs","type":"quiz","order":1,"quiz":{"passingScore":60,"questions":[
        {"question":"Quels trois écrivains sont les fondateurs de la Négritude ?","type":"multiple_choice","options":["Césaire, Senghor et Damas","Diop, Senghor et Sembène","Césaire, Fanon et Glissant","Senghor, Hampâté Bâ et Kourouma"],"correctIndex":0,"explanation":"Aimé Césaire, Léopold Sédar Senghor et Léon-Gontran Damas."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Quel historien sénégalais a défendu l'africanité de l'Égypte ancienne ?","type":"multiple_choice","options":["Cheikh Anta Diop","Léopold Senghor","Joseph Ki-Zerbo","Amadou Hampâté Bâ"],"correctIndex":0,"explanation":"Cheikh Anta Diop, auteur de « Nations nègres et culture »."},
    {"question":"La Négritude est née à Paris dans les années 1930.","type":"true_false","correctBool":true,"explanation":"Elle émerge parmi les étudiants africains et antillais à Paris."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Négritude","url":"https://fr.wikipedia.org/wiki/N%C3%A9gritude"},
    {"type":"link","title":"Article Wikipédia : Cheikh Anta Diop","url":"https://fr.wikipedia.org/wiki/Cheikh_Anta_Diop"},
    {"type":"image","title":"Léopold Sédar Senghor","url":"https://commons.wikimedia.org/wiki/Special:FilePath/L%C3%A9opold_S%C3%A9dar_Senghor.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-negritude-renaissance-culturelle';

-- ── 9. Résistances à la colonisation ────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — Résistances à la colonisation',
  content = '[]'::jsonb,
  objectives = $obj$["Comprendre la diversité des résistances africaines","Situer la victoire d'Adoua (1896)","Identifier des figures comme Samori Touré et Ménélik II"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"Des résistances multiples","order":0,"lessons":[
      {"id":"s1l1","title":"Guerres, diplomatie, révoltes","type":"text","order":0,"durationMin":6,"content":"Loin d'avoir été passive, l'Afrique a opposé à la colonisation des résistances multiples : guerres, diplomatie, soulèvements religieux et révoltes populaires.\n\nDe Samori Touré en Afrique de l'Ouest aux guerriers zoulous en Afrique australe, ces résistances ont parfois tenu les puissances européennes en échec pendant des décennies."}
    ]},
    {"id":"s2","title":"Adoua, 1896","order":1,"lessons":[
      {"id":"s2l1","title":"La victoire éthiopienne","type":"text","order":0,"durationMin":5,"content":"Le 1er mars 1896, à Adoua, l'armée éthiopienne de l'empereur Ménélik II écrase les troupes italiennes. C'est la première grande victoire d'un État africain contre une puissance coloniale européenne.\n\nElle fait de l'Éthiopie un symbole d'indépendance pour tout le continent."},
      {"id":"s2l2","title":"Quiz — La bataille d'Adoua","type":"quiz","order":1,"quiz":{"passingScore":60,"questions":[
        {"question":"Lors de quelle bataille de 1896 l'Éthiopie a-t-elle vaincu l'Italie ?","type":"multiple_choice","options":["Adoua","Isandlwana","Omdourman","Tondibi"],"correctIndex":0,"explanation":"La bataille d'Adoua, victoire de Ménélik II."}
      ]}}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Quel empereur éthiopien a vaincu l'Italie à Adoua ?","type":"multiple_choice","options":["Ménélik II","Haïlé Sélassié","Théodoros II","Yohannès IV"],"correctIndex":0,"explanation":"Ménélik II commande l'armée victorieuse à Adoua."},
    {"question":"Adoua fut la première grande victoire d'un État africain contre une puissance coloniale.","type":"true_false","correctBool":true,"explanation":"Cette victoire de 1896 fit de l'Éthiopie un symbole d'indépendance."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Bataille d'Adoua","url":"https://fr.wikipedia.org/wiki/Bataille_d%27Adoua"},
    {"type":"link","title":"Article Wikipédia : Samori Touré","url":"https://fr.wikipedia.org/wiki/Samori_Tour%C3%A9"},
    {"type":"image","title":"Ménélik II d'Éthiopie","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Menelik_II_of_Ethiopia.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-resistances-colonisation';

-- ── 10. Les indépendances africaines ────────────────────────
UPDATE modules SET
  module_type = 'internal', has_certificate = true, certificate_name = 'Certificat — Les indépendances africaines',
  content = '[]'::jsonb,
  objectives = $obj$["Comprendre le contexte des indépendances africaines","Situer « l'année de l'Afrique » 1960","Saisir les défis de l'après-indépendance"]$obj$::jsonb,
  sections = $sec$[
    {"id":"s1","title":"La vague des indépendances","order":0,"lessons":[
      {"id":"s1l1","title":"Le vent de la décolonisation","type":"text","order":0,"durationMin":6,"content":"Au lendemain de la Seconde Guerre mondiale, le vent des indépendances souffle sur l'Afrique. Le Ghana de Kwame Nkrumah ouvre la voie en 1957 ; trois ans plus tard, dix-sept pays accèdent à la souveraineté lors de la seule année 1960."},
      {"id":"s1l2","title":"Quiz — Le précurseur","type":"quiz","order":1,"quiz":{"passingScore":60,"questions":[
        {"question":"Quel pays fut, en 1957, la première colonie d'Afrique subsaharienne indépendante ?","type":"multiple_choice","options":["Le Ghana","La Guinée","Le Sénégal","Le Congo"],"correctIndex":0,"explanation":"Le Ghana de Nkrumah ouvre la voie en 1957."}
      ]}}
    ]},
    {"id":"s2","title":"1960 et ses défis","order":1,"lessons":[
      {"id":"s2l1","title":"L'année de l'Afrique","type":"text","order":0,"durationMin":5,"content":"1960 est restée dans l'histoire comme « l'année de l'Afrique ». Mais l'indépendance politique ne règle pas tout : frontières héritées, dépendance économique et ingérences marqueront les décennies suivantes. En Algérie, l'indépendance (1962) est arrachée après huit ans de guerre ; au Congo, l'assassinat de Lumumba en 1961 illustre le prix payé."}
    ]}
  ]$sec$::jsonb,
  final_quiz = $fq${"title":"Évaluation finale","passingScore":60,"questions":[
    {"question":"Combien de pays africains accèdent à l'indépendance lors de la seule année 1960 ?","type":"multiple_choice","options":["7","12","17","25"],"correctIndex":2,"explanation":"Dix-sept pays deviennent indépendants en 1960."},
    {"question":"L'indépendance de l'Algérie a été obtenue de façon pacifique.","type":"true_false","correctBool":false,"explanation":"Elle est arrachée en 1962 après huit ans d'une guerre très violente."}
  ]}$fq$::jsonb,
  resources = $res$[
    {"type":"link","title":"Article Wikipédia : Patrice Lumumba","url":"https://fr.wikipedia.org/wiki/Patrice_Lumumba"},
    {"type":"link","title":"Article Wikipédia : Kwame Nkrumah","url":"https://fr.wikipedia.org/wiki/Kwame_Nkrumah"},
    {"type":"image","title":"Patrice Lumumba (1960)","url":"https://commons.wikimedia.org/wiki/Special:FilePath/Patrice_Lumumba%2C_1960.jpg?width=1200"}
  ]$res$::jsonb,
  updated_at = now()
WHERE slug = 'demo-independances-africaines';
