const db = require('better-sqlite3')('omniverse.db');
console.log(db.prepare("SELECT email, is_banned FROM users").all());
