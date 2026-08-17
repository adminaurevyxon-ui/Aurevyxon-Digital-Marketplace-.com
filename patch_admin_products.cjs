const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

if (!content.includes('Edit Listing')) {
  content = content.replace(
    /<Button size="sm" onClick=\{\(\) => deleteListing\(l\.id\)\}/,
    `<Button size="sm" variant="outline" onClick={() => navigate(\`/manage/\${l.id}\`)} className="h-8 border-border text-xs">Edit Listing</Button>\n<Button size="sm" onClick={() => deleteListing(l.id)}`
  );
  fs.writeFileSync('src/pages/Admin.tsx', content);
}
