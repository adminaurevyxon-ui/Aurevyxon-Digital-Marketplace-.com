const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const missingApis = `
  try { db.prepare("ALTER TABLE listings ADD COLUMN weighted_rating REAL DEFAULT 0").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE listings ADD COLUMN review_count INTEGER DEFAULT 0").run(); } catch(e) {}
`;

code = code.replace(
  '// --- End New APIS ---',
  missingApis + '\n  // --- End New APIS ---'
);
fs.writeFileSync('server.ts', code);
