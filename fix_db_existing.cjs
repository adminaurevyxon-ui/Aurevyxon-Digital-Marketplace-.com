const Database = require('better-sqlite3');
const db = new Database('omniverse.db');
try { db.prepare("ALTER TABLE listings ADD COLUMN weighted_rating REAL DEFAULT 0").run(); } catch(e) { console.log(e.message); }
try { db.prepare("ALTER TABLE listings ADD COLUMN review_count INTEGER DEFAULT 0").run(); } catch(e) { console.log(e.message); }
console.log("DB altered!");
