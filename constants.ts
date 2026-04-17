
import type { Theme, Event, TrainingModule, Creator, Sponsor, User, FeaturedItem, MoodleInstance, MoodleCourse, MoodleOfflinePackage, MoodleCourseMap, TimelineNarrative, TimelineMoment } from './types';

// Mock user database
export const USERS: User[] = [
  {
    id: 'clxrz2p5g000008l3b1a9d7k9',
    name: 'Curiositus',
    email: 'curiositus@kasuku.com',
    image: null,
    role: 'SUPERADMIN',
    passwordHash: 'SetAStrongPasswordHere',
  },
  {
    id: 'user_google_mock',
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    image: `https://api.dicebear.com/8.x/initials/svg?seed=Alex Doe`,
    role: 'VIEWER',
  }
];

export let THEMES: Theme[] = [
  { id: '1', name: 'Histoire', slug: 'history' },
  { id: '2', name: 'Musique', slug: 'music' },
  { id: '3', name: 'Cinéma', slug: 'cinema' },
  { id: '4', name: 'Littérature', slug: 'literature' },
  { id: '5', name: 'Politique', slug: 'politics' },
  { id: '6', name: 'Science & Tech', slug: 'science-tech' },
  { id: '7', name: 'Patrimoine', slug: 'heritage' },
  { id: '8', name: 'Figures', slug: 'figures' },
  { id: '9', name: 'Mouvements Sociaux', slug: 'social-movements' },
  { id: '10', name: 'Sports', slug: 'sports' },
  { id: '11', name: 'Santé', slug: 'health' },
];

export const THEME_COLORS: Record<string, string> = {
  'history': '#9B59B6', 
  'music': '#3498DB', 
  'cinema': '#E74C3C', 
  'literature': '#2ECC71', 
  'politics': '#34495E', 
  'science-tech': '#1ABC9C', 
  'heritage': '#D35400', 
  'figures': '#F1C40F', 
  'social-movements': '#C0392B', 
  'sports': '#27AE60', 
  'health': '#E67E22', 
};

// --- MOMENTS NARRATIFS NELSON MANDELA ---
const MANDELA_MOMENTS: TimelineMoment[] = [
    {
        id: 'mom-mand-1',
        timelineId: 'tl2',
        title: 'Naissance de Nelson Mandela',
        narrative: 'Rolihlahla Mandela naît à Mvezo, en Afrique du Sud. Fils de conseiller de chef tribal, il est le premier de sa famille à fréquenter l\'école, où on lui donne le prénom Nelson.',
        timeType: 'date',
        dateExact: '1918-07-18',
        position: 1,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1200' }]
    },
    {
        id: 'mom-mand-5',
        timelineId: 'tl2',
        title: 'Entrée en politique : Adhésion à l\'ANC',
        narrative: 'Mandela rejoint officiellement le Congrès National Africain (ANC) à Johannesburg. C\'est le début d\'un engagement d\'une vie pour la justice et l\'égalité.',
        timeType: 'period',
        periodText: '1943',
        position: 5,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800' }]
    },
    {
        id: 'mom-mand-6',
        timelineId: 'tl2',
        title: 'Fondation de la Ligue de la Jeunesse',
        narrative: 'Avec Walter Sisulu et Oliver Tambo, il fonde la Ligue de la jeunesse de l\'ANC pour insuffler une énergie nouvelle et plus radicale au mouvement de libération.',
        timeType: 'period',
        periodText: '1944',
        position: 6,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800' }]
    },
    {
        id: 'mom-mand-7',
        timelineId: 'tl2',
        title: 'Instauration de l\'Apartheid',
        narrative: 'L\'arrivée au pouvoir du Parti National marque l\'institutionnalisation de l\'apartheid. La ségrégation devient la loi, durcissant le combat de Mandela.',
        timeType: 'period',
        periodText: '1948',
        position: 7,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1509023467864-1ecbb3f604ce?q=80&w=800' }]
    },
    {
        id: 'mom-mand-8',
        timelineId: 'tl2',
        title: 'La "Defiance Campaign"',
        narrative: 'Mandela dirige la première grande campagne nationale de désobéissance civile. Des milliers de Sud-Africains bravent les lois injustes de l\'apartheid de manière non-violente.',
        timeType: 'date',
        dateExact: '1952-06-26',
        position: 8,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800' }]
    },
    {
        id: 'mom-mand-10',
        timelineId: 'tl2',
        title: 'Arrestation : Le Treason Trial',
        narrative: 'Accusé de haute trahison avec 155 autres militants, Mandela subit un procès marathon qui durera près de cinq ans avant de se conclure par un acquittement.',
        timeType: 'date',
        dateExact: '1956-12-05',
        position: 10,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800' }]
    },
    {
        id: 'mom-mand-12',
        timelineId: 'tl2',
        title: 'Capture de Madiba',
        narrative: 'Après 17 mois de vie clandestine en tant que "Pimprenel Noir", Mandela est capturé par la police. C\'est le début de ses 27 années de captivité.',
        timeType: 'date',
        dateExact: '1962-08-05',
        position: 12,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800' }]
    },
    {
        id: 'mom-mand-13',
        timelineId: 'tl2',
        title: 'Procès de Rivonia : Prison à vie',
        narrative: 'Mandela prononce son célèbre plaidoyer : "C\'est un idéal pour lequel je suis prêt à mourir". Il est condamné à la prison à perpétuité et envoyé à Robben Island.',
        timeType: 'date',
        dateExact: '1964-06-12',
        position: 13,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1448380611387-3506cc6ba395?q=80&w=800' }]
    },
    {
        id: 'mom-mand-16',
        timelineId: 'tl2',
        title: 'La Libération : Mandela est libre',
        narrative: 'Après 27 ans dans les geôles de l\'apartheid, Nelson Mandela franchit les portes de la prison de Victor Verster, la main levée, sous les yeux du monde entier.',
        timeType: 'date',
        dateExact: '1990-02-11',
        position: 16,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800' }]
    },
    {
        id: 'mom-mand-17',
        timelineId: 'tl2',
        title: 'Le Prix Nobel de la Paix',
        narrative: 'Reconnaissance mondiale : Mandela et FW de Klerk reçoivent conjointement le prix Nobel pour leur travail de démantèlement pacifique de l\'apartheid.',
        timeType: 'date',
        dateExact: '1993-12-10',
        position: 17,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1533740566848-5f7d3e04e3d7?q=80&w=800' }]
    },
    {
        id: 'mom-mand-18',
        timelineId: 'tl2',
        title: 'Élection du Premier Président Noir',
        narrative: 'Lors des premières élections multiraciales d\'Afrique du Sud, Mandela est élu président. Il entame sa mission de réconciliation nationale pour une "Nation Arc-en-ciel".',
        timeType: 'date',
        dateExact: '1994-04-27',
        position: 18,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1510903117013-f1596c327647?q=80&w=800' }]
    },
    {
        id: 'mom-mand-20',
        timelineId: 'tl2',
        title: 'Décès et Héritage Mondial',
        narrative: 'Madiba s\'éteint à Johannesburg à l\'âge de 95 ans. Son départ provoque une émotion planétaire, célébrant l\'homme qui a vaincu la haine par le pardon.',
        timeType: 'date',
        dateExact: '2013-12-05',
        position: 20,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200' }]
    }
];

