db = db.getSiblingDB('admin');

try {
  db.createUser({
    user: 'admin',
    pwd: 'password',
    roles: [
      {
        role: 'readWrite',
        db: 'livestream_app'
      },
      {
        role: 'dbAdmin',
        db: 'livestream_app'
      }
    ]
  });
} catch (e) {
  if (e.code !== 11000) { // 11000 is duplicate key error
    throw e;
  }
}

db = db.getSiblingDB('livestream_app');

try {
  db.createCollection('overlays');
} catch (e) {
  if (e.codeName !== 'NamespaceExists') {
    throw e;
  }
}

try {
  db.createCollection('settings');
} catch (e) {
  if (e.codeName !== 'NamespaceExists') {
    throw e;
  }
}
