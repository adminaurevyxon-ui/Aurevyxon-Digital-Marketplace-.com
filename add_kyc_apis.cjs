const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('/api/admin/kyc')) {
  const adminApiBlock = `
  // Admin KYC
  app.get("/api/admin/kyc", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const kycRecords = db.prepare("SELECT k.*, u.name as user_name, u.email as user_email FROM user_kyc k JOIN users u ON k.user_id = u.id ORDER BY k.created_at DESC").all();
      res.json({ kycRecords });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/kyc/:id/status", authenticate, requireSuperAdmin, (req, res) => {
    const { status, admin_notes } = req.body;
    try {
      const tx = db.transaction(() => {
        const kyc = db.prepare("SELECT * FROM user_kyc WHERE id = ?").get(req.params.id) as any;
        if (!kyc) throw new Error("KYC not found");
        
        db.prepare("UPDATE user_kyc SET status = ? WHERE id = ?").run(status, req.params.id);
        
        if (status === 'approved') {
          db.prepare("UPDATE users SET is_verified = 1 WHERE id = ?").run(kyc.user_id);
        } else if (status === 'rejected') {
          db.prepare("UPDATE users SET is_verified = 0 WHERE id = ?").run(kyc.user_id);
        }
        
        logAudit((req as any).user.id, "UPDATE_KYC_STATUS", req.params.id, { status, admin_notes });
      });
      tx();
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;
  content = content.replace('// ========== ENTERPRISE ADMIN APIs ==========', '// ========== ENTERPRISE ADMIN APIs ==========\n' + adminApiBlock);
  fs.writeFileSync('server.ts', content);
}
