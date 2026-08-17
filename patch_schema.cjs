const sqlite = require('better-sqlite3');
const db = sqlite('omniverse.db');

try {
  db.prepare("ALTER TABLE seller_profiles ADD COLUMN admin_notes TEXT").run();
  console.log("Added admin_notes column");
} catch(e) { console.log(e.message); }

