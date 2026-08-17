const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

content = content.replace(
  /\{activeTab === 'system' && systemStats && \(/g,
  `{activeTab === 'support' && <AdminSupportTickets />}\n       {activeTab === 'system' && systemStats && (`
);

fs.writeFileSync('src/pages/Admin.tsx', content);
