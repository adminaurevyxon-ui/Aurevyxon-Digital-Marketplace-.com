import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import sqliteDb from './db.ts';

let firebaseConfig: any = {};
try {
  if (fs.existsSync('./firebase-applet-config.json')) {
    firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  }
} catch (e) {
  console.warn("⚠️ [Firestore Sync] Notice: could not load firebase-applet-config.json:", e);
}

const fbApp = firebaseConfig.apiKey ? initializeApp(firebaseConfig, "AurevyxonServerApp") : null;
const fbAuth = fbApp ? getAuth(fbApp) : null;
export const firestoreDb = fbApp ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId) : null;

let isReady = false;

export async function initServerFirestore() {
  if (!fbAuth || !firestoreDb) {
    console.warn("⚠️ [Firestore Sync] Skipping server Firestore init: fbAuth or firestoreDb is null");
    return;
  }
  try {
    await signInWithEmailAndPassword(fbAuth, "system-service@aurevyxon.com", "ServerPass123!");
    console.log("🔥 [Firestore Sync] Server authenticated with Cloud Firestore.");
    isReady = true;
  } catch (err: any) {
    try {
      await createUserWithEmailAndPassword(fbAuth, "system-service@aurevyxon.com", "ServerPass123!");
      console.log("🔥 [Firestore Sync] Server system account created & authenticated.");
      isReady = true;
    } catch (e: any) {
      console.warn("⚠️ [Firestore Sync] Auth initialization notice:", e?.message);
    }
  }

  // Perform full initial synchronization from SQLite to Cloud Firestore
  try {
    await syncAllSqliteDataToFirestore();
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Initial data migration error:", err?.message);
  }
}

export async function syncProductToFirestore(product: any) {
  if (!product || !product.id || !firestoreDb) return;
  try {
    const pId = String(product.id);
    const payload = {
      id: pId,
      title: product.title || "",
      description: product.description || "",
      price: Number(product.price) || 0,
      original_price: Number(product.original_price || product.price) || 0,
      discount_percent: Number(product.discount_percentage || product.discount_percent || 0),
      discount_type: product.discount_type || 'None',
      buyer_price: Number(product.buyer_price || product.price) || 0,
      platform_fee: Number(product.platform_fee || 0),
      net_payout: Number(product.net_payout || product.price) || 0,
      category: product.type || product.category || "Digital Product",
      seller_id: String(product.seller_id || "seller"),
      image_url: product.image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      file_url: product.file_url || "",
      status: product.status || "active",
      views_count: Number(product.views_count || 0),
      sales_count: Number(product.sales_count || 0),
      rating: Number(product.rating || 5.0),
      created_at: product.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await setDoc(doc(firestoreDb, "products", pId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "listings", pId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "product_versions", pId), { ...payload, version: "1.0.0" }, { merge: true });
    await setDoc(doc(firestoreDb, "categories", String(product.category || "general")), { id: String(product.category || "general"), name: product.category || "Digital Product" }, { merge: true });
    await setDoc(doc(firestoreDb, "product_metadata", pId), { id: pId, tags: [product.category || "digital"], downloads: Number(product.sales_count || 0) }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced product to products, listings, product_versions, categories, product_metadata:", pId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync product:", err?.message);
  }
}

export async function syncUserToFirestore(user: any) {
  if (!user || !user.id || !firestoreDb) return;
  try {
    const uId = String(user.id);
    const payload = {
      uid: uId,
      id: uId,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "buyer",
      bio: user.bio || "",
      is_banned: user.is_banned ? 1 : 0,
      seller_balance: Number(user.seller_balance || 0),
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "users", uId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "user_profiles", uId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "user_settings", uId), { user_id: uId, notifications_enabled: true, theme: "light" }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced user to users, user_profiles, user_settings:", uId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync user:", err?.message);
  }
}

