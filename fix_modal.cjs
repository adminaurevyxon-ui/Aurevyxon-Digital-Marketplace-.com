const fs = require('fs');
let content = fs.readFileSync('src/components/ReviewModal.tsx', 'utf8');

content = content.replace(/\\`Bearer \\\$\\{token\\}\\`/g, "`Bearer ${token}`");

fs.writeFileSync('src/components/ReviewModal.tsx', content);
