const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex1 = /const requireSuperAdmin = \(req: any, res: any, next: any\) => \{\n    if \(req\.user\.role !== 'admin'\) return res\.status\(403\)\.json\(\{ error: "Forbidden: Super Admin Access Required" \}\);\n    next\(\);\n  \};\n\n  /;
const regex2 = /const logAudit = \(admin_id: string, action: string, target: string, details: any = \{\}\) => \{\n    try \{\n      db\.prepare\("INSERT INTO audit_logs \(id, admin_id, action, target, details\) VALUES \(\?, \?, \?, \?, \?\)"\)\.run\(\n        crypto\.randomUUID\(\), admin_id, action, target, JSON\.stringify\(details\)\n      \);\n    \} catch\(e\) \{ console\.error\("Audit log failed", e\); \}\n  \};/;

const r1 = content.match(regex1);
const r2 = content.match(regex2);

if (r1 && r2) {
  content = content.replace(r1[0], '');
  content = content.replace(r2[0], '');
  
  content = content.replace(
    /\/\/ ========== ENTERPRISE ADMIN APIs ==========/g,
    `// ========== ENTERPRISE ADMIN APIs ==========\n  ${r1[0]}\n  ${r2[0]}`
  );
  fs.writeFileSync('server.ts', content);
} else {
  console.log("Could not find blocks");
}
