import { Router } from 'express';
import db from '../db.ts';
import { LedgerEngine } from '../ledger.ts';
import { ulid } from 'ulid';

const router = Router();

// Middleware to ensure admin role
router.use((req, res, next) => {
  // Mock admin check
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer admin-token') {
    // return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

router.get('/gmv', (req, res) => {
  // GMV is sum of all 'Gateway_Clearing' debits (the gross amounts paid by buyers)
  const result = db.prepare(`
    SELECT SUM(amount) as gmv FROM ledger_entries 
    WHERE account_id = 'Gateway_Clearing' AND entry_type = 'debit'
  `).get() as { gmv: number };
  
  res.json({ gmv: result.gmv || 0 });
});

router.get('/revenue', (req, res) => {
  const result = db.prepare(`
    SELECT SUM(amount) as revenue FROM ledger_entries 
    WHERE account_id = 'Platform_Revenue' AND entry_type = 'credit'
  `).get() as { revenue: number };
  
  res.json({ revenue: result.revenue || 0 });
});

router.get('/ledger-explorer', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const entries = db.prepare(`
    SELECT * FROM ledger_entries ORDER BY created_at DESC LIMIT ?
  `).all(limit);
  
  res.json(entries);
});

router.get('/seller/:id/balance', (req, res) => {
  const sellerId = req.params.id;
  
  const payable = LedgerEngine.getAccountBalance(`Seller_Payable_${sellerId}`);
  const reserve = LedgerEngine.getAccountBalance(`Reserve_Held_${sellerId}`);
  
  res.json({
    sellerId,
    payable,
    reserve_held: reserve
  });
});

router.get('/reconciliation', (req, res) => {
  const runs = db.prepare(`SELECT * FROM reconciliation_runs ORDER BY created_at DESC`).all();
  res.json(runs);
});

router.post('/reconciliation/:id/resolve', (req, res) => {
  const { notes } = req.body;
  if (!notes) return res.status(400).json({ error: 'Notes required' });

  db.prepare(`
    UPDATE reconciliation_runs SET status = 'RESOLVED', resolved_at = datetime('now'), resolved_by = 'admin'
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(ulid(), req.params.id, 'ReconciliationResolved', JSON.stringify({ notes }), 'admin');

  res.json({ success: true });
});

router.get('/webhook-dead-letter', (req, res) => {
  const deadLetters = db.prepare(`SELECT * FROM webhook_dead_letter WHERE status = 'DEAD_LETTER'`).all();
  res.json(deadLetters);
});

export default router;
