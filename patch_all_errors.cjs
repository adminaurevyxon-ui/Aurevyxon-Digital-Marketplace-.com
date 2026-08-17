const fs = require('fs');

let homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
if (!homeCode.includes('review_count?: number;')) {
    homeCode = homeCode.replace(/weighted_rating\?: number;/g, 'weighted_rating?: number;\n  review_count?: number;');
    fs.writeFileSync('src/pages/Home.tsx', homeCode);
}
console.log("Patched Home.tsx");