// --- MOMENTS NARRATIFS AOF ---
const AOF_MOMENTS: TimelineMoment[] = [
    {
        id: 'mom-aof-1',
        timelineId: 'tl-aof',
        title: "L'Aube de la Matrice Administrative",
        narrative: "Tout commence un 16 juin 1895. À cette date, ce n'est pas encore une nation, c'est un décret. Le Gouvernement Général de l'AOF naît pour discipliner l'immensité. Imaginez Ernest Roume, penché sur des cartes où les frontières sont encore des pointillés. Il veut une machine de gestion unique. Saint-Louis, la \"Vieille Dame\", est la première capitale, mais elle est trop étroite. Le regard se tourne vers la presqu'île du Cap-Vert. Dakar est choisie pour devenir le cerveau de ce géant de 4,6 millions de km².",
        timeType: 'date',
        dateExact: '1895-06-16',
        position: 1,
        media: [{ type: 'image', url: 'https://picsum.photos/seed/aof-admin/800/600' }]
    },
    {
        id: 'mom-aof-2',
        timelineId: 'tl-aof',
        title: "Le Rail et le Sang de l'Économie",
        narrative: "Pour que la donnée (et la marchandise) circule, il faut des veines. Le Chemin de fer Dakar-Saint Louis (K-010) n'est pas qu'une prouesse d'ingénierie ; c'est le premier algorithme de transport de l'Afrique de l'Ouest. On y transporte l'arachide, l'or vert, mais aussi les idées. Dans les wagons, on parle d'indépendance, on parle de syndicats. Parallèlement, la Caisse d'Épargne de l'AOF (K-011) apprend aux populations à transformer le troc en chiffres, intégrant chaque villageois dans le grand livre de compte colonial.",
        timeType: 'period',
        periodText: '1885 - 1922',
        position: 2,
        media: [{ type: 'image', url: 'https://picsum.photos/seed/aof-rail/800/600' }]
    },
    {
        id: 'mom-aof-3',
        timelineId: 'tl-aof',
        title: "La Mutation du Citoyen",
        narrative: "Le système vacille après la guerre. À Brazzaville (K-004), le Général de Gaulle comprend que la matrice doit s'adapter ou se briser. C'est l'heure des géants locaux. Lamine Guèye (K-003) entre en scène. Il ne demande pas la charité, il demande le droit. Sa loi est un séisme : le \"sujet\" devient \"citoyen\". Les privilèges s'effritent. L'AOF n'est plus seulement un réservoir de ressources, elle devient un laboratoire politique où se forgent les futurs leaders des indépendances.",
        timeType: 'period',
        periodText: '1944 - 1946',
        position: 3,
        media: [{ type: 'image', url: 'https://picsum.photos/seed/aof-citizen/800/600' }]
    },
    {
        id: 'mom-aof-4',
        timelineId: 'tl-aof',
        title: "L'Héritage de l'Invisible : Le Franc CFA",
        narrative: "Le 25 décembre 1945, alors que l'Europe se reconstruit, un nouveau code monétaire est injecté : le Franc CFA (K-009). Sous la plume de René Pleven, cette monnaie est créée pour stabiliser les échanges. Elle est le dernier pilier de l'AOF, le seul qui survivra physiquement à l'éclatement de la fédération en 1958. C'est un lien invisible qui, encore aujourd'hui, relie les archives de l'AOF à la réalité des marchés de Dakar ou d'Abidjan.",
        timeType: 'date',
        dateExact: '1945-12-25',
        position: 4,
        media: [{ type: 'image', url: 'https://picsum.photos/seed/aof-cfa/800/600' }]
    }
];

