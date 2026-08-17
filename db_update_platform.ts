import Database from 'better-sqlite3';
const db = new Database('omniverse.db');
try { db.exec("ALTER TABLE listings ADD COLUMN platform TEXT;"); } catch(e) {}
console.log("Platform column added");
