const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf8');

content = content.replace(/'Full Stack Project'/g, "'Source Code'");
content = content.replace(/'AI System'/g, "'AI Systems'");
content = content.replace(/'SaaS Platform'/g, "'SaaS Platforms'");
content = content.replace(/'UI Kit'/g, "'UI/UX Kits'");
content = content.replace(/'Digital Business'/g, "'Full Websites'");
content = content.replace(/'Prompt Pack'/g, "'AI Systems'");

fs.writeFileSync('server/db.ts', content);
