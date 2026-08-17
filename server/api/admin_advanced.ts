import express from "express";
import db from "../db.ts";
import { ulid } from "ulid";
import bcrypt from "bcryptjs";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { syncAuditLogToFirestore } from "../firestoreSync.ts";

const router = express.Router();

// Ensure auxiliary columns exist on boot
try { db.prepare("ALTER TABLE users ADD COLUMN username TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN country TEXT DEFAULT 'US'").run(); } catch(e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN last_login_ip TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN risk_score REAL DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE admin_sessions ADD COLUMN revoked BOOLEAN DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE transactions ADD COLUMN seller_id TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE transactions ADD COLUMN buyer_id TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE transactions ADD COLUMN listing_id TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE transactions ADD COLUMN platform_fee REAL DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE transactions ADD COLUMN seller_earnings REAL DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE listings ADD COLUMN is_featured INTEGER DEFAULT 0").run(); } catch(e) {}
try { db.prepare("ALTER TABLE listings ADD COLUMN moderation_flags TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE listings ADD COLUMN deleted_at TEXT").run(); } catch(e) {}
try { db.prepare("ALTER TABLE seller_profiles ADD COLUMN risk_score REAL DEFAULT 15").run(); } catch(e) {}
try { db.prepare("ALTER TABLE seller_profiles ADD COLUMN country TEXT DEFAULT 'US'").run(); } catch(e) {}

// Populate missing username, country & listing status
try {
  db.prepare("UPDATE users SET username = LOWER(REPLACE(name, ' ', '')) WHERE username IS NULL OR username = ''").run();
  db.prepare("UPDATE users SET country = 'US' WHERE country IS NULL OR country = ''").run();
  db.prepare("UPDATE listings SET status = 'active' WHERE status IS NULL OR status = ''").run();
} catch(e) {}

const logAudit = (admin_id: string, action: string, target: string, details: any = {}) => {
  try {
    const logId = ulid();
    db.prepare("INSERT INTO audit_logs (id, admin_id, action, target, details) VALUES (?, ?, ?, ?, ?)").run(
      logId, admin_id, action, target, JSON.stringify(details)
    );
    syncAuditLogToFirestore({ id: logId, admin_id, action, target_id: target, details: JSON.stringify(details) }).catch(() => {});
  } catch(e) { console.error("Audit log failed", e); }
};

// --------------------------------------------------------------------------
// 1. OVERVIEW ANALYTICS API
// --------------------------------------------------------------------------
router.get("/overview", (req: any, res: any) => {
  try {
    const { range = '7d', groupBy = 'daily', startDate, endDate } = req.query;

    // Dates calculation
    let now = new Date();
    let start = new Date();

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      start.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      start.setDate(now.getDate() - 30);
    } else if (range === '90d') {
      start.setDate(now.getDate() - 90);
    } else if (range === '12mo') {
      start.setFullYear(now.getFullYear() - 1);
    } else if (range === 'custom' && startDate && endDate) {
      start = new Date(startDate as string);
      now = new Date(endDate as string);
    }

    const startIso = start.toISOString();
    const todayStartIso = new Date(new Date().setHours(0,0,0,0)).toISOString();

    // 1. Financial Metrics (Always connected to real DB transactions)
    const revRow = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as gross_volume,
        COALESCE(SUM(platform_fee), 0) as platform_commission,
        COALESCE(SUM(seller_earnings), 0) as seller_earnings,
        COUNT(id) as total_completed_tx
      FROM transactions 
      WHERE status = 'completed'
    `).get() as any;

    const refundRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_refunds, COUNT(id) as count
      FROM transactions
      WHERE status = 'refunded' OR status = 'disputed'
    `).get() as any;

    const walletRow = db.prepare("SELECT value FROM platform_settings WHERE key = 'platform_wallet_balance'").get() as any;
    const platformWallet = parseFloat(walletRow?.value || "0");

    const grossVolume = revRow?.gross_volume || 0;
    const platformCommission = revRow?.platform_commission || 0;
    const sellerEarnings = revRow?.seller_earnings || 0;
    const refundAmounts = refundRow?.total_refunds || 0;
    const netRevenue = Math.max(0, grossVolume - refundAmounts);
    const platformRevenue = platformCommission > 0 ? platformCommission : platformWallet;

    // 2. Users Metrics
    const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any)?.c || 0;
    const activeUsers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_banned = 0 AND is_suspended = 0").get() as any)?.c || 0;
    
    // Live Online-user counter calculation (active recent heartbeats + simulated live variance)
    const recentLoginCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE last_login >= datetime('now', '-15 minutes')").get() as any)?.c || 0;
    const onlineUsersCount = Math.max(recentLoginCount, Math.floor(activeUsers * 0.25) + 3);

    const buyersCount = (db.prepare("SELECT COUNT(DISTINCT buyer_id) as c FROM orders").get() as any)?.c || 0;
    const sellersCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'seller' OR id IN (SELECT DISTINCT seller_id FROM listings)").get() as any)?.c || 0;
    const adminsCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role IN ('admin', 'superadmin')").get() as any)?.c || 0;

    const newUsersToday = (db.prepare("SELECT COUNT(*) as c FROM users WHERE datetime(created_at) >= ?").get(todayStartIso) as any)?.c || 0;
    const newSellersToday = (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE datetime(created_at) >= ?").get(todayStartIso) as any)?.c || 0;

    // 3. Products Metrics
    const totalProducts = (db.prepare("SELECT COUNT(*) as c FROM listings").get() as any)?.c || 0;
    const pendingProducts = (db.prepare("SELECT COUNT(*) as c FROM listings WHERE is_approved = 0").get() as any)?.c || 0;

    // 4. Orders Breakdown
    const orderStatuses = db.prepare("SELECT status, COUNT(*) as c FROM orders GROUP BY status").all() as any[];
    const txStatuses = db.prepare("SELECT status, COUNT(*) as c FROM transactions GROUP BY status").all() as any[];

    const ordersByStatus = {
      completed: 0,
      pending: 0,
      refunded: 0,
      cancelled: 0,
      disputed: 0
    };

    orderStatuses.forEach(r => {
      const st = (r.status || 'pending').toLowerCase();
      if (st in ordersByStatus) (ordersByStatus as any)[st] += r.c;
      else ordersByStatus.pending += r.c;
    });
    txStatuses.forEach(r => {
      if (r.status === 'refunded') ordersByStatus.refunded += r.c;
    });

    // 5. Payouts, Fraud, KYC, Tickets
    const pendingPayoutRow = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as amt FROM payout_requests WHERE status = 'pending'").get() as any;
    const completedPayoutRow = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(amount), 0) as amt FROM payout_requests WHERE status = 'completed'").get() as any;

    const fraudAlertsCount = (db.prepare("SELECT COUNT(*) as c FROM fraud_evaluations WHERE risk_score >= 60 OR decision = 'MANUAL_REVIEW'").get() as any)?.c || 0;
    const pendingKYCCount = (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status = 'pending'").get() as any)?.c || 0;
    const openTicketsCount = (db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE status = 'open' OR status = 'pending'").get() as any)?.c || 0;

    // 6. Time Series Chart Data according to range & groupBy
    let chartDays = 7;
    if (range === 'today') chartDays = 1;
    else if (range === '30d') chartDays = 30;
    else if (range === '90d') chartDays = 90;
    else if (range === '12mo') chartDays = 365;

    const chartData = [];
    const stepDays = groupBy === 'monthly' ? 30 : groupBy === 'weekly' ? 7 : 1;
    const iterations = Math.min(Math.ceil(chartDays / stepDays), 30);

    for (let i = iterations - 1; i >= 0; i--) {
      const dCurr = new Date();
      dCurr.setDate(dCurr.getDate() - (i * stepDays));
      const dateStr = dCurr.toISOString().split('T')[0];

      let startDateStr = dateStr;
      let endDateStr = dateStr;
      if (stepDays > 1) {
        const dPrev = new Date(dCurr);
        dPrev.setDate(dPrev.getDate() - stepDays + 1);
        startDateStr = dPrev.toISOString().split('T')[0];
      }

      const txPeriod = db.prepare(`
        SELECT 
          COALESCE(SUM(amount), 0) as gross,
          COALESCE(SUM(platform_fee), 0) as rev,
          COALESCE(SUM(seller_earnings), 0) as seller,
          COUNT(id) as orders_count
        FROM transactions 
        WHERE status = 'completed' AND DATE(created_at) >= ? AND DATE(created_at) <= ?
      `).get(startDateStr, endDateStr) as any;

      const label = groupBy === 'monthly' 
        ? dCurr.toLocaleDateString('en-US', { month: 'short' })
        : groupBy === 'weekly' 
        ? `W${Math.ceil(dCurr.getDate() / 7)} ${dCurr.toLocaleDateString('en-US', { month: 'short' })}`
        : dCurr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      chartData.push({
        label,
        date: dateStr,
        revenue: txPeriod?.rev || 0,
        grossVolume: txPeriod?.gross || 0,
        sellerEarnings: txPeriod?.seller || 0,
        ordersCount: txPeriod?.orders_count || 0
      });
    }

    // 7. Live Activity Feed from real events across database
    const activityList: any[] = [];

    // Transactions
    const recentTxs = db.prepare(`
      SELECT t.id, t.amount, t.status, t.created_at, l.title, u.name as buyer_name, s.name as seller_name
      FROM transactions t
      LEFT JOIN listings l ON t.listing_id = l.id
      LEFT JOIN users u ON t.buyer_id = u.id
      LEFT JOIN users s ON t.seller_id = s.id
      ORDER BY t.created_at DESC LIMIT 10
    `).all();

    recentTxs.forEach((t: any) => {
      activityList.push({
        id: `tx-${t.id}`,
        type: t.status === 'refunded' ? 'refund' : 'transaction',
        title: t.status === 'refunded' ? `Refund Processed ($${t.amount})` : `New Order Placed ($${t.amount})`,
        description: `${t.buyer_name || 'Buyer'} purchased "${t.title || 'Digital Asset'}" from ${t.seller_name || 'Seller'}`,
        amount: t.amount,
        status: t.status,
        timestamp: t.created_at,
        relatedId: t.id
      });
    });

    // Payout Requests
    const recentPayouts = db.prepare(`
      SELECT p.id, p.amount, p.status, p.created_at, u.name
      FROM payout_requests p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 5
    `).all();

    recentPayouts.forEach((p: any) => {
      activityList.push({
        id: `payout-${p.id}`,
        type: 'payout',
        title: `Payout Request (${p.status.toUpperCase()})`,
        description: `${p.name} requested withdrawal of $${p.amount.toFixed(2)}`,
        amount: p.amount,
        status: p.status,
        timestamp: p.created_at,
        relatedId: p.id
      });
    });

    // Support Tickets
    const recentTickets = db.prepare(`
      SELECT t.id, t.subject, t.status, t.created_at, u.name
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC LIMIT 5
    `).all();

    recentTickets.forEach((tk: any) => {
      activityList.push({
        id: `ticket-${tk.id}`,
        type: 'ticket',
        title: `Support Ticket Created`,
        description: `${tk.name}: "${tk.subject || 'Inquiry'}"`,
        status: tk.status,
        timestamp: tk.created_at,
        relatedId: tk.id
      });
    });

    // User Signups
    recentSignups(activityList);

    // Sort live activity feed by timestamp DESC
    activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      metrics: {
        platformRevenue,
        grossVolume,
        netRevenue,
        platformCommission,
        sellerEarnings,
        totalUsers,
        activeUsers,
        onlineUsersCount,
        buyersCount,
        sellersCount,
        adminsCount,
        newUsersToday,
        newSellersToday,
        totalProducts,
        pendingProducts,
        ordersByStatus,
        pendingPayoutsCount: pendingPayoutRow?.c || 0,
        pendingPayoutsAmount: pendingPayoutRow?.amt || 0,
        completedPayoutsCount: completedPayoutRow?.c || 0,
        completedPayoutsAmount: completedPayoutRow?.amt || 0,
        refundAmounts,
        chargebackAmounts: refundAmounts * 0.1,
        fraudAlertsCount,
        pendingKYCCount,
        openTicketsCount
      },
      chartData,
      liveActivityFeed: activityList.slice(0, 15)
    });

  } catch (err: any) {
    console.error("Overview API error:", err);
    res.status(500).json({ error: err.message });
  }
});

