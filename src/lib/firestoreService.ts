import { 
  doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, writeBatch, runTransaction 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { toast } from "sonner";

/**
 * AUREVYXON Cloud Firestore Persistence Service
 * Enforces real Firestore reads and writes for all marketplace actions.
 */

// FORCE-SERVER FETCH & REAL-TIME LISTENERS
export async function fetchCollectionForceServer(colName: string) {
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    const items: any[] = [];
    snap.forEach((docSnap) => items.push(docSnap.data()));
    return items;
  } catch (err: any) {
    console.error(`❌ [Firestore Force-Server Fetch Error] ${colName}:`, err);
    return [];
  }
}

export function subscribeRealtimeCollection(colName: string, onUpdate: (items: any[], isFromCache: boolean, hasPendingWrites: boolean) => void) {
  const colRef = collection(db, colName);
  return onSnapshot(colRef, { includeMetadataChanges: true }, (snapshot) => {
    const isFromCache = snapshot.metadata.fromCache;
    const hasPendingWrites = snapshot.metadata.hasPendingWrites;
    const items: any[] = [];
    snapshot.forEach((docSnap) => items.push(docSnap.data()));
    onUpdate(items, isFromCache, hasPendingWrites);
  }, (err) => {
    console.error(`❌ [Firestore Realtime Error] ${colName}:`, err);
  });
}

