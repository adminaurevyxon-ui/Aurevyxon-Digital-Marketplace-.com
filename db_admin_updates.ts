import Database from 'better-sqlite3';
const db = new Database('omniverse.db');

try { db.exec("ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT 0;"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0;"); } catch(e) {}

try { db.exec("ALTER TABLE listings ADD COLUMN is_approved BOOLEAN DEFAULT 1;"); } catch(e) {}
try { db.exec("ALTER TABLE listings ADD COLUMN is_featured BOOLEAN DEFAULT 0;"); } catch(e) {}

console.log("Admin DB schemas updated");
