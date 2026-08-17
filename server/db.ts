import Database from 'better-sqlite3';
import { ulid } from 'ulid';
import bcrypt from 'bcryptjs';

const db = new Database('aurevyxon.db');

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('busy_timeout = 15000');
db.pragma('temp_store = MEMORY');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    admin_role_id TEXT,
    admin_permissions TEXT,
    fraud_score REAL DEFAULT 0,
    is_suspended BOOLEAN DEFAULT 0,
    last_login DATETIME,
    admin_notes TEXT,
    github_id TEXT,
    google_id TEXT,
    discord_id TEXT,
    avatar_url TEXT,
    github_username TEXT,
    provider TEXT DEFAULT 'local',
    phone_number TEXT,
    platform_balance REAL DEFAULT 0,
    seller_balance REAL DEFAULT 0,
    commission_rate REAL DEFAULT 0.25,
    is_banned BOOLEAN DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );
  
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('1', 'global_commission_rate', '0.25');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('2', 'platform_wallet_balance', '0');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('3', 'kyc_sla_hours', '72');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('10', 'stripe_enabled', '1');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('11', 'razorpay_enabled', '1');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('12', 'paypal_enabled', '1');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('13', 'upi_enabled', '1');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('14', 'crypto_gw_enabled', '1');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('15', 'crypto_direct_enabled', '1');
  INSERT OR IGNORE INTO platform_settings (id, key, value) VALUES ('16', 'bank_enabled', '1');

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
    tax_amount REAL DEFAULT 0,
    escrow_release_at DATETIME,
    is_disputed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users (id),
    FOREIGN KEY (seller_id) REFERENCES users (id),
    FOREIGN KEY (listing_id) REFERENCES listings (id)
  );

  CREATE TABLE IF NOT EXISTS payout_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    method_type TEXT NOT NULL,
    details TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS payout_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    method_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (method_id) REFERENCES payout_methods (id)
  );

  CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    description TEXT,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    language TEXT,
    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    type TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    is_rejected BOOLEAN DEFAULT 0,
    rejection_reason TEXT,
    version INTEGER DEFAULT 1,
    seller_id TEXT,
    buyer_id TEXT,
    image_url TEXT,
    file_url TEXT,
    tags TEXT,
    sales INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    is_approved BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    discount_percentage REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'None',
    custom_badge TEXT,
    screenshots TEXT,
    sub_category TEXT,
    platform TEXT,
    framework TEXT,
    license_type TEXT,
    support_type TEXT,
    language TEXT,
    compatibility TEXT,
    file_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users (id),
    FOREIGN KEY (buyer_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings (id),
    FOREIGN KEY (buyer_id) REFERENCES users (id)
  );

  
  
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

  CREATE TABLE IF NOT EXISTS user_kyc (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    document_url TEXT,
    bank_details TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS kyc_documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seller_profile_id TEXT,
    doc_slot TEXT NOT NULL,
    doc_type TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'UPLOADED_AWAITING_VERIFICATION',
    rejection_reason TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS seller_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    seller_type TEXT DEFAULT 'individual',
    kyc_status TEXT DEFAULT 'pending',
    pan_number TEXT,
    gstin TEXT,
    payout_method TEXT DEFAULT 'bank',
    payout_details TEXT,
    payout_verified BOOLEAN DEFAULT 0,
    commission_tier TEXT DEFAULT 'standard',
    seller_agreement_accepted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seller_verifications (
    id TEXT PRIMARY KEY,
    seller_profile_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    verification_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id)
  );

  CREATE TABLE IF NOT EXISTS kyc_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    seller_profile_id TEXT,
    current_step INTEGER DEFAULT 1,
    step1_status TEXT DEFAULT 'NOT_STARTED',
    step2_status TEXT DEFAULT 'LOCKED',
    step3_status TEXT DEFAULT 'LOCKED',
    step4_status TEXT DEFAULT 'LOCKED',
    kyc_status TEXT DEFAULT 'pending',
    submitted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS kyc_document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version_number INTEGER DEFAULT 1,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'UPLOADED',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES kyc_documents (id)
  );

  CREATE TABLE IF NOT EXISTS tax_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    seller_profile_id TEXT,
    tax_country TEXT NOT NULL,
    tax_id TEXT,
    gstin TEXT,
    business_type TEXT,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS business_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    seller_profile_id TEXT,
    business_name TEXT NOT NULL,
    reg_number TEXT,
    reg_cert_url TEXT,
    authorized_signatory TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS verification_requirements (
    id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL,
    seller_type TEXT NOT NULL,
    requirement_key TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS country_id_document_types (
    id TEXT PRIMARY KEY,
    country_name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    doc_id TEXT NOT NULL,
    doc_label TEXT NOT NULL,
    requires_back BOOLEAN DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS verification_reviews (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
  );

  
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT,
    moderation_status TEXT DEFAULT 'visible',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
\n  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER,
    valid_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    iso_code TEXT UNIQUE NOT NULL,
    phone_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'open',
    resolution TEXT,
    assigned_to TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cms_pages (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_display_name TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (recipient_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS system_events (
    id TEXT PRIMARY KEY,
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    triggered_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    immutable BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    immutable BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reconciliation_runs (
    id TEXT PRIMARY KEY,
    gateway TEXT NOT NULL,
    run_date DATE NOT NULL,
    status TEXT NOT NULL, -- 'CLEAN', 'MISMATCH_FOUND', 'RESOLVED'
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolved_by TEXT
  );

  CREATE TABLE IF NOT EXISTS webhook_dead_letter (
    id TEXT PRIMARY KEY,
    gateway TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED'
    next_retry_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fraud_evaluations (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL, -- 'SELLER', 'TRANSACTION'
    target_id TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    contributing_factors TEXT,
    decision TEXT NOT NULL, -- 'AUTO_APPROVE', 'MANUAL_REVIEW', 'AUTO_REJECT', 'HOLD'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (listing_id) REFERENCES listings (id),
    UNIQUE(user_id, listing_id)
  );
`);

// Seed data
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as any;
if (userCount.count === 0) {
  const adminId = ulid();
  const proUI = ulid();
  const quantAI = ulid();
  const codeStack = ulid();
  const designX = ulid();
  const finVentures = ulid();
  const aiMasters = ulid();

  const hash = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare("INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)");
  
  insertUser.run(adminId, 'Admin', 'admin@aurevyxon.com', hash, 'admin');
  insertUser.run(proUI, 'ProUI', 'proui@aurevyxon.com', hash, 'user');
  insertUser.run(quantAI, 'QuantAI', 'quant@aurevyxon.com', hash, 'user');
  insertUser.run(codeStack, 'CodeStack', 'code@aurevyxon.com', hash, 'user');
  insertUser.run(designX, 'DesignX', 'design@aurevyxon.com', hash, 'user');
  insertUser.run(finVentures, 'FinVentures', 'fin@aurevyxon.com', hash, 'user');
  insertUser.run(aiMasters, 'AI Masters', 'aimasters@aurevyxon.com', hash, 'user');

  const insertListing = db.prepare("INSERT INTO listings (id, title, description, price, type, mode, seller_id, image_url, tags, sales, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  insertListing.run('1', 'Apex - Premium SaaS Analytics Dashboard', 'A complete, production-ready full-stack SaaS analytics platform. Built with Next.js, Tailwind, and Prisma.', 249, 'Source Code', 'Unlimited', proUI, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80', JSON.stringify(["Next.js", "SaaS", "Dashboard"]), 145, 4.9);
  
  insertListing.run('2', 'NeuralTrade - Crypto AI Bot Core', 'High-frequency trading algorithm with continuous learning. Includes backtesting engine and Binance API integration.', 5900, 'AI Systems', 'Exclusive', quantAI, 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=800&q=80', JSON.stringify(["Python", "Machine Learning", "Trading"]), 0, 0);

  insertListing.run('3', 'EvoStore - E-commerce Multi-vendor Platform', 'Clone of major multi-vendor stores. Built with Node.js, React, and MongoDB. Includes admin and vendor dashboards.', 199, 'SaaS Platforms', 'Unlimited', codeStack, 'https://images.unsplash.com/photo-1661956602116-aa6865609028?auto=format&fit=crop&w=800&q=80', JSON.stringify(["React", "Node.js", "E-commerce"]), 890, 4.7);

  insertListing.run('4', 'Visionary - Mobile App UI Kit', '150+ premium mobile app screens for iOS and Android. Auto-layout, variants, and dark mode included.', 49, 'UI/UX Kits', 'Unlimited', designX, 'https://images.unsplash.com/photo-1607252656733-fd74e47190f8?auto=format&fit=crop&w=800&q=80', JSON.stringify(["Figma", "UI", "Mobile"]), 3200, 4.9);

  insertListing.run('5', 'NeoBank - Complete FinTech App (Acquisition)', 'Fully functioning FinTech application with $15k MMR. 10k Active users. Selling full ownership including domains and codebase.', 120000, 'Full Websites', 'Exclusive', finVentures, 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80', JSON.stringify(["FinTech", "Acquisition", "React Native"]), 0, 5.0);

  insertListing.run('6', 'PromptGenius - 10,000+ AI Prompts', 'The ultimate collection of prompts for Midjourney, ChatGPT, and Stable Diffusion.', 19, 'AI Systems', 'Unlimited', aiMasters, 'https://images.unsplash.com/photo-1684496269651-789304910b80?auto=format&fit=crop&w=800&q=80', JSON.stringify(["AI", "Prompts", "ChatGPT"]), 12500, 4.6);
}

export default db;
try {
  db.prepare("ALTER TABLE reviews ADD COLUMN moderation_status TEXT DEFAULT 'visible'").run();
} catch (e) {}

const sellerCols = [
  "full_legal_name TEXT",
  "dob TEXT",
  "phone TEXT",
  "phone_country_code TEXT DEFAULT '+91'",
  "phone_number TEXT",
  "phone_verified BOOLEAN DEFAULT 0",
  "address TEXT",
  "address_line1 TEXT",
  "address_line2 TEXT",
  "city TEXT",
  "state TEXT",
  "postal_code TEXT",
  "country TEXT DEFAULT 'India'",
  "id_type TEXT",
  "national_id TEXT",
  "id_document_url TEXT",
  "id_document_front_url TEXT",
  "id_document_back_url TEXT",
  "id_document_front_name TEXT",
  "id_document_back_name TEXT",
  "id_document_status TEXT DEFAULT 'NOT_UPLOADED'",
  "id_document_requires_back BOOLEAN DEFAULT 0",
  "tax_country TEXT",
  "tax_id TEXT",
  "tax_accepted BOOLEAN DEFAULT 0",
  "business_legal_name TEXT",
  "business_reg_number TEXT",
  "business_reg_cert_url TEXT",
  "business_reg_cert_name TEXT",
  "different_business_address BOOLEAN DEFAULT 0",
  "business_address_line1 TEXT",
  "business_address_line2 TEXT",
  "business_city TEXT",
  "business_state TEXT",
  "business_postal_code TEXT",
  "business_country TEXT",
  "authorized_signatory_name TEXT",
  "authorized_signatory_id TEXT",
  "business_tax_doc_url TEXT",
  "business_tax_doc_name TEXT",
  "declaration_version TEXT DEFAULT 'v1.0'",
  "declaration_ip TEXT",
  "declaration_user_agent TEXT",
  "declaration_accepted_at DATETIME",
  "bank_name TEXT",
  "account_holder TEXT",
  "account_number TEXT",
  "ifsc_code TEXT",
  "upi_id TEXT",
  "payout_mismatch_flagged BOOLEAN DEFAULT 0",
  "payout_mismatch_reason TEXT",
  "kyc_rejection_reason TEXT",
  "kyc_submitted_at DATETIME",
  "step1_status TEXT DEFAULT 'NOT_STARTED'",
  "step2_status TEXT DEFAULT 'LOCKED'",
  "step3_status TEXT DEFAULT 'LOCKED'",
  "step4_status TEXT DEFAULT 'LOCKED'",
  "current_step INTEGER DEFAULT 1"
];
for (const col of sellerCols) {
  try {
    db.prepare(`ALTER TABLE seller_profiles ADD COLUMN ${col}`).run();
  } catch (e) {}
}

// Seed countries if empty
const countryCount = db.prepare("SELECT count(*) as count FROM countries").get() as any;
if (!countryCount || countryCount.count === 0) {
  const insertCountry = db.prepare("INSERT OR IGNORE INTO countries (id, name, iso_code, phone_code, is_active) VALUES (?, ?, ?, ?, 1)");
  const INITIAL_COUNTRIES = [
    { name: "Afghanistan", iso_code: "AF", phone_code: "+93" },
    { name: "Albania", iso_code: "AL", phone_code: "+355" },
    { name: "Algeria", iso_code: "DZ", phone_code: "+213" },
    { name: "Andorra", iso_code: "AD", phone_code: "+376" },
    { name: "Angola", iso_code: "AO", phone_code: "+244" },
    { name: "Argentina", iso_code: "AR", phone_code: "+54" },
    { name: "Armenia", iso_code: "AM", phone_code: "+374" },
    { name: "Australia", iso_code: "AU", phone_code: "+61" },
    { name: "Austria", iso_code: "AT", phone_code: "+43" },
    { name: "Azerbaijan", iso_code: "AZ", phone_code: "+994" },
    { name: "Bahamas", iso_code: "BS", phone_code: "+1" },
    { name: "Bahrain", iso_code: "BH", phone_code: "+973" },
    { name: "Bangladesh", iso_code: "BD", phone_code: "+880" },
    { name: "Barbados", iso_code: "BB", phone_code: "+1" },
    { name: "Belarus", iso_code: "BY", phone_code: "+375" },
    { name: "Belgium", iso_code: "BE", phone_code: "+32" },
    { name: "Belize", iso_code: "BZ", phone_code: "+501" },
    { name: "Benin", iso_code: "BJ", phone_code: "+229" },
    { name: "Bhutan", iso_code: "BT", phone_code: "+975" },
    { name: "Bolivia", iso_code: "BO", phone_code: "+591" },
    { name: "Bosnia and Herzegovina", iso_code: "BA", phone_code: "+387" },
    { name: "Botswana", iso_code: "BW", phone_code: "+267" },
    { name: "Brazil", iso_code: "BR", phone_code: "+55" },
    { name: "Brunei", iso_code: "BN", phone_code: "+673" },
    { name: "Bulgaria", iso_code: "BG", phone_code: "+359" },
    { name: "Burkina Faso", iso_code: "BF", phone_code: "+226" },
    { name: "Burundi", iso_code: "BI", phone_code: "+257" },
    { name: "Cambodia", iso_code: "KH", phone_code: "+855" },
    { name: "Cameroon", iso_code: "CM", phone_code: "+237" },
    { name: "Canada", iso_code: "CA", phone_code: "+1" },
    { name: "Chad", iso_code: "TD", phone_code: "+235" },
    { name: "Chile", iso_code: "CL", phone_code: "+56" },
    { name: "China", iso_code: "CN", phone_code: "+86" },
    { name: "Colombia", iso_code: "CO", phone_code: "+57" },
    { name: "Costa Rica", iso_code: "CR", phone_code: "+506" },
    { name: "Croatia", iso_code: "HR", phone_code: "+385" },
    { name: "Cuba", iso_code: "CU", phone_code: "+53" },
    { name: "Cyprus", iso_code: "CY", phone_code: "+357" },
    { name: "Czech Republic", iso_code: "CZ", phone_code: "+420" },
    { name: "Denmark", iso_code: "DK", phone_code: "+45" },
    { name: "Dominican Republic", iso_code: "DO", phone_code: "+1" },
    { name: "Ecuador", iso_code: "EC", phone_code: "+593" },
    { name: "Egypt", iso_code: "EG", phone_code: "+20" },
    { name: "El Salvador", iso_code: "SV", phone_code: "+503" },
    { name: "Estonia", iso_code: "EE", phone_code: "+372" },
    { name: "Ethiopia", iso_code: "ET", phone_code: "+251" },
    { name: "Fiji", iso_code: "FJ", phone_code: "+679" },
    { name: "Finland", iso_code: "FI", phone_code: "+358" },
    { name: "France", iso_code: "FR", phone_code: "+33" },
    { name: "Gabon", iso_code: "GA", phone_code: "+241" },
    { name: "Gambia", iso_code: "GM", phone_code: "+220" },
    { name: "Georgia", iso_code: "GE", phone_code: "+995" },
    { name: "Germany", iso_code: "DE", phone_code: "+49" },
    { name: "Ghana", iso_code: "GH", phone_code: "+233" },
    { name: "Greece", iso_code: "GR", phone_code: "+30" },
    { name: "Guatemala", iso_code: "GT", phone_code: "+502" },
    { name: "Guyana", iso_code: "GY", phone_code: "+592" },
    { name: "Haiti", iso_code: "HT", phone_code: "+509" },
    { name: "Honduras", iso_code: "HN", phone_code: "+504" },
    { name: "Hong Kong", iso_code: "HK", phone_code: "+852" },
    { name: "Hungary", iso_code: "HU", phone_code: "+36" },
    { name: "Iceland", iso_code: "IS", phone_code: "+354" },
    { name: "India", iso_code: "IN", phone_code: "+91" },
    { name: "Indonesia", iso_code: "ID", phone_code: "+62" },
    { name: "Iran", iso_code: "IR", phone_code: "+98" },
    { name: "Iraq", iso_code: "IQ", phone_code: "+964" },
    { name: "Ireland", iso_code: "IE", phone_code: "+353" },
    { name: "Israel", iso_code: "IL", phone_code: "+972" },
    { name: "Italy", iso_code: "IT", phone_code: "+39" },
    { name: "Ivory Coast", iso_code: "CI", phone_code: "+225" },
    { name: "Jamaica", iso_code: "JM", phone_code: "+1" },
    { name: "Japan", iso_code: "JP", phone_code: "+81" },
    { name: "Jordan", iso_code: "JO", phone_code: "+962" },
    { name: "Kazakhstan", iso_code: "KZ", phone_code: "+7" },
    { name: "Kenya", iso_code: "KE", phone_code: "+254" },
    { name: "Kuwait", iso_code: "KW", phone_code: "+965" },
    { name: "Kyrgyzstan", iso_code: "KG", phone_code: "+996" },
    { name: "Laos", iso_code: "LA", phone_code: "+856" },
    { name: "Latvia", iso_code: "LV", phone_code: "+371" },
    { name: "Lebanon", iso_code: "LB", phone_code: "+961" },
    { name: "Lesotho", iso_code: "LS", phone_code: "+266" },
    { name: "Liberia", iso_code: "LR", phone_code: "+231" },
    { name: "Libya", iso_code: "LY", phone_code: "+218" },
    { name: "Liechtenstein", iso_code: "LI", phone_code: "+423" },
    { name: "Lithuania", iso_code: "LT", phone_code: "+370" },
    { name: "Luxembourg", iso_code: "LU", phone_code: "+352" },
    { name: "Macau", iso_code: "MO", phone_code: "+853" },
    { name: "Madagascar", iso_code: "MG", phone_code: "+261" },
    { name: "Malawi", iso_code: "MW", phone_code: "+265" },
    { name: "Malaysia", iso_code: "MY", phone_code: "+60" },
    { name: "Maldives", iso_code: "MV", phone_code: "+960" },
    { name: "Mali", iso_code: "ML", phone_code: "+223" },
    { name: "Malta", iso_code: "MT", phone_code: "+356" },
    { name: "Mauritius", iso_code: "MU", phone_code: "+230" },
    { name: "Mexico", iso_code: "MX", phone_code: "+52" },
    { name: "Moldova", iso_code: "MD", phone_code: "+373" },
    { name: "Monaco", iso_code: "MC", phone_code: "+377" },
    { name: "Mongolia", iso_code: "MN", phone_code: "+976" },
    { name: "Montenegro", iso_code: "ME", phone_code: "+382" },
    { name: "Morocco", iso_code: "MA", phone_code: "+212" },
    { name: "Mozambique", iso_code: "MZ", phone_code: "+258" },
    { name: "Myanmar", iso_code: "MM", phone_code: "+95" },
    { name: "Namibia", iso_code: "NA", phone_code: "+264" },
    { name: "Nepal", iso_code: "NP", phone_code: "+977" },
    { name: "Netherlands", iso_code: "NL", phone_code: "+31" },
    { name: "New Zealand", iso_code: "NZ", phone_code: "+64" },
    { name: "Nicaragua", iso_code: "NI", phone_code: "+505" },
    { name: "Niger", iso_code: "NE", phone_code: "+227" },
    { name: "Nigeria", iso_code: "NG", phone_code: "+234" },
    { name: "North Macedonia", iso_code: "MK", phone_code: "+389" },
    { name: "Norway", iso_code: "NO", phone_code: "+47" },
    { name: "Oman", iso_code: "OM", phone_code: "+968" },
    { name: "Pakistan", iso_code: "PK", phone_code: "+92" },
    { name: "Panama", iso_code: "PA", phone_code: "+507" },
    { name: "Papua New Guinea", iso_code: "PG", phone_code: "+675" },
    { name: "Paraguay", iso_code: "PY", phone_code: "+595" },
    { name: "Peru", iso_code: "PE", phone_code: "+51" },
    { name: "Philippines", iso_code: "PH", phone_code: "+63" },
    { name: "Poland", iso_code: "PL", phone_code: "+48" },
    { name: "Portugal", iso_code: "PT", phone_code: "+351" },
    { name: "Qatar", iso_code: "QA", phone_code: "+974" },
    { name: "Romania", iso_code: "RO", phone_code: "+40" },
    { name: "Russia", iso_code: "RU", phone_code: "+7" },
    { name: "Rwanda", iso_code: "RW", phone_code: "+250" },
    { name: "Saudi Arabia", iso_code: "SA", phone_code: "+966" },
    { name: "Senegal", iso_code: "SN", phone_code: "+221" },
    { name: "Serbia", iso_code: "RS", phone_code: "+381" },
    { name: "Seychelles", iso_code: "SC", phone_code: "+248" },
    { name: "Sierra Leone", iso_code: "SL", phone_code: "+232" },
    { name: "Singapore", iso_code: "SG", phone_code: "+65" },
    { name: "Slovakia", iso_code: "SK", phone_code: "+421" },
    { name: "Slovenia", iso_code: "SI", phone_code: "+386" },
    { name: "Somalia", iso_code: "SO", phone_code: "+252" },
    { name: "South Africa", iso_code: "ZA", phone_code: "+27" },
    { name: "South Korea", iso_code: "KR", phone_code: "+82" },
    { name: "South Sudan", iso_code: "SS", phone_code: "+211" },
    { name: "Spain", iso_code: "ES", phone_code: "+34" },
    { name: "Sri Lanka", iso_code: "LK", phone_code: "+94" },
    { name: "Sudan", iso_code: "SD", phone_code: "+249" },
    { name: "Suriname", iso_code: "SR", phone_code: "+597" },
    { name: "Sweden", iso_code: "SE", phone_code: "+46" },
    { name: "Switzerland", iso_code: "CH", phone_code: "+41" },
    { name: "Syria", iso_code: "SY", phone_code: "+963" },
    { name: "Taiwan", iso_code: "TW", phone_code: "+886" },
    { name: "Tajikistan", iso_code: "TJ", phone_code: "+992" },
    { name: "Tanzania", iso_code: "TZ", phone_code: "+255" },
    { name: "Thailand", iso_code: "TH", phone_code: "+66" },
    { name: "Togo", iso_code: "TG", phone_code: "+228" },
    { name: "Trinidad and Tobago", iso_code: "TT", phone_code: "+1" },
    { name: "Tunisia", iso_code: "TN", phone_code: "+216" },
    { name: "Turkey", iso_code: "TR", phone_code: "+90" },
    { name: "Turkmenistan", iso_code: "TM", phone_code: "+993" },
    { name: "Uganda", iso_code: "UG", phone_code: "+256" },
    { name: "Ukraine", iso_code: "UA", phone_code: "+380" },
    { name: "United Arab Emirates", iso_code: "AE", phone_code: "+971" },
    { name: "United Kingdom", iso_code: "GB", phone_code: "+44" },
    { name: "United States", iso_code: "US", phone_code: "+1" },
    { name: "Uruguay", iso_code: "UY", phone_code: "+598" },
    { name: "Uzbekistan", iso_code: "UZ", phone_code: "+998" },
    { name: "Venezuela", iso_code: "VE", phone_code: "+58" },
    { name: "Vietnam", iso_code: "VN", phone_code: "+84" },
    { name: "Yemen", iso_code: "YE", phone_code: "+967" },
    { name: "Zambia", iso_code: "ZM", phone_code: "+260" },
    { name: "Zimbabwe", iso_code: "ZW", phone_code: "+263" }
  ];

  for (const c of INITIAL_COUNTRIES) {
    try {
      insertCountry.run(ulid(), c.name, c.iso_code, c.phone_code);
    } catch (e) {}
  }
}

// Seed country_id_document_types database table
try {
  const docTypeCount = (db.prepare("SELECT COUNT(*) as c FROM country_id_document_types").get() as any)?.c || 0;
  if (docTypeCount === 0) {
    const insertDocType = db.prepare(`
      INSERT INTO country_id_document_types (id, country_name, country_code, doc_id, doc_label, requires_back, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const SEED_DOC_TYPES = [
      // India
      { country: "India", code: "IN", id: "Aadhaar", label: "Aadhaar Card", requiresBack: 1, desc: "Front & Back of UIDAI Aadhaar Card", order: 1 },
      { country: "India", code: "IN", id: "PAN", label: "PAN Card", requiresBack: 0, desc: "Permanent Account Number Card", order: 2 },
      { country: "India", code: "IN", id: "Passport", label: "Indian Passport", requiresBack: 0, desc: "Personal information page of valid Passport", order: 3 },
      { country: "India", code: "IN", id: "DriversLicense", label: "Driving Licence", requiresBack: 1, desc: "Smartcard Driving Licence", order: 4 },
      { country: "India", code: "IN", id: "VoterID", label: "Voter ID Card (EPIC)", requiresBack: 1, desc: "Election Commission Voter Identity Card", order: 5 },

      // United States
      { country: "United States", code: "US", id: "Passport", label: "US Passport", requiresBack: 0, desc: "Information page of unexpired US Passport", order: 1 },
      { country: "United States", code: "US", id: "DriversLicense", label: "State Driver's License", requiresBack: 1, desc: "Front & Back side of valid State DL", order: 2 },
      { country: "United States", code: "US", id: "StateID", label: "State Identification Card", requiresBack: 1, desc: "Front & Back side of State issued photo ID", order: 3 },
      { country: "United States", code: "US", id: "SSNCard", label: "Social Security Card (SSN)", requiresBack: 0, desc: "Official Social Security Administration Card", order: 4 },

      // United Kingdom
      { country: "United Kingdom", code: "GB", id: "Passport", label: "UK Passport", requiresBack: 0, desc: "Photo page of valid UK Passport", order: 1 },
      { country: "United Kingdom", code: "GB", id: "DriversLicense", label: "UK Photocard Driving Licence", requiresBack: 1, desc: "Front & Back side of UK photocard DL", order: 2 },
      { country: "United Kingdom", code: "GB", id: "NationalID", label: "Biometric Residence Permit (BRP)", requiresBack: 1, desc: "Front & Back side of UK BRP card", order: 3 },

      // Canada
      { country: "Canada", code: "CA", id: "Passport", label: "Canadian Passport", requiresBack: 0, desc: "Photo page of valid Canadian Passport", order: 1 },
      { country: "Canada", code: "CA", id: "DriversLicense", label: "Provincial Driver's License", requiresBack: 1, desc: "Front & Back side of provincial DL", order: 2 },
      { country: "Canada", code: "CA", id: "ProvincialID", label: "Provincial Photo Card", requiresBack: 1, desc: "Front & Back side of provincial photo ID", order: 3 },

      // Australia
      { country: "Australia", code: "AU", id: "Passport", label: "Australian Passport", requiresBack: 0, desc: "Photo page of valid Australian Passport", order: 1 },
      { country: "Australia", code: "AU", id: "DriversLicense", label: "Australian Driver Licence", requiresBack: 1, desc: "Front & Back side of state DL", order: 2 },
      { country: "Australia", code: "AU", id: "ProofOfAge", label: "Proof of Age Card", requiresBack: 1, desc: "Front & Back side of photo card", order: 3 },

      // Germany
      { country: "Germany", code: "DE", id: "NationalID", label: "Personalausweis (National ID)", requiresBack: 1, desc: "Front & Back side of German Personalausweis", order: 1 },
      { country: "Germany", code: "DE", id: "Passport", label: "Reisepass (Passport)", requiresBack: 0, desc: "Photo page of German Passport", order: 2 },
      { country: "Germany", code: "DE", id: "DriversLicense", label: "Führerschein (Driver's License)", requiresBack: 1, desc: "Front & Back side of EU photocard license", order: 3 },

      // United Arab Emirates
      { country: "United Arab Emirates", code: "AE", id: "EmiratesID", label: "Emirates ID Card", requiresBack: 1, desc: "Front & Back side of Federal Identity Card", order: 1 },
      { country: "United Arab Emirates", code: "AE", id: "Passport", label: "UAE Passport", requiresBack: 0, desc: "Personal details page of valid UAE Passport", order: 2 },

      // Singapore
      { country: "Singapore", code: "SG", id: "NRIC", label: "NRIC / FIN Card", requiresBack: 1, desc: "Front & Back side of Singapore NRIC/FIN Card", order: 1 },
      { country: "Singapore", code: "SG", id: "Passport", label: "Singapore Passport", requiresBack: 0, desc: "Personal details page of Singapore Passport", order: 2 },
      { country: "Singapore", code: "SG", id: "DriversLicense", label: "Singapore Driving Licence", requiresBack: 1, desc: "Front & Back side of Singapore DL", order: 3 },
    ];

    for (const item of SEED_DOC_TYPES) {
      try {
        insertDocType.run(ulid(), item.country, item.code, item.id, item.label, item.requiresBack, item.desc, item.order);
      } catch (e) {}
    }
  }
} catch (err) {
  console.error("Failed to seed country_id_document_types:", err);
}
