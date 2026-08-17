const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');
code = code.replace('is_featured?: boolean;', 'is_featured?: boolean;\n  review_count?: number;\n  weighted_rating?: number;');
fs.writeFileSync('src/pages/Home.tsx', code);
