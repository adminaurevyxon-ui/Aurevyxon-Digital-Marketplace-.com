const fs = require('fs');
let content = fs.readFileSync('src/pages/StartSelling.tsx', 'utf8');
content = content.replace('sellerProfile.rejection_reason', 'sellerProfile.admin_notes');
fs.writeFileSync('src/pages/StartSelling.tsx', content);
