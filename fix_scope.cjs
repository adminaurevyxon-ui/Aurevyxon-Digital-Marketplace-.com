const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const requireSuperAdmin = \(req: any, res: any, next: any\) => \{[\s\S]*?next\(\);\n  \};/;
const match = content.match(regex);

if (match) {
  content = content.replace(match[0], '');
  content = content.replace(
    /const logAudit =/g,
    `${match[0]}\n\n  const logAudit =`
  );
  fs.writeFileSync('server.ts', content);
}
