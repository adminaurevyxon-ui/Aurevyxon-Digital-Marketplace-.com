const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /app\.get\("\/api\/admin\/listings", authenticate, requireSuperAdmin, \(req, res\) => \{/g,
  `app.get("/api/admin/audit-logs", authenticate, requireSuperAdmin, (req, res) => {\n    try {\n      const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500").all();\n      res.json({ logs });\n    } catch(err: any) {\n      res.status(500).json({ error: err.message });\n    }\n  });\n\n  app.get("/api/admin/listings", authenticate, requireSuperAdmin, (req, res) => {`
);

fs.writeFileSync('server.ts', content);
