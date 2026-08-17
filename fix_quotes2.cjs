const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
  fs.writeFileSync(file, content);
}

fixFile('src/pages/AdminSupportTickets.tsx');
fixFile('src/pages/AdminKYC.tsx');
fixFile('src/pages/Admin.tsx');
