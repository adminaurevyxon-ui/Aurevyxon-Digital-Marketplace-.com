const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Add imports
const imports = `
import { AdminFraud } from "./admin/AdminFraud";
import { AdminCMS } from "./admin/AdminCMS";
import { AdminReports } from "./admin/AdminReports";
`;
code = code.replace("export default function Admin()", imports + "\nexport default function Admin()");

// Update the tabs list
code = code.replace(
  "['overview', 'transactions', 'payouts', 'users', 'kyc', 'products', 'support', 'marketing', 'system', 'security', 'settings']",
  "['overview', 'users', 'kyc', 'products', 'transactions', 'payouts', 'fraud', 'support', 'cms', 'reports', 'system', 'security', 'settings']"
);

// Add the rendering logic for the new tabs
const newRenders = `
       {activeTab === 'fraud' && <AdminFraud />}
       {activeTab === 'cms' && <AdminCMS />}
       {activeTab === 'reports' && <AdminReports />}
`;

code = code.replace("{activeTab === 'support' && <AdminSupportTickets />}", "{activeTab === 'support' && <AdminSupportTickets />}" + newRenders);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched Admin.tsx");