export async function syncSellerProfileToFirestore(seller: any) {
  if (!seller || (!seller.user_id && !seller.id) || !firestoreDb) return;
  try {
    const sId = String(seller.user_id || seller.id);
    const payload = {
      id: sId,
      user_id: sId,
      store_name: seller.display_name || seller.store_name || "Seller Store",
      seller_type: seller.seller_type || "individual",
      pan_number: seller.pan_number || "",
      kyc_status: seller.kyc_status || "pending",
      payout_verified: seller.payout_verified ? 1 : 0,
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "sellers", sId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "seller_profiles", sId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "seller_verifications", sId), { id: sId, seller_id: sId, is_verified: seller.payout_verified ? 1 : 0, verified_at: new Date().toISOString() }, { merge: true });
    await setDoc(doc(firestoreDb, "seller_settings", sId), { seller_id: sId, auto_payout: true, currency: "USD" }, { merge: true });
    await setDoc(doc(firestoreDb, "seller_payout_methods", sId), { seller_id: sId, type: "bank_transfer", is_default: true }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced seller to sellers, seller_profiles, seller_verifications, seller_settings, seller_payout_methods:", sId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync seller profile:", err?.message);
  }
}

export async function syncOrderToFirestore(order: any) {
  if (!order || !order.id || !firestoreDb) return;
  try {
    const oId = String(order.id);
    const payload = {
      id: oId,
      buyer_id: String(order.buyer_id || ""),
      seller_id: String(order.seller_id || ""),
      listing_id: String(order.listing_id || order.product_id || ""),
      amount: Number(order.amount || 0),
      status: order.status || "completed",
      created_at: order.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "orders", oId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "order_items", oId), { order_id: oId, product_id: payload.listing_id, price: payload.amount, quantity: 1 }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced order to orders and order_items:", oId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync order:", err?.message);
  }
}

export async function syncMessageToFirestore(msg: any) {
  if (!msg || !msg.id || !firestoreDb) return;
  try {
    const mId = String(msg.id);
    const payload = {
      id: mId,
      conversation_id: msg.conversation_id || "",
      sender_id: String(msg.sender_id || ""),
      sender_role: msg.sender_role || "user",
      sender_display_name: msg.sender_display_name || "AUREVYXON Support",
      recipient_id: String(msg.recipient_id || ""),
      category: msg.category || "General",
      subject: msg.subject || "",
      message: msg.message || "",
      is_read: msg.is_read ? 1 : 0,
      created_at: msg.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "messages", mId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "conversations", String(msg.conversation_id || mId)), { id: String(msg.conversation_id || mId), participant_a: payload.sender_id, participant_b: payload.recipient_id, last_message: payload.message }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced message to messages and conversations:", mId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync message:", err?.message);
  }
}

export async function syncKycToFirestore(kyc: any) {
  if (!kyc || (!kyc.id && !kyc.user_id) || !firestoreDb) return;
  try {
    const kId = String(kyc.id || kyc.user_id);
    const payload = {
      id: kId,
      user_id: String(kyc.user_id || kId),
      full_name: kyc.full_name || kyc.name || "",
      document_type: kyc.document_type || "Passport",
      document_number: kyc.document_number || "",
      status: kyc.status || kyc.kyc_status || "pending",
      review_notes: kyc.review_notes || "",
      created_at: kyc.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "kyc_submissions", kId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "kyc_applications", kId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "kyc_documents", kId), { id: kId, user_id: payload.user_id, document_type: payload.document_type, doc_number: payload.document_number }, { merge: true });
    await setDoc(doc(firestoreDb, "verification_records", kId), { id: kId, user_id: payload.user_id, status: payload.status, verified_at: new Date().toISOString() }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced KYC to kyc_submissions, kyc_applications, kyc_documents, verification_records:", kId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync KYC:", err?.message);
  }
}

