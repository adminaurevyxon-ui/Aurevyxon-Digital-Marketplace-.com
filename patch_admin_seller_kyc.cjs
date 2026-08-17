const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const getKycEndpoint = `  app.get("/api/admin/kyc", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const kycRecords = db.prepare("SELECT k.*, u.name as user_name, u.email as user_email FROM seller_profiles k JOIN users u ON k.user_id = u.id ORDER BY k.seller_agreement_accepted_at DESC").all();
      res.json({ kycRecords });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });`;

content = content.replace(/  app\.get\("\/api\/admin\/kyc"[\s\S]*?  \}\);/, getKycEndpoint);

const postKycEndpoint = `  app.post("/api/admin/kyc/:id/status", authenticate, requireSuperAdmin, (req, res) => {
    const { status, admin_notes } = req.body;
    try {
      const tx = db.transaction(() => {
        const profile = db.prepare("SELECT * FROM seller_profiles WHERE id = ?").get(req.params.id) as any;
        if (!profile) throw new Error("Seller profile not found");
        
        db.prepare("UPDATE seller_profiles SET kyc_status = ?, payout_verified = ?, admin_notes = ? WHERE id = ?").run(
            status, 
            status === 'verified' ? 1 : 0, 
            admin_notes || null, 
            req.params.id
        );
        
        if (status === 'verified') {
          db.prepare("UPDATE users SET role = 'seller' WHERE id = ?").run(profile.user_id);
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
              ulid(), profile.user_id, "kyc", "Your seller application has been approved!"
          );
        } else if (status === 'rejected') {
          db.prepare("UPDATE users SET role = 'user' WHERE id = ?").run(profile.user_id);
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
              ulid(), profile.user_id, "kyc", "Your seller application was rejected. Please review."
          );
        }
        
        logAudit((req as any).user.id, "UPDATE_SELLER_STATUS", req.params.id, { status, admin_notes });
      });
      tx();
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });`;

content = content.replace(/  app\.post\("\/api\/admin\/kyc\/:id\/status"[\s\S]*?  \}\);/, postKycEndpoint);

// Add delete seller profile endpoint
const deleteKycEndpoint = `
  app.delete("/api/admin/kyc/:id", authenticate, requireSuperAdmin, (req, res) => {
    try {
        const tx = db.transaction(() => {
            const profile = db.prepare("SELECT * FROM seller_profiles WHERE id = ?").get(req.params.id) as any;
            if (!profile) throw new Error("Not found");
            db.prepare("UPDATE users SET role = 'user' WHERE id = ?").run(profile.user_id);
            db.prepare("DELETE FROM seller_profiles WHERE id = ?").run(req.params.id);
            logAudit((req as any).user.id, "DELETE_SELLER_APPLICATION", req.params.id, { user_id: profile.user_id });
        });
        tx();
        res.json({ success: true });
    } catch(e: any) {
        res.status(500).json({ error: e.message });
    }
  });
`;

content = content.replace('// ========== ENTERPRISE ADMIN APIs ==========', '// ========== ENTERPRISE ADMIN APIs ==========\n' + deleteKycEndpoint);

fs.writeFileSync('server.ts', content);
