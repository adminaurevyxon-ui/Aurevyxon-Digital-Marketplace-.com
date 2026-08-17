const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const additionalApis = `
  // --- New APIS ---
  try { db.prepare("ALTER TABLE users ADD COLUMN preferences TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN store_settings TEXT").run(); } catch(e) {}

  app.get("/api/seller/coupons", authenticate, (req: any, res) => {
     const coupons = db.prepare("SELECT * FROM coupons").all();
     res.json({ coupons });
  });

  app.post("/api/seller/coupons", authenticate, (req: any, res) => {
     const { code, discount_percentage, valid_until } = req.body;
     try {
       db.prepare("INSERT INTO coupons (id, code, discount_percentage, valid_until) VALUES (?, ?, ?, ?)").run(ulid(), code, discount_percentage, valid_until);
       res.json({ success: true, coupon: { code, discount_percentage } });
     } catch(e: any) {
       res.json({ error: e.message });
     }
  });

  app.get("/api/seller/settings", authenticate, (req: any, res) => {
     const user = db.prepare("SELECT store_settings FROM users WHERE id = ?").get(req.user.id) as any;
     res.json({ settings: user?.store_settings ? JSON.parse(user.store_settings) : null });
  });

  app.post("/api/seller/settings", authenticate, (req: any, res) => {
     db.prepare("UPDATE users SET store_settings = ? WHERE id = ?").run(JSON.stringify(req.body), req.user.id);
     res.json({ success: true });
  });

  app.post("/api/user/wallet/add-funds", authenticate, (req: any, res) => {
     db.prepare("UPDATE users SET seller_balance = seller_balance + ? WHERE id = ?").run(req.body.amount || 50, req.user.id);
     res.json({ success: true });
  });

  app.delete("/api/payout/methods/:id", authenticate, (req: any, res) => {
     db.prepare("DELETE FROM payout_methods WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
     res.json({ success: true });
  });

  app.get("/api/user/preferences", authenticate, (req: any, res) => {
     const user = db.prepare("SELECT preferences FROM users WHERE id = ?").get(req.user.id) as any;
     res.json({ preferences: user?.preferences });
  });

  app.post("/api/user/preferences", authenticate, (req: any, res) => {
     db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(JSON.stringify(req.body), req.user.id);
     res.json({ success: true });
  });

  app.get("/api/download/:orderId", authenticate, (req: any, res) => {
     const order = db.prepare("SELECT * FROM orders WHERE id = ? AND buyer_id = ?").get(req.params.orderId, req.user.id) as any;
     if (!order) return res.status(404).send("Not found");
     // Mock sending a file
     res.setHeader('Content-disposition', 'attachment; filename=purchase.zip');
     res.setHeader('Content-type', 'application/zip');
     res.send("MOCK_ZIP_CONTENT_PROD_READY");
  });
  // --- End New APIS ---
`;

// insert before the app.get("/api/dashboard" ...
code = code.replace(
  /app\.get\("\/api\/dashboard", authenticate, \(req: any, res\) => {/,
  additionalApis + '\n  app.get("/api/dashboard", authenticate, (req: any, res) => {'
);

fs.writeFileSync('server.ts', code);
