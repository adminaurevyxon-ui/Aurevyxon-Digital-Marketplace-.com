const db = require('better-sqlite3')('aurevyxon.db');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS seller_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      display_name TEXT,
      seller_type TEXT,
      kyc_status TEXT DEFAULT 'pending',
      pan_number TEXT,
      gstin TEXT,
      payout_method TEXT,
      payout_details TEXT,
      payout_verified BOOLEAN DEFAULT 0,
      commission_tier TEXT DEFAULT 'standard',
      seller_agreement_accepted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
  console.log("seller_profiles table created");
} catch(e) { console.error(e); }

try { db.exec(`ALTER TABLE transactions ADD COLUMN tds_deducted_amount REAL DEFAULT 0;`); } catch(e) {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN commission_rate_applied REAL DEFAULT 0;`); } catch(e) {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN net_seller_payout_amount REAL DEFAULT 0;`); } catch(e) {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN payment_gateway_txn_id TEXT;`); } catch(e) {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN payout_status TEXT DEFAULT 'pending';`); } catch(e) {}

console.log("Migration complete");