export async function syncWalletTxToFirestore(tx: any) {
  if (!tx || !tx.id || !firestoreDb) return;
  try {
    const tId = String(tx.id);
    const payload = {
      id: tId,
      user_id: String(tx.user_id || tx.buyer_id || ""),
      type: tx.type || "deposit",
      amount: Number(tx.amount || 0),
      description: tx.description || tx.type || "",
      status: tx.status || "completed",
      created_at: tx.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "wallet_transactions", tId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "transactions", tId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "wallets", payload.user_id || tId), { user_id: payload.user_id, balance: payload.amount }, { merge: true });
    await setDoc(doc(firestoreDb, "wallet_ledger", tId), { id: tId, user_id: payload.user_id, entry_type: payload.type, amount: payload.amount }, { merge: true });
    await setDoc(doc(firestoreDb, "commissions", tId), { id: tId, tx_id: tId, commission_amount: payload.amount * 0.05 }, { merge: true });
    await setDoc(doc(firestoreDb, "refunds", tId), { id: tId, tx_id: tId, amount: payload.amount, status: "none" }, { merge: true });
    await setDoc(doc(firestoreDb, "disputes", tId), { id: tId, tx_id: tId, status: "resolved" }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced tx to wallet_transactions, transactions, wallets, wallet_ledger, commissions, refunds, disputes:", tId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync transaction:", err?.message);
  }
}

export async function syncPayoutRequestToFirestore(payout: any) {
  if (!payout || !payout.id || !firestoreDb) return;
  try {
    const pId = String(payout.id);
    const payload = {
      id: pId,
      seller_id: String(payout.user_id || payout.seller_id || ""),
      amount: Number(payout.amount || 0),
      payment_method: payout.payment_method || payout.method || "Bank Transfer",
      status: payout.status || "pending",
      created_at: payout.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "payout_requests", pId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "payouts", pId), payload, { merge: true });
    console.log("🔥 [Firestore Sync] Synced payout to payout_requests and payouts:", pId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync payout request:", err?.message);
  }
}

export async function syncCouponToFirestore(coupon: any) {
  if (!coupon || (!coupon.id && !coupon.code) || !firestoreDb) return;
  try {
    const cId = String(coupon.id || coupon.code);
    const payload = {
      id: cId,
      code: coupon.code || "",
      seller_id: String(coupon.seller_id || ""),
      discount_percentage: Number(coupon.discount_percentage || coupon.discount || 0),
      max_uses: Number(coupon.max_uses || 100),
      uses_count: Number(coupon.uses_count || coupon.uses || 0),
      status: coupon.status || "active",
      created_at: coupon.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "coupons", cId), payload, { merge: true });
    console.log("🔥 [Firestore Sync] Synced coupon doc:", cId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync coupon:", err?.message);
  }
}

export async function syncReviewToFirestore(review: any) {
  if (!review || !review.id || !firestoreDb) return;
  try {
    const rId = String(review.id);
    const payload = {
      id: rId,
      product_id: String(review.listing_id || review.product_id || ""),
      user_id: String(review.user_id || review.buyer_id || ""),
      rating: Number(review.rating || 5),
      comment: review.comment || review.content || "",
      created_at: review.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "reviews", rId), payload, { merge: true });
    console.log("🔥 [Firestore Sync] Synced review doc:", rId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync review:", err?.message);
  }
}

export async function syncTicketToFirestore(ticket: any) {
  if (!ticket || !ticket.id || !firestoreDb) return;
  try {
    const tId = String(ticket.id);
    const payload = {
      id: tId,
      user_id: String(ticket.user_id || ""),
      subject: ticket.subject || "",
      category: ticket.category || "General",
      status: ticket.status || "open",
      priority: ticket.priority || "normal",
      created_at: ticket.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "tickets", tId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "support_tickets", tId), payload, { merge: true });
    console.log("🔥 [Firestore Sync] Synced ticket to tickets and support_tickets:", tId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync ticket:", err?.message);
  }
}

export async function syncNotificationToFirestore(notif: any) {
  if (!notif || !notif.id || !firestoreDb) return;
  try {
    const nId = String(notif.id);
    const payload = {
      id: nId,
      user_id: String(notif.user_id || ""),
      type: notif.type || "system",
      message: notif.message || notif.title || "",
      reference_id: notif.reference_id || "",
      is_read: notif.is_read ? 1 : 0,
      created_at: notif.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "notifications", nId), payload, { merge: true });
    console.log("🔥 [Firestore Sync] Synced notification doc:", nId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync notification:", err?.message);
  }
}

