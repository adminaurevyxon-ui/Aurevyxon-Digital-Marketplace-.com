import Database from 'better-sqlite3';
const db = new Database('omniverse.db');

try { db.exec("ALTER TABLE users ADD COLUMN platform_balance REAL DEFAULT 0;"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN seller_balance REAL DEFAULT 0;"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN commission_rate REAL DEFAULT 0.25;"); } catch(e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );
  
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('1', 'global_commission_rate', '0.25');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('2', 'platform_wallet_balance', '0');

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    buyer_id TEXT,
    seller_id TEXT,
    listing_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    platform_fee REAL NOT NULL,
    seller_earnings REAL NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users (id),
    FOREIGN KEY (seller_id) REFERENCES users (id),
    FOREIGN KEY (listing_id) REFERENCES listings (id)
  );

  CREATE TABLE IF NOT EXISTS payout_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    method_type TEXT NOT NULL, -- e.g., 'bank_transfer', 'paypal', 'crypto', 'stripe'
    details TEXT NOT NULL, -- JSON string of details
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS payout_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    method_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'rejected'
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (method_id) REFERENCES payout_methods (id)
  );
`);
console.log("DB Updated Part 2");
