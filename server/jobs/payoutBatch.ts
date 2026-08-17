import db from '../db.ts';
import { ulid } from 'ulid';
import { LedgerEngine, LedgerEntry } from '../ledger.ts';

export class PayoutBatchProcessor {
  /**
   * Run payout batch job to transfer payable balances to actual seller accounts
   */
  static run() {
    console.log(`Starting Payout Batch Processor...`);

    // Find all Seller_Payable balances
    // This aggregates all credits and debits to find the net balance for all Seller_Payable accounts
    const balances = db.prepare(`
      SELECT 
        account_id,
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as net_balance
      FROM ledger_entries
      WHERE account_id LIKE 'Seller_Payable_%'
      GROUP BY account_id
      HAVING net_balance > 0
    `).all() as { account_id: string, net_balance: number }[];

    for (const b of balances) {
      if (b.net_balance < 100) {
        // Minimum payout threshold
        continue;
      }

      const sellerId = b.account_id.replace('Seller_Payable_', '');
      console.log(`Initiating payout of ${b.net_balance} for seller ${sellerId}`);

      try {
        // Simulate Gateway Payout API Call
        // const payoutResult = await Gateway.payout(sellerId, b.net_balance);
        
        // On success, record the ledger entries
        const payoutTxId = ulid();
        const entries: LedgerEntry[] = [
          {
            transaction_id: payoutTxId,
            account_id: b.account_id, // Seller_Payable
            entry_type: 'debit',
            amount: b.net_balance,
            currency: 'INR'
          },
          {
            transaction_id: payoutTxId,
            account_id: 'Gateway_Clearing', // Or a dedicated Payout_Clearing account
            entry_type: 'credit',
            amount: b.net_balance,
            currency: 'INR'
          }
        ];

        LedgerEngine.recordTransaction(entries, 'system');

        db.prepare(`
          INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(ulid(), sellerId, 'PayoutSettled', JSON.stringify({
          payout_transaction_id: payoutTxId,
          amount: b.net_balance
        }), 'system');

        console.log(`Successfully settled payout for ${sellerId}`);

      } catch (err) {
        console.error(`Failed to process payout for ${sellerId}:`, err);
        // On failure, do not debit. It will retry next batch.
      }
    }

    console.log(`Payout Batch Processor completed.`);
  }
}