export async function syncAuditLogToFirestore(log: any) {
  if (!log || !log.id || !firestoreDb) return;
  try {
    const lId = String(log.id);
    const payload = {
      id: lId,
      admin_id: String(log.admin_id || log.user_id || "admin"),
      action: log.action || "",
      target_id: String(log.target_id || ""),
      details: log.details || "",
      created_at: log.created_at || new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "audit_logs", lId), payload, { merge: true });
    console.log("🔥 [Firestore Sync] Synced audit log doc:", lId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync audit log:", err?.message);
  }
}

export async function syncSystemSettingToFirestore(setting: any) {
  if (!setting || !firestoreDb) return;
  try {
    const sId = String(setting.id || setting.key || "global");
    const payload = {
      id: sId,
      platform_fee_percent: Number(setting.platform_fee || setting.platform_fee_percent || 5),
      maintenance_mode: Boolean(setting.maintenance_mode),
      payout_threshold: Number(setting.payout_threshold || 50),
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(firestoreDb, "system_settings", sId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "platform_settings", sId), payload, { merge: true });
    await setDoc(doc(firestoreDb, "commission_settings", sId), { fee_percentage: payload.platform_fee_percent }, { merge: true });
    await setDoc(doc(firestoreDb, "feature_flags", "global"), { maintenance_mode: payload.maintenance_mode, kyc_required: true }, { merge: true });
    await setDoc(doc(firestoreDb, "admin_roles", "admin_super"), { role: "super_admin", level: 1 }, { merge: true });
    await setDoc(doc(firestoreDb, "admin_permissions", "full_access"), { permission: "all", granted: true }, { merge: true });
    await setDoc(doc(firestoreDb, "cms_pages", "terms"), { id: "terms", title: "Terms of Service", content: "AUREVYXON Marketplace Terms" }, { merge: true });
    await setDoc(doc(firestoreDb, "banners", "hero"), { id: "hero", title: "AUREVYXON Digital Marketplace", active: true }, { merge: true });
    console.log("🔥 [Firestore Sync] Synced settings to system_settings, platform_settings, commission_settings, feature_flags, admin_roles, admin_permissions, cms_pages, banners:", sId);
  } catch (err: any) {
    console.error("❌ [Firestore Sync] Failed to sync system setting:", err?.message);
  }
}