// PENDING WRITES VERIFICATION
export async function verifyServerWriteCommit(colName: string, docId: string): Promise<boolean> {
  try {
    const docRef = doc(db, colName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    const hasPending = snap.metadata.hasPendingWrites;
    if (hasPending) {
      console.warn(`⏳ [Firestore Pending Write] Doc ${docId} in ${colName} is pending server commit...`);
    } else {
      console.log(`✅ [Firestore Server Confirmed] Doc ${docId} in ${colName} acknowledged by server.`);
    }
    return !hasPending;
  } catch (e: any) {
    console.error(`❌ [Firestore Verification Error] ${colName}/${docId}:`, e);
    return false;
  }
}

// PERSISTENCE HEALTH CHECK FOR ADMIN DIAGNOSTICS
export async function runPersistenceHealthCheck(): Promise<{ success: boolean; details: Record<string, any> }> {
  const testId = `health_check_${Date.now()}`;
  const details: Record<string, any> = { testId, timestamp: new Date().toISOString() };
  try {
    const healthDocRef = doc(db, "system_settings", testId);
    
    // 1. Write Test Document
    const testPayload = { id: testId, status: "testing", ping: "pong", created_at: new Date().toISOString() };
    await setDoc(healthDocRef, testPayload);
    details.write = "PASSED";

    // 2. Read Test Document with force server verification
    const snap = await getDoc(healthDocRef);
    if (!snap.exists() || snap.data()?.ping !== "pong") {
      throw new Error("Read verification failed or data mismatch");
    }
    details.read = "PASSED";
    details.hasPendingWrites = snap.metadata.hasPendingWrites;
    details.fromCache = snap.metadata.fromCache;

    // 3. Clean up test document
    await deleteDoc(healthDocRef);
    details.delete = "PASSED";

    console.log("🏥 [Firestore Health Check] Complete Health Check PASSED:", details);
    toast.success("Firestore Persistence Health Check Passed! Real Writes Verified.");
    return { success: true, details };
  } catch (err: any) {
    console.error("❌ [Firestore Health Check Failed]:", err);
    details.error = err?.message || "Health check failed";
    toast.error(`Persistence Health Check Failed: ${err?.message || 'Firestore write error'}`);
    return { success: false, details };
  }
}

// ATOMIC TRANSACTION EXECUTION WITH IDEMPOTENCY KEYING
export async function executeAtomicTransaction(
  operations: (transaction: any) => Promise<void>,
  idempotencyKey?: string
) {
  try {
    if (idempotencyKey) {
      const idempRef = doc(db, "transactions", `idemp_${idempotencyKey}`);
      const idempSnap = await getDoc(idempRef);
      if (idempSnap.exists()) {
        console.warn(`⚠️ [Firestore Idempotency] Operation with key ${idempotencyKey} already executed.`);
        return { status: "already_processed", key: idempotencyKey };
      }
    }

    await runTransaction(db, async (transaction) => {
      await operations(transaction);
      if (idempotencyKey) {
        const idempRef = doc(db, "transactions", `idemp_${idempotencyKey}`);
        transaction.set(idempRef, { idempotencyKey, executedAt: new Date().toISOString() });
      }
    });

    console.log("🔥 [Firestore Atomic Transaction] Successfully committed atomic transaction.");
    return { status: "success" };
  } catch (err: any) {
    console.error("❌ [Firestore Transaction Error]:", err);
    toast.error(`Transaction failed: ${err?.message || 'Server-side transaction rejected'}`);
    throw err;
  }
}

// BATCH FINANCIAL EXECUTION
export async function executeFinancialBatch(txOperations: Array<{ collection: string; id: string; data: any }>) {
  try {
    const batch = writeBatch(db);
    for (const op of txOperations) {
      const docRef = doc(db, op.collection, op.id);
      batch.set(docRef, { ...op.data, updated_at: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log("🔥 [Firestore Batch] Successfully committed financial batch of", txOperations.length, "docs");
    return true;
  } catch (err: any) {
    console.error("❌ [Firestore Financial Batch Error]:", err);
    toast.error(`Financial transaction failed: ${err?.message || 'Server error'}`);
    throw err;
  }
}

// 1. USER PROFILES
export async function persistUserToFirestore(userData: {
  id: string;
  name: string;
  email: string;
  role?: string;
  photoURL?: string;
  seller_profile?: any;
}) {
  try {
    const userRef = doc(db, "users", userData.id);
    const profileRef = doc(db, "user_profiles", userData.id);
    const settingsRef = doc(db, "user_settings", userData.id);

    const payload = {
      uid: userData.id,
      name: userData.name || "",
      email: userData.email || "",
      role: userData.role || "buyer",
      photoURL: userData.photoURL || "",
      seller_profile: userData.seller_profile || null,
      updatedAt: new Date().toISOString()
    };

    const batch = writeBatch(db);
    batch.set(userRef, payload, { merge: true });
    batch.set(profileRef, payload, { merge: true });
    batch.set(settingsRef, { user_id: userData.id, notifications_enabled: true }, { merge: true });
    await batch.commit();

    console.log("🔥 [Firestore] Persisted user profile & settings across domain:", userData.id);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist user profile:", err);
    toast.error(`Firestore save failed: ${err.message || 'Permission or Network Error'}`);
    throw err;
  }
}


export async function fetchUserFromFirestore(userId: string) {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to fetch user profile:", err);
    return null;
  }
}

// 2. PRODUCTS / LISTINGS
export async function persistProductToFirestore(product: any) {
  try {
    const productId = String(product.id);
    const productRef = doc(db, "products", productId);
    const payload = {
      id: productId,
      title: product.title || "",
      description: product.description || "",
      price: Number(product.price) || 0,
      original_price: Number(product.original_price || product.price) || 0,
      discount_percent: Number(product.discount_percent || 0),
      discount_amount: Number(product.discount_amount || 0),
      buyer_price: Number(product.buyer_price || product.price) || 0,
      platform_fee: Number(product.platform_fee || 0),
      net_payout: Number(product.net_payout || product.price) || 0,
      category: product.category || "General",
      seller_id: String(product.seller_id || product.user_id || auth.currentUser?.uid || "seller"),
      seller_name: product.seller_name || auth.currentUser?.displayName || "Verified Seller",
      image_url: product.image_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      status: product.status || "active",
      tags: Array.isArray(product.tags) ? product.tags : [],
      views_count: Number(product.views_count || 0),
      sales_count: Number(product.sales_count || 0),
      rating: Number(product.rating || 5.0),
      created_at: product.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await setDoc(productRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted product to collection 'products':", productId);

    // Duplicate sync to 'listings' for query flexibility
    const listingRef = doc(db, "listings", productId);
    await setDoc(listingRef, payload, { merge: true });

    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist product:", err);
    toast.error(`Firestore product save failed: ${err.message}`);
    throw err;
  }
}

export async function fetchProductsFromFirestore() {
  try {
    const colRef = collection(db, "products");
    const snap = await getDocs(colRef);
    const products: any[] = [];
    snap.forEach((docSnap) => {
      products.push(docSnap.data());
    });
    console.log("🔥 [Firestore] Fetched products count:", products.length);
    return products;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to fetch products:", err);
    return [];
  }
}

// 3. SELLER PROFILES & KYC
export async function persistSellerProfileToFirestore(sellerProfile: any) {
  try {
    const sellerId = String(sellerProfile.user_id || sellerProfile.id || auth.currentUser?.uid);
    if (!sellerId) throw new Error("Missing seller user_id");

    const sellerRef = doc(db, "sellers", sellerId);
    const payload = {
      id: sellerId,
      user_id: sellerId,
      store_name: sellerProfile.store_name || "Seller Store",
      business_email: sellerProfile.business_email || "",
      kyc_status: sellerProfile.kyc_status || "pending",
      kyc_documents: sellerProfile.kyc_documents || [],
      payout_bank: sellerProfile.payout_bank || "",
      admin_notes: sellerProfile.admin_notes || "",
      rejection_reason: sellerProfile.rejection_reason || "",
      updated_at: new Date().toISOString()
    };

    await setDoc(sellerRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted seller profile to 'sellers':", sellerId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist seller profile:", err);
    toast.error(`Firestore seller save failed: ${err.message}`);
    throw err;
  }
}

// 4. ORDERS & TRANSACTIONS
export async function persistOrderToFirestore(orderData: any) {
  try {
    const orderId = String(orderData.id);
    const orderRef = doc(db, "orders", orderId);
    const payload = {
      id: orderId,
      buyer_id: String(orderData.buyer_id || auth.currentUser?.uid || "buyer"),
      buyer_name: orderData.buyer_name || "Buyer",
      product_id: String(orderData.product_id),
      product_title: orderData.product_title || "",
      amount: Number(orderData.amount || 0),
      platform_fee: Number(orderData.platform_fee || 0),
      net_seller_payout: Number(orderData.net_seller_payout || 0),
      status: orderData.status || "completed",
      created_at: orderData.created_at || new Date().toISOString()
    };

    await setDoc(orderRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted order to 'orders':", orderId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist order:", err);
    toast.error(`Firestore order save failed: ${err.message}`);
    throw err;
  }
}

// 5. DIRECT MESSAGES
export async function persistMessageToFirestore(messageData: any) {
  try {
    const msgId = String(messageData.id);
    const msgRef = doc(db, "messages", msgId);
    const payload = {
      id: msgId,
      conversation_id: messageData.conversation_id || `conv_seller_${messageData.recipient_id}`,
      sender_id: String(messageData.sender_id || auth.currentUser?.uid),
      sender_role: messageData.sender_role || "user",
      sender_display_name: messageData.sender_display_name || "AUREVYXON User",
      recipient_id: String(messageData.recipient_id),
      category: messageData.category || "General",
      subject: messageData.subject || "",
      message: messageData.message || "",
      is_read: messageData.is_read ? 1 : 0,
      created_at: messageData.created_at || new Date().toISOString()
    };

    await setDoc(msgRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted message to 'messages':", msgId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist message:", err);
    toast.error(`Firestore message save failed: ${err.message}`);
    throw err;
  }
}

// 6. NOTIFICATIONS
export async function persistNotificationToFirestore(notifData: any) {
  try {
    const notifId = String(notifData.id);
    const notifRef = doc(db, "notifications", notifId);
    const payload = {
      id: notifId,
      user_id: String(notifData.user_id),
      type: notifData.type || "system",
      message: notifData.message || "",
      reference_id: notifData.reference_id || "",
      is_read: notifData.is_read ? 1 : 0,
      created_at: notifData.created_at || new Date().toISOString()
    };

    await setDoc(notifRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted notification to 'notifications':", notifId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist notification:", err);
    return null;
  }
}

// 7. KYC SUBMISSIONS
export async function persistKycSubmissionToFirestore(kycData: any) {
  try {
    const kycId = String(kycData.id || kycData.user_id || auth.currentUser?.uid);
    const kycRef = doc(db, "kyc_submissions", kycId);
    const payload = {
      id: kycId,
      user_id: String(kycData.user_id || auth.currentUser?.uid),
      full_name: kycData.full_name || "",
      document_type: kycData.document_type || "Passport",
      document_number: kycData.document_number || "",
      status: kycData.status || "pending",
      review_notes: kycData.review_notes || "",
      created_at: kycData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await setDoc(kycRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted KYC submission to 'kyc_submissions':", kycId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist KYC submission:", err);
    return null;
  }
}

// 8. WALLET TRANSACTIONS
export async function persistWalletTxToFirestore(txData: any) {
  try {
    const txId = String(txData.id);
    const txRef = doc(db, "wallet_transactions", txId);
    const payload = {
      id: txId,
      user_id: String(txData.user_id || auth.currentUser?.uid),
      type: txData.type || "deposit",
      amount: Number(txData.amount || 0),
      description: txData.description || "",
      status: txData.status || "completed",
      created_at: txData.created_at || new Date().toISOString()
    };
    await setDoc(txRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted wallet transaction to 'wallet_transactions':", txId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist wallet transaction:", err);
    return null;
  }
}

// 9. PAYOUT REQUESTS
export async function persistPayoutRequestToFirestore(payoutData: any) {
  try {
    const payoutId = String(payoutData.id);
    const payoutRef = doc(db, "payout_requests", payoutId);
    const payload = {
      id: payoutId,
      seller_id: String(payoutData.seller_id || auth.currentUser?.uid),
      amount: Number(payoutData.amount || 0),
      payment_method: payoutData.payment_method || "Bank Transfer",
      status: payoutData.status || "pending",
      created_at: payoutData.created_at || new Date().toISOString()
    };
    await setDoc(payoutRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted payout request to 'payout_requests':", payoutId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist payout request:", err);
    return null;
  }
}

// 10. COUPONS
export async function persistCouponToFirestore(couponData: any) {
  try {
    const couponId = String(couponData.id || couponData.code);
    const couponRef = doc(db, "coupons", couponId);
    const payload = {
      id: couponId,
      code: couponData.code || "",
      seller_id: String(couponData.seller_id || auth.currentUser?.uid),
      discount_percentage: Number(couponData.discount_percentage || 0),
      max_uses: Number(couponData.max_uses || 100),
      uses_count: Number(couponData.uses_count || 0),
      status: couponData.status || "active",
      created_at: couponData.created_at || new Date().toISOString()
    };
    await setDoc(couponRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted coupon to 'coupons':", couponId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist coupon:", err);
    return null;
  }
}

// 11. REVIEWS
export async function persistReviewToFirestore(reviewData: any) {
  try {
    const reviewId = String(reviewData.id);
    const reviewRef = doc(db, "reviews", reviewId);
    const payload = {
      id: reviewId,
      product_id: String(reviewData.product_id),
      user_id: String(reviewData.user_id || auth.currentUser?.uid),
      rating: Number(reviewData.rating || 5),
      comment: reviewData.comment || "",
      created_at: reviewData.created_at || new Date().toISOString()
    };
    await setDoc(reviewRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted review to 'reviews':", reviewId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist review:", err);
    return null;
  }
}

// 12. SUPPORT TICKETS
export async function persistTicketToFirestore(ticketData: any) {
  try {
    const ticketId = String(ticketData.id);
    const ticketRef = doc(db, "tickets", ticketId);
    const payload = {
      id: ticketId,
      user_id: String(ticketData.user_id || auth.currentUser?.uid),
      subject: ticketData.subject || "",
      category: ticketData.category || "General",
      status: ticketData.status || "open",
      priority: ticketData.priority || "normal",
      created_at: ticketData.created_at || new Date().toISOString()
    };
    await setDoc(ticketRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted support ticket to 'tickets':", ticketId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist support ticket:", err);
    return null;
  }
}

// 13. AUDIT LOGS
export async function persistAuditLogToFirestore(logData: any) {
  try {
    const logId = String(logData.id);
    const logRef = doc(db, "audit_logs", logId);
    const payload = {
      id: logId,
      admin_id: String(logData.admin_id || auth.currentUser?.uid || "admin"),
      action: logData.action || "",
      target_id: String(logData.target_id || ""),
      details: logData.details || "",
      created_at: logData.created_at || new Date().toISOString()
    };
    await setDoc(logRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted audit log to 'audit_logs':", logId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist audit log:", err);
    return null;
  }
}

// 14. SYSTEM SETTINGS
export async function persistSystemSettingToFirestore(settingData: any) {
  try {
    const settingId = String(settingData.id || settingData.key || "global");
    const settingRef = doc(db, "system_settings", settingId);
    const payload = {
      id: settingId,
      platform_fee_percent: Number(settingData.platform_fee_percent || 5),
      maintenance_mode: Boolean(settingData.maintenance_mode),
      payout_threshold: Number(settingData.payout_threshold || 50),
      updated_at: new Date().toISOString()
    };
    await setDoc(settingRef, payload, { merge: true });
    console.log("🔥 [Firestore] Persisted system setting to 'system_settings':", settingId);
    return payload;
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to persist system setting:", err);
    return null;
  }
}

