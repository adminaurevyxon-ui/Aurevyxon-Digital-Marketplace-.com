import db from './server/db.ts';

try {
  db.prepare("SELECT * FROM support_tickets LIMIT 1").all();
  db.prepare("SELECT * FROM reviews LIMIT 1").all();
  db.prepare("SELECT * FROM payout_methods LIMIT 1").all();
  db.prepare("SELECT * FROM user_kyc LIMIT 1").all();
  console.log("All queries passed!");
} catch (e) {
  console.error("SQL Error:", e);
}
