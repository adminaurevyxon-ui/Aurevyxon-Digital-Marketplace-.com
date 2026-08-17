import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, ShieldCheck, Building2, CreditCard, FileText, CheckCircle2, 
  ArrowRight, ArrowLeft, UploadCloud, Lock, Sparkles, AlertCircle, X, Check, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { 
  getCountryKycRule, 
  validateTaxIdByCountry, 
  validatePostalCodeByCountry, 
  COUNTRY_KYC_RULES 
} from "@/lib/countryKycRules";
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4
} from "@/lib/kycValidation";
import { KYCDocumentUploader, DocumentSlotState } from "@/components/KYCDocumentUploader";
import { SearchableCountrySelect } from "@/components/SearchableCountrySelect";

interface SellerOnboardingProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * Submits seller KYC data to Firestore with status 'pending' for admin review.
 */
export async function submitSellerKYCToFirestore(
  userId: string,
  kycData: {
    fullName: string;
    dob: string;
    idType: string;
    nationalId: string;
    idDocumentUrl?: string;
    taxCountry: string;
    taxId: string;
    sellerType: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  }
) {
  try {
    const submittedAt = new Date().toISOString();
    // 1. Create/Update document in Firestore 'sellers' collection with pending status
    const sellerRef = doc(db, "sellers", userId);
    await setDoc(
      sellerRef,
      {
        userId,
        ...kycData,
        status: "pending",
        kycStatus: "pending",
        submittedAt,
        estimatedApprovalTimeHours: 47,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Update user's kycStatus in Firestore 'users' collection
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        uid: userId,
        kycStatus: "pending",
        kycSubmittedAt: submittedAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`Successfully submitted seller KYC for user ${userId} in Firestore (Pending Admin Review).`);
  } catch (error: any) {
    console.warn("Firestore submit warning (non-fatal):", error);
    // Don't throw fatal error if backend sync can complete
  }
}

/**
 * Updates the user's role to 'seller' in Firestore when Admin approves.
 */
export async function updateUserRoleToSellerInFirestore(
  userId: string,
  kycData?: any
) {
  try {
    const sellerRef = doc(db, "sellers", userId);
    await setDoc(
      sellerRef,
      {
        userId,
        status: "verified",
        kycStatus: "verified",
        verificationCompletedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        uid: userId,
        role: "seller",
        kycStatus: "verified",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`Successfully updated user ${userId} role to 'seller' in Firestore.`);
  } catch (error: any) {
    console.error("Firestore update error:", error);
  }
}

export function SellerOnboarding({ isOpen = true, onClose, onSuccess }: SellerOnboardingProps) {
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Real backend step completion statuses
  const [stepStatuses, setStepStatuses] = useState<{
    s1: string;
    s2: string;
    s3: string;
    s4: string;
  }>({
    s1: "NOT_STARTED",
    s2: "LOCKED",
    s3: "LOCKED",
    s4: "LOCKED",
  });

  // Real Identity Document States
  const [frontDoc, setFrontDoc] = useState<DocumentSlotState>({
    status: "NOT_UPLOADED"
  });
  const [backDoc, setBackDoc] = useState<DocumentSlotState>({
    status: "NOT_UPLOADED"
  });

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identity & Personal Docs
    fullName: user?.name || "",
    dob: "",
    idType: "Passport",
    nationalId: "",
    idDocumentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80",
    phoneCountryCode: "+91",
    phoneNumber: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    address: "",

    // Step 2: Tax & Business Details
    sellerType: "individual",
    taxCountry: "India",
    taxId: "",
    gstin: "",
    businessLegalName: "",
    businessRegNumber: "",
    differentBusinessAddress: false,
    businessAddressLine1: "",
    businessAddressLine2: "",
    businessCity: "",
    businessState: "",
    businessPostalCode: "",
    businessCountry: "India",
    authorizedSignatoryName: "",
    authorizedSignatoryId: "",
    businessRegCertUrl: "",
    businessRegCertName: "",
    businessTaxDocUrl: "",
    businessTaxDocName: "",
    declarationVersion: "v1.0",
    taxAccepted: false,

    // Step 3: Bank & Payout Info
    payoutMethod: "bank",
    bankName: "",
    accountHolder: user?.name || "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    payoutMismatchFlagged: false,
    payoutMismatchReason: "",

    // Step 4: Status & Terms Agreement
    kycStatus: "not_submitted",
    kycRejectionReason: "",
    termsAccepted: false,
    declarationAccepted: false,
  });

  // Business Document States
  const [businessCertDoc, setBusinessCertDoc] = useState<DocumentSlotState>({ status: "NOT_UPLOADED" });
  const [businessTaxDoc, setBusinessTaxDoc] = useState<DocumentSlotState>({ status: "NOT_UPLOADED" });

  // Database-driven Document Types for selected country
  const [dbDocTypes, setDbDocTypes] = useState<{ id: string; label: string; requiresBack: boolean; description: string }[]>([]);

  // Field level validation errors map
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch country specific document types from database whenever selected country changes
  React.useEffect(() => {
    async function fetchCountryDocTypes() {
      try {
        const res = await fetch(`/api/admin/advanced/country-doc-types/list?country=${encodeURIComponent(formData.country)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.allowedDocTypes && data.allowedDocTypes.length > 0) {
            setDbDocTypes(data.allowedDocTypes);
            const exists = data.allowedDocTypes.some((d: any) => d.id === formData.idType);
            if (!exists) {
              setFormData((prev) => ({ ...prev, idType: data.allowedDocTypes[0].id }));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch country doc types from DB:", err);
      }
    }
    if (formData.country) {
      fetchCountryDocTypes();
    }
  }, [formData.country]);

  // Helper to render field error message
  const renderFieldError = (fieldKey: string) => {
    if (!fieldErrors[fieldKey]) return null;
    return (
      <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {fieldErrors[fieldKey]}
      </p>
    );
  };

  // Helper to get input border class
  const fieldClass = (fieldKey: string) => 
    fieldErrors[fieldKey] 
      ? "bg-slate-950 border-rose-500/80 focus:ring-rose-500 focus:border-rose-500 text-white text-sm" 
      : "bg-slate-950 border-slate-800 text-white text-sm";

  // Load real step status and current step from backend database on mount
  React.useEffect(() => {
    async function loadBackendStepStatus() {
      try {
        const authHeader = token || localStorage.getItem("aurevyxon_token");
        if (!authHeader) return;
        const res = await fetch("/api/seller/onboarding/status", {
          headers: { Authorization: `Bearer ${authHeader}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStepStatuses({
            s1: data.step1_status || "NOT_STARTED",
            s2: data.step2_status || "LOCKED",
            s3: data.step3_status || "LOCKED",
            s4: data.step4_status || "LOCKED",
          });

          if (data.current_step && data.current_step >= 1 && data.current_step <= 4) {
            setCurrentStep(data.current_step);
          }

          if (data.formData) {
            setFormData((prev) => ({
              ...prev,
              fullName: data.formData.fullName || prev.fullName,
              dob: data.formData.dob || prev.dob,
              idType: data.formData.idType || prev.idType,
              nationalId: data.formData.nationalId || prev.nationalId,
              phoneCountryCode: data.formData.phoneCountryCode || prev.phoneCountryCode,
              phoneNumber: data.formData.phoneNumber || prev.phoneNumber,
              phone: data.formData.phone || prev.phone,
              addressLine1: data.formData.addressLine1 || prev.addressLine1,
              addressLine2: data.formData.addressLine2 || prev.addressLine2,
              city: data.formData.city || prev.city,
              state: data.formData.state || prev.state,
              postalCode: data.formData.postalCode || prev.postalCode,
              country: data.formData.country || prev.country,
              address: data.formData.address || prev.address,
              sellerType: data.formData.sellerType || prev.sellerType,
              taxCountry: data.formData.taxCountry || prev.taxCountry,
              taxId: data.formData.taxId || prev.taxId,
              gstin: data.formData.gstin || prev.gstin,
              businessLegalName: data.formData.businessLegalName || prev.businessLegalName,
              businessRegNumber: data.formData.businessRegNumber || prev.businessRegNumber,
              differentBusinessAddress: Boolean(data.formData.differentBusinessAddress),
              businessAddressLine1: data.formData.businessAddressLine1 || prev.businessAddressLine1,
              businessAddressLine2: data.formData.businessAddressLine2 || prev.businessAddressLine2,
              businessCity: data.formData.businessCity || prev.businessCity,
              businessState: data.formData.businessState || prev.businessState,
              businessPostalCode: data.formData.businessPostalCode || prev.businessPostalCode,
              businessCountry: data.formData.businessCountry || prev.businessCountry,
              authorizedSignatoryName: data.formData.authorizedSignatoryName || prev.authorizedSignatoryName,
              authorizedSignatoryId: data.formData.authorizedSignatoryId || prev.authorizedSignatoryId,
              taxAccepted: Boolean(data.formData.taxAccepted),
              payoutMethod: data.formData.payoutMethod || prev.payoutMethod,
              bankName: data.formData.bankName || prev.bankName,
              accountHolder: data.formData.accountHolder || prev.accountHolder,
              accountNumber: data.formData.accountNumber || prev.accountNumber,
              ifscCode: data.formData.ifscCode || prev.ifscCode,
              upiId: data.formData.upiId || prev.upiId,
              payoutMismatchFlagged: Boolean(data.formData.payoutMismatchFlagged),
              payoutMismatchReason: data.formData.payoutMismatchReason || prev.payoutMismatchReason,
              kycStatus: data.formData.kycStatus || prev.kycStatus,
              kycRejectionReason: data.formData.kycRejectionReason || prev.kycRejectionReason,
            }));
          }
        }
      } catch (err) {
        console.warn("Backend step status sync warning:", err);
      }
    }
    loadBackendStepStatus();
  }, [token]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Save current progress as a draft to the database
  const handleSaveDraftAndClose = async () => {
    try {
      const authHeader = token || localStorage.getItem("aurevyxon_token");
      if (authHeader) {
        await fetch("/api/seller/onboarding/draft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authHeader}`,
          },
          body: JSON.stringify({ currentStep, data: formData }),
        });
        toast.success("KYC progress saved to database. You can resume anytime.");
      }
    } catch (err) {
      console.warn("Save draft error:", err);
    } finally {
      if (onClose) onClose();
    }
  };

  // Helper check for Step 2 Info validity before unlocking declaration
  const checkStep2InfoValid = () => {
    const taxVal = validateTaxIdByCountry(formData.taxId, formData.taxCountry);
    if (!taxVal.valid) return false;

    const taxRule = getCountryKycRule(formData.taxCountry);
    if (taxRule.requiresVatGst && formData.sellerType === "business" && !formData.gstin.trim()) {
      return false;
    }

    if (formData.sellerType === "business") {
      if (!formData.businessLegalName.trim()) return false;
      if (!formData.businessRegNumber.trim()) return false;
      if (!formData.authorizedSignatoryName.trim()) return false;
      if (!formData.authorizedSignatoryId.trim()) return false;
      if (formData.differentBusinessAddress) {
        if (!formData.businessAddressLine1.trim() || !formData.businessCity.trim() || !formData.businessState.trim()) return false;
        const bPostal = validatePostalCodeByCountry(formData.businessPostalCode, formData.businessCountry);
        if (!bPostal.valid) return false;
      }
    }
    return true;
  };

  const validateStep = (step: number): boolean => {
    let res: { isValid: boolean; errors: Record<string, string> } = { isValid: true, errors: {} };

    if (step === 1) {
      const hasFront = frontDoc.status === "UPLOADED_AWAITING_VERIFICATION" || frontDoc.status === "ACCEPTED" || Boolean(frontDoc.previewUrl);
      res = validateStep1({
        fullName: formData.fullName,
        dob: formData.dob,
        country: formData.country,
        phoneNumber: formData.phoneNumber || formData.phone,
        addressLine1: formData.addressLine1,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        idType: formData.idType,
        nationalId: formData.nationalId,
        hasFrontDoc: hasFront,
      });

      // Additional document back requirement check based on active country rules
      const residenceRule = getCountryKycRule(formData.country);
      const effectiveDocs = dbDocTypes.length > 0 ? dbDocTypes : residenceRule.allowedDocTypes;
      const matchedDocConfig = effectiveDocs.find((d) => d.id === formData.idType) || effectiveDocs[0];
      const requiresBack = matchedDocConfig ? matchedDocConfig.requiresBack : true;
      const hasBack = backDoc.status === "UPLOADED_AWAITING_VERIFICATION" || backDoc.status === "ACCEPTED" || Boolean(backDoc.previewUrl);

      if (!hasFront) {
        res.errors.frontDoc = "Front Side document is mandatory. Please take a photo or upload a document file.";
        res.isValid = false;
      }

      if (requiresBack && !hasBack) {
        res.errors.backDoc = `Back Side document is mandatory for ${matchedDocConfig ? matchedDocConfig.label : formData.idType}. Please take a photo or upload a document file.`;
        res.isValid = false;
      }
    } else if (step === 2) {
      res = validateStep2({
        sellerType: formData.sellerType,
        taxCountry: formData.taxCountry,
        taxId: formData.taxId,
        gstin: formData.gstin,
        businessLegalName: formData.businessLegalName,
        businessRegNumber: formData.businessRegNumber,
        authorizedSignatoryName: formData.authorizedSignatoryName,
        taxAccepted: formData.taxAccepted,
      });
    } else if (step === 3) {
      res = validateStep3({
        bankName: formData.bankName,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId,
        country: formData.country,
        payoutMethod: formData.payoutMethod,
      });
    } else if (step === 4) {
      res = validateStep4({
        termsAccepted: formData.termsAccepted,
        declarationAccepted: formData.declarationAccepted,
      });
    }

    setFieldErrors(res.errors);
    const errKeys = Object.keys(res.errors);
    if (errKeys.length > 0) {
      const firstErrorMsg = res.errors[errKeys[0]];
      setError(firstErrorMsg);
      toast.error(firstErrorMsg);
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = async () => {
    // 1. Client-Side Validation: STOP if anything is invalid
    if (!validateStep(currentStep)) {
      setStepStatuses((prev) => ({ ...prev, [`s${currentStep}`]: "ERROR" }));
      return; // DO NOT ADVANCE!
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Server-Side Validation & State Sync
      const authHeader = token || localStorage.getItem("aurevyxon_token");
      if (authHeader) {
        const response = await fetch("/api/seller/onboarding/step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authHeader}`,
          },
          body: JSON.stringify({
            step: currentStep,
            data: formData,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          setError(resData.error || "Step validation failed on server.");
          toast.error(resData.error || "Server validation error");
          setStepStatuses((prev) => ({ ...prev, [`s${currentStep}`]: "ERROR" }));
          setLoading(false);
          return; // STOP! DO NOT ADVANCE ON SERVER ERROR!
        }

        // Update step completion status
        setStepStatuses((prev) => ({
          ...prev,
          [`s${currentStep}`]: "COMPLETED",
          [`s${Math.min(currentStep + 1, 4)}`]:
            prev[`s${Math.min(currentStep + 1, 4)}` as keyof typeof prev] === "LOCKED"
              ? "NOT_STARTED"
              : prev[`s${Math.min(currentStep + 1, 4)}` as keyof typeof prev],
        }));
      }

      // ONLY advance if validation succeeded completely
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } catch (err: any) {
      console.error("Backend step sync error:", err);
      setError("Failed to verify step with server. Please check network connection.");
      toast.error("Network or server error during verification.");
      setStepStatuses((prev) => ({ ...prev, [`s${currentStep}`]: "ERROR" }));
      // DO NOT ADVANCE ON CATCH!
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepHeaderClick = (targetStep: number) => {
    if (targetStep === currentStep) return;
    const statusKey = `s${targetStep}` as keyof typeof stepStatuses;
    if (stepStatuses[statusKey] === "LOCKED" && targetStep > currentStep) {
      toast.error(`Step ${targetStep} is locked. Complete previous steps first.`);
      return;
    }
    setError(null);
    setCurrentStep(targetStep);
  };

  const handleCompleteVerification = async () => {
    if (!validateStep(4)) return;
    
    const targetUserId = user?.id || auth.currentUser?.uid;
    if (!targetUserId) {
      toast.error("User authentication required. Please sign in first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Submit to Backend KYC endpoint with independent server-side re-check
      const authHeader = token || localStorage.getItem("aurevyxon_token");
      const response = await fetch("/api/seller/submit-kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authHeader}`,
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        setError(resData.error || "KYC Application submission failed.");
        toast.error(resData.error || "Submission failed.");
        setLoading(false);
        return;
      }

      // 2. Mirror status update in Firestore for real-time synchronization
      await submitSellerKYCToFirestore(targetUserId, {
        fullName: formData.fullName,
        dob: formData.dob,
        idType: formData.idType,
        nationalId: formData.nationalId,
        idDocumentUrl: formData.idDocumentUrl,
        taxCountry: formData.taxCountry,
        taxId: formData.taxId,
        sellerType: formData.sellerType,
        bankName: formData.bankName,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId,
      });

      toast.success("KYC Application Submitted! Under review by Compliance Team.");
      setFormData((prev) => ({ ...prev, kycStatus: "pending" }));
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Seller KYC submission error:", err);
      setError(err.message || "Failed to submit application. Please try again.");
      toast.error("Submission failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Seller Account & KYC Verification
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">Complete verification to unlock publishing digital assets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraftAndClose}
              className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-blue-400" /> Save Draft
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={handleSaveDraftAndClose} className="text-slate-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Step Indicator reflecting real backend state */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex justify-between items-center">
            {[
              { num: 1, title: "Identity Docs", icon: User },
              { num: 2, title: "Tax Info", icon: FileText },
              { num: 3, title: "Payout & Bank", icon: CreditCard },
              { num: 4, title: "Verification", icon: ShieldCheck },
            ].map((st) => {
              const Icon = st.icon;
              const statusKey = `s${st.num}` as keyof typeof stepStatuses;
              const backendStatus = stepStatuses[statusKey];
              const isCompleted = backendStatus === "COMPLETED" || currentStep > st.num;
              const isCurrent = currentStep === st.num;
              const isError = backendStatus === "ERROR";
              const isLocked = backendStatus === "LOCKED";

              return (
                <div 
                  key={st.num} 
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
                  onClick={() => handleStepHeaderClick(st.num)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isError
                        ? "bg-red-500 text-white ring-2 ring-red-500/40"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : st.num}
                  </div>
                  <span className={`text-xs hidden sm:inline font-medium ${isCurrent ? "text-white" : isError ? "text-red-400" : "text-slate-400"}`}>
                    {st.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>


        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Identity & Personal Docs */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" /> Personal Identity & Contact Information
                  </h3>
                  <p className="text-xs text-slate-400">Provide official details as listed on your government identity document</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Full Legal Name *</label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="e.g., Rajesh Kumar Sharma"
                      className={fieldClass("fullName")}
                    />
                    {renderFieldError("fullName")}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Date of Birth *</label>
                    <Input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      className={fieldClass("dob")}
                    />
                    {renderFieldError("dob")}
                  </div>
                </div>

                {/* 2.3 Identity Document Type vs Tax ID — Separated & Country-Aware */}
                {(() => {
                  const residenceRule = getCountryKycRule(formData.country);
                  const effectiveDocTypes = dbDocTypes.length > 0 ? dbDocTypes : residenceRule.allowedDocTypes;
                  const matchedDocConfig = effectiveDocTypes.find((d) => d.id === formData.idType) || effectiveDocTypes[0];
                  const requiresBack = matchedDocConfig ? matchedDocConfig.requiresBack : true;

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">Identity Document Type * ({residenceRule.countryName})</label>
                            <span className="text-[10px] text-slate-400 font-mono">(Tax IDs in Step 2)</span>
                          </div>
                          <Select 
                            value={formData.idType} 
                            onValueChange={(val) => {
                              handleChange("idType", val);
                            }}
                          >
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              {effectiveDocTypes.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id}>
                                  {doc.label} {doc.requiresBack ? "(Front & Back)" : "(Front Only)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">Identity Document Number *</label>
                          <Input
                            value={formData.nationalId}
                            onChange={(e) => handleChange("nationalId", e.target.value.toUpperCase())}
                            placeholder={`e.g., ${formData.idType} Number`}
                            className={fieldClass("nationalId")}
                          />
                          {renderFieldError("nationalId")}
                        </div>
                      </div>

                      {/* 2.4 Phone Number with Country Code */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300">Contact Phone Number *</label>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Country Code Match ({residenceRule.phoneCode})
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <SearchableCountrySelect
                            mode="phone"
                            value={formData.phoneCountryCode}
                            onChange={(country) => {
                              handleChange("phoneCountryCode", country.phone_code);
                              handleChange("phone", `${country.phone_code} ${formData.phoneNumber}`);
                            }}
                            placeholder="Code"
                            className="w-40 shrink-0"
                          />

                          <Input
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleChange("phoneNumber", val);
                              handleChange("phone", `${formData.phoneCountryCode} ${val}`);
                            }}
                            placeholder={residenceRule.phonePlaceholder}
                            className={fieldClass("phoneNumber")}
                          />
                        </div>
                        {renderFieldError("phoneNumber")}
                      </div>

                      {/* 2.5 Structured Address */}
                      <div className="space-y-3 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">Residential Address Details *</label>
                          <span className="text-[10px] text-slate-400">Validated against {residenceRule.countryName} standards</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">Country of Residence *</label>
                            <SearchableCountrySelect
                              mode="name"
                              value={formData.country}
                              onChange={(country) => {
                                handleChange("country", country.name);
                                handleChange("phoneCountryCode", country.phone_code);
                                handleChange("phone", `${country.phone_code} ${formData.phoneNumber}`);
                                const newRule = getCountryKycRule(country.name);
                                if (newRule.allowedDocTypes.length > 0) {
                                  handleChange("idType", newRule.allowedDocTypes[0].id);
                                }
                              }}
                              placeholder="Select Country of Residence..."
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">Address Line 1 *</label>
                            <Input
                              value={formData.addressLine1}
                              onChange={(e) => handleChange("addressLine1", e.target.value)}
                              placeholder="House / Flat No., Street Name"
                              className={fieldClass("addressLine1")}
                            />
                            {renderFieldError("addressLine1")}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-400">Address Line 2 (Optional)</label>
                          <Input
                            value={formData.addressLine2}
                            onChange={(e) => handleChange("addressLine2", e.target.value)}
                            placeholder="Landmark, Suite, Apartment, Unit, etc."
                            className="bg-slate-950 border-slate-800 text-white text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">City *</label>
                            <Input
                              value={formData.city}
                              onChange={(e) => handleChange("city", e.target.value)}
                              placeholder="City / Town"
                              className={fieldClass("city")}
                            />
                            {renderFieldError("city")}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">State / Province *</label>
                            <Input
                              value={formData.state}
                              onChange={(e) => handleChange("state", e.target.value)}
                              placeholder="State / Region"
                              className={fieldClass("state")}
                            />
                            {renderFieldError("state")}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-400">{residenceRule.postalLabel} *</label>
                            <Input
                              value={formData.postalCode}
                              onChange={(e) => handleChange("postalCode", e.target.value)}
                              placeholder={residenceRule.postalPlaceholder}
                              className={fieldClass("postalCode")}
                            />
                            {renderFieldError("postalCode")}
                          </div>
                        </div>
                      </div>

                      {/* REAL IDENTITY DOCUMENT UPLOADER WITH DUAL SLOTS & CAMERA */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <KYCDocumentUploader
                          idType={matchedDocConfig.label}
                          requiresBack={requiresBack}
                          frontDoc={frontDoc}
                          backDoc={backDoc}
                          frontError={fieldErrors.frontDoc}
                          backError={fieldErrors.backDoc}
                          onUploadSuccess={(slot, docData) => {
                            if (slot === "front") {
                              setFrontDoc(docData);
                              setFieldErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.frontDoc;
                                return updated;
                              });
                            } else {
                              setBackDoc(docData);
                              setFieldErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.backDoc;
                                return updated;
                              });
                            }
                          }}
                          onRemoveSuccess={(slot) => {
                            if (slot === "front") setFrontDoc({ status: "NOT_UPLOADED" });
                            else setBackDoc({ status: "NOT_UPLOADED" });
                          }}
                        />
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* STEP 2: Tax & Business Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" /> Tax & Business Identification
                  </h3>
                  <p className="text-xs text-slate-400">Country-driven tax compliance and business entity verification</p>
                </div>

                {/* Country Mismatch Callout Note */}
                {formData.country !== formData.taxCountry && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>
                      <strong>Note:</strong> Your Country of Residence (<strong>{formData.country}</strong>) differs from your Tax Residence Country (<strong>{formData.taxCountry}</strong>). Tax reporting and withholding will follow <strong>{formData.taxCountry}</strong> regulations.
                    </span>
                  </div>
                )}

                {(() => {
                  const taxRule = getCountryKycRule(formData.taxCountry);
                  const isStep2ValidAboveDeclaration = checkStep2InfoValid();

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">Seller Account Type *</label>
                          <Select value={formData.sellerType} onValueChange={(val) => handleChange("sellerType", val)}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                              <SelectItem value="individual">Individual Creator / Freelancer</SelectItem>
                              <SelectItem value="business">Registered Business / Company / Firm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">Tax Residence Country *</label>
                          <SearchableCountrySelect
                            mode="name"
                            value={formData.taxCountry}
                            onChange={(country) => handleChange("taxCountry", country.name)}
                            placeholder="Select Tax Residence Country..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-300">{taxRule.taxIdLabel} *</label>
                          <Input
                            value={formData.taxId}
                            onChange={(e) => handleChange("taxId", e.target.value.toUpperCase())}
                            placeholder={taxRule.taxIdPlaceholder}
                            className={`${fieldClass("taxId")} uppercase font-mono`}
                          />
                          <p className="text-[10px] text-slate-400 font-mono">{taxRule.taxIdHelp}</p>
                          {renderFieldError("taxId")}
                        </div>

                        {taxRule.requiresVatGst && formData.sellerType === "business" && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-300">{taxRule.vatGstLabel || "VAT / GST Number"} *</label>
                            <Input
                              value={formData.gstin}
                              onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                              placeholder={taxRule.vatGstPlaceholder || "GST / VAT Identification"}
                              className={`${fieldClass("gstin")} uppercase font-mono`}
                            />
                            {renderFieldError("gstin")}
                          </div>
                        )}
                      </div>

                      {/* Business Seller Additional Fields */}
                      {formData.sellerType === "business" && (
                        <div className="p-4 bg-slate-950/80 border border-purple-500/20 rounded-xl space-y-4">
                          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" /> Registered Business / Company Profile
                            </span>
                            <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                              Corporate Seller
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-slate-300">Business / Company Legal Name *</label>
                              <Input
                                value={formData.businessLegalName}
                                onChange={(e) => handleChange("businessLegalName", e.target.value)}
                                placeholder="e.g. Acme Technologies Pvt Ltd"
                                className={fieldClass("businessLegalName")}
                              />
                              {renderFieldError("businessLegalName")}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-slate-300">Business Registration Number (CIN / CRN) *</label>
                              <Input
                                value={formData.businessRegNumber}
                                onChange={(e) => handleChange("businessRegNumber", e.target.value.toUpperCase())}
                                placeholder="e.g. U72200MH2021PTC123456"
                                className={`${fieldClass("businessRegNumber")} font-mono uppercase`}
                              />
                              {renderFieldError("businessRegNumber")}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-slate-300">Authorized Signatory Full Name *</label>
                              <Input
                                value={formData.authorizedSignatoryName}
                                onChange={(e) => handleChange("authorizedSignatoryName", e.target.value)}
                                placeholder="Legal name of authorized manager/director"
                                className={fieldClass("authorizedSignatoryName")}
                              />
                              {renderFieldError("authorizedSignatoryName")}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-slate-300">Authorized Signatory Title / ID *</label>
                              <Input
                                value={formData.authorizedSignatoryId}
                                onChange={(e) => handleChange("authorizedSignatoryId", e.target.value)}
                                placeholder="e.g. Director / Managing Partner / DIN-0982312"
                                className={fieldClass("authorizedSignatoryId")}
                              />
                              {renderFieldError("authorizedSignatoryId")}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.differentBusinessAddress}
                                onChange={(e) => handleChange("differentBusinessAddress", e.target.checked)}
                                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-300 font-medium">
                                Business Address is different from Personal Residence Address
                              </span>
                            </label>

                            {formData.differentBusinessAddress && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                                <div className="space-y-1 col-span-2">
                                  <label className="text-[11px] text-slate-400">Business Address Line 1 *</label>
                                  <Input
                                    value={formData.businessAddressLine1}
                                    onChange={(e) => handleChange("businessAddressLine1", e.target.value)}
                                    placeholder="Street / Office Suite"
                                    className="bg-slate-950 border-slate-800 text-white text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] text-slate-400">City *</label>
                                  <Input
                                    value={formData.businessCity}
                                    onChange={(e) => handleChange("businessCity", e.target.value)}
                                    placeholder="City"
                                    className="bg-slate-950 border-slate-800 text-white text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] text-slate-400">State / Province *</label>
                                  <Input
                                    value={formData.businessState}
                                    onChange={(e) => handleChange("businessState", e.target.value)}
                                    placeholder="State"
                                    className="bg-slate-950 border-slate-800 text-white text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] text-slate-400">Postal / Zip Code *</label>
                                  <Input
                                    value={formData.businessPostalCode}
                                    onChange={(e) => handleChange("businessPostalCode", e.target.value)}
                                    placeholder="Postal Code"
                                    className="bg-slate-950 border-slate-800 text-white text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tax & Business Declaration Checkbox - Gated until information above is valid */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        isStep2ValidAboveDeclaration
                          ? "bg-slate-950 border-slate-800"
                          : "bg-slate-950/40 border-slate-800/50 opacity-75"
                      }`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.taxAccepted}
                            disabled={!isStep2ValidAboveDeclaration}
                            onChange={(e) => handleChange("taxAccepted", e.target.checked)}
                            className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className="text-xs text-slate-300 leading-relaxed">
                            I declare under penalty of perjury that I am tax compliant in <strong>{formData.taxCountry}</strong>, all tax and business information provided is true, and I authorize automatic statutory withholding and tax reporting.
                          </span>
                        </label>
                        {!isStep2ValidAboveDeclaration && (
                          <p className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            Please enter valid tax and required business details above to enable this declaration.
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* STEP 3: Bank & Payout Info */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> Bank & Payout Configuration
                  </h3>
                  <p className="text-xs text-slate-400">Direct deposit account for sales payouts and earnings distribution</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Payout Channel *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("payoutMethod", "bank")}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        formData.payoutMethod === "bank"
                          ? "bg-blue-600/20 border-blue-500 text-white font-semibold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Direct Bank Wire / NEFT
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("payoutMethod", "upi")}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        formData.payoutMethod === "upi"
                          ? "bg-blue-600/20 border-blue-500 text-white font-semibold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> Instant UPI ID
                    </button>
                  </div>
                </div>

                {formData.payoutMethod === "bank" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Bank Name *</label>
                        <Input
                          value={formData.bankName}
                          onChange={(e) => handleChange("bankName", e.target.value)}
                          placeholder="e.g. HDFC Bank / ICICI Bank / Chase"
                          className={fieldClass("bankName")}
                        />
                        {renderFieldError("bankName")}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Bank Account Holder Name *</label>
                        <Input
                          value={formData.accountHolder}
                          onChange={(e) => handleChange("accountHolder", e.target.value)}
                          placeholder="Exact name on Bank Passbook / Statement"
                          className={fieldClass("accountHolder")}
                        />
                        {renderFieldError("accountHolder")}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Account Number *</label>
                        <Input
                          value={formData.accountNumber}
                          onChange={(e) => handleChange("accountNumber", e.target.value)}
                          placeholder="Bank account number"
                          className={`${fieldClass("accountNumber")} font-mono`}
                        />
                        {renderFieldError("accountNumber")}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">IFSC / SWIFT / Routing Code *</label>
                        <Input
                          value={formData.ifscCode}
                          onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
                          placeholder="e.g. HDFC0001234 or CHASUS33"
                          className={`${fieldClass("ifscCode")} uppercase font-mono`}
                        />
                        {renderFieldError("ifscCode")}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">UPI ID *</label>
                    <Input
                      value={formData.upiId}
                      onChange={(e) => handleChange("upiId", e.target.value)}
                      placeholder="e.g. user@okaxis or phone@upi"
                      className={`${fieldClass("upiId")} font-mono`}
                    />
                    {renderFieldError("upiId")}
                  </div>
                )}

                {/* Payout Ownership Mismatch Callout */}
                {(() => {
                  const legalName = formData.sellerType === "business" ? formData.businessLegalName : formData.fullName;
                  const holder = formData.accountHolder;
                  if (holder && legalName) {
                    const cleanH = holder.toLowerCase().replace(/[^a-z0-9]/g, "");
                    const cleanL = legalName.toLowerCase().replace(/[^a-z0-9]/g, "");
                    if (cleanH && cleanL && !cleanH.includes(cleanL) && !cleanL.includes(cleanH)) {
                      return (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Ownership Mismatch Warning:</strong> Payout Account Holder Name (<strong>{holder}</strong>) differs from Legal Identity Name (<strong>{legalName}</strong>).
                            <span className="block mt-0.5 text-slate-400">This account will be flagged for manual compliance review prior to authorizing payout releases.</span>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </motion.div>
            )}

            {/* STEP 4: Final Verification Review & Submit / Status Screen */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {formData.kycStatus === "pending" || formData.kycStatus === "verified" ? (
                  /* Live Status Screen */
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-6 text-center">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
                      {formData.kycStatus === "verified" ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-wide">
                        {formData.kycStatus === "verified" ? "APPROVED SELLER" : "UNDER COMPLIANCE REVIEW"}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {formData.kycStatus === "verified" ? "KYC Verification Complete!" : "KYC Application Under Review"}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {formData.kycStatus === "verified"
                          ? "Your seller account is fully verified. You can now publish digital assets and receive payouts."
                          : "Your identity, tax, and bank details have been securely recorded. Our compliance team is verifying your documents."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 block">Submitted At:</span>
                        <span className="font-semibold text-white font-mono">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Est. Response Time:</span>
                        <span className="font-semibold text-emerald-400">24 – 48 Hours</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Seller Type:</span>
                        <span className="font-semibold text-purple-300 uppercase">{formData.sellerType}</span>
                      </div>
                    </div>

                    {onClose && (
                      <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-6 py-2">
                        Return to Marketplace
                      </Button>
                    )}
                  </div>
                ) : (
                  /* Verification Review Summary before submission */
                  <>
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Review Application Details
                      </h3>
                      <p className="text-xs text-slate-400">Comprehensive read-only summary of your KYC application before final submission</p>
                    </div>

                    <div className="space-y-3">
                      {/* Section 1: Identity & Residence */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400 font-semibold border-b border-slate-800/60 pb-1.5">
                          <span>1. Personal Identity & Residence</span>
                          <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validated</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-300">
                          <div><span className="text-slate-500">Full Name:</span> {formData.fullName}</div>
                          <div><span className="text-slate-500">Date of Birth:</span> {formData.dob}</div>
                          <div><span className="text-slate-500">Residence:</span> {formData.country}</div>
                          <div><span className="text-slate-500">ID ({formData.idType}):</span> <span className="font-mono">****{formData.nationalId.slice(-4)}</span></div>
                        </div>
                      </div>

                      {/* Section 2: Tax & Business Details */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400 font-semibold border-b border-slate-800/60 pb-1.5">
                          <span>2. Tax & Business Profile</span>
                          <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validated</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-300">
                          <div><span className="text-slate-500">Account Type:</span> <span className="capitalize">{formData.sellerType}</span></div>
                          <div><span className="text-slate-500">Tax Country:</span> {formData.taxCountry}</div>
                          <div><span className="text-slate-500">Tax ID / PAN:</span> <span className="font-mono uppercase">****{formData.taxId.slice(-4)}</span></div>
                          {formData.sellerType === "business" && (
                            <>
                              <div><span className="text-slate-500">Business Name:</span> {formData.businessLegalName}</div>
                              <div><span className="text-slate-500">Business Reg No:</span> <span className="font-mono">{formData.businessRegNumber}</span></div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Bank & Payout Configuration */}
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400 font-semibold border-b border-slate-800/60 pb-1.5">
                          <span>3. Payout Account</span>
                          <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validated</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-300">
                          <div><span className="text-slate-500">Channel:</span> <span className="uppercase font-semibold">{formData.payoutMethod}</span></div>
                          <div><span className="text-slate-500">Account Holder:</span> {formData.accountHolder}</div>
                          {formData.payoutMethod === "bank" ? (
                            <div className="col-span-2"><span className="text-slate-500">Bank Details:</span> {formData.bankName} - <span className="font-mono">****{formData.accountNumber.slice(-4)}</span> ({formData.ifscCode})</div>
                          ) : (
                            <div className="col-span-2"><span className="text-slate-500">UPI ID:</span> <span className="font-mono">{formData.upiId}</span></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Legal Agreement Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.termsAccepted}
                          onChange={(e) => handleChange("termsAccepted", e.target.checked)}
                          className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300">
                          I accept the <a href="/terms" target="_blank" className="text-blue-400 underline font-semibold">OMEGA-NEXUS Seller Agreement</a> and platform commission split rules.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.declarationAccepted}
                          onChange={(e) => handleChange("declarationAccepted", e.target.checked)}
                          className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-300">
                          I certify under penalty of perjury that all identity, tax, and bank details provided are true, accurate, and belong to me.
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleSaveDraftAndClose}
            className="text-slate-400 hover:text-white hover:bg-slate-900 text-xs hidden sm:flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" /> Save Progress & Exit
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCompleteVerification}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2 shadow-lg shadow-emerald-600/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying & Updating Role...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Complete KYC & Become Seller
                </span>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
