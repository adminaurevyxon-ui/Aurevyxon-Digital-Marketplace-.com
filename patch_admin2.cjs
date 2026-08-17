const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

if (!content.includes('AdminSupportTickets')) {
  content = content.replace(
    /import \{ AdminAuditLogs \} from "\.\/AdminAuditLogs";/g,
    `import { AdminAuditLogs } from "./AdminAuditLogs";\nimport { AdminSupportTickets } from "./AdminSupportTickets";`
  );
  
  content = content.replace(
    /\{activeTab === 'support' && \(/g,
    `{activeTab === 'support' && <AdminSupportTickets />}\n       {activeTab === 'NOT_support' && (`
  );
  
  fs.writeFileSync('src/pages/Admin.tsx', content);
}
