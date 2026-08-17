const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageListing.tsx', 'utf8');

content = content.replace(
  /if \(data\.listing\.seller_id !== user\?\.id && !user\?\.is_admin\) \{/,
  `if (data.listing.seller_id !== user?.id && user?.role !== 'admin') {`
);

fs.writeFileSync('src/pages/ManageListing.tsx', content);
