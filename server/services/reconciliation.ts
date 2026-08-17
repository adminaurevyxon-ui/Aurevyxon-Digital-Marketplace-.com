import db from '../db.ts';
import { ulid } from 'ulid';

export class ReconciliationEngine {
  /**
   * Run daily reconciliation against a gateway settlement report
   * @param gateway 'stripe' | 'razorpay'
   * @param runDate Date string 'YYYY-MM-DD'
   * @param settlementReport Array of actual settled transactions from gateway
   */
  static run(gateway: string, runDate: string, settlementReport: any[]) {
    console.log(`Starting Reconciliation for ${gateway} on ${runDate}`);
    let mismatches = 0;
    const details = [];

    for (const reportTx of settlementReport) {
      // Find the sale event / ledger transaction for this orderId (referenceId)
      // We assume reportTx has { orderId, grossAmount, commission, sellerNet }
      
      const saleEvent = db.prepare(`
        SELECT * FROM system_events 
        WHERE aggregate_id = ? AND event_type = 'SaleCreated'
      `).get(reportTx.orderId) as any;

      if (!saleEvent) {
        mismatches++;
        details.push({ orderId: reportTx.orderId, error: 'Ledger record not found for gateway transaction' });
        continue;
      }

      const payload = JSON.parse(saleEvent.payload);
      
      // Compare values
      // Note: Math.abs for float comparison
      const grossMatch = Math.abs(payload.grossAmount - reportTx.grossAmount) < 0.01;
      const commissionMatch = Math.abs(payload.platformCommission - reportTx.commission) < 0.01;
      const netMatch = Math.abs(payload.sellerNet - reportTx.sellerNet) < 0.01;

      if (!grossMatch || !commissionMatch || !netMatch) {
        mismatches++;
        details.push({
          orderId: reportTx.orderId,
          error: 'Amount mismatch',
          ledger: payload,
          gateway: reportTx
        });
      }
    }

    const status = mismatches > 0 ? 'MISMATCH_FOUND' : 'CLEAN';

    db.prepare(`
      INSERT INTO reconciliation_runs (id, gateway, run_date, status, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(ulid(), gateway, runDate, status, JSON.stringify(details));

    console.log(`Reconciliation finished with status: ${status}. Mismatches: ${mismatches}`);
    return { status, mismatches, details };
  }

  static getRuns() {
    return db.prepare(`SELECT * FROM reconciliation_runs ORDER BY created_at DESC`).all();
  }

  static resolveRun(runId: string, resolvedBy: string, notes: string) {
    const run = db.prepare(`SELECT * FROM reconciliation_runs WHERE id = ?`).get(runId) as any;
    if (!run) throw new Error("Run not found");
    
    db.prepare(`
      UPDATE reconciliation_runs 
      SET status = 'RESOLVED', resolved_at = datetime('now'), resolved_by = ?
      WHERE id = ?
    `).run(resolvedBy, runId);

    db.prepare(`
      INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(ulid(), runId, 'ReconciliationResolved', JSON.stringify({ notes }), resolvedBy);
  }
}
