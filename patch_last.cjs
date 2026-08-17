const fs = require('fs');

// 1. Fix server.ts 'as any'
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/db\.prepare\((.*?)\)\.get\((.*?)\);/g, 'db.prepare($1).get($2) as any;');
serverCode = serverCode.replace(/listings\.map\(\(l\) =>/g, 'listings.map((l: any) =>');
fs.writeFileSync('server.ts', serverCode);

// 2. Fix Home.tsx Listing interface
let homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');
if (!homeCode.includes('review_count?: number')) {
  homeCode = homeCode.replace(/weighted_rating\?: number;/g, 'weighted_rating?: number;\n  review_count?: number;');
  fs.writeFileSync('src/pages/Home.tsx', homeCode);
} else {
  // Maybe it's missing in some other Listing interface definition?
  // Let's replace 'sales?: number;' with 'sales?: number;\n  review_count?: number;' just in case.
  if (homeCode.includes('sales?: number;') && !homeCode.includes('review_count?: number')) {
     homeCode = homeCode.replace(/sales\?: number;/g, 'sales?: number;\n  review_count?: number;\n  weighted_rating?: number;');
     fs.writeFileSync('src/pages/Home.tsx', homeCode);
  }
}

// 3. Fix MessageSquare in Listing.tsx
let listingCode = fs.readFileSync('src/pages/Listing.tsx', 'utf8');
if (!listingCode.includes('MessageSquare,') && !listingCode.includes('MessageSquare }')) {
    listingCode = listingCode.replace(/import \{(.*?)\} from "lucide-react";/, 'import {$1, MessageSquare} from "lucide-react";');
    fs.writeFileSync('src/pages/Listing.tsx', listingCode);
}
console.log("Patched!");