// --- MOMENTS NARRATIFS SAMUEL ETO'O ---
const ETOO_MOMENTS: TimelineMoment[] = [
    {
        id: 'mom-etoo-1',
        timelineId: 'tl1',
        title: 'Naissance de Samuel Eto\'o',
        narrative: 'Samuel Eto\'o Fils voit le jour à Douala, au Cameroun. Benjamin d\'une fratrie de six enfants, il commence à taper dans le ballon dans les rues du quartier New Bell.',
        timeType: 'date',
        dateExact: '1981-03-10',
        position: 1,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1529900660574-e94ca72035a3?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-2',
        timelineId: 'tl1',
        title: 'Sacre Continental : Victoire à la CAN',
        narrative: 'À seulement 18 ans, Eto\'o remporte sa première Coupe d\'Afrique des Nations avec les Lions Indomptables au Nigeria, marquant en finale contre le pays hôte.',
        timeType: 'date',
        dateExact: '2000-02-12',
        position: 2,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-3',
        timelineId: 'tl1',
        title: 'L\'Or Olympique à Sydney',
        narrative: 'Il guide le Cameroun vers une médaille d\'or historique aux Jeux Olympiques de Sydney, battant l\'Espagne en finale. Le Cameroun est sur le toit du monde olympique.',
        timeType: 'date',
        dateExact: '2000-09-30',
        position: 3,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-4',
        timelineId: 'tl1',
        title: 'Sommet Européen avec le Barça',
        narrative: 'Samuel Eto\'o remporte sa première Ligue des Champions avec le FC Barcelone au Stade de France, marquant le but de l\'égalisation cruciale contre Arsenal.',
        timeType: 'date',
        dateExact: '2006-05-17',
        position: 4,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-5',
        timelineId: 'tl1',
        title: 'Le Triplé Historique Blaugrana',
        narrative: 'Eto\'o marque en finale de la Ligue des Champions contre Manchester United. Le Barça réalise un triplé historique : Liga, Coupe du Roi, Ligue des Champions.',
        timeType: 'date',
        dateExact: '2009-05-27',
        position: 5,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1551290464-672935272304?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-6',
        timelineId: 'tl1',
        title: 'Doublé Européen avec l\'Inter',
        narrative: 'Transféré à l\'Inter Milan, il remporte une nouvelle Ligue des Champions et réalise un deuxième triplé consécutif avec deux clubs différents, un exploit unique.',
        timeType: 'date',
        dateExact: '2010-05-22',
        position: 6,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-7',
        timelineId: 'tl1',
        title: 'Retraite d\'une Légende',
        narrative: 'Après une carrière monumentale parcourant les plus grands clubs du monde, Samuel Eto\'o annonce officiellement sa retraite sportive, laissant un héritage immense.',
        timeType: 'date',
        dateExact: '2019-09-07',
        position: 7,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1518091043644-c1d445bcc97a?q=80&w=800' }]
    },
    {
        id: 'mom-etoo-8',
        timelineId: 'tl1',
        title: 'Le Nouveau Défi : FECAFOOT',
        narrative: 'L\'icône du football camerounais est élue à la présidence de la Fédération Camerounaise de Football (FECAFOOT) avec pour ambition de redonner sa grandeur au football local.',
        timeType: 'date',
        dateExact: '2021-12-11',
        position: 8,
        media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800' }]
    }
];

