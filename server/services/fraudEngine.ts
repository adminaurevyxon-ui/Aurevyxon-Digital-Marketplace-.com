import db from '../db.ts';
import { ulid } from 'ulid';

export class FraudRiskEngine {

  static calculateSellerRiskScore(sellerId: string) {
    let score = 10;
    const factors = [];

    // Check account age (just a mock query for now, assuming sellerId maps to a user)
    // Check KYC status
    const kyc = db.prepare(`SELECT * FROM user_kyc WHERE user_id = ?`).get(sellerId) as any;
    if (!kyc || kyc.status !== 'verified') {
      score += 40;
      factors.push('KYC not fully verified');
    }

    // Check dispute history
    const disputes = db.prepare(`
      SELECT count(*) as count FROM disputes WHERE seller_id = ?
    `).get(sellerId) as { count: number };
    if (disputes.count > 0) {
      score += (disputes.count * 15);
      factors.push(`Has ${disputes.count} historical disputes`);
    }

    score = Math.min(score, 100);
    return { score, factors };
  }

  static calculateTransactionRiskScore(orderId: string, buyerId: string, buyerCountry: string) {
    let score = 5;
    const factors = [];

    // High risk countries (example)
    const highRiskCountries = ['XX', 'YY'];
    if (highRiskCountries.includes(buyerCountry)) {
      score += 30;
      factors.push('High-risk buyer country');
    }

    // Velocity checks
    const recentOrders = db.prepare(`
      SELECT count(*) as count FROM orders 
      WHERE buyer_id = ? AND created_at >= datetime('now', '-24 hours')
    `).get(buyerId) as { count: number };
    
    if (recentOrders.count > 3) {
      score += 25;
      factors.push(`High purchase velocity: ${recentOrders.count} orders in 24h`);
    }

    score = Math.min(score, 100);
    return { score, factors };
  }

  static evaluateTransaction(orderId: string, buyerId: string, buyerCountry: string) {
    const { score, factors } = this.calculateTransactionRiskScore(orderId, buyerId, buyerCountry);
    
    let decision = 'AUTO_APPROVE';
    if (score > 75) decision = 'AUTO_REJECT';
    else if (score > 50) decision = 'HOLD'; // Apply reserve hold
    else if (score > 30) decision = 'MANUAL_REVIEW';

    db.prepare(`
      INSERT INTO fraud_evaluations (id, target_type, target_id, risk_score, contributing_factors, decision)
      VALUES (?, 'TRANSACTION', ?, ?, ?, ?)
    `).run(ulid(), orderId, score, JSON.stringify(factors), decision);

    db.prepare(`
      INSERT INTO system_events (id, aggregate_id, event_type, payload, triggered_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(ulid(), orderId, 'FraudEvaluationCompleted', JSON.stringify({ score, factors, decision }), 'system');

    return decision;
  }
}
