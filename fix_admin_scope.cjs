const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const regex = /  const requireSuperAdmin = \([^)]*\) => \{\n    if \(req\.user\?\.role !== 'admin'\) \{\n      return res\.status\(403\)\.json\(\{ error: "Forbidden: Super Admin access required" \}\);\n    \}\n    next\(\);\n  \};\n/;
content = content.replace(regex, '');

const authRegex = /(  const authenticate = \([^)]*\) => \{[\s\S]*?  \};\n)/;
content = content.replace(authRegex, `$1\n  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Super Admin access required" });
    }
    next();
  };\n`);
fs.writeFileSync('server.ts', content);
