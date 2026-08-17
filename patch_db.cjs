const Database = require('better-sqlite3');
const db = new Database('omniverse.db');

try {
    db.exec(`
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
    `);

    // Add columns if they don't exist
    const addColumn = (table, col, def) => {
        const info = db.prepare(`PRAGMA table_info(${table})`).all();
        if (!info.find(c => c.name === col)) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
        }
    };

    addColumn('users', 'admin_role_id', 'TEXT');
    addColumn('users', 'admin_permissions', 'TEXT'); // overrides role if present
    addColumn('users', 'fraud_score', 'REAL DEFAULT 0');
    addColumn('users', 'is_suspended', 'BOOLEAN DEFAULT 0');
    addColumn('users', 'last_login', 'DATETIME');
    addColumn('users', 'admin_notes', 'TEXT');

    addColumn('listings', 'is_rejected', 'BOOLEAN DEFAULT 0');
    addColumn('listings', 'rejection_reason', 'TEXT');
    addColumn('listings', 'version', 'INTEGER DEFAULT 1');

    addColumn('transactions', 'tax_amount', 'REAL DEFAULT 0');
    addColumn('transactions', 'escrow_release_at', 'DATETIME');
    addColumn('transactions', 'is_disputed', 'BOOLEAN DEFAULT 0');

    // Create Super Admin Role if not exists
    const superAdminRole = db.prepare("SELECT * FROM admin_roles WHERE name = 'Super Admin'").get();
    if (!superAdminRole) {
        db.prepare("INSERT INTO admin_roles (id, name, permissions) VALUES (?, ?, ?)").run('1', 'Super Admin', JSON.stringify(['all']));
        db.prepare("UPDATE users SET admin_role_id = '1' WHERE email = 'admin@omniverse.com'").run();
    }
    
    console.log("DB patched successfully");
} catch (e) {
    console.error(e);
}
