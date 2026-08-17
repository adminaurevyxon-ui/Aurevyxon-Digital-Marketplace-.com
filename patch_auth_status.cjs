const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/res\.sendStatus\(401\)/g, 'res.status(401).json({ error: "Unauthorized" })');
code = code.replace(/res\.sendStatus\(403\)/g, 'res.status(403).json({ error: "Forbidden" })');

fs.writeFileSync('server.ts', code);
