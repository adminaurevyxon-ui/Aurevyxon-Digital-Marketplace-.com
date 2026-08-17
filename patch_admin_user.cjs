const Database = require('better-sqlite3');
const db = new Database('aurevyxon.db');

db.prepare("UPDATE users SET role = 'admin' WHERE email = 'jagannathsing777@gmail.com'").run();
console.log("Updated jagannathsing777@gmail.com to admin");
