const db = require('better-sqlite3')('omniverse.db');
const schema = db.prepare("PRAGMA table_info(users)").all();
console.log(schema.map(c => c.name));
