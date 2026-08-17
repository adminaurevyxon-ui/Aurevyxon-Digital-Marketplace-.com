import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Clock, ShieldAlert, ShieldCheck, RefreshCw, FileText, CheckCircle2, 
  AlertCircle, Building2, User, CreditCard, Lock, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { SellerOnboarding } from "@/components/SellerOnboarding";

interface PendingSellerReviewProps {
  onStatusApproved?: () => void;
}

export function PendingSellerReview({ onStatusApproved }: PendingSellerReviewProps) {
  const { user, token } = useAuth();
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReopenOnboarding, setShowReopenOnboarding] = useState(false);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 71,
    minutes: 59,
    seconds: 59,
  });

  const fetchKycStatus = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch from Firestore first if available
      if (user?.id) {
        try {
          const sellerDocRef = doc(db, "sellers", user.id);
          const docSnap = await getDoc(sellerDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setKycData(data);
            if (data.status === "verified" || data.kycStatus === "verified") {
              toast.success("Congratulations! Your Seller account has been approved by Admin!");
              if (onStatusApproved) onStatusApproved();
              else window.location.reload();
              return;
            }
          }
        } catch (fsErr) {
          console.warn("Firestore fetch error:", fsErr);
        }
      }

      // 2. Fetch from Backend API
      if (token) {
        const res = await fetch("/api/seller/kyc-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.role === 'seller' || data.kyc_status === 'verified') {
            toast.success("Seller verification approved!");
            if (onStatusApproved) onStatusApproved();
            else window.location.reload();
            return;
          }
          setKycData(data);
          if (data.profile) {
            setKycData((prev: any) => ({ ...prev, ...data.profile, ...data }));
          }
        }
      }
    } catch (e) {
      console.error("Status check failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();

    // Listen live to Firestore updates if user logged in
    let unsubscribe: any = null;
    if (user?.id) {
      try {
        const sellerDocRef = doc(db, "sellers", user.id);
        unsubscribe = onSnapshot(sellerDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setKycData((prev: any) => ({ ...prev, ...data }));
            if (data.status === "verified" || data.kycStatus === "verified") {
              toast.success("Admin Approved Your Seller Account! Access Granted.");
              if (onStatusApproved) onStatusApproved();
              else window.location.reload();
            }
          }
        });
      } catch (err) {
        console.warn("Firestore snapshot listener error:", err);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id, token]);

  // Status helpers
  const isUnsubmitted = !kycData?.kyc_status || kycData?.kyc_status === 'not_submitted' || kycData?.kyc_status === 'none' || kycData?.kyc_status === 'KYC_DRAFT';
  const isRejected = kycData?.kyc_status === 'rejected' || kycData?.kyc_status === 'requires_info' || kycData?.kyc_status === 'resubmission' || kycData?.status === 'rejected';
  const isPending = kycData?.kyc_status === 'pending' || kycData?.kyc_status === 'under_review' || kycData?.kyc_status === 'PENDING_REVIEW' || (!isUnsubmitted && !isRejected);

  // Live Countdown timer ticker (Configurable SLA calculation)
  const slaHours = kycData?.kyc_sla_hours || kycData?.estimated_approval_hours || 72;

  useEffect(() => {
    if (isUnsubmitted || isRejected) {
      setIsTimerExpired(true);
      return;
    }

    let submittedTime = Date.now();
    if (kycData?.submitted_at) {
      submittedTime = new Date(kycData.submitted_at).getTime();
    } else if (kycData?.submittedAt) {
      submittedTime = new Date(kycData.submittedAt).getTime();
    } else if (kycData?.created_at) {
      submittedTime = new Date(kycData.created_at).getTime();
    }

    const targetTime = submittedTime + slaHours * 60 * 60 * 1000;

    const checkTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setIsTimerExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsTimerExpired(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [kycData, slaHours, isUnsubmitted, isRejected]);

  const maskString = (val: string) => {
    if (!val) return "••••••••";
    if (val.length <= 4) return val;
    return "•••• " + val.slice(-4);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-white">
      {/* Onboarding Modal for Re-submission */}
      {showReopenOnboarding && (
        <SellerOnboarding
          isOpen={showReopenOnboarding}
          onClose={() => setShowReopenOnboarding(false)}
          onSuccess={() => {
            setShowReopenOnboarding(false);
            fetchKycStatus();
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500 rounded-full blur-xs" />

        {/* Unsubmitted KYC Card */}
        {isUnsubmitted && (
          <div className="mb-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start font-bold text-amber-400 text-base">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                KYC Verification Required
              </div>
              <p className="text-xs text-slate-300">
                You have not submitted your KYC verification yet. Please complete your seller onboarding to start selling digital assets.
              </p>
            </div>
            <Button
              onClick={() => setShowReopenOnboarding(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shrink-0 shadow-lg"
            >
              Complete KYC Verification
            </Button>
          </div>
        )}

        {/* Admin Action Alert Banner if rejected / requires_info / resubmission */}
        {isRejected && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-red-500/15 via-amber-500/10 to-slate-900 border border-red-500/40 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                {kycData?.kyc_status === 'requires_info' ? 'Admin Requested Additional Information' :
                 kycData?.kyc_status === 'resubmission' ? 'Admin Requested Document Resubmission' :
                 'Seller Application Rejected by Admin'}
              </div>
              <Button
                onClick={() => setShowReopenOnboarding(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 h-8 rounded-lg shadow"
              >
                Update & Resubmit Application
              </Button>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-red-500/20 text-slate-200">
              <span className="text-slate-400 font-mono text-[10px] uppercase block mb-1">Rejection Reason / Admin Note:</span>
              <p className="font-sans font-medium text-amber-200">
                {kycData?.admin_notes || kycData?.kyc_rejection_reason || kycData?.rejection_reason || kycData?.reason || "Please review your submitted tax documents and payout information."}
              </p>
            </div>
          </div>
        )}

        {/* Header Notice */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide uppercase">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> 
              {isUnsubmitted ? "Verification Required" : isRejected ? "Verification Rejected" : "Seller Approval Pending"}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {isUnsubmitted ? "Complete KYC Verification" : isRejected ? "Resubmit Application" : "Your Verification is Pending Review"}
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              {isUnsubmitted 
                ? "Complete your seller registration and KYC submission to unlock the Seller Dashboard."
                : isRejected 
                ? "Your previous submission was rejected. Please review the reason above and resubmit your details."
                : `Your verification is pending review. Standard review time: ${slaHours} Hours.`}
            </p>
          </div>

          <Button
            onClick={fetchKycStatus}
            disabled={refreshing}
            className="self-start md:self-center bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs gap-2 px-4 py-2.5 rounded-xl shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            Check Live Status
          </Button>
        </div>

        {/* SLA Countdown Box - ONLY SHOW TIMER WHEN PENDING AND SLA NOT EXPIRED */}
        {isPending && (
          <div className="my-8 p-6 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400/80 font-bold">
                Estimated Review Time Remaining ({slaHours} Hours SLA)
              </div>
              <div className="text-lg font-bold text-white">
                Your verification is pending review.
              </div>
              <p className="text-xs text-slate-400">
                Your details have been submitted to the Admin Queue. Once verified, your seller permissions will be unlocked.
              </p>
            </div>

            {/* Countdown Digital Timer Display or Expired Static Badge (NO negative numbers!) */}
            {isTimerExpired ? (
              <div className="flex items-center gap-2 shrink-0 bg-amber-500/15 border border-amber-500/40 px-6 py-4 rounded-2xl text-amber-300 font-bold text-sm shadow-inner">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <div className="text-left">
                  <div className="text-xs font-mono text-amber-400 uppercase">Review Status</div>
                  <div className="text-base text-white font-extrabold">PENDING REVIEW</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-xs font-mono text-amber-400 font-semibold mb-1">
                  Estimated review time remaining:
                </div>
                <div className="flex items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
                  <div className="text-center px-3">
                    <div className="text-2xl md:text-3xl font-mono font-extrabold text-amber-400">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mt-0.5">Hours</div>
                  </div>
                  <span className="text-2xl font-bold text-amber-500/50">:</span>
                  <div className="text-center px-3">
                    <div className="text-2xl md:text-3xl font-mono font-extrabold text-amber-400">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mt-0.5">Mins</div>
                  </div>
                  <span className="text-2xl font-bold text-amber-500/50">:</span>
                  <div className="text-center px-3">
                    <div className="text-2xl md:text-3xl font-mono font-extrabold text-amber-400">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mt-0.5">Secs</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification Progress Workflow */}
        <div className="my-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Verification Pipeline Steps
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Step 1 — Completed</div>
                <div className="font-bold text-sm text-white mt-0.5">KYC Submission</div>
                <div className="text-xs text-slate-400 mt-1">Identity & Bank payout info saved in secure registry.</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Step 2 — In Progress</div>
                <div className="font-bold text-sm text-white mt-0.5">Admin Manual Audit</div>
                <div className="text-xs text-slate-400 mt-1">Admin team validating tax compliance & identity (Up to 47h).</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-start gap-3.5 opacity-60">
              <div className="p-2 bg-slate-800 text-slate-500 rounded-xl shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 3 — Locked</div>
                <div className="font-bold text-sm text-white mt-0.5">Dashboard Access</div>
                <div className="text-xs text-slate-400 mt-1">Full product creation, sales tracking & withdrawals unlocked.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Information Summary */}
        <div className="my-8 p-6 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Submitted Application Record
            </h3>
            <Button
              onClick={() => setShowReopenOnboarding(true)}
              variant="ghost"
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              Update / Edit Details
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="text-slate-500 font-medium">Full Name / Display</div>
              <div className="font-bold text-slate-200 mt-1">{kycData?.fullName || kycData?.display_name || user?.name || "Submitted"}</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="text-slate-500 font-medium">National Tax ID / PAN</div>
              <div className="font-mono font-bold text-slate-200 mt-1">{maskString(kycData?.nationalId || kycData?.pan_number)}</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="text-slate-500 font-medium">Payout Method</div>
              <div className="font-bold text-slate-200 mt-1 uppercase">{kycData?.payoutMethod || kycData?.payout_method || "Bank Wire"}</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="text-slate-500 font-medium">Bank / Institution</div>
              <div className="font-bold text-slate-200 mt-1">{kycData?.bankName || kycData?.bank_name || "Bank Account"}</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="text-slate-500 font-medium">Account Number</div>
              <div className="font-mono font-bold text-slate-200 mt-1">{maskString(kycData?.accountNumber || kycData?.payout_details)}</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <div className="text-slate-500 font-medium">KYC Status Badge</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold mt-1 text-[11px]">
                <Clock className="w-3 h-3" /> PENDING REVIEW
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="italic">
            Note: Admin panel handles all manual review queues. You will receive an alert as soon as your account is approved.
          </p>
          <div className="text-slate-500 shrink-0 font-mono text-[11px]">
            Application ID: {user?.id ? user.id.slice(0, 10) : "RECV-OK"}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
