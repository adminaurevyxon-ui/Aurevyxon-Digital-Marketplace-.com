import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/SellerDashboard.tsx', 'utf8');

// We just let the unused vars stay or they might be used somewhere else.
// But we should remove `submitPayout`.
content = content.replace(
  /const submitPayout = async[\s\S]*?};/g,
  ''
);

fs.writeFileSync('src/pages/dashboard/SellerDashboard.tsx', content);
