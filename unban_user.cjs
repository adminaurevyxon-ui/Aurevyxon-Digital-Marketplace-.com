const db = require('better-sqlite3')('omniverse.db');
db.prepare("UPDATE users SET is_banned = 0 WHERE email = 'jagannathsing777@gmail.com'").run();
console.log("User unbanned.");