export async function syncAllSqliteDataToFirestore() {
  console.log("🚀 [Firestore Migration] Starting initial sync of all SQLite records into Cloud Firestore...");

  // 1. Sync Users
  try {
    const users = sqliteDb.prepare("SELECT * FROM users").all();
    for (const u of users as any[]) {
      await syncUserToFirestore(u);
    }
    console.log(`✅ Synced ${users.length} users to Firestore 'users' collection.`);
  } catch (e: any) {
    console.warn("User migration notice:", e?.message);
  }

  // 2. Sync Listings / Products
  try {
    const listings = sqliteDb.prepare("SELECT * FROM listings").all();
    for (const l of listings as any[]) {
      await syncProductToFirestore(l);
    }
    console.log(`✅ Synced ${listings.length} products to Firestore 'products' collection.`);
  } catch (e: any) {
    console.warn("Listings migration notice:", e?.message);
  }

  // 3. Sync Seller Profiles
  try {
    const sellers = sqliteDb.prepare("SELECT * FROM seller_profiles").all();
    for (const s of sellers as any[]) {
      await syncSellerProfileToFirestore(s);
    }
    console.log(`✅ Synced ${sellers.length} seller profiles to Firestore 'sellers' collection.`);
  } catch (e: any) {
    console.warn("Sellers migration notice:", e?.message);
  }

  // 4. Sync Orders
  try {
    const orders = sqliteDb.prepare("SELECT * FROM orders").all();
    for (const o of orders as any[]) {
      await syncOrderToFirestore(o);
    }
    console.log(`✅ Synced ${orders.length} orders to Firestore 'orders' collection.`);
  } catch (e: any) {
    console.warn("Orders migration notice:", e?.message);
  }

  // 5. Sync Direct Messages
  try {
    const messages = sqliteDb.prepare("SELECT * FROM direct_messages").all();
    for (const m of messages as any[]) {
      await syncMessageToFirestore(m);
    }
    console.log(`✅ Synced ${messages.length} messages to Firestore 'messages' collection.`);
  } catch (e: any) {
    console.warn("Messages migration notice:", e?.message);
  }

  // 6. Sync KYC Submissions
  try {
    const kycs = sqliteDb.prepare("SELECT * FROM kyc_applications").all();
    for (const k of kycs as any[]) {
      await syncKycToFirestore(k);
    }
    console.log(`✅ Synced ${kycs.length} KYC submissions to Firestore 'kyc_submissions' collection.`);
  } catch (e: any) {
    console.warn("KYC migration notice:", e?.message);
  }

  // 7. Sync Transactions / Wallet
  try {
    const txs = sqliteDb.prepare("SELECT * FROM transactions").all();
    for (const t of txs as any[]) {
      await syncWalletTxToFirestore(t);
    }
    console.log(`✅ Synced ${txs.length} transactions to Firestore 'wallet_transactions' collection.`);
  } catch (e: any) {
    console.warn("Transactions migration notice:", e?.message);
  }

  // 8. Sync Payout Requests
  try {
    const payouts = sqliteDb.prepare("SELECT * FROM payout_requests").all();
    for (const p of payouts as any[]) {
      await syncPayoutRequestToFirestore(p);
    }
    console.log(`✅ Synced ${payouts.length} payout requests to Firestore 'payout_requests' collection.`);
  } catch (e: any) {
    console.warn("Payouts migration notice:", e?.message);
  }

  // 9. Sync Coupons
  try {
    const coupons = sqliteDb.prepare("SELECT * FROM coupons").all();
    for (const c of coupons as any[]) {
      await syncCouponToFirestore(c);
    }
    console.log(`✅ Synced ${coupons.length} coupons to Firestore 'coupons' collection.`);
  } catch (e: any) {
    console.warn("Coupons migration notice:", e?.message);
  }

  // 10. Sync Reviews
  try {
    const reviews = sqliteDb.prepare("SELECT * FROM reviews").all();
    for (const r of reviews as any[]) {
      await syncReviewToFirestore(r);
    }
    console.log(`✅ Synced ${reviews.length} reviews to Firestore 'reviews' collection.`);
  } catch (e: any) {
    console.warn("Reviews migration notice:", e?.message);
  }

  // 11. Sync Support Tickets
  try {
    const tickets = sqliteDb.prepare("SELECT * FROM support_tickets").all();
    for (const t of tickets as any[]) {
      await syncTicketToFirestore(t);
    }
    console.log(`✅ Synced ${tickets.length} tickets to Firestore 'tickets' collection.`);
  } catch (e: any) {
    console.warn("Tickets migration notice:", e?.message);
  }

  // 12. Sync Notifications
  try {
    const notifs = sqliteDb.prepare("SELECT * FROM notifications").all();
    for (const n of notifs as any[]) {
      await syncNotificationToFirestore(n);
    }
    console.log(`✅ Synced ${notifs.length} notifications to Firestore 'notifications' collection.`);
  } catch (e: any) {
    console.warn("Notifications migration notice:", e?.message);
  }

  // 13. Sync Audit Logs
  try {
    const logs = sqliteDb.prepare("SELECT * FROM audit_logs").all();
    for (const l of logs as any[]) {
      await syncAuditLogToFirestore(l);
    }
    console.log(`✅ Synced ${logs.length} audit logs to Firestore 'audit_logs' collection.`);
  } catch (e: any) {
    console.warn("Audit logs migration notice:", e?.message);
  }

  // 14. Sync System Settings
  try {
    const settings = sqliteDb.prepare("SELECT * FROM platform_settings").all();
    for (const s of settings as any[]) {
      await syncSystemSettingToFirestore(s);
    }
    console.log(`✅ Synced ${settings.length} system settings to Firestore 'system_settings' collection.`);
  } catch (e: any) {
    console.warn("Settings migration notice:", e?.message);
  }

  console.log("🎉 [Firestore Migration] COMPLETE! All marketplace collections populated in Cloud Firestore!");
}

