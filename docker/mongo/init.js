// ─── MongoDB Init Script ──────────────────────────────────────────────────────
// Exécuté une seule fois à la création du container.
// Crée la base kasuku_db, les index et l'utilisateur applicatif.

const dbName = process.env.MONGO_INITDB_DATABASE || 'kasuku_db';
const rootUser = process.env.MONGO_INITDB_ROOT_USERNAME || 'kasuku';
const rootPass = process.env.MONGO_INITDB_ROOT_PASSWORD;

// Connexion en tant que root
db = db.getSiblingDB('admin');

// Créer un utilisateur dédié à l'application (lecture/écriture sur kasuku_db)
db.createUser({
  user: rootUser,
  pwd: rootPass,
  roles: [
    { role: 'readWrite', db: dbName },
    { role: 'dbAdmin', db: dbName },
  ],
});

// Passer sur la base applicative
db = db.getSiblingDB(dbName);

// ─── Index ────────────────────────────────────────────────────────────────────

// Events
db.events.createIndex({ slug: 1 }, { unique: true });
db.events.createIndex({ dateISO: 1 });
db.events.createIndex({ year: 1 });
db.events.createIndex({ countryCode: 1 });
db.events.createIndex({ 'themes.slug': 1 });
db.events.createIndex({ title: 'text', summary: 'text' });

// Timelines
db.timelines.createIndex({ slug: 1 }, { unique: true });
db.timelines.createIndex({ status: 1 });
db.timelines.createIndex({ type: 1 });
db.timelines.createIndex({ title: 'text', shortDescription: 'text' });

// Modules
db.modules.createIndex({ slug: 1 }, { unique: true });
db.modules.createIndex({ level: 1 });
db.modules.createIndex({ language: 1 });
db.modules.createIndex({ moduleType: 1 });
db.modules.createIndex({ title: 'text', summary: 'text' });

// Themes
db.themes.createIndex({ slug: 1 }, { unique: true });

// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Featured items
db.featureditems.createIndex({ order: 1 });
db.featureditems.createIndex({ active: 1, startDate: 1, endDate: 1 });

// Moodle
db.moodleinstances.createIndex({ baseUrl: 1 });
db.moodlecourses.createIndex({ instanceId: 1, remoteCourseId: 1 }, { unique: true });
db.moodleofflinepackages.createIndex({ courseId: 1 });
db.moodlecoursemaps.createIndex({ moduleId: 1 });

// Kalenda
db.kalendas.createIndex({ slug: 1 }, { unique: true });
db.kalendas.createIndex({ status: 1 });

print('✅ Kasuku DB initialisée avec succès.');
