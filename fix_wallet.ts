import fs from 'fs';
let content = fs.readFileSync('src/pages/dashboard/SellerDashboard.tsx', 'utf8');

content = content.replace(/\/\/ Create a method first[\s\S]*?\} catch \(err: any\) \{\s*toast\.error\(err\.message\);\s*\}\s*\};/g, '');

fs.writeFileSync('src/pages/dashboard/SellerDashboard.tsx', content);