// MODÈLE "PARCOURS" OFFICIEL
export let TIMELINES: TimelineNarrative[] = [
  {
    id: 'tl-aof',
    slug: 'aof-matrice-administrative',
    title: "L'AOF : La Matrice Administrative",
    type: 'evenement',
    shortDescription: "Plongez dans l'histoire de l'Afrique Occidentale Française, de sa création administrative à son héritage monétaire.",
    thumbnail: 'https://picsum.photos/seed/aof-story/800/600',
    periodLabel: '1895 - 1958',
    status: 'published',
    eventCount: 4,
    moments: AOF_MOMENTS
  },
  {
    id: 'tl1',
    slug: 'samuel-etoo',
    title: 'Samuel Eto\'o',
    type: 'personnage',
    shortDescription: 'De Douala aux sommets de l\'Europe, revivez la trajectoire légendaire du Lion Indomptable.',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
    periodLabel: '1981 - Présent',
    status: 'published',
    eventCount: 8,
    moments: ETOO_MOMENTS
  },
  {
    id: 'tl2',
    slug: 'nelson-mandela',
    title: 'Nelson Mandela',
    type: 'personnage',
    shortDescription: 'Suivez le destin de Madiba, de la lutte clandestine à la présidence d\'une nation réconciliée.',
    thumbnail: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=800',
    periodLabel: '1918 - 2013',
    status: 'published',
    eventCount: 12,
    moments: MANDELA_MOMENTS
  }
];

const CREATORS: Creator[] = [
    {
        id: 'creator1',
        name: 'Kasuku Academy – Équipe éditoriale',
        avatarUrl: 'https://i.postimg.cc/8cYFbspt/Kasuku-logo.png',
        bio: 'Curateurs de contenus culturels panafricains.',
        links: ['#']
    }
];

const SPONSORS: Sponsor[] = [];

export let ALL_TRAINING_MODULES: TrainingModule[] = [
    { 
      id: 'tm1', 
      title: 'Les origines de l\'humanité en Afrique', 
      slug: 'origins-of-humankind', 
      summary: 'Explorez les premières étapes de l\'évolution humaine sur le continent.', 
      durationMin: 45, 
      level: 'Beginner',
      updatedAt: '2023-10-26',
      language: 'fr',
      objectives: ['Identifier les principales espèces d\'hominidés.'],
      creators: [CREATORS[0]],
      sponsors: [],
      eventIds: ['evt9'],
      tags: ['science'],
      moduleType: 'internal',
      sections: [
        { id: 's1', title: 'Premiers Hominidés', order: 1, lessons: [
            { id: 'l1-1', title: 'Introduction', type: 'video', durationMin: 15, order: 1 },
        ]}
      ]
    },
    {
      id: 'tm-aof-admin',
      title: 'L\'AOF : Administration et Gouvernance',
      slug: 'aof-administration-gouvernance',
      summary: 'Comprendre les structures administratives et les enjeux de pouvoir au sein de la fédération de l\'AOF.',
      durationMin: 60,
      level: 'Intermediate',
      updatedAt: '2024-03-30',
      language: 'fr',
      objectives: ['Analyser le rôle du Gouverneur Général', 'Comprendre la centralisation à Dakar'],
      creators: [CREATORS[0]],
      sponsors: [],
      eventIds: ['K-001'],
      tags: ['histoire', 'politique'],
      moduleType: 'internal',
      sections: [
        { id: 's1', title: 'Structure de l\'AOF', order: 1, lessons: [
            { id: 'l1-1', title: 'Le décret de 1895', type: 'video', durationMin: 20, order: 1 },
        ]}
      ]
    },
    {
      id: 'tm-cfa',
      title: 'Le Franc CFA : Histoire et Enjeux',
      slug: 'franc-cfa-histoire-enjeux',
      summary: 'Un module complet sur la création, l\'évolution et les débats contemporains autour du Franc CFA.',
      durationMin: 90,
      level: 'Advanced',
      updatedAt: '2024-03-30',
      language: 'fr',
      objectives: ['Tracer l\'histoire monétaire de l\'AOF', 'Comprendre les mécanismes du Franc CFA'],
      creators: [CREATORS[0]],
      sponsors: [],
      eventIds: ['K-009'],
      tags: ['économie', 'histoire'],
      moduleType: 'internal',
      sections: [
        { id: 's1', title: 'Origines monétaires', order: 1, lessons: [
            { id: 'l1-1', title: 'De la BAO au Franc CFA', type: 'video', durationMin: 30, order: 1 },
        ]}
      ]
    },
    {
      id: 'tm-lamine',
      title: 'Lamine Guèye et la Citoyenneté',
      slug: 'lamine-gueye-citoyennete',
      summary: 'Découvrez le combat de Lamine Guèye pour l\'égalité des droits et la fin du statut de "sujet".',
      durationMin: 45,
      level: 'Intermediate',
      updatedAt: '2024-03-30',
      language: 'fr',
      objectives: ['Analyser la Loi Lamine Guèye', 'Comprendre l\'évolution du statut de citoyen'],
      creators: [CREATORS[0]],
      sponsors: [],
      eventIds: ['K-003'],
      tags: ['politique', 'droit'],
      moduleType: 'internal',
      sections: [
        { id: 's1', title: 'Le combat pour l\'égalité', order: 1, lessons: [
            { id: 'l1-1', title: 'La Loi de 1946', type: 'video', durationMin: 25, order: 1 },
        ]}
      ]
    }
];

