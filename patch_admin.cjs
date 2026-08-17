const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

if (!content.includes('AdminAuditLogs')) {
  content = content.replace(
    /import \{ Card, CardContent, CardHeader, CardTitle \} from "@\/components\/ui\/card";/g,
    `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";\nimport { AdminAuditLogs } from "./AdminAuditLogs";`
  );
  
  content = content.replace(
    /\{activeTab === 'settings' && \(/g,
    `{activeTab === 'security' && <AdminAuditLogs />}\n       {activeTab === 'settings' && (`
  );
  
  fs.writeFileSync('src/pages/Admin.tsx', content);
}
