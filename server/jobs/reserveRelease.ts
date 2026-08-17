import db from '../db.ts';
import { ulid } from 'ulid';
import { LedgerEngine, LedgerEntry } from '../ledger.ts';

export class ReserveReleaseJob {
  /**
   * Release reserve funds that have passed their hold period (e.g. 30 days)
   * and have no active disputes.
   */
  static run(holdPeriodDays: number = 30) {
    console.log(`Starting Reserve Release Job (Hold Period: ${holdPeriodDays} days)...`);
    
    // Find all 'credit' entries into Reserve_Held accounts older than holdPeriodDays
    // and where we haven't already released them.
    const eligibleReserves = db.prepare(`
      SELECT l.id, l.transaction_id, l.account_id, l.amount, l.currency, l.created_at, e.aggregate_id as sale_id
      FROM ledger_entries l
      JOIN system_events e ON e.payload LIKE '%' || l.transaction_id || '%' AND (e.event_type = 'SaleCreated' OR e.event_type = 'LedgerTransactionRecorded')
      WHERE l.account_id LIKE 'Reserve_Held_%'
        AND l.entry_type = 'credit'
        AND l.created_at <= datetime('now', '-' || ? || ' days')
        -- Ensure this exact ledger entry hasn't been released (i.e. no debit for this transaction_id with RESERVE_RELEASE event)
        AND NOT EXISTS (
           SELECT 1 FROM system_events se 
           WHERE se.event_type = 'ReserveReleased' AND se.payload LIKE '%' || l.transaction_id || '%'
        )
    `).all(holdPeriodDays) as any[];

    for (const reserve of eligibleReserves) {
      // Check for disputes on this sale_id
      const hasDispute = db.prepare(`
        SELECT 1 FROM system_events 
        WHERE aggregate_id = ? 
        AND event_type IN ('DisputeOpened', 'ChargebackReceived')
      `).get(reserve.sale_id);

      if (hasDispute) {
        console.log(`Skipping release for ${reserve.transaction_id} due to active dispute.`);
        continue;
      }

      // Proceed to release
      const sellerId = reserve.account_id.replace('Reserve_Held_', '');
      
      const entries: LedgerEntry[] = [
        {
          transaction_id: ulid(),
          account_id: reserve.account_id,
          entry_type: 'debit',
          amount: reserve.amount,
          currency: reserve.currency
        },
        {
          transaction_id: ulid(),
          account_id: `Seller_Payable_${sellerId}`,
          entry_type: 'credit',
          amount: reserve.amount,
          currency: reserve.currency
        }
      ];

      // Re-use the same transaction ID to link them
      const releaseTxId = ulid();
      entries[0].transaction_id = releaseTxId;
      entries[1].transaction_id = releaseTxId;

      try {
        // Start db transaction inside LedgerEngine (it uses one)
        LedgerEngine.recordTransaction(entries, 'system');
        
        // Record specific release event tying back to original transaction
        db.prepare(`
          INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(ulid(), reserve.sale_id, 'ReserveReleased', JSON.stringify({ 
          original_transaction_id: reserve.transaction_id,
          release_transaction_id: releaseTxId,
          amount: reserve.amount 
        }), 'system_job');
        
        console.log(`Released ${reserve.amount} ${reserve.currency} for seller ${sellerId}`);
      } catch (err) {
        console.error(`Failed to release reserve ${reserve.transaction_id}:`, err);
      }
    }
    
    console.log(`Reserve Release Job completed.`);
  }
}