export let EVENTS: Event[] = [
  // --- PARCOURS SAMUEL ETO'O (Événements calendrier liés) ---
  {
    id: 'evt-etoo-1',
    title: 'Naissance de Samuel Eto\'o',
    slug: 'naissance-samuel-etoo',
    summary: 'Samuel Eto\'o Fils voit le jour à Douala, au Cameroun. Benjamin d\'une fratrie de six enfants, il deviendra l\'un des meilleurs attaquants de l\'histoire du football mondial.',
    dateISO: '1981-03-10',
    year: 1981,
    countryCode: 'CM',
    themes: [THEMES[9], THEMES[7]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1529900660574-e94ca72035a3?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-1'
  },
  {
    id: 'evt-etoo-2',
    title: 'Le Cameroun champion d\'Afrique',
    slug: 'cameroun-champion-can-2000',
    summary: 'Les Lions Indomptables de Samuel Eto\'o remportent la CAN 2000 face au Nigeria. Eto\'o marque un but décisif en finale.',
    dateISO: '2000-02-12',
    year: 2000,
    countryCode: 'CM',
    themes: [THEMES[9]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-2'
  },
  {
    id: 'evt-etoo-3',
    title: 'Médaille d\'or aux JO de Sydney',
    slug: 'medaille-or-jo-2000-cameroun',
    summary: 'Exploit historique du Cameroun qui remporte la médaille d\'or en football aux Jeux Olympiques de Sydney contre l\'Espagne.',
    dateISO: '2000-09-30',
    year: 2000,
    countryCode: 'CM',
    themes: [THEMES[9]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-3'
  },
  {
    id: 'evt-etoo-4',
    title: 'Eto\'o et le Barça rois de l\'Europe',
    slug: 'champions-league-2006-barca',
    summary: 'Le FC Barcelone remporte la Ligue des Champions. Samuel Eto\'o marque le premier but barcelonais de la finale contre Arsenal.',
    dateISO: '2006-05-17',
    year: 2006,
    countryCode: 'ES',
    themes: [THEMES[9]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-4'
  },
  {
    id: 'evt-etoo-5',
    title: 'Triplé historique du FC Barcelone',
    slug: 'triple-historique-barca-2009',
    summary: 'Eto\'o et Messi mènent le Barça vers un triplé inédit. Victoire en finale de C1 contre Manchester United à Rome.',
    dateISO: '2009-05-27',
    year: 2009,
    countryCode: 'ES',
    themes: [THEMES[9]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1551290464-672935272304?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-5'
  },
  {
    id: 'evt-etoo-6',
    title: 'Inter Milan : Nouveau Triplé pour Eto\'o',
    slug: 'triple-inter-milan-2010',
    summary: 'Samuel Eto\'o remporte un deuxième triplé consécutif, cette fois avec l\'Inter Milan sous les ordres de José Mourinho.',
    dateISO: '2010-05-22',
    year: 2010,
    countryCode: 'IT',
    themes: [THEMES[9]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-6'
  },
  {
    id: 'evt-etoo-7',
    title: 'Fin de carrière de Samuel Eto\'o',
    slug: 'retraite-samuel-etoo',
    summary: 'L\'une des plus grandes figures du football africain et mondial annonce la fin de sa carrière de joueur professionnel.',
    dateISO: '2019-09-07',
    year: 2019,
    countryCode: 'CM',
    themes: [THEMES[9], THEMES[7]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1518091043644-c1d445bcc97a?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-7'
  },
  {
    id: 'evt-etoo-8',
    title: 'Samuel Eto\'o à la tête de la FECAFOOT',
    slug: 'election-etoo-fecafoot',
    summary: 'Samuel Eto\'o est élu président de la Fédération Camerounaise de Football lors d\'une assemblée générale très suivie.',
    dateISO: '2021-12-11',
    year: 2021,
    countryCode: 'CM',
    themes: [THEMES[9], THEMES[4]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800' }],
    sources: [],
    timelineId: 'tl1',
    timelineSlug: 'samuel-etoo',
    timelineMomentId: 'mom-etoo-8'
  },

  // --- PARCOURS NELSON MANDELA (Événements calendrier liés) ---
  {
    id: 'evt-mand-1',
    title: 'Naissance de Nelson Mandela',
    slug: 'naissance-nelson-mandela',
    summary: 'Nelson Mandela naît à Mvezo. Cet événement marque le début de la vie de celui qui deviendra le symbole mondial de la lutte contre l\'oppression.',
    dateISO: '1918-07-18',
    year: 1918,
    countryCode: 'ZA',
    themes: [THEMES[0], THEMES[7]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-1'
  },
  {
    id: 'evt-mand-5',
    title: 'Engagement politique : Mandela rejoint l\'ANC',
    slug: 'mandela-adhésion-anc',
    summary: 'Nelson Mandela s\'engage officiellement dans le combat politique en rejoignant l\'ANC, le principal mouvement d\'opposition noir en Afrique du Sud.',
    year: 1943,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[8]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-5'
  },
  {
    id: 'evt-mand-6',
    title: 'Ligue de la Jeunesse de l\'ANC',
    slug: 'fondation-ligue-jeunesse-anc',
    summary: 'Fondation de l\'ANC Youth League. Mandela et ses compagnons souhaitent transformer l\'ANC en un mouvement de masse plus radical.',
    year: 1944,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[8]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-6'
  },
  {
    id: 'evt-mand-7',
    title: 'Loi de l\'Apartheid',
    slug: 'instauration-officielle-apartheid',
    summary: 'Le régime de l\'apartheid est officiellement mis en place, séparant systématiquement les populations selon leur couleur de peau.',
    year: 1948,
    countryCode: 'ZA',
    themes: [THEMES[0], THEMES[4]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1509023467864-1ecbb3f604ce?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-7'
  },
  {
    id: 'evt-mand-8',
    title: 'Campagne de Défi (Defiance Campaign)',
    slug: 'mandela-defiance-campaign',
    summary: 'Lancement d\'une campagne massive de désobéissance civile non-violente contre les lois de l\'apartheid, sous la direction de Nelson Mandela.',
    dateISO: '1952-06-26',
    year: 1952,
    countryCode: 'ZA',
    themes: [THEMES[8], THEMES[4]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-8'
  },
  {
    id: 'evt-mand-10',
    title: 'Arrestation du Treason Trial',
    slug: 'arrestation-treason-trial',
    summary: 'Mandela est arrêté avec 155 autres activistes. Ce procès historique pour trahison va durer 5 ans.',
    dateISO: '1956-12-05',
    year: 1956,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[0]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-10'
  },
  {
    id: 'evt-mand-12',
    title: 'Arrestation de Nelson Mandela',
    slug: 'arrestation-mandela-1962',
    summary: 'Nelson Mandela est capturé par les forces de sécurité après des mois de clandestinité. C\'est le début de sa longue vie de prisonnier politique.',
    dateISO: '1962-08-05',
    year: 1962,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[8]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-12'
  },
  {
    id: 'evt-mand-13',
    title: 'Condamnation au Procès de Rivonia',
    slug: 'proces-rivonia-condamnation',
    summary: 'Mandela et sept autres leaders sont condamnés à la prison à perpétuité. Son discours au tribunal entre dans l\'histoire mondiale.',
    dateISO: '1964-06-12',
    year: 1964,
    countryCode: 'ZA',
    themes: [THEMES[0], THEMES[4]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1448380611387-3506cc6ba395?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-13'
  },
  {
    id: 'evt-mand-16',
    title: 'Libération de Nelson Mandela',
    slug: 'liberation-nelson-mandela',
    summary: 'Le monde assiste en direct à la libération de Nelson Mandela. Un moment charnière vers la fin de l\'apartheid.',
    dateISO: '1990-02-11',
    year: 1990,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[8]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-16'
  },
  {
    id: 'evt-mand-17',
    title: 'Prix Nobel de la Paix',
    slug: 'mandela-nobel-peace-prize',
    summary: 'Nelson Mandela reçoit le prix Nobel de la paix pour son combat et sa vision de réconciliation pour l\'Afrique du Sud.',
    dateISO: '1993-12-10',
    year: 1993,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[0]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1533740566848-5f7d3e04e3d7?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-17'
  },
  {
    id: 'evt-mand-18',
    title: 'Mandela élu Président',
    slug: 'election-mandela-president',
    summary: 'Nelson Mandela devient le premier président élu démocratiquement en Afrique du Sud lors d\'élections historiques.',
    dateISO: '1994-04-27',
    year: 1994,
    countryCode: 'ZA',
    themes: [THEMES[4], THEMES[5]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1510903117013-f1596c327647?q=80&w=800' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-18'
  },
  {
    id: 'evt-mand-20',
    title: 'Décès de Nelson Mandela',
    slug: 'deces-nelson-mandela',
    summary: 'Disparition de Nelson Mandela à l\'âge de 95 ans. Un deuil planétaire salue la mémoire de Madiba.',
    dateISO: '2013-12-05',
    year: 2013,
    countryCode: 'ZA',
    themes: [THEMES[0], THEMES[8]],
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200' }],
    sources: [],
    timelineId: 'tl2',
    timelineSlug: 'nelson-mandela',
    timelineMomentId: 'mom-mand-20'
  },

  // --- AUTRES ÉVÉNEMENTS ---
  {
    id: 'K-001',
    title: "Création de l'AOF",
    slug: 'creation-aof',
    summary: "Naissance du Gouvernement Général de l'Afrique Occidentale Française, marquant un tournant administratif majeur.",
    dateISO: '1895-06-16',
    year: 1895,
    countryCode: 'SN',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/aof/800/600' }],
    sources: [],
    timelineId: 'tl-aof',
    timelineSlug: 'aof-matrice-administrative',
    timelineMomentId: 'mom-aof-1'
  },
  {
    id: 'K-002',
    title: 'Sénatus-Consulte de 1854',
    slug: 'senatus-consulte-1854',
    summary: 'Définition du régime législatif des colonies soumises au pouvoir discrétionnaire des décrets impériaux.',
    dateISO: '1854-05-03',
    year: 1854,
    countryCode: 'FR',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/napoleon/800/600' }],
    sources: []
  },
  {
    id: 'K-003',
    title: 'Loi Lamine Guèye',
    slug: 'loi-lamine-gueye',
    summary: "Instauration de l'égalité de droits entre les citoyens français et les anciens \"sujets\" d'Outre-mer.",
    dateISO: '1946-05-07',
    year: 1946,
    countryCode: 'SN',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/equality/800/600' }],
    sources: [],
    timelineId: 'tl-aof',
    timelineSlug: 'aof-matrice-administrative',
    timelineMomentId: 'mom-aof-3'
  },
  {
    id: 'K-004',
    title: 'Conférence de Brazzaville',
    slug: 'conference-brazzaville',
    summary: "Réunion historique jetant les bases de l'Union Française et amorçant des réformes structurelles après-guerre.",
    dateISO: '1944-01-30',
    year: 1944,
    countryCode: 'CG',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/brazzaville/800/600' }],
    sources: [],
    timelineId: 'tl-aof',
    timelineSlug: 'aof-matrice-administrative',
    timelineMomentId: 'mom-aof-3'
  },
  {
    id: 'K-005',
    title: "Abolition de l'Esclavage",
    slug: 'abolition-esclavage',
    summary: "Décret actant la fin définitive de la traite et de l'esclavage au sein de l'empire colonial français.",
    dateISO: '1848-04-27',
    year: 1848,
    countryCode: 'FR',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/freedom/800/600' }],
    sources: []
  },
  {
    id: 'K-006',
    title: 'Fondation de la Banque du Sénégal',
    slug: 'fondation-banque-senegal',
    summary: "Création de la première banque d'émission de l'Afrique de l'Ouest, basée à Saint-Louis du Sénégal.",
    dateISO: '1853-12-21',
    year: 1853,
    countryCode: 'SN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/bank/800/600' }],
    sources: []
  },
  {
    id: 'K-007',
    title: "Privilège d'émission de la BAO",
    slug: 'privilege-emission-bao',
    summary: "Octroi du monopole monétaire à la Banque de l'Afrique Occidentale pour stabiliser les échanges.",
    dateISO: '1901-06-29',
    year: 1901,
    countryCode: 'SN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/currency/800/600' }],
    sources: []
  },
  {
    id: 'K-008',
    title: "L'Étalon-Or Classique",
    slug: 'etalon-or-classique',
    summary: 'Mise en place du système de convertibilité illimitée des billets de banque en or pur.',
    dateISO: '1870-01-01',
    year: 1870,
    countryCode: 'UN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/gold/800/600' }],
    sources: []
  },
  {
    id: 'K-009',
    title: 'Création du Franc CFA',
    slug: 'creation-franc-cfa',
    summary: "Naissance officielle de la monnaie des \"Colonies Françaises d'Afrique\" pour stabiliser l'économie.",
    dateISO: '1945-12-25',
    year: 1945,
    countryCode: 'UN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/cfa/800/600' }],
    sources: [],
    timelineId: 'tl-aof',
    timelineSlug: 'aof-matrice-administrative',
    timelineMomentId: 'mom-aof-4'
  },
  {
    id: 'K-010',
    title: 'Chemin de fer Dakar-St Louis',
    slug: 'chemin-de-fer-dakar-st-louis',
    summary: "Inauguration de la toute première ligne ferroviaire structurante de l'Afrique de l'Ouest.",
    dateISO: '1885-07-06',
    year: 1885,
    countryCode: 'SN',
    themes: [THEMES[6]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/train/800/600' }],
    sources: [],
    timelineId: 'tl-aof',
    timelineSlug: 'aof-matrice-administrative',
    timelineMomentId: 'mom-aof-2'
  },
  {
    id: 'K-011',
    title: "Caisse d'Épargne de l'AOF",
    slug: 'caisse-epargne-aof',
    summary: "Institution créée pour collecter et sécuriser l'épargne des populations locales via le réseau postal.",
    dateISO: '1922-10-01',
    year: 1922,
    countryCode: 'SN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/savings/800/600' }],
    sources: [],
    timelineId: 'tl-aof',
    timelineSlug: 'aof-matrice-administrative',
    timelineMomentId: 'mom-aof-2'
  },
  {
    id: 'K-012',
    title: 'Chèques Postaux à Dakar',
    slug: 'cheques-postaux-dakar',
    summary: 'Modernisation des moyens de paiement scripturaux pour faciliter les transactions administratives.',
    dateISO: '1927-11-01',
    year: 1927,
    countryCode: 'SN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/check/800/600' }],
    sources: []
  },
  {
    id: 'K-013',
    title: 'Crédit Agricole Mutuel',
    slug: 'credit-agricole-mutuel',
    summary: 'Dispositif de financement conçu pour moderniser et soutenir l\'agriculture coloniale via le crédit.',
    dateISO: '1926-05-23',
    year: 1926,
    countryCode: 'UN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/agriculture/800/600' }],
    sources: []
  },
  {
    id: 'K-014',
    title: 'Le Plan Albert Sarraut',
    slug: 'plan-albert-sarraut',
    summary: 'Programme décennal ambitieux pour la mise en valeur économique et sociale des colonies françaises.',
    dateISO: '1921-01-01',
    year: 1921,
    countryCode: 'FR',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/planning/800/600' }],
    sources: []
  },
  {
    id: 'K-015',
    title: "Institut d'Émission de l'AOF",
    slug: 'institut-emission-aof',
    summary: "Établissement public succédant à la BAO pour reprendre la gestion de la monnaie circulante.",
    dateISO: '1955-01-20',
    year: 1955,
    countryCode: 'SN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/finance/800/600' }],
    sources: []
  },
  {
    id: 'K-016',
    title: 'Dévaluation du Franc CFA (1948)',
    slug: 'devaluation-franc-cfa-1948',
    summary: 'Premier ajustement majeur de la parité monétaire suite aux déséquilibres économiques post-conflit.',
    dateISO: '1948-01-26',
    year: 1948,
    countryCode: 'UN',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/devaluation/800/600' }],
    sources: []
  },
  {
    id: 'K-017',
    title: 'Doctrine Daladier',
    slug: 'doctrine-daladier',
    summary: 'Politique liant l\'autonomie politique locale au renforcement des intérêts économiques métropolitains.',
    dateISO: '1924-12-20',
    year: 1924,
    countryCode: 'FR',
    themes: [THEMES[0]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/politics/800/600' }],
    sources: []
  },
  {
    id: 'K-018',
    title: 'Banque de l\'Indochine (Modèle)',
    slug: 'banque-indochine-modele',
    summary: 'Institution privée servant de référence technique pour l\'organisation des banques africaines.',
    dateISO: '1875-01-21',
    year: 1875,
    countryCode: 'FR',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/indochina/800/600' }],
    sources: []
  },
  {
    id: 'K-019',
    title: 'Accord de Bretton Woods',
    slug: 'accord-bretton-woods',
    summary: 'Instauration du système monétaire international fixant les règles financières basées sur le dollar.',
    dateISO: '1944-07-22',
    year: 1944,
    countryCode: 'US',
    themes: [THEMES[5]],
    media: [{ type: 'image', url: 'https://picsum.photos/seed/dollar/800/600' }],
    sources: []
  },
  {
    id: 'evt1',
    title: 'Premier homme sur la Lune',
    slug: 'first-man-on-the-moon',
    summary: 'La mission Apollo 11 réussit son alunissage. Neil Armstrong devient le premier humain à fouler un autre corps céleste.',
    dateISO: '1969-07-20',
    year: 1969,
    countryCode: 'US',
    themes: [THEMES[5], THEMES[0]],
    media: [{ id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800' }],
    sources: [],
  }
];

export let FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: 'feat-cfa-module',
    title: 'Formation : Le Franc CFA',
    subtitle: 'Maîtrisez l\'histoire et les enjeux de la monnaie commune.',
    imageUrl: 'https://picsum.photos/seed/cfa-module/800/600',
    eventId: 'K-009',
    active: true,
    startDate: '2024-03-01',
    endDate: '2026-12-31',
    order: -1,
    ctaLabel: 'Suivre le module',
    ctaTo: 'franc-cfa-histoire-enjeux'
  },
  {
    id: 'feat-aof',
    title: "L'AOF",
    subtitle: "Découvrez la matrice administrative qui a façonné l'Afrique de l'Ouest.",
    imageUrl: 'https://picsum.photos/seed/aof-story/800/600',
    eventId: 'K-001',
    active: true,
    startDate: '2023-01-01',
    endDate: '2026-12-31',
    order: 0,
    ctaLabel: 'Explorer le récit',
    ctaTo: 'aof-matrice-administrative'
  },
  {
    id: 'feat-etoo',
    title: 'Samuel Eto\'o',
    subtitle: 'Redécouvrez le parcours fulgurant d\'un Lion indomptable.',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
    eventId: 'evt-etoo-2',
    active: true,
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    order: 1,
    ctaLabel: 'Voir le récit',
    ctaTo: 'samuel-etoo'
  },
  {
    id: 'feat-mandela',
    title: 'Nelson Mandela',
    subtitle: 'Suivez le combat de Madiba pour la dignité et la paix mondiale.',
    imageUrl: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=800',
    eventId: 'evt-mand-16',
    active: true,
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    order: 2,
    ctaLabel: 'Voir le récit',
    ctaTo: 'nelson-mandela'
  }
];

// Mock Moodle
export let MOODLE_INSTANCES: MoodleInstance[] = [];
export let MOODLE_COURSES: MoodleCourse[] = [];
export let MOODLE_PACKAGES: MoodleOfflinePackage[] = [];
export let MOODLE_MAPS: MoodleCourseMap[] = [];

EVENTS.forEach(event => {
    event.trainingModules = ALL_TRAINING_MODULES.filter(module => module.eventIds.includes(event.id));
});

export { CREATORS, SPONSORS };
