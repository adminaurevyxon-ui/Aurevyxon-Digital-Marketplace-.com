const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /<span className="flex items-center"><Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" \/> \{listing.rating \|\| "5\.0"\}<\/span>/g;
content = content.replace(regex, `<span className="flex items-center"><Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" /> {listing.rating ? listing.rating.toFixed(1) : "0.0"} <span className="ml-1 opacity-70">({listing.review_count || 0})</span></span>`);

fs.writeFileSync('src/pages/Home.tsx', content);
