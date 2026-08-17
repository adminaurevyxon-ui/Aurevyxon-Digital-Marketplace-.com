const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('/api/admin/transactions/:id/refund')) {
  const adminApiBlock = `
  app.post("/api/admin/transactions/:id/refund", authenticate, requireSuperAdmin, (req, res) => {
    const { reason } = req.body;
    try {
      const txId = req.params.id;
      const transaction = db.transaction(() => {
        const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as any;
        if (!tx) throw new Error("Transaction not found");
        if (tx.status === 'refunded') throw new Error("Already refunded");
        
        db.prepare("UPDATE transactions SET status = 'refunded' WHERE id = ?").run(txId);
        
        // Deduct from seller balance
        db.prepare("UPDATE users SET seller_balance = seller_balance - ? WHERE id = ?").run(tx.seller_earnings, tx.seller_id);
        // Deduct from platform wallet
        db.prepare("UPDATE platform_settings SET value = CAST(value AS REAL) - ? WHERE key = 'platform_wallet_balance'").run(tx.amount - tx.seller_earnings);
        
        logAudit((req as any).user.id, "REFUND_TRANSACTION", txId, { reason, amount: tx.amount });
      });
      transaction();
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;
  content = content.replace('app.get("/api/admin/transactions", authenticate, requireSuperAdmin, (req, res) => {', adminApiBlock + '\n  app.get("/api/admin/transactions", authenticate, requireSuperAdmin, (req, res) => {');
  fs.writeFileSync('server.ts', content);
}
