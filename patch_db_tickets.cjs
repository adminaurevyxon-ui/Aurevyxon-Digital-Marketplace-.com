const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf8');

if (!content.includes('resolution TEXT')) {
  content = content.replace(
    /status TEXT DEFAULT 'open',/g,
    `status TEXT DEFAULT 'open',\n    resolution TEXT,\n    assigned_to TEXT,`
  );
  fs.writeFileSync('server/db.ts', content);
}