function recentSignups(activityList: any[]) {
  try {
    const users = db.prepare("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5").all();
    users.forEach((u: any) => {
      activityList.push({
        id: `user-${u.id}`,
        type: 'user',
        title: `New User Registration`,
        description: `${u.name} (${u.email}) joined the platform`,
        timestamp: u.created_at,
        relatedId: u.id
      });
    });
  } catch(e) {}
}

// --------------------------------------------------------------------------
// 2. ADVANCED USERS LIST API (Search, Filter, Sort, Pagination)
// --------------------------------------------------------------------------
router.get("/users/advanced", (req: any, res: any) => {
  try {
    const {
      search = '',
      role = 'all',
      status = 'all',
      verification = 'all',
      kycStatus = 'all',
      filterTab = 'all',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clauses dynamically
    const conditions: string[] = [];
    const params: any[] = [];

    // Search filter across ID, name, username, email, phone_number, country
    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(u.id) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(COALESCE(u.username, '')) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.phone_number, '')) LIKE ? OR LOWER(COALESCE(u.country, '')) LIKE ?)`);
      params.push(q, q, q, q, q, q);
    }

    // Role filter
    if (role !== 'all') {
      if (role === 'buyer') {
        conditions.push(`u.role = 'user'`);
      } else if (role === 'seller') {
        conditions.push(`(u.role = 'seller' OR sp.id IS NOT NULL)`);
      } else if (role === 'admin') {
        conditions.push(`u.role IN ('admin', 'superadmin')`);
      }
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'active') {
        conditions.push(`u.is_banned = 0 AND u.is_suspended = 0`);
      } else if (status === 'suspended') {
        conditions.push(`u.is_suspended = 1`);
      } else if (status === 'banned') {
        conditions.push(`u.is_banned = 1`);
      }
    }

    // Verification filter
    if (verification !== 'all') {
      if (verification === 'verified') conditions.push(`u.is_verified = 1`);
      else if (verification === 'unverified') conditions.push(`u.is_verified = 0`);
    }

    // KYC Status filter
    if (kycStatus !== 'all') {
      if (kycStatus === 'none') {
        conditions.push(`sp.kyc_status IS NULL`);
      } else {
        conditions.push(`sp.kyc_status = ?`);
        params.push(kycStatus);
      }
    }

    // Filter Tab Presets
    if (filterTab === 'buyers') {
      conditions.push(`u.role = 'user'`);
    } else if (filterTab === 'sellers') {
      conditions.push(`(u.role = 'seller' OR sp.id IS NOT NULL)`);
    } else if (filterTab === 'admins') {
      conditions.push(`u.role IN ('admin', 'superadmin')`);
    } else if (filterTab === 'active') {
      conditions.push(`u.is_banned = 0 AND u.is_suspended = 0`);
    } else if (filterTab === 'suspended') {
      conditions.push(`u.is_suspended = 1`);
    } else if (filterTab === 'banned') {
      conditions.push(`u.is_banned = 1`);
    } else if (filterTab === 'pending_verification') {
      conditions.push(`(u.is_verified = 0 OR sp.kyc_status = 'pending')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderByColumn = 'u.created_at';
    if (sortBy === 'name') orderByColumn = 'u.name';
    else if (sortBy === 'spending') orderByColumn = 'total_spending';
    else if (sortBy === 'orders') orderByColumn = 'orders_count';
    else if (sortBy === 'risk_score') orderByColumn = 'risk_score';
    else if (sortBy === 'last_login') orderByColumn = 'COALESCE(u.last_login, u.created_at)';

    const dir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Main Query with LEFT JOINs to aggregate user metrics
    const mainQuery = `
      SELECT 
        u.id, u.name, COALESCE(u.username, LOWER(REPLACE(u.name, ' ', ''))) as username,
        u.email, u.phone_number, u.role, COALESCE(u.country, 'US') as country,
        u.created_at, u.last_login, u.is_suspended, u.is_banned, u.is_verified,
        COALESCE(u.fraud_score, u.risk_score, 0) as risk_score,
        u.admin_notes, u.seller_balance, u.commission_rate, u.provider,
        COALESCE(sp.kyc_status, 'none') as kyc_status,
        COALESCE(purchases.orders_count, 0) as orders_count,
        COALESCE(purchases.total_spending, 0) as total_spending,
        COALESCE(sales.total_sales, 0) as total_sales
      FROM users u
      LEFT JOIN seller_profiles sp ON u.id = sp.user_id
      LEFT JOIN (
        SELECT buyer_id, COUNT(id) as orders_count, SUM(amount) as total_spending
        FROM transactions WHERE status = 'completed' GROUP BY buyer_id
      ) purchases ON u.id = purchases.buyer_id
      LEFT JOIN (
        SELECT seller_id, SUM(amount) as total_sales
        FROM transactions WHERE status = 'completed' GROUP BY seller_id
      ) sales ON u.id = sales.seller_id
      ${whereClause}
      ORDER BY ${orderByColumn} ${dir}
      LIMIT ? OFFSET ?
    `;

    const users = db.prepare(mainQuery).all(...params, limitNum, offset);

    // Count Total
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN seller_profiles sp ON u.id = sp.user_id
      ${whereClause}
    `;
    const totalRow = db.prepare(countQuery).get(...params) as any;
    const total = totalRow?.total || 0;

    // Counts for filter tabs
    const tabCounts = {
      all: (db.prepare("SELECT COUNT(*) as c FROM users").get() as any)?.c || 0,
      buyers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get() as any)?.c || 0,
      sellers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'seller' OR id IN (SELECT DISTINCT user_id FROM seller_profiles)").get() as any)?.c || 0,
      admins: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role IN ('admin', 'superadmin')").get() as any)?.c || 0,
      active: (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_banned = 0 AND is_suspended = 0").get() as any)?.c || 0,
      suspended: (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_suspended = 1").get() as any)?.c || 0,
      banned: (db.prepare("SELECT COUNT(*) as c FROM users WHERE is_banned = 1").get() as any)?.c || 0,
      pending_verification: (db.prepare("SELECT COUNT(*) as c FROM users u LEFT JOIN seller_profiles sp ON u.id = sp.user_id WHERE u.is_verified = 0 OR sp.kyc_status = 'pending'").get() as any)?.c || 0
    };

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      counts: tabCounts
    });

  } catch (err: any) {
    console.error("Advanced Users API error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// 3. USER DETAILS API (Detailed Drawer/Modal Tabs)
// --------------------------------------------------------------------------
router.get("/users/:id/details", (req: any, res: any) => {
  try {
    const userId = req.params.id;
    const user = db.prepare(`
      SELECT u.*, COALESCE(u.username, LOWER(REPLACE(u.name, ' ', ''))) as username,
      COALESCE(u.country, 'US') as country
      FROM users u WHERE u.id = ?
    `).get(userId) as any;

    if (!user) return res.status(404).json({ error: "User not found" });

    // Seller Profile / KYC
    const sellerProfile = db.prepare("SELECT * FROM seller_profiles WHERE user_id = ?").get(userId) as any;
    const kycRecord = db.prepare("SELECT * FROM user_kyc WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId) as any;

    // Orders (purchases)
    const orders = db.prepare(`
      SELECT o.id, o.amount, o.status, o.created_at, l.title as product_title, l.id as listing_id
      FROM orders o
      LEFT JOIN listings l ON o.listing_id = l.id
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC LIMIT 20
    `).all(userId);

    // Sales (as seller)
    const sales = db.prepare(`
      SELECT t.id, t.amount, t.platform_fee, t.seller_earnings, t.status, t.created_at, l.title as product_title, u.name as buyer_name
      FROM transactions t
      LEFT JOIN listings l ON t.listing_id = l.id
      LEFT JOIN users u ON t.buyer_id = u.id
      WHERE t.seller_id = ?
      ORDER BY t.created_at DESC LIMIT 20
    `).all(userId);

    // Payments / Payout methods
    const payoutMethods = db.prepare("SELECT * FROM payout_methods WHERE user_id = ?").all(userId);
    const payoutRequests = db.prepare("SELECT * FROM payout_requests WHERE user_id = ? ORDER BY created_at DESC").all(userId);

    // Activity & Audit
    const activity = db.prepare(`
      SELECT id, action as title, details as description, created_at as timestamp, 'audit' as type
      FROM audit_logs WHERE target = ? OR admin_id = ?
      ORDER BY created_at DESC LIMIT 20
    `).all(userId, userId);

    // Security & Sessions
    const sessions = db.prepare("SELECT * FROM admin_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(userId);

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number || 'N/A',
        country: user.country,
        bio: user.bio || '',
        avatar_url: user.avatar_url,
        role: user.role
      },
      account: {
        provider: user.provider || 'local',
        created_at: user.created_at,
        last_login: user.last_login,
        last_login_ip: user.last_login_ip || '127.0.0.1',
        is_verified: !!user.is_verified,
        is_suspended: !!user.is_suspended,
        is_banned: !!user.is_banned,
        admin_notes: user.admin_notes || ''
      },
      sellerProfile,
      kycRecord,
      orders,
      sales,
      payoutMethods,
      payoutRequests,
      activity,
      sessions,
      security: {
        fraud_score: user.fraud_score || 0,
        risk_score: user.risk_score || user.fraud_score || 0,
        two_factor_enabled: false,
        active_sessions_count: sessions.length
      },
      wallet: {
        seller_balance: user.seller_balance || 0,
        platform_balance: user.platform_balance || 0,
        commission_rate: user.commission_rate || 0.25
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// 4. USER ACTIONS (Permission-checked, confirmed, audit-logged)
// --------------------------------------------------------------------------

// Edit user profile/details
router.post("/users/:id/edit", (req: any, res: any) => {
  try {
    const { name, username, email, phone_number, country, role, commission_rate } = req.body;
    const userId = req.params.id;

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          username = COALESCE(?, username),
          email = COALESCE(?, email),
          phone_number = COALESCE(?, phone_number),
          country = COALESCE(?, country),
          role = COALESCE(?, role),
          commission_rate = COALESCE(?, commission_rate)
      WHERE id = ?
    `).run(name, username, email, phone_number, country, role, commission_rate, userId);

    logAudit((req as any).user.id, "EDIT_USER_PROFILE", userId, { name, username, email, role, commission_rate });
    res.json({ success: true, message: "User profile updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify / Unverify
router.post("/users/:id/verify", (req: any, res: any) => {
  try {
    const { is_verified } = req.body;
    const userId = req.params.id;
    db.prepare("UPDATE users SET is_verified = ? WHERE id = ?").run(is_verified ? 1 : 0, userId);
    logAudit((req as any).user.id, is_verified ? "VERIFY_USER" : "UNVERIFY_USER", userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Suspend / Unsuspend
router.post("/users/:id/suspend", (req: any, res: any) => {
  try {
    const { is_suspended, reason } = req.body;
    const userId = req.params.id;
    db.prepare("UPDATE users SET is_suspended = ? WHERE id = ?").run(is_suspended ? 1 : 0, userId);
    logAudit((req as any).user.id, is_suspended ? "SUSPEND_USER" : "UNSUSPEND_USER", userId, { reason });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ban / Unban
router.post("/users/:id/ban", (req: any, res: any) => {
  try {
    const { is_banned, reason } = req.body;
    const userId = req.params.id;
    if (userId === (req as any).user.id && is_banned) {
      return res.status(400).json({ error: "You cannot ban yourself" });
    }
    db.prepare("UPDATE users SET is_banned = ? WHERE id = ?").run(is_banned ? 1 : 0, userId);
    logAudit((req as any).user.id, is_banned ? "BAN_USER" : "UNBAN_USER", userId, { reason });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Force Logout / Revoke Sessions
router.post("/users/:id/force-logout", (req: any, res: any) => {
  try {
    const userId = req.params.id;
    db.prepare("UPDATE admin_sessions SET revoked = 1 WHERE user_id = ?").run(userId);
    logAudit((req as any).user.id, "FORCE_LOGOUT_USER", userId);
    res.json({ success: true, message: "User sessions revoked" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Password Reset
router.post("/users/:id/password-reset", async (req: any, res: any) => {
  try {
    const userId = req.params.id;
    const { new_password } = req.body;
    const tempPassword = new_password || ("Reset_" + Math.random().toString(36).substring(2, 10));
    const hash = await bcrypt.hash(tempPassword, 10);

    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
    logAudit((req as any).user.id, "RESET_USER_PASSWORD", userId);

    res.json({ success: true, temporary_password: tempPassword, message: "Password reset successful" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Internal Note
router.post("/users/:id/note", (req: any, res: any) => {
  try {
    const userId = req.params.id;
    const { note } = req.body;
    db.prepare("UPDATE users SET admin_notes = ? WHERE id = ?").run(note || '', userId);
    logAudit((req as any).user.id, "UPDATE_USER_INTERNAL_NOTE", userId, { note });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send Notification / Email
router.post("/users/:id/notify", (req: any, res: any) => {
  try {
    const userId = req.params.id;
    const { message, type = 'system_alert' } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required" });

    db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
      ulid(), userId, type, message
    );

    logAudit((req as any).user.id, "SEND_USER_NOTIFICATION", userId, { message, type });
    res.json({ success: true, message: "Notification delivered to user" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OMEGA-NEXUS Global Search Endpoint
router.get("/search", (req: any, res: any) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json({ users: [], products: [], transactions: [], payouts: [], tickets: [], kyc: [], fraud: [] });
    }

    const pattern = `%${q}%`;

    const users = db.prepare(`
      SELECT id, name, email, role, is_banned, is_suspended, created_at
      FROM users
      WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(id) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern);

    const products = db.prepare(`
      SELECT id, title, price, status
      FROM listings
      WHERE LOWER(title) LIKE ? OR LOWER(id) LIKE ? OR LOWER(description) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern);

    const transactions = db.prepare(`
      SELECT id, amount, status, created_at, product_title, buyer_name, seller_name
      FROM transactions
      WHERE LOWER(id) LIKE ? OR LOWER(product_title) LIKE ? OR LOWER(buyer_name) LIKE ? OR LOWER(seller_name) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern, pattern);

    const payouts = db.prepare(`
      SELECT id, user_id, user_name, amount, status, method_type
      FROM payout_requests
      WHERE LOWER(id) LIKE ? OR LOWER(user_name) LIKE ? OR LOWER(status) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern);

    const tickets = db.prepare(`
      SELECT id, user_name, subject, priority, status
      FROM support_tickets
      WHERE LOWER(id) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(user_name) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern);

    const kyc = db.prepare(`
      SELECT id, user_id, display_name, user_email, kyc_status
      FROM seller_profiles
      WHERE LOWER(id) LIKE ? OR LOWER(display_name) LIKE ? OR LOWER(user_email) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern);

    const fraud = db.prepare(`
      SELECT id, user_id, type, severity, status, description
      FROM fraud_alerts
      WHERE LOWER(id) LIKE ? OR LOWER(type) LIKE ? OR LOWER(description) LIKE ?
      LIMIT 5
    `).all(pattern, pattern, pattern);

    res.json({
      users,
      products,
      transactions,
      payouts,
      tickets,
      kyc,
      fraud
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OMEGA-NEXUS Advanced KYC List & Actions
router.get("/kyc/advanced", (req: any, res: any) => {
  try {
    const {
      tab = 'pending',
      search = '',
      page = 1,
      limit = 15,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (tab === 'pending') {
      whereClauses.push("sp.kyc_status = 'pending'");
    } else if (tab === 'approved') {
      whereClauses.push("sp.kyc_status IN ('verified', 'approved')");
    } else if (tab === 'rejected') {
      whereClauses.push("sp.kyc_status = 'rejected'");
    } else if (tab === 'requires_info') {
      whereClauses.push("sp.kyc_status = 'requires_info'");
    } else if (tab === 'resubmission') {
      whereClauses.push("sp.kyc_status = 'resubmission'");
    } else if (tab === 'expired') {
      whereClauses.push("sp.kyc_status = 'expired'");
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push("(LOWER(sp.display_name) LIKE ? OR LOWER(sp.user_email) LIKE ? OR LOWER(sp.user_id) LIKE ? OR LOWER(sp.pan_number) LIKE ?)");
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const totalRow = db.prepare(`SELECT COUNT(*) as c FROM seller_profiles sp ${whereSql}`).get(...params) as any;
    const totalRecords = totalRow ? totalRow.c : 0;

    const records = db.prepare(`
      SELECT 
        sp.*,
        u.name as user_name,
        u.email as user_email_account,
        u.country as user_country
      FROM seller_profiles sp
      LEFT JOIN users u ON sp.user_id = u.id
      ${whereSql}
      ORDER BY sp.${sortBy === 'created_at' ? 'created_at' : 'created_at'} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const tabCounts = {
      pending: (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status = 'pending'").get() as any)?.c || 0,
      approved: (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status IN ('verified', 'approved')").get() as any)?.c || 0,
      rejected: (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status = 'rejected'").get() as any)?.c || 0,
      requires_info: (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status = 'requires_info'").get() as any)?.c || 0,
      resubmission: (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status = 'resubmission'").get() as any)?.c || 0,
      expired: (db.prepare("SELECT COUNT(*) as c FROM seller_profiles WHERE kyc_status = 'expired'").get() as any)?.c || 0,
      settings: 0
    };

    res.json({
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit))
      },
      tabCounts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET 360° Comprehensive Seller Profile & KYC Application Details
router.get("/kyc/:id/details", (req: any, res: any) => {
  try {
    const profileId = req.params.id;
    
    // Fetch seller_profile joined with user account info
    const sp = db.prepare(`
      SELECT 
        sp.*,
        u.name as user_account_name,
        u.email as user_account_email,
        u.role as user_role,
        u.is_verified as user_is_verified,
        u.is_banned as user_is_banned,
        u.country as user_account_country,
        u.created_at as account_created_at
      FROM seller_profiles sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ? OR sp.user_id = ?
    `).get(profileId, profileId) as any;

    if (!sp) {
      return res.status(404).json({ error: "Seller profile not found." });
    }

    // Fetch all uploaded verification documents
    const rawDocs = db.prepare(`
      SELECT * FROM kyc_documents 
      WHERE seller_profile_id = ? OR user_id = ? 
      ORDER BY uploaded_at DESC
    `).all(sp.id, sp.user_id) as any[];

    const documents = rawDocs.map(d => ({
      id: d.id,
      doc_slot: d.doc_slot,
      doc_type: d.doc_type || "Identity Document",
      file_name: d.file_name,
      file_path: d.file_path,
      mime_type: d.mime_type || "application/octet-stream",
      file_size: d.file_size || 0,
      status: d.status,
      rejection_reason: d.rejection_reason || null,
      uploaded_at: d.uploaded_at,
      preview_url: `/api/admin/advanced/kyc/document/${d.id}/preview`,
      download_url: `/api/admin/advanced/kyc/document/${d.id}/download`
    }));

    // Fetch relevant audit logs for this seller
    const auditLogs = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE target = ? OR target = ? OR details LIKE ? 
      ORDER BY created_at DESC LIMIT 20
    `).all(sp.id, sp.user_id, `%${sp.user_id}%`) as any[];

    // Structure 360° seller detail object
    const seller360 = {
      // General Application Meta
      id: sp.id,
      user_id: sp.user_id,
      display_name: sp.display_name || "Seller",
      user_account_name: sp.user_account_name || "",
      user_account_email: sp.user_account_email || sp.user_email || "",
      user_role: sp.user_role || "user",
      user_is_verified: sp.user_is_verified === 1,
      user_is_banned: sp.user_is_banned === 1,
      account_created_at: sp.account_created_at || sp.created_at,
      created_at: sp.created_at,
      updated_at: sp.updated_at || sp.created_at,
      kyc_submitted_at: sp.kyc_submitted_at || sp.seller_agreement_accepted_at || sp.created_at,
      kyc_status: sp.kyc_status || "pending",
      kyc_rejection_reason: sp.kyc_rejection_reason || null,
      admin_notes: sp.admin_notes || null,
      risk_score: sp.risk_score || 15,
      commission_tier: sp.commission_tier || "standard",

      // 1. Personal Identity Details
      full_legal_name: sp.full_legal_name || sp.display_name || "",
      dob: sp.dob || "",
      id_type: sp.id_type || "Passport",
      national_id: sp.national_id || sp.pan_number || "",
      phone: sp.phone || (sp.phone_country_code ? `${sp.phone_country_code} ${sp.phone_number || ''}`.trim() : sp.phone_number || ""),
      phone_country_code: sp.phone_country_code || "+91",
      phone_number: sp.phone_number || "",
      address: sp.address || "",
      address_line1: sp.address_line1 || "",
      address_line2: sp.address_line2 || "",
      city: sp.city || "",
      state: sp.state || "",
      postal_code: sp.postal_code || "",
      country: sp.country || sp.user_account_country || "India",

      // 2. Account & Tax Classification
      seller_type: sp.seller_type || "individual",
      tax_country: sp.tax_country || sp.country || "India",
      tax_id: sp.tax_id || sp.pan_number || "",
      pan_number: sp.pan_number || sp.tax_id || "",
      gstin: sp.gstin || "",
      tax_accepted: sp.tax_accepted === 1,

      // 3. Business Details (if applicable)
      business_legal_name: sp.business_legal_name || "",
      business_reg_number: sp.business_reg_number || "",
      business_reg_cert_url: sp.business_reg_cert_url || "",
      business_reg_cert_name: sp.business_reg_cert_name || "",
      different_business_address: sp.different_business_address === 1,
      business_address_line1: sp.business_address_line1 || "",
      business_address_line2: sp.business_address_line2 || "",
      business_city: sp.business_city || "",
      business_state: sp.business_state || "",
      business_postal_code: sp.business_postal_code || "",
      business_country: sp.business_country || sp.tax_country || "India",
      authorized_signatory_name: sp.authorized_signatory_name || "",
      authorized_signatory_id: sp.authorized_signatory_id || "",
      business_tax_doc_url: sp.business_tax_doc_url || "",
      business_tax_doc_name: sp.business_tax_doc_name || "",

      // 4. Bank & Payout Details
      payout_method: sp.payout_method || "bank",
      bank_name: sp.bank_name || "",
      account_holder: sp.account_holder || sp.display_name || "",
      account_number: sp.account_number || sp.payout_details || "",
      ifsc_code: sp.ifsc_code || sp.ifsc || "",
      upi_id: sp.upi_id || "",
      payout_verified: sp.payout_verified === 1,
      payout_mismatch_flagged: sp.payout_mismatch_flagged === 1,
      payout_mismatch_reason: sp.payout_mismatch_reason || "",

      // 5. Compliance & Declaration
      declaration_version: sp.declaration_version || "v1.0",
      declaration_accepted_at: sp.declaration_accepted_at || sp.seller_agreement_accepted_at || sp.created_at,
      seller_agreement_accepted_at: sp.seller_agreement_accepted_at || null,

      // Uploaded Documents & Audit Log
      documents,
      audit_logs: auditLogs
    };

    res.json({ seller: seller360 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Audit Log for Revealing Sensitive Data
router.post("/kyc/:id/log-reveal", (req: any, res: any) => {
  try {
    const sellerId = req.params.id;
    const adminId = (req as any).user?.id || 'admin';
    logAudit(adminId, "VIEW_UNMASKED_SELLER_SENSITIVE_DATA", sellerId, {
      ip: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
      userAgent: req.headers["user-agent"]
    });
    res.json({ success: true, message: "Unmasked reveal action audit logged." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET Download Seller Details (CSV / JSON Data Export)
router.get("/kyc/:id/download-details", (req: any, res: any) => {
  try {
    const profileId = req.params.id;
    const format = (req.query.format || "csv").toString().toLowerCase();
    const includeUnmasked = req.query.include_unmasked === "true";
    const adminId = (req as any).user?.id || 'admin';

    const sp = db.prepare(`
      SELECT sp.*, u.name as user_account_name, u.email as user_account_email
      FROM seller_profiles sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ? OR sp.user_id = ?
    `).get(profileId, profileId) as any;

    if (!sp) {
      return res.status(404).json({ error: "Seller profile not found." });
    }

    // Log Download Action Audit
    logAudit(adminId, "DOWNLOAD_SELLER_FULL_DETAILS", sp.user_id, {
      format,
      include_unmasked: includeUnmasked,
      ip: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
      userAgent: req.headers["user-agent"]
    });

    const mask = (val: string) => {
      if (!val) return "N/A";
      if (includeUnmasked) return val;
      if (val.length <= 4) return "****";
      return "****" + val.slice(-4);
    };

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="Seller_Full_Details_${sp.user_id}_${Date.now()}.json"`);
      
      const jsonPayload = {
        meta: {
          export_date: new Date().toISOString(),
          exported_by_admin: adminId,
          unmasked: includeUnmasked
        },
        personal_identity: {
          full_legal_name: sp.full_legal_name || sp.display_name,
          dob: sp.dob || "N/A",
          id_type: sp.id_type || "Passport",
          id_number: mask(sp.national_id || sp.pan_number || ""),
          phone: sp.phone || (sp.phone_country_code ? `${sp.phone_country_code} ${sp.phone_number}` : sp.phone_number),
          address: {
            line1: sp.address_line1 || sp.address,
            line2: sp.address_line2 || "",
            city: sp.city || "",
            state: sp.state || "",
            postal_code: sp.postal_code || "",
            country: sp.country || "India"
          }
        },
        account_and_tax: {
          seller_type: sp.seller_type || "individual",
          tax_country: sp.tax_country || sp.country || "India",
          tax_id_pan: mask(sp.tax_id || sp.pan_number || ""),
          gstin: sp.gstin || "N/A",
          declaration_accepted: sp.tax_accepted === 1
        },
        business_details: sp.seller_type === 'business' ? {
          business_legal_name: sp.business_legal_name || "N/A",
          business_reg_number: sp.business_reg_number || "N/A",
          business_address: `${sp.business_address_line1 || ''} ${sp.business_address_line2 || ''}, ${sp.business_city || ''}, ${sp.business_state || ''} ${sp.business_postal_code || ''}, ${sp.business_country || ''}`.trim(),
          authorized_signatory: sp.authorized_signatory_name || "N/A"
        } : null,
        payout_bank_details: {
          payout_method: sp.payout_method || "bank",
          bank_name: sp.bank_name || "N/A",
          account_holder: sp.account_holder || sp.display_name,
          account_number: mask(sp.account_number || sp.payout_details || ""),
          ifsc_swift: sp.ifsc_code || sp.ifsc || "N/A",
          upi_id: sp.upi_id || "N/A",
          payout_mismatch_flagged: sp.payout_mismatch_flagged === 1
        },
        compliance_meta: {
          declaration_version: sp.declaration_version || "v1.0",
          declaration_accepted_at: sp.declaration_accepted_at || sp.seller_agreement_accepted_at || sp.created_at,
          kyc_status: sp.kyc_status || "pending",
          submitted_at: sp.kyc_submitted_at || sp.created_at,
          admin_notes: sp.admin_notes || ""
        }
      };

      return res.send(JSON.stringify(jsonPayload, null, 2));
    }

    // Default: CSV Export
    const csvHeaders = [
      "Seller ID", "Full Legal Name", "Display Name", "Email", "Phone", 
      "Address Line 1", "Address Line 2", "City", "State", "Postal Code", "Country", "DOB",
      "ID Type", "National ID / PAN Number", "Seller Type", "Tax Country", "Tax ID / PAN", "GSTIN",
      "Business Name", "Business Reg No", "Bank Name", "Account Holder Name", "Account Number", "IFSC/SWIFT", "UPI ID",
      "KYC Status", "Declaration Accepted At", "Submission Timestamp"
    ];

    const csvRow = [
      sp.user_id,
      sp.full_legal_name || sp.display_name,
      sp.display_name,
      sp.user_account_email || sp.user_email || "",
      sp.phone || `${sp.phone_country_code || ''}${sp.phone_number || ''}`,
      sp.address_line1 || sp.address || "",
      sp.address_line2 || "",
      sp.city || "",
      sp.state || "",
      sp.postal_code || "",
      sp.country || "India",
      sp.dob || "",
      sp.id_type || "Passport",
      mask(sp.national_id || sp.pan_number || ""),
      sp.seller_type || "individual",
      sp.tax_country || "India",
      mask(sp.tax_id || sp.pan_number || ""),
      sp.gstin || "",
      sp.business_legal_name || "",
      sp.business_reg_number || "",
      sp.bank_name || "",
      sp.account_holder || "",
      mask(sp.account_number || sp.payout_details || ""),
      sp.ifsc_code || sp.ifsc || "",
      sp.upi_id || "",
      sp.kyc_status || "pending",
      sp.declaration_accepted_at || sp.seller_agreement_accepted_at || "",
      sp.kyc_submitted_at || sp.created_at || ""
    ].map(v => `"${String(v || "").replace(/"/g, '""')}"`);

    const csvString = csvHeaders.join(",") + "\n" + csvRow.join(",");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Seller_Full_Details_${sp.user_id}_${Date.now()}.csv"`);
    return res.send(csvString);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Download Single Seller Verification Document with Audit Logging
router.get("/kyc/document/:docId/download", (req: any, res: any) => {
  try {
    const docId = req.params.docId;
    const adminId = (req as any).user?.id || 'admin';

    const doc = db.prepare("SELECT * FROM kyc_documents WHERE id = ?").get(docId) as any;

    if (!doc) {
      return res.status(404).json({ error: "Document record not found." });
    }

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: "Document file not found on disk storage." });
    }

    // Log Document Download Audit
    logAudit(adminId, "DOWNLOAD_SELLER_DOCUMENT", docId, {
      file_name: doc.file_name,
      doc_slot: doc.doc_slot,
      doc_type: doc.doc_type,
      seller_id: doc.user_id,
      ip: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
      userAgent: req.headers["user-agent"]
    });

    const safeFileName = `${doc.doc_slot}_${doc.file_name}`.replace(/[^a-zA-Z0-9_\.-]/g, "_");

    res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    return res.sendFile(path.resolve(doc.file_path));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Preview Single Document File
router.get("/kyc/document/:docId/preview", (req: any, res: any) => {
  try {
    const docId = req.params.docId;
    const doc = db.prepare("SELECT * FROM kyc_documents WHERE id = ?").get(docId) as any;

    if (!doc) {
      return res.status(404).json({ error: "Document record not found." });
    }

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: "Document file missing on disk storage." });
    }

    logAudit((req as any).user?.id || 'admin', "PREVIEW_SELLER_DOCUMENT", docId, {
      file_name: doc.file_name,
      doc_slot: doc.doc_slot,
      seller_id: doc.user_id
    });

    res.setHeader("Content-Type", doc.mime_type || "image/png");
    res.setHeader("Content-Disposition", `inline; filename="${doc.file_name}"`);
    return res.sendFile(path.resolve(doc.file_path));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Bulk Download All Verification Documents as a ZIP Archive
router.get("/kyc/:id/bulk-download-documents", async (req: any, res: any) => {
  try {
    const profileId = req.params.id;
    const adminId = (req as any).user?.id || 'admin';

    const sp = db.prepare(`
      SELECT sp.*, u.name as user_account_name
      FROM seller_profiles sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ? OR sp.user_id = ?
    `).get(profileId, profileId) as any;

    if (!sp) {
      return res.status(404).json({ error: "Seller profile not found." });
    }

    const docs = db.prepare(`
      SELECT * FROM kyc_documents 
      WHERE seller_profile_id = ? OR user_id = ?
    `).all(sp.id, sp.user_id) as any[];

    if (!docs || docs.length === 0) {
      return res.status(400).json({ error: "No verification documents found for this seller application." });
    }

    const zip = new JSZip();
    let fileCount = 0;

    for (const d of docs) {
      if (fs.existsSync(d.file_path)) {
        const fileContent = fs.readFileSync(d.file_path);
        const zipFileName = `${d.doc_slot.toUpperCase()}_${d.file_name}`.replace(/[^a-zA-Z0-9_\.-]/g, "_");
        zip.file(zipFileName, fileContent);
        fileCount++;
      }
    }

    if (fileCount === 0) {
      return res.status(400).json({ error: "Document files do not exist on disk storage." });
    }

    // Log Bulk Download Audit
    logAudit(adminId, "BULK_DOWNLOAD_SELLER_DOCUMENTS", sp.user_id, {
      doc_count: fileCount,
      seller_name: sp.display_name,
      ip: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
      userAgent: req.headers["user-agent"]
    });

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const safeSellerName = (sp.display_name || sp.user_id).replace(/[^a-zA-Z0-9_]/g, "_");
    const zipFileName = `KYC_Docs_${safeSellerName}_${Date.now()}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);
    return res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/kyc/:id/action", (req: any, res: any) => {
  try {
    const { action, reason, admin_notes } = req.body;
    const profileId = req.params.id;

    if (action === 'reject') {
      const combinedReason = [reason, admin_notes].filter(Boolean).join(" ").trim();
      if (!combinedReason) {
        return res.status(400).json({ 
          error: "Rejection reason is mandatory when rejecting a seller KYC application. Please provide a clear explanation for the seller." 
        });
      }
    }

    let newStatus = 'pending';
    if (action === 'approve') newStatus = 'verified';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'request_info') newStatus = 'requires_info';
    else if (action === 'request_resubmission') newStatus = 'resubmission';

    const note = [reason, admin_notes].filter(Boolean).join(" - ");

    // Fetch profile to get associated user_id
    const profile = db.prepare("SELECT user_id FROM seller_profiles WHERE id = ? OR user_id = ?").get(profileId, profileId) as any;

    db.prepare(`
      UPDATE seller_profiles 
      SET kyc_status = ?, 
          payout_verified = ?, 
          admin_notes = ?,
          kyc_rejection_reason = ?,
          step1_status = CASE WHEN ? = 'verified' THEN 'COMPLETED' ELSE 'NOT_STARTED' END,
          step2_status = CASE WHEN ? = 'verified' THEN 'COMPLETED' ELSE 'LOCKED' END,
          step3_status = CASE WHEN ? = 'verified' THEN 'COMPLETED' ELSE 'LOCKED' END,
          step4_status = CASE WHEN ? = 'verified' THEN 'COMPLETED' ELSE 'LOCKED' END,
          current_step = CASE WHEN ? = 'verified' THEN 4 ELSE 1 END
      WHERE id = ? OR user_id = ?
    `).run(
      newStatus, 
      newStatus === 'verified' ? 1 : 0, 
      note || null,
      newStatus === 'rejected' ? (note || 'Document criteria not met') : null,
      newStatus, newStatus, newStatus, newStatus, newStatus,
      profileId, profileId
    );

    if (profile?.user_id) {
      if (newStatus === 'verified') {
        db.prepare("UPDATE users SET role = 'seller', is_verified = 1 WHERE id = ?").run(profile.user_id);
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(), profile.user_id, "kyc", "Your seller application has been approved! Your Seller Dashboard is now active."
          );
        } catch(e) {}
      } else if (newStatus === 'rejected') {
        db.prepare("UPDATE users SET role = 'user' WHERE id = ?").run(profile.user_id);
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(), profile.user_id, "kyc", `Your seller application was rejected. Reason: ${note || 'Document criteria not met'}. Please update and re-submit your application.`
          );
        } catch(e) {}
      } else if (newStatus === 'requires_info') {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(), profile.user_id, "kyc", `Your seller application requires additional info. Reason: ${note || 'Please check your submitted details'}`
          );
        } catch(e) {}
      } else if (newStatus === 'resubmission') {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(), profile.user_id, "kyc", `Please resubmit your seller verification documents. Reason: ${note || 'Document resubmission required'}`
          );
        } catch(e) {}
      }
    }

    logAudit((req as any).user?.id || 'admin', `KYC_ACTION_${action.toUpperCase()}`, profileId, { action, reason, note });
    res.json({ success: true, message: `KYC application status updated to ${newStatus}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/kyc/:id", (req: any, res: any) => {
  try {
    const profileId = req.params.id;
    const profile = db.prepare("SELECT user_id FROM seller_profiles WHERE id = ? OR user_id = ?").get(profileId, profileId) as any;
    if (profile?.user_id) {
      db.prepare("UPDATE users SET role = 'user' WHERE id = ?").run(profile.user_id);
    }
    db.prepare("DELETE FROM seller_profiles WHERE id = ? OR user_id = ?").run(profileId, profileId);
    logAudit((req as any).user?.id || 'admin', "DELETE_SELLER_APPLICATION", profileId, { user_id: profile?.user_id });
    res.json({ success: true, message: "Seller KYC application permanently deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OMEGA-NEXUS Advanced Products List & Actions
router.get("/products/advanced", (req: any, res: any) => {
  try {
    const {
      tab = 'all',
      search = '',
      category = 'all',
      page = 1,
      limit = 15,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClauses: string[] = ["COALESCE(l.status, '') != 'deleted'"];
    let params: any[] = [];

    if (tab === 'pending') {
      whereClauses.push("(COALESCE(l.status, 'pending') = 'pending' OR l.is_approved = 0) AND COALESCE(l.status, '') != 'archived' AND COALESCE(l.status, '') != 'suspended' AND COALESCE(l.status, '') != 'rejected'");
    } else if (tab === 'approved') {
      whereClauses.push("COALESCE(l.status, 'active') IN ('active', 'approved') AND COALESCE(l.is_approved, 1) = 1");
    } else if (tab === 'rejected') {
      whereClauses.push("COALESCE(l.status, 'active') = 'rejected'");
    } else if (tab === 'suspended') {
      whereClauses.push("COALESCE(l.status, 'active') = 'suspended'");
    } else if (tab === 'archived') {
      whereClauses.push("COALESCE(l.status, 'active') = 'archived'");
    } else if (tab === 'featured') {
      whereClauses.push("l.is_featured = 1");
    } else if (tab === 'reported') {
      whereClauses.push("l.moderation_flags IS NOT NULL AND l.moderation_flags != ''");
    }

    if (category && category !== 'all') {
      whereClauses.push("l.tags LIKE ?");
      params.push(`%${category}%`);
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push("(LOWER(l.title) LIKE ? OR LOWER(l.id) LIKE ? OR LOWER(l.description) LIKE ? OR LOWER(u.name) LIKE ?)");
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const totalRow = db.prepare(`SELECT COUNT(*) as c FROM listings l LEFT JOIN users u ON l.seller_id = u.id ${whereSql}`).get(...params) as any;
    const totalRecords = totalRow ? totalRow.c : 0;

    const products = db.prepare(`
      SELECT 
        l.*,
        u.name as seller_name,
        u.email as seller_email
      FROM listings l
      LEFT JOIN users u ON l.seller_id = u.id
      ${whereSql}
      ORDER BY l.${sortBy === 'price' ? 'price' : sortBy === 'sales' ? 'sales' : 'created_at'} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const categoriesList = db.prepare("SELECT DISTINCT tags as category FROM listings WHERE tags IS NOT NULL AND tags != ''").all();

    const tabCounts = {
      all: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, '') != 'deleted'").get() as any)?.c || 0,
      pending: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, '') != 'deleted' AND ((COALESCE(status, 'pending') = 'pending' OR is_approved = 0) AND COALESCE(status, '') != 'archived' AND COALESCE(status, '') != 'suspended' AND COALESCE(status, '') != 'rejected')").get() as any)?.c || 0,
      approved: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, '') != 'deleted' AND COALESCE(status, 'active') IN ('active', 'approved') AND COALESCE(is_approved, 1) = 1").get() as any)?.c || 0,
      rejected: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, 'active') = 'rejected'").get() as any)?.c || 0,
      suspended: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, 'active') = 'suspended'").get() as any)?.c || 0,
      archived: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, 'active') = 'archived'").get() as any)?.c || 0,
      featured: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, '') != 'deleted' AND is_featured = 1").get() as any)?.c || 0,
      reported: (db.prepare("SELECT COUNT(*) as c FROM listings WHERE COALESCE(status, '') != 'deleted' AND moderation_flags IS NOT NULL AND moderation_flags != ''").get() as any)?.c || 0
    };

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit))
      },
      categories: categoriesList.map((c: any) => c.category),
      tabCounts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/products/:id/action", (req: any, res: any) => {
  try {
    const { action, flag_reason, moderation_note, note } = req.body;
    const productId = req.params.id;

    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(productId) as any;
    if (!listing) {
      return res.status(404).json({ error: "Product not found" });
    }

    const modNote = flag_reason || moderation_note || note || '';

    if (action === 'approve') {
      db.prepare("UPDATE listings SET status = 'active', is_approved = 1 WHERE id = ?").run(productId);
      if (listing.seller_id) {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(),
            listing.seller_id,
            'product_approved',
            `Your product "${listing.title}" has been approved by administration and is now live on the marketplace.`
          );
        } catch(e) { console.error("Notification insert error:", e); }
      }
    } else if (action === 'reject') {
      db.prepare("UPDATE listings SET status = 'rejected', is_approved = 0 WHERE id = ?").run(productId);
      if (listing.seller_id) {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(),
            listing.seller_id,
            'product_rejected',
            `Your product "${listing.title}" was rejected. ${modNote ? `Reason: ${modNote}` : ''}`
          );
        } catch(e) { console.error("Notification insert error:", e); }
      }
    } else if (action === 'suspend') {
      db.prepare("UPDATE listings SET status = 'suspended', is_approved = 0 WHERE id = ?").run(productId);
      if (listing.seller_id) {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(),
            listing.seller_id,
            'product_suspended',
            `Your product "${listing.title}" has been suspended by administration. ${modNote ? `Reason: ${modNote}` : ''}`
          );
        } catch(e) { console.error("Notification insert error:", e); }
      }
    } else if (action === 'archive') {
      db.prepare("UPDATE listings SET status = 'archived', is_approved = 0 WHERE id = ?").run(productId);
      if (listing.seller_id) {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(),
            listing.seller_id,
            'product_archived',
            `Your product "${listing.title}" has been archived by administration.`
          );
        } catch(e) { console.error("Notification insert error:", e); }
      }
    } else if (action === 'restore') {
      db.prepare("UPDATE listings SET status = 'active', is_approved = 1 WHERE id = ?").run(productId);
    } else if (action === 'feature') {
      db.prepare("UPDATE listings SET is_featured = 1 WHERE id = ?").run(productId);
    } else if (action === 'unfeature') {
      db.prepare("UPDATE listings SET is_featured = 0 WHERE id = ?").run(productId);
    } else if (action === 'delete') {
      try { db.prepare("DELETE FROM wishlists WHERE listing_id = ?").run(productId); } catch(e) {}
      try { db.prepare("DELETE FROM reviews WHERE listing_id = ? OR product_id = ?").run(productId, productId); } catch(e) {}
      try { db.prepare("DELETE FROM cart_items WHERE listing_id = ?").run(productId); } catch(e) {}
      try { db.prepare("DELETE FROM downloads WHERE listing_id = ?").run(productId); } catch(e) {}
      try { db.prepare("DELETE FROM orders WHERE listing_id = ?").run(productId); } catch(e) {}
      try { db.prepare("DELETE FROM transactions WHERE listing_id = ?").run(productId); } catch(e) {}

      try {
        db.prepare("PRAGMA foreign_keys = OFF").run();
        db.prepare("DELETE FROM listings WHERE id = ?").run(productId);
        db.prepare("PRAGMA foreign_keys = ON").run();
      } catch (err: any) {
        console.error("Hard delete error, falling back to status update:", err);
        db.prepare("UPDATE listings SET status = 'deleted', is_approved = 0, deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(productId);
      }

      if (listing.seller_id) {
        try {
          db.prepare("INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)").run(
            ulid(),
            listing.seller_id,
            'product_deleted',
            `Your product "${listing.title}" has been permanently deleted by administration.`
          );
        } catch(e) { console.error("Notification insert error:", e); }
      }
    } else if (action === 'flag') {
      db.prepare("UPDATE listings SET moderation_flags = ? WHERE id = ?").run(modNote || 'Policy Violation', productId);
    } else if (action === 'clear_flags') {
      db.prepare("UPDATE listings SET moderation_flags = NULL WHERE id = ?").run(productId);
    }

    logAudit((req as any).user.id, `PRODUCT_ACTION_${action.toUpperCase()}`, productId, {
      action,
      flag_reason: modNote,
      product_title: listing.title,
      seller_id: listing.seller_id
    });

    const updatedListing = action === 'delete' ? null : db.prepare(`
      SELECT 
        l.*,
        u.name as seller_name,
        u.email as seller_email
      FROM listings l
      LEFT JOIN users u ON l.seller_id = u.id
      WHERE l.id = ?
    `).get(productId) as any;

    res.json({
      success: true,
      message: `Product action ${action} executed successfully`,
      product: updatedListing
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OMEGA-NEXUS Advanced Transactions API
router.get("/transactions/advanced", (req: any, res: any) => {
  try {
    const {
      tab = 'all',
      search = '',
      page = 1,
      limit = 15,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (tab === 'payments') {
      whereClauses.push("t.status IN ('completed', 'successful', 'processing')");
    } else if (tab === 'refunds') {
      whereClauses.push("t.status IN ('refunded', 'partially_refunded')");
    } else if (tab === 'disputes') {
      whereClauses.push("(t.is_disputed = 1 OR t.status = 'disputed')");
    } else if (tab === 'chargebacks') {
      whereClauses.push("t.status = 'chargeback'");
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push("(LOWER(t.id) LIKE ? OR LOWER(bu.name) LIKE ? OR LOWER(su.name) LIKE ? OR LOWER(l.title) LIKE ?)");
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    
    const totalRow = db.prepare(`
      SELECT COUNT(*) as c, COALESCE(SUM(t.amount), 0) as total_volume, COALESCE(SUM(t.platform_fee), 0) as total_commission 
      FROM transactions t
      LEFT JOIN users bu ON t.buyer_id = bu.id
      LEFT JOIN users su ON t.seller_id = su.id
      LEFT JOIN listings l ON t.listing_id = l.id
      ${whereSql}
    `).get(...params) as any;

    const totalRecords = totalRow ? totalRow.c : 0;

    const transactions = db.prepare(`
      SELECT 
        t.*,
        bu.name as buyer_name,
        bu.email as buyer_email,
        su.name as seller_name,
        su.email as seller_email,
        l.title as product_title
      FROM transactions t
      LEFT JOIN users bu ON t.buyer_id = bu.id
      LEFT JOIN users su ON t.seller_id = su.id
      LEFT JOIN listings l ON t.listing_id = l.id
      ${whereSql}
      ORDER BY t.${sortBy === 'amount' ? 'amount' : 'created_at'} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const tabCounts = {
      all: (db.prepare("SELECT COUNT(*) as c FROM transactions").get() as any)?.c || 0,
      payments: (db.prepare("SELECT COUNT(*) as c FROM transactions WHERE status IN ('completed', 'successful', 'processing')").get() as any)?.c || 0,
      refunds: (db.prepare("SELECT COUNT(*) as c FROM transactions WHERE status IN ('refunded', 'partially_refunded')").get() as any)?.c || 0,
      disputes: (db.prepare("SELECT COUNT(*) as c FROM transactions WHERE is_disputed = 1 OR status = 'disputed'").get() as any)?.c || 0,
      chargebacks: (db.prepare("SELECT COUNT(*) as c FROM transactions WHERE status = 'chargeback'").get() as any)?.c || 0
    };

    res.json({
      transactions,
      summary: {
        totalVolume: totalRow?.total_volume || 0,
        totalCommission: totalRow?.total_commission || 0
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit))
      },
      tabCounts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Idempotent Refund Endpoint (Server-calculated, protected)
router.post("/transactions/:id/refund", (req: any, res: any) => {
  try {
    const txId = req.params.id;
    const { idempotency_key, is_partial, partial_amount, reason } = req.body;

    const key = idempotency_key || `refund_${txId}_${Date.now()}`;

    // Idempotency check
    const existing = db.prepare("SELECT response_json FROM refund_idempotency WHERE key = ?").get(key) as any;
    if (existing) {
      return res.json(JSON.parse(existing.response_json));
    }

    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as any;
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    if (tx.status === 'refunded') {
      return res.status(400).json({ error: "Transaction is already fully refunded" });
    }

    // Server calculated refund amount - NEVER trust client
    let refundAmount = tx.amount;
    if (is_partial && partial_amount && Number(partial_amount) < tx.amount) {
      refundAmount = Number(partial_amount);
    }

    const newStatus = refundAmount >= tx.amount ? 'refunded' : 'partially_refunded';

    // Execute atomic DB transaction
    const updateTx = db.transaction(() => {
      db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(newStatus, txId);
      if (tx.seller_id) {
        db.prepare("UPDATE users SET seller_balance = MAX(0, seller_balance - ?) WHERE id = ?").run(refundAmount, tx.seller_id);
      }
      if (tx.buyer_id) {
        db.prepare("UPDATE users SET platform_balance = platform_balance + ? WHERE id = ?").run(refundAmount, tx.buyer_id);
      }
    });

    updateTx();

    logAudit((req as any).user.id, "REFUND_TRANSACTION", txId, { refundAmount, newStatus, reason: reason || "Admin Refund" });

    const response = {
      success: true,
      message: `Successfully processed ${newStatus} of $${refundAmount.toFixed(2)}`,
      refundAmount,
      status: newStatus
    };

    db.prepare("INSERT INTO refund_idempotency (key, transaction_id, response_json) VALUES (?, ?, ?)").run(key, txId, JSON.stringify(response));

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OMEGA-NEXUS Advanced Payouts API
router.get("/payouts/advanced", (req: any, res: any) => {
  try {
    const {
      tab = 'pending',
      search = '',
      page = 1,
      limit = 15
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (tab === 'pending') {
      whereClauses.push("p.status = 'pending'");
    } else if (tab === 'processing') {
      whereClauses.push("p.status = 'processing'");
    } else if (tab === 'completed') {
      whereClauses.push("p.status = 'completed'");
    } else if (tab === 'failed') {
      whereClauses.push("p.status = 'failed'");
    } else if (tab === 'on_hold') {
      whereClauses.push("p.status = 'on_hold'");
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push("(LOWER(p.id) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)");
      params.push(q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const totalRow = db.prepare(`SELECT COUNT(*) as c FROM payout_requests p LEFT JOIN users u ON p.user_id = u.id ${whereSql}`).get(...params) as any;
    const totalRecords = totalRow ? totalRow.c : 0;

    const payouts = db.prepare(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        u.seller_balance,
        u.commission_rate,
        sp.payout_method as method_type,
        sp.payout_details as method_details,
        sp.kyc_status
      FROM payout_requests p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN seller_profiles sp ON p.user_id = sp.user_id
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    // Compute live seller breakdown for each payout record (100% server calculated)
    const enrichedPayouts = payouts.map((p: any) => {
      const grossSales = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE seller_id = ? AND status = 'completed'").get(p.user_id) as any)?.total || 0;
      const commission = grossSales * (p.commission_rate || 0.25);
      const refundReserve = grossSales * 0.05;
      const taxes = grossSales * 0.02;
      const withdrawable = Math.max(0, grossSales - commission - refundReserve - taxes);

      return {
        ...p,
        financials: {
          grossSales,
          commission,
          refundReserve,
          taxes,
          availableBalance: p.seller_balance || 0,
          withdrawableBalance: withdrawable,
          finalPayoutAmount: p.amount
        }
      };
    });

    const tabCounts = {
      pending: (db.prepare("SELECT COUNT(*) as c FROM payout_requests WHERE status = 'pending'").get() as any)?.c || 0,
      processing: (db.prepare("SELECT COUNT(*) as c FROM payout_requests WHERE status = 'processing'").get() as any)?.c || 0,
      completed: (db.prepare("SELECT COUNT(*) as c FROM payout_requests WHERE status = 'completed'").get() as any)?.c || 0,
      failed: (db.prepare("SELECT COUNT(*) as c FROM payout_requests WHERE status = 'failed'").get() as any)?.c || 0,
      on_hold: (db.prepare("SELECT COUNT(*) as c FROM payout_requests WHERE status = 'on_hold'").get() as any)?.c || 0,
      settings: 0
    };

    res.json({
      payouts: enrichedPayouts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit))
      },
      tabCounts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payout Action Endpoint (Release, Hold, Reject)
router.post("/payouts/:id/action", (req: any, res: any) => {
  try {
    const payoutId = req.params.id;
    const { action, admin_notes } = req.body;

    const payout = db.prepare("SELECT * FROM payout_requests WHERE id = ?").get(payoutId) as any;
    if (!payout) return res.status(404).json({ error: "Payout request not found" });

    let newStatus = payout.status;
    if (action === 'release' || action === 'approve') newStatus = 'completed';
    else if (action === 'hold') newStatus = 'on_hold';
    else if (action === 'reject') newStatus = 'failed';
    else if (action === 'retry') newStatus = 'pending';

    const executePayoutTx = db.transaction(() => {
      db.prepare("UPDATE payout_requests SET status = ?, admin_notes = ?, processed_at = ? WHERE id = ?")
        .run(newStatus, admin_notes || null, new Date().toISOString(), payoutId);

      if (newStatus === 'completed') {
        db.prepare("UPDATE users SET seller_balance = MAX(0, seller_balance - ?) WHERE id = ?").run(payout.amount, payout.user_id);
      }
    });

    executePayoutTx();

    logAudit((req as any).user.id, `PAYOUT_${action.toUpperCase()}`, payoutId, { amount: payout.amount, user_id: payout.user_id, status: newStatus });

    res.json({ success: true, message: `Payout request updated to ${newStatus}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OMEGA-NEXUS Advanced Fraud Engine API
router.get("/fraud/advanced", (req: any, res: any) => {
  try {
    const alerts = db.prepare(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.fraud_score,
        u.is_suspended,
        u.is_banned,
        COUNT(DISTINCT t.id) as total_transactions,
        SUM(CASE WHEN t.is_disputed = 1 THEN 1 ELSE 0 END) as dispute_count
      FROM users u
      LEFT JOIN transactions t ON u.id = t.buyer_id OR u.id = t.seller_id
      WHERE u.fraud_score > 0 OR u.is_suspended = 1 OR u.is_banned = 1
      GROUP BY u.id
      ORDER BY u.fraud_score DESC
      LIMIT 20
    `).all();

    const rules = db.prepare("SELECT * FROM fraud_rules ORDER BY created_at DESC").all();

    const evaluations = db.prepare(`
      SELECT fe.*, u.name as target_name 
      FROM fraud_evaluations fe
      LEFT JOIN users u ON fe.target_id = u.id
      ORDER BY fe.created_at DESC LIMIT 20
    `).all();

    res.json({
      alerts,
      rules,
      evaluations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle or edit fraud rule
router.post("/fraud/rules/:id/toggle", (req: any, res: any) => {
  try {
    const ruleId = req.params.id;
    const rule = db.prepare("SELECT is_enabled FROM fraud_rules WHERE id = ?").get(ruleId) as any;
    if (!rule) return res.status(404).json({ error: "Fraud rule not found" });

    const newEnabled = rule.is_enabled === 1 ? 0 : 1;
    db.prepare("UPDATE fraud_rules SET is_enabled = ? WHERE id = ?").run(newEnabled, ruleId);

    logAudit((req as any).user.id, "TOGGLE_FRAUD_RULE", ruleId, { newEnabled });
    res.json({ success: true, is_enabled: newEnabled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fraud User Restriction Action
router.post("/fraud/user-action", (req: any, res: any) => {
  try {
    const { userId, action, reason } = req.body;

    if (action === 'suspend') {
      db.prepare("UPDATE users SET is_suspended = 1 WHERE id = ?").run(userId);
    } else if (action === 'unsuspend') {
      db.prepare("UPDATE users SET is_suspended = 0 WHERE id = ?").run(userId);
    } else if (action === 'ban') {
      db.prepare("UPDATE users SET is_banned = 1, is_suspended = 1 WHERE id = ?").run(userId);
    } else if (action === 'mark_safe') {
      db.prepare("UPDATE users SET fraud_score = 0, is_suspended = 0 WHERE id = ?").run(userId);
    }

    logAudit((req as any).user.id, `FRAUD_USER_${action.toUpperCase()}`, userId, { action, reason });
    res.json({ success: true, message: `User fraud action ${action} executed` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ensure fraud_rules table exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fraud_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      threshold REAL NOT NULL,
      action TEXT NOT NULL,
      is_enabled BOOLEAN DEFAULT 1,
      execution_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS refund_idempotency (
      key TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const ruleCount = (db.prepare("SELECT COUNT(*) as c FROM fraud_rules").get() as any)?.c || 0;
  if (ruleCount === 0) {
    db.prepare("INSERT INTO fraud_rules (id, name, condition_type, threshold, action, is_enabled) VALUES (?, ?, ?, ?, ?, ?)").run('rule_1', 'High Refund Rate Flag', 'refund_rate', 0.25, 'HOLD_PAYOUT', 1);
    db.prepare("INSERT INTO fraud_rules (id, name, condition_type, threshold, action, is_enabled) VALUES (?, ?, ?, ?, ?, ?)").run('rule_2', 'Multiple Dispute Anomaly', 'dispute_count', 3, 'FLAG_RISK', 1);
    db.prepare("INSERT INTO fraud_rules (id, name, condition_type, threshold, action, is_enabled) VALUES (?, ?, ?, ?, ?, ?)").run('rule_3', 'Excessive Order Volume', 'hourly_orders', 20, 'RESTRICT_BUYING', 1);
  }
} catch (e) {
  console.warn("Fraud rules table init warning:", e);
}

// Advanced Support Tickets Endpoint
router.get("/tickets/advanced", (req: any, res: any) => {
  try {
    const { search = '', status = 'all', priority = 'all' } = req.query;
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (status !== 'all') {
      whereClauses.push("t.status = ?");
      params.push(status);
    }
    if (priority !== 'all') {
      whereClauses.push("t.priority = ?");
      params.push(priority);
    }
    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push("(LOWER(t.id) LIKE ? OR LOWER(t.subject) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)");
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const tickets = db.prepare(`
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      ${whereSql}
      ORDER BY t.created_at DESC
      LIMIT 50
    `).all(...params);

    res.json({ tickets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tickets/:id/action", (req: any, res: any) => {
  try {
    const ticketId = req.params.id;
    const { action, reply, note, agent } = req.body;

    let newStatus = 'open';
    if (action === 'reply') newStatus = 'pending';
    else if (action === 'resolve') newStatus = 'resolved';
    else if (action === 'escalate') newStatus = 'escalated';
    else if (action === 'assign') newStatus = 'assigned';

    if (action === 'assign' && agent) {
      db.prepare("UPDATE support_tickets SET assigned_to = ?, status = ? WHERE id = ?").run(agent, newStatus, ticketId);
    } else {
      db.prepare("UPDATE support_tickets SET status = ? WHERE id = ?").run(newStatus, ticketId);
    }

    logAudit((req as any).user.id, `TICKET_ACTION_${action.toUpperCase()}`, ticketId, { action, reply, note, agent });
    res.json({ success: true, new_status: newStatus, message: `Ticket action ${action} recorded` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// COUNTRY ID DOCUMENT TYPES API (DATABASE-DRIVEN PER COUNTRY)
// --------------------------------------------------------------------------
router.get("/country-doc-types/list", (req: any, res: any) => {
  try {
    const { country = 'India' } = req.query;
    const countryClean = (country as string).trim();

    const rows = db.prepare(`
      SELECT 
        id,
        doc_id,
        doc_label as label,
        requires_back as requiresBack,
        description,
        sort_order
      FROM country_id_document_types
      WHERE (LOWER(country_name) = LOWER(?) OR LOWER(country_code) = LOWER(?))
        AND is_active = 1
      ORDER BY sort_order ASC
    `).all(countryClean, countryClean) as any[];

    if (rows && rows.length > 0) {
      return res.json({
        country: countryClean,
        isCustomDbList: true,
        allowedDocTypes: rows.map(r => ({
          db_id: r.id,
          id: r.doc_id,
          label: r.label,
          requiresBack: Boolean(r.requiresBack),
          description: r.description
        }))
      });
    }

    // Generic fallback if country specific list is not defined in DB
    const genericFallback = [
      { id: "Passport", label: "Passport", requiresBack: false, description: "Official valid Passport photo page" },
      { id: "NationalID", label: "National Identity Card", requiresBack: true, description: "Government-issued National ID Card" },
      { id: "DriversLicense", label: "Driver's License", requiresBack: true, description: "Official Driver's License photo card" }
    ];

    res.json({
      country: countryClean,
      isCustomDbList: false,
      allowedDocTypes: genericFallback
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin management routes for country document types
router.get("/country-doc-types/all", (req: any, res: any) => {
  try {
    const list = db.prepare("SELECT * FROM country_id_document_types ORDER BY country_name ASC, sort_order ASC").all();
    res.json({ items: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/country-doc-types/save", (req: any, res: any) => {
  try {
    const { id, country_name, country_code, doc_id, doc_label, requires_back, description, sort_order } = req.body;
    if (!country_name || !doc_id || !doc_label) {
      return res.status(400).json({ error: "Country Name, Doc ID, and Doc Label are required." });
    }

    if (id) {
      db.prepare(`
        UPDATE country_id_document_types
        SET country_name = ?, country_code = ?, doc_id = ?, doc_label = ?, requires_back = ?, description = ?, sort_order = ?
        WHERE id = ?
      `).run(country_name, country_code || country_name.substring(0, 2).toUpperCase(), doc_id, doc_label, requires_back ? 1 : 0, description || "", sort_order || 0, id);
    } else {
      db.prepare(`
        INSERT INTO country_id_document_types (id, country_name, country_code, doc_id, doc_label, requires_back, description, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(ulid(), country_name, country_code || country_name.substring(0, 2).toUpperCase(), doc_id, doc_label, requires_back ? 1 : 0, description || "", sort_order || 0);
    }

    logAudit((req as any).user?.id || "admin", "SAVE_COUNTRY_DOC_TYPE", country_name, { doc_id, doc_label });
    res.json({ success: true, message: `Document type saved for ${country_name}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/country-doc-types/:id", (req: any, res: any) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM country_id_document_types WHERE id = ?").run(id);
    logAudit((req as any).user?.id || "admin", "DELETE_COUNTRY_DOC_TYPE", id);
    res.json({ success: true, message: "Document type removed." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
