import db from '../db.ts';

export class AccountingReports {

  static generatePLReport(startDate: string, endDate: string) {
    const revenue = db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries 
      WHERE account_id = 'Platform_Revenue' AND entry_type = 'credit'
      AND created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as { total: number };

    // In a full system, you would have expense accounts too (e.g. Gateway_Fees)
    const expenses = db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries 
      WHERE account_id = 'Operating_Expenses' AND entry_type = 'debit'
      AND created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as { total: number };

    return {
      period: { startDate, endDate },
      total_revenue: revenue.total || 0,
      total_expenses: expenses.total || 0,
      net_profit: (revenue.total || 0) - (expenses.total || 0)
    };
  }

  static generateTDSReport(startDate: string, endDate: string) {
    // Summarize TDS_Payable account activity
    const tdsCollected = db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries 
      WHERE account_id = 'TDS_Payable' AND entry_type = 'credit'
      AND created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as { total: number };

    return {
      period: { startDate, endDate },
      total_tds_collected: tdsCollected.total || 0
    };
  }

  static generateSellerSettlementReport(sellerId: string, startDate: string, endDate: string) {
    // To find gross sales, we'd need to join system_events or find the original transactions
    // Since we store seller net in Seller_Payable_<id>, let's just sum credits for this seller
    const sellerCredits = db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries 
      WHERE account_id = ? AND entry_type = 'credit'
      AND created_at >= ? AND created_at <= ?
    `).get(`Seller_Payable_${sellerId}`, startDate, endDate) as { total: number };

    const sellerPayouts = db.prepare(`
      SELECT SUM(amount) as total FROM ledger_entries 
      WHERE account_id = ? AND entry_type = 'debit'
      AND created_at >= ? AND created_at <= ?
    `).get(`Seller_Payable_${sellerId}`, startDate, endDate) as { total: number };

    return {
      sellerId,
      period: { startDate, endDate },
      total_earnings_credited: sellerCredits.total || 0,
      total_payouts_debited: sellerPayouts.total || 0
    };
  }
}
