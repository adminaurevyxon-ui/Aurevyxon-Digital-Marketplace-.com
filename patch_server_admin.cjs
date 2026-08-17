const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
  // ---------------------------------------------------------
  // ENTERPRISE ADMIN ROUTES
  // ---------------------------------------------------------

  // Fraud & Disputes
  app.get("/api/admin/fraud", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const disputes = db.prepare(\`
        SELECT d.*, t.amount, t.currency, u1.name as buyer_name, u2.name as seller_name 
        FROM disputes d
        JOIN transactions t ON d.transaction_id = t.id
        JOIN users u1 ON d.buyer_id = u1.id
        JOIN users u2 ON d.seller_id = u2.id
        ORDER BY d.created_at DESC
      \`).all();
      
      const suspiciousUsers = db.prepare(\`
        SELECT id, name, email, fraud_score, is_suspended, created_at 
        FROM users 
        WHERE fraud_score > 0 OR is_suspended = 1 
        ORDER BY fraud_score DESC 
        LIMIT 50
      \`).all();
      
      res.json({ disputes, suspiciousUsers });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/fraud/suspend/:userId", authenticate, requireSuperAdmin, (req, res) => {
    try {
      db.prepare("UPDATE users SET is_suspended = 1 WHERE id = ?").run(req.params.userId);
      res.json({ success: true });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

  // CMS
  app.get("/api/admin/cms/announcements", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const announcements = db.prepare("SELECT * FROM platform_announcements ORDER BY created_at DESC").all();
      res.json({ announcements });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/cms/announcements", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const { title, content } = req.body;
      db.prepare("INSERT INTO platform_announcements (id, title, content) VALUES (?, ?, ?)").run(ulid(), title, content);
      res.json({ success: true });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reports
  app.get("/api/admin/reports/export", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const { type } = req.query;
      let data = [];
      if (type === 'users') {
        data = db.prepare("SELECT id, name, email, role, created_at FROM users").all();
      } else if (type === 'transactions') {
        data = db.prepare("SELECT * FROM transactions").all();
      } else if (type === 'products') {
        data = db.prepare("SELECT id, title, price, sales FROM listings").all();
      }
      res.json({ data });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

`;

// Insert the routes before the catch-all
code = code.replace("// Catch-all for API to prevent HTML fallback", newRoutes + "\n  // Catch-all for API to prevent HTML fallback");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with admin routes");
