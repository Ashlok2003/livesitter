db = db.getSiblingDB('admin');

// Create user only if it doesn't exist
const userExists = db.system.users.findOne({ user: 'admin', db: 'admin' });

if (!userExists) {
  db.createUser({
    user: 'admin',
    pwd: 'password',
    roles: [
      { role: 'readWrite', db: 'livestream_app' },
      { role: 'dbAdmin', db: 'livestream_app' }
    ]
  });
}

db = db.getSiblingDB('livestream_app');

// Helper to safely create a collection
function safeCreateCollection(name) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name);
  }
}

// Create collections if not exist
safeCreateCollection('overlays');
safeCreateCollection('settings');
