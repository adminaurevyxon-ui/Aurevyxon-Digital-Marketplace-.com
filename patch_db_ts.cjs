const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const newTables = `
  CREATE TABLE IF NOT EXISTS admin_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  );
  CREATE TABLE IF NOT EXISTS ip_blacklist (
    id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    admin_notes TEXT,
    resolution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id)
  );
  CREATE TABLE IF NOT EXISTS platform_announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

code = code.replace("CREATE TABLE IF NOT EXISTS user_kyc", newTables + "\n  CREATE TABLE IF NOT EXISTS user_kyc");

code = code.replace("role TEXT DEFAULT 'user',", "role TEXT DEFAULT 'user',\n    admin_role_id TEXT,\n    admin_permissions TEXT,\n    fraud_score REAL DEFAULT 0,\n    is_suspended BOOLEAN DEFAULT 0,\n    last_login DATETIME,\n    admin_notes TEXT,");
code = code.replace("status TEXT DEFAULT 'completed',", "status TEXT DEFAULT 'completed',\n    tax_amount REAL DEFAULT 0,\n    escrow_release_at DATETIME,\n    is_disputed BOOLEAN DEFAULT 0,");
code = code.replace("status TEXT DEFAULT 'active',", "status TEXT DEFAULT 'active',\n    is_rejected BOOLEAN DEFAULT 0,\n    rejection_reason TEXT,\n    version INTEGER DEFAULT 1,");

fs.writeFileSync('server/db.ts', code);
console.log("Patched server/db.ts");
