const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /<span>★ \{listing.rating \|\| "5\.0"\}<\/span>/g;
content = content.replace(regex, `<span>★ {listing.rating ? listing.rating.toFixed(1) : "0.0"} <span className="text-gray-500 ml-0.5">({listing.review_count || 0})</span></span>`);

fs.writeFileSync('src/pages/Home.tsx', content);
