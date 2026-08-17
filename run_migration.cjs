const Database = require('better-sqlite3');
const db = new Database('omniverse.db');
try {
  db.exec("ALTER TABLE support_tickets ADD COLUMN resolution TEXT");
  db.exec("ALTER TABLE support_tickets ADD COLUMN assigned_to TEXT");
} catch(e) {
  // Ignore if columns already exist
}
console.log("Migration complete");
