import db from './db.ts';
import { ulid } from 'ulid';

export interface LedgerEntry {
  transaction_id: string;
  account_id: string;
  entry_type: 'debit' | 'credit';
  amount: number;
  currency: string;
}

export class LedgerEngine {
  /**
   * Records a double-entry transaction in the ledger.
   * A valid transaction MUST have debits equal to credits.
   */
  static recordTransaction(entries: LedgerEntry[], triggeredBy: string = 'system') {
    const totalDebits = entries.filter(e => e.entry_type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = entries.filter(e => e.entry_type === 'credit').reduce((sum, e) => sum + e.amount, 0);

    // Core Principle: Debits MUST equal Credits
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new Error(`Ledger imbalance: Debits (${totalDebits}) != Credits (${totalCredits})`);
    }

    const transactionId = entries[0]?.transaction_id || ulid();

    const insertEntry = db.prepare(`
      INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, currency)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertEvent = db.prepare(`
      INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Use a database transaction to ensure atomicity
    const transaction = db.transaction((entries: LedgerEntry[]) => {
      for (const entry of entries) {
        insertEntry.run(
          ulid(),
          entry.transaction_id,
          entry.account_id,
          entry.entry_type,
          entry.amount,
          entry.currency || 'INR'
        );
      }

      // Record the immutable event for this transaction
      insertEvent.run(
        ulid(),
        transactionId,
        'LedgerTransactionRecorded',
        JSON.stringify({ entries }),
        triggeredBy
      );
    });

    transaction(entries);
  }

  /**
   * Calculates the current balance of any ledger account by summing credits and subtracting debits.
   */
  static getAccountBalance(accountId: string): number {
    const result = db.prepare(`
      SELECT 
        SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END) as total_debits
      FROM ledger_entries
      WHERE account_id = ?
    `).get(accountId) as { total_credits: number, total_debits: number };

    return (result.total_credits || 0) - (result.total_debits || 0);
  }

  /**
   * Process a split payment at point of sale
   */
  static processSplitPayment(
    saleId: string, 
    buyerId: string, 
    sellerId: string, 
    grossAmount: number, 
    commissionRate: number = 0.15,
    currency: string = 'INR'
  ) {
    const transactionId = ulid();
    const platformCommission = parseFloat((grossAmount * commissionRate).toFixed(2));
    
    // In India (Section 194-O), e-commerce operators must withhold 1% TDS on the GROSS amount
    const tdsRate = 0.01; 
    const tdsAmount = parseFloat((grossAmount * tdsRate).toFixed(2));
    
    const sellerNet = parseFloat((grossAmount - platformCommission - tdsAmount).toFixed(2));

    const entries: LedgerEntry[] = [
      // Gateway clearing receives the full gross amount (Debit)
      {
        transaction_id: transactionId,
        account_id: 'Gateway_Clearing',
        entry_type: 'debit',
        amount: grossAmount,
        currency
      },
      // Platform earns its commission (Credit)
      {
        transaction_id: transactionId,
        account_id: 'Platform_Revenue',
        entry_type: 'credit',
        amount: platformCommission,
        currency
      },
      // TDS Withheld - payable to government (Credit)
      {
        transaction_id: transactionId,
        account_id: 'TDS_Payable',
        entry_type: 'credit',
        amount: tdsAmount,
        currency
      },
      // Seller's net payout (Credit)
      {
        transaction_id: transactionId,
        account_id: `Seller_Payable_${sellerId}`,
        entry_type: 'credit',
        amount: sellerNet,
        currency
      }
    ];

    this.recordTransaction(entries, buyerId);

    // Record the Sale event
    db.prepare(`
      INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(ulid(), saleId, 'SaleCreated', JSON.stringify({
      grossAmount,
      platformCommission,
      tdsAmount,
      sellerNet,
      currency
    }), buyerId);
  }
}
