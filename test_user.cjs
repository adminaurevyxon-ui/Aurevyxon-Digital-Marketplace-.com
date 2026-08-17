const db = require('better-sqlite3')('omniverse.db');
const user = db.prepare("SELECT * FROM users WHERE email = 'jagannathsing777@gmail.com'").get();
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);
console.log(token);
