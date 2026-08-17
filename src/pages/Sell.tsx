import React, { useState, useEffect, FormEvent } from "react";
import { safeJson } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { categories } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { BigDropdown } from "@/components/BigDropdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { persistProductToFirestore } from "@/lib/firestoreService";
import { SellerOnboarding } from "@/components/SellerOnboarding";
import { PendingSellerReview } from "@/components/PendingSellerReview";
import { 
  Lock, UploadCloud, Link as LinkIcon, DollarSign, Tag, CheckCircle2,
  FileText, Percent, Folder, Monitor, Code, Bookmark, HelpCircle, 
  Globe, Cpu, File as FileIcon, ShoppingCart, Info, List, Star, ArrowRight, ArrowLeft, ShieldCheck, Calculator,
  AlertTriangle, X
} from "lucide-react";

const STEPS = [
  { id: 1, title: 'Product Information', desc: 'Basic details', icon: FileText },
  { id: 2, title: 'Discount Type', desc: 'Choose discount type', icon: Percent },
  { id: 3, title: 'Category', desc: 'Select category', icon: Folder },
  { id: 4, title: 'Platform', desc: 'Select platform', icon: Monitor },
  { id: 5, title: 'Framework', desc: 'Select framework', icon: Code },
  { id: 6, title: 'License', desc: 'Choose license type', icon: Bookmark },
  { id: 7, title: 'Support', desc: 'Support & updates', icon: HelpCircle },
  { id: 8, title: 'Language', desc: 'Product language', icon: Globe },
  { id: 9, title: 'Compatibility', desc: 'Compatibility details', icon: Cpu },
  { id: 10, title: 'File Type', desc: 'Select file type', icon: FileIcon },
  { id: 11, title: 'Sale Mode', desc: 'Choose sale mode', icon: ShoppingCart },
  { id: 12, title: 'Uploads', desc: 'Asset files', icon: UploadCloud }
];

export default function Sell() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [showKycModal, setShowKycModal] = useState(false);
  const [validationPopup, setValidationPopup] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: "",
    message: ""
  });

  const [commissionRate, setCommissionRate] = useState<number>(0.25);
  const [showFeeCalculator, setShowFeeCalculator] = useState<boolean>(true);

  const fetchLiveCommission = () => {
    fetch("/api/public/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.global_commission_rate !== undefined && data.global_commission_rate !== null) {
          const num = Number(data.global_commission_rate);
          if (!isNaN(num)) setCommissionRate(num);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveCommission();
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "",
    mode: "",
    tags: "",
    discount_percentage: "0",
    discount_type: "",
    custom_badge: "",
    platform: "",
    sub_category: "",
    framework: "",
    license_type: "",
    support_type: "",
    language: "",
    compatibility: "",
    file_type: "",
  });

  const fmtCurr = (amount: number) => {
    const valid = isNaN(amount) || amount < 0 ? 0 : amount;
    return "$" + valid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isPriceValid = formData.price.trim() !== "" && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) >= 0;
  const calcOrigPrice = Math.max(0, parseFloat(formData.price) || 0);
  const calcDiscountPct = Math.min(100, Math.max(0, parseFloat(formData.discount_percentage) || 0));
  const calcDiscountAmt = calcOrigPrice * (calcDiscountPct / 100);
  const calcBuyerPrice = Math.max(0, calcOrigPrice - calcDiscountAmt);
  const calcPlatformFee = calcBuyerPrice * (commissionRate / 100);
  const calcNetPayout = Math.max(0, calcBuyerPrice - calcPlatformFee);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const validTypes = ['.png', '.jpg', '.jpeg'];
      if (!validTypes.includes(ext) && !['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error("Cover image must be a PNG or JPG/JPEG image file.");
        setError("Cover image must be a PNG or JPG/JPEG image file.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const validExts = ['.png', '.jpg', '.jpeg'];
      const invalidFiles = filesArr.filter((f: File) => {
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        return !validExts.includes(ext) && !['image/png', 'image/jpeg', 'image/jpg'].includes(f.type);
      });

      if (invalidFiles.length > 0) {
        toast.error("All 8 screenshots must be PNG or JPG/JPEG image files.");
        setError("All 8 screenshots must be PNG or JPG/JPEG image files.");
        return;
      }

      if (filesArr.length !== 8) {
        setError("You must upload exactly 8 screenshots.");
        toast.error("You must upload exactly 8 screenshots.");
        setScreenshots(filesArr);
        return;
      }
      setError("");
      setScreenshots(filesArr);
    }
  };

  const validateStep = (stepNumber: number): { valid: boolean; title: string; message: string } => {
    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) {
          return { valid: false, title: "Title Select/Fill Karein", message: "Aapne Asset Title enter nahi kiya hai. Kripya aage badhne se pehle Title darj karein!" };
        }
        if (!formData.description.trim()) {
          return { valid: false, title: "Description Fill Karein", message: "Aapne Asset Description enter nahi kiya hai. Kripya Description darj karein!" };
        }
        if (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
          return { valid: false, title: "Valid Price Enter Karein", message: "Kripya valid price ($ USD) enter karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 2:
        if (!formData.discount_type) {
          return { valid: false, title: "Discount Type Select Karein", message: "Aapne Discount Type select nahi kiya hai. Kripya pehle ek Discount Type option par click karke use select karein, uske baad Next dabaein!" };
        }
        return { valid: true, title: "", message: "" };

      case 3:
        if (!formData.type) {
          return { valid: false, title: "Category Select Karein", message: "Aapne Category select nahi kiya hai. Kripya pehle Category select karein!" };
        }
        if (categories[formData.type as keyof typeof categories] && categories[formData.type as keyof typeof categories].subCategories.length > 0 && !formData.sub_category) {
          return { valid: false, title: "Sub Category Select Karein", message: "Kripya is Category ke liye Sub Category bhi select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 4:
        if (!formData.platform) {
          return { valid: false, title: "Platform Select Karein", message: "Aapne Platform select nahi kiya hai. Kripya pehle ek Platform option select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 5:
        if (!formData.framework) {
          return { valid: false, title: "Framework Select Karein", message: "Aapne Framework select nahi kiya hai. Kripya pehle Framework option select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 6:
        if (!formData.license_type) {
          return { valid: false, title: "License Select Karein", message: "Aapne License Type select nahi kiya hai. Kripya pehle License Type select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 7:
        if (!formData.support_type) {
          return { valid: false, title: "Support Select Karein", message: "Aapne Support Option select nahi kiya hai. Kripya pehle Support Option select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 8:
        if (!formData.language) {
          return { valid: false, title: "Language Select Karein", message: "Aapne Language select nahi kiya hai. Kripya pehle Language select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 9:
        if (!formData.compatibility) {
          return { valid: false, title: "Compatibility Select Karein", message: "Aapne Compatibility details select nahi kiya hai. Kripya pehle Compatibility option select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 10:
        if (!formData.file_type) {
          return { valid: false, title: "File Type Select Karein", message: "Aapne File Type select nahi kiya hai. Kripya pehle File Type select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 11:
        if (!formData.mode) {
          return { valid: false, title: "Sale Mode Select Karein", message: "Aapne Sale Mode select nahi kiya hai. Kripya pehle Sale Mode select karein!" };
        }
        return { valid: true, title: "", message: "" };

      case 12:
        if (!imageFile) {
          return { valid: false, title: "Cover Image Missing", message: "Kripya pehle Cover Image upload karein!" };
        }
        if (screenshots.length !== 8) {
          return { valid: false, title: "8 Screenshots Required", message: "Kripya exactly 8 Screenshots upload karein! (Abhi " + screenshots.length + " uploaded hain)" };
        }
        if (!assetFile) {
          return { valid: false, title: "Asset File Missing", message: "Kripya Digital Source Asset File (.zip, .apk, etc.) upload karein!" };
        }
        return { valid: true, title: "", message: "" };

      default:
        return { valid: true, title: "", message: "" };
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("You must be logged in to sell items.");
      toast.error("You must be logged in to sell items.");
      return;
    }

    for (let s = 1; s <= 12; s++) {
      const check = validateStep(s);
      if (!check.valid) {
        setCurrentStep(s);
        setValidationPopup({
          show: true,
          title: check.title,
          message: check.message
        });
        toast.error(check.message);
        return;
      }
    }
    
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value as string);
      });
      if (imageFile) data.append("image", imageFile);
      if (assetFile) data.append("asset", assetFile);
      screenshots.forEach(file => data.append("screenshots", file));

      const token = localStorage.getItem("aurevyxon_token");
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || "Failed to upload asset");

      // Save directly to Cloud Firestore collection 'products'
      await persistProductToFirestore({
        id: json.listingId,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        discount_percent: formData.discount_percentage,
        buyer_price: calcBuyerPrice,
        platform_fee: calcPlatformFee,
        net_payout: calcBuyerPrice - calcPlatformFee,
        category: formData.type || "Digital Product",
        seller_id: user?.id,
        seller_name: user?.name,
        status: "active"
      });

      setSuccess(true);
      toast.success("Asset uploaded successfully!");
      setTimeout(() => navigate(`/listing/${json.listingId}`), 2000);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to publish asset");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const check = validateStep(currentStep);
    if (!check.valid) {
      setValidationPopup({
        show: true,
        title: check.title,
        message: check.message
      });
      toast.error(check.message);
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      setHighestStepReached(prev => Math.max(prev, currentStep + 1));
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId === currentStep) return;
    if (stepId > currentStep) {
      for (let s = currentStep; s < stepId; s++) {
        const check = validateStep(s);
        if (!check.valid) {
          setCurrentStep(s);
          setValidationPopup({
            show: true,
            title: check.title,
            message: `Pehle Step ${s} (${STEPS[s - 1].title}) complete karein: ${check.message}`
          });
          toast.error(check.message);
          return;
        }
      }
    }
    setCurrentStep(stepId);
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">Upload Successful!</h1>
        <p className="text-muted-foreground text-lg mb-8">Your digital asset is now live on Aurevyxon.</p>
      </div>
    );
  }

  const InlineSelection = ({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                isSelected 
                  ? 'bg-[#5b21b6] border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] ring-2 ring-purple-500/50' 
                  : 'bg-[#111422] border-gray-800/80 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              }`}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {opt}
            </button>
          );
        })}
      </div>
      {!value && (
        <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl w-fit">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Kripya aage badhne ke liye ek option select karein (Please select an option to proceed)</span>
        </div>
      )}
    </div>
  );

  const activeStepData = STEPS.find(s => s.id === currentStep);
  const ActiveIcon = activeStepData?.icon || FileText;

  return (
    <div className="min-h-screen bg-[#07090e] text-white py-12">
      {/* Validation Warning Popup Modal */}
      <AnimatePresence>
        {validationPopup.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0e1220] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(245,158,11,0.25)] text-center relative overflow-hidden"
            >
              <button 
                onClick={() => setValidationPopup({ show: false, title: "", message: "" })}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <AlertTriangle className="w-8 h-8 animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{validationPopup.title}</h3>
              <p className="text-gray-200 text-sm leading-relaxed mb-6 bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 text-left font-medium">
                {validationPopup.message}
              </p>

              <Button
                onClick={() => setValidationPopup({ show: false, title: "", message: "" })}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-bold text-base rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
              >
                Pehle Select Karein / Got It
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seller Onboarding KYC Modal */}
      {showKycModal && (
        <SellerOnboarding
          isOpen={showKycModal}
          onClose={() => setShowKycModal(false)}
          onSuccess={() => {
            setShowKycModal(false);
            window.location.reload();
          }}
        />
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        
        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl mb-8 flex items-center gap-3">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p>You must sign in to access the Seller Portal. Please use the SignIn button in the header.</p>
          </div>
        )}

        {isAuthenticated && user?.role !== 'seller' && user?.role !== 'admin' && (
          <PendingSellerReview onStatusApproved={() => window.location.reload()} />
        )}

        {isAuthenticated && (user?.role === 'seller' || user?.role === 'admin') && (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8">
                {error}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* LEFT SIDEBAR - STEPPER */}
          <div className="w-full lg:w-72 flex-shrink-0 relative py-4">
            {/* Connecting Vertical Line */}
            <div className="absolute top-8 bottom-8 left-[34px] w-px bg-gray-800/80 z-0" />
            
            <div className="flex flex-col gap-1 relative z-10">
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isPast = step.id < highestStepReached && step.id < currentStep;
                const isClickable = step.id <= highestStepReached;
                const StepIcon = step.icon;
                
                return (
                  <div 
                    key={step.id} 
                    className={`relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    } ${
                      isActive ? 'bg-[#181134] border border-[#7c3aed]' : 'border border-transparent hover:bg-[#111422]'
                    }`}
                    onClick={() => handleStepClick(step.id)}
                  >
                    {/* Circle */}
                    <div className={`relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold border transition-colors duration-300 z-10 ${
                      isPast
                        ? "bg-[#10b981] border-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        : isActive 
                        ? "bg-[#5b21b6] border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]" 
                        : "bg-[#0f121b] border-gray-800/80 text-gray-400"
                    }`}>
                      {!isPast && <span className={`absolute top-1 left-2 text-[9px] font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.id}</span>}
                      {isPast ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : step.id === 1 ? (
                        <span className="text-lg mt-1 font-semibold">{isActive ? '1' : '1'}</span>
                      ) : (
                        <StepIcon className="w-5 h-5 mt-1" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 mt-0.5">
                      <h4 className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {step.title}
                      </h4>
                      <p className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE - CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pl-2">
              <div className="w-14 h-14 rounded-full bg-[#1a153a] border border-[#5b21b6] flex flex-shrink-0 items-center justify-center">
                <ActiveIcon className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#c4b5fd] mb-1">{activeStepData?.title}</h2>
                <p className="text-gray-300 text-sm">
                  {activeStepData?.title === 'Product Information' ? 'Provide the basic details about your product' : activeStepData?.desc}
                </p>
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800/60 rounded-3xl p-6 md:p-8 min-h-[500px] flex flex-col relative shadow-xl">
              
              {/* Form Fields Container */}
              <form id="sellForm" onSubmit={handleSubmit} className="flex-1">
                
                {currentStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Asset Title */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                        Asset Title <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                           <Tag className="w-5 h-5 text-[#c4b5fd]" />
                        </div>
                        <Input 
                          required 
                          placeholder="e.g. Apex SaaS Dashboard" 
                          className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-1">Enter a clear and catchy title for your product</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                        Description <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-2 w-10 h-10 rounded-lg flex items-center justify-center">
                           <List className="w-6 h-6 text-gray-400" />
                        </div>
                        <Textarea 
                          required 
                          placeholder="Describe your asset in detail..." 
                          className="bg-[#111422] border-gray-800 text-white pl-12 pt-4 min-h-[180px] rounded-2xl focus-visible:ring-purple-500 resize-none placeholder:text-gray-500"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-1">Provide a detailed description of what your product does, its features, and benefits.</p>
                    </div>

                    {/* Custom Badge */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                        Custom Badge/Description Text <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                           <Star className="w-5 h-5 text-[#c4b5fd]" />
                        </div>
                        <Input 
                          placeholder="e.g. Limited Edition, Premium Version..." 
                          className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500"
                          value={formData.custom_badge}
                          onChange={(e) => setFormData({ ...formData, custom_badge: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-1">Add a custom badge or short text to highlight your product</p>
                    </div>

                    {/* Grid for Price, Discount & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                          Price (USD) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                             <DollarSign className="w-5 h-5 text-[#c4b5fd]" />
                          </div>
                          <Input 
                            type="number" 
                            required 
                            min="0"
                            step="1"
                            placeholder="249" 
                            className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500 font-medium text-lg"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-1">Set the price for your product</p>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                          Discount Percentage (%) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                             <Percent className="w-5 h-5 text-[#c4b5fd]" />
                          </div>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            placeholder="0" 
                            className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 font-medium text-lg"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-1">Optional discount percentage</p>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                          Tags (comma separated) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                             <Tag className="w-5 h-5 text-[#c4b5fd]" />
                          </div>
                          <Input 
                            placeholder="React, Next.js, Android" 
                            className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-1">Add relevant tags to help buyers find your product</p>
                      </div>

                      <div className="flex flex-col justify-center col-span-1 md:col-span-2 mt-2">
                        <div className="bg-[#181134] border border-[#7c3aed]/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(124,58,237,0.15)] space-y-4">
                          <div className="flex items-center justify-between border-b border-[#7c3aed]/20 pb-3">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-5 h-5 text-amber-400" />
                              <h4 className="text-base font-bold text-white">Price & Platform Fee Calculator</h4>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowFeeCalculator(!showFeeCalculator)}
                              className="bg-[#2a1b54] border-[#7c3aed]/50 hover:bg-[#3b2776] text-amber-300 text-xs gap-1.5 h-8 font-semibold"
                            >
                              <Calculator className="w-3.5 h-3.5 text-amber-400" />
                              {showFeeCalculator ? "Hide Fee Details" : "Platform Fee Details"}
                            </Button>
                          </div>

                          {!isPriceValid && (
                            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-purple-300 flex items-center gap-2 font-medium">
                              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                              <span>Enter a price above to see fee breakdown</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Final Price */}
                            <div className="bg-[#111422] border border-gray-800 rounded-xl p-3.5">
                              <p className="text-xs text-[#c4b5fd] font-medium mb-1">Final Buyer Price</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white font-mono">
                                  {fmtCurr(calcBuyerPrice)}
                                </span>
                                {calcDiscountPct > 0 && calcOrigPrice > 0 && (
                                  <span className="text-xs text-gray-500 line-through font-mono">{fmtCurr(calcOrigPrice)}</span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-400 mt-1 block">What the customer pays</span>
                            </div>

                            {/* Platform Fee */}
                            <div className="bg-[#111422] border border-amber-500/30 rounded-xl p-3.5">
                              <p className="text-xs text-amber-400 font-medium mb-1 flex items-center justify-between">
                                <span>Platform Fee ({commissionRate}%)</span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">Deducted</span>
                              </p>
                              <span className="text-2xl font-bold text-amber-400 font-mono">
                                -{fmtCurr(calcPlatformFee)}
                              </span>
                              <span className="text-[11px] text-gray-400 mt-1 block">Marketplace & Escrow Fee</span>
                            </div>

                            {/* Net Seller Payout */}
                            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5">
                              <p className="text-xs text-emerald-400 font-medium mb-1 flex items-center justify-between">
                                <span>Net Seller Payout</span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">Your Earnings</span>
                              </p>
                              <span className="text-2xl font-bold text-emerald-400 font-mono">
                                {fmtCurr(calcNetPayout)}
                              </span>
                              <span className="text-[11px] text-emerald-300/70 mt-1 block">Directly credited to wallet</span>
                            </div>
                          </div>

                          {showFeeCalculator && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#111422]/90 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 space-y-2.5">
                              <div className="flex justify-between items-center text-gray-400">
                                <span>Original Product Price:</span>
                                <span className="font-mono font-medium text-white">{fmtCurr(calcOrigPrice)}</span>
                              </div>
                              {calcDiscountPct > 0 ? (
                                <div className="flex justify-between items-center text-emerald-400">
                                  <span>Instant Discount ({calcDiscountPct}% OFF):</span>
                                  <span className="font-mono font-medium">-{fmtCurr(calcDiscountAmt)}</span>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center text-gray-400">
                                  <span>Instant Discount (0% OFF):</span>
                                  <span className="font-mono">$0.00</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-1.5 border-t border-gray-800 font-medium text-white">
                                <span>Calculated Buyer Price:</span>
                                <span className="font-mono font-bold text-purple-300">{fmtCurr(calcBuyerPrice)}</span>
                              </div>
                              <div className="flex justify-between items-center text-amber-400">
                                <span className="flex items-center gap-1">
                                  <Calculator className="w-3.5 h-3.5 text-amber-400" /> Platform Fee Deduction ({commissionRate}%):
                                </span>
                                <span className="font-mono font-bold">-{fmtCurr(calcPlatformFee)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-emerald-500/30 font-bold text-emerald-400 text-sm bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Estimated Net Earnings:
                                </span>
                                <span className="font-mono text-lg font-black text-emerald-400">{fmtCurr(calcNetPayout)}</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Discount Type</label>
                      <InlineSelection 
                        value={formData.discount_type}
                        options={[
                          "Flat Amount ($ Off)", "Percentage (%) Off", "Buy 1 Get 1 Free", "Bundle Discount (multi-product)", 
                          "Seasonal/Limited-Time Offer", "First-Time Buyer Discount", "Volume Discount (bulk license purchase)", 
                          "Flash Sale (Time-Boxed)", "Loyalty/Repeat Buyer Discount", "Coupon Code Only"
                        ]}
                        onChange={(val) => setFormData({ ...formData, discount_type: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Category</label>
                      <InlineSelection 
                        value={formData.type}
                        options={Object.keys(categories)}
                        onChange={(val) => setFormData({ ...formData, type: val, sub_category: "" })}
                      />
                    </div>
                    {formData.type && categories[formData.type as keyof typeof categories] && (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Sub Category</label>
                        <InlineSelection 
                          value={formData.sub_category}
                          options={categories[formData.type as keyof typeof categories].subCategories}
                          onChange={(val) => setFormData({ ...formData, sub_category: val })}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                                {currentStep === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Platform</label>
                      <InlineSelection 
                        value={formData.platform}
                        options={[
                          "Android", "iOS", "Web (Browser-Based)", "Windows", "macOS", "Linux", "Cross-Platform", "React Native", 
                          "Flutter", "Chrome Extension", "Firefox Extension", "WordPress", "Shopify", "Figma", "VS Code", 
                          "Telegram Bot", "Discord Bot", "Slack App", "API/Backend Only", "Smart TV", "Wearables (watchOS/Wear OS)", 
                          "Notion", "Adobe Creative Cloud (Photoshop/Premiere/After Effects)", "Unity", "Unreal Engine", "Roblox Studio", 
                          "Canva", "Zapier/Make/n8n", "Blockchain/Web3 (Ethereum, Solana, Polygon)", "Standalone/Any Platform (Non-Digital Media)"
                        ]}
                        onChange={(val) => setFormData({ ...formData, platform: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Framework</label>
                      <InlineSelection 
                        value={formData.framework}
                        options={[
                          "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte / SvelteKit", "Node.js", "Express.js", "NestJS", 
                          "Django", "Flask", "FastAPI", "Laravel", "Ruby on Rails", "Spring Boot", "ASP.NET Core", "Flutter", 
                          "React Native", "SwiftUI", "Jetpack Compose (Kotlin)", "Kotlin Multiplatform", "Unity", "Unreal Engine", 
                          "Godot", "TensorFlow", "PyTorch", "Keras", "LangChain", "LlamaIndex", "Electron.js", "jQuery", "Bootstrap", 
                          "Tailwind CSS", "Material UI", "Chakra UI", "WordPress (PHP)", "WooCommerce", "Shopify Liquid", "Solidity (Smart Contracts)", 
                          "Web3.js / Ethers.js", "Three.js (3D/WebGL)", "Blender Python API", "Not Applicable (Non-Code Asset)", "None / Vanilla Code"
                        ]}
                        onChange={(val) => setFormData({ ...formData, framework: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 6 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">License</label>
                      <InlineSelection 
                        value={formData.license_type}
                        options={[
                          "Personal Use License", "Commercial Use License", "Extended Commercial License", "Single Site License", 
                          "Multi-Site License", "Developer License", "White-Label License", "Reseller License", "MIT License", 
                          "GPL License", "Apache 2.0 License", "Creative Commons (CC0)", "Creative Commons (CC-BY)", "Royalty-Free License", 
                          "Editorial Use Only License", "Exclusive License (sold once, then delisted)", "Non-Exclusive License (resellable to multiple buyers)", 
                          "Lifetime License", "Subscription-Based License", "Print-on-Demand License", "Broadcast/Film Use License", "Attribution Required License"
                        ]}
                        onChange={(val) => setFormData({ ...formData, license_type: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 7 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Support</label>
                      <InlineSelection 
                        value={formData.support_type}
                        options={[
                          "Included — Lifetime", "Included — 1 Year", "Included — 6 Months", "Included — 90 Days", "Included — 30 Days", 
                          "Not Included", "Priority Support (Paid Add-on)", "Community Support Only", "Email Support", "Live Chat Support", 
                          "Phone Support", "Installation Support Included", "Custom Setup Service Available", "Documentation Only (Self-Service)"
                        ]}
                        onChange={(val) => setFormData({ ...formData, support_type: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 8 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Language</label>
                      <InlineSelection 
                        value={formData.language}
                        options={[
                          "English", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic", "Chinese (Simplified)", 
                          "Chinese (Traditional)", "Japanese", "Korean", "Russian", "Italian", "Bengali", "Tamil", "Telugu", 
                          "Marathi", "Gujarati", "Punjabi", "Urdu", "Turkish", "Vietnamese", "Indonesian", "Thai", "Dutch", 
                          "Polish", "Multi-Language (i18n Ready)", "Language-Agnostic (Code/Asset Only, No UI Text)"
                        ]}
                        onChange={(val) => setFormData({ ...formData, language: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 9 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Compatibility</label>
                      <InlineSelection 
                        value={formData.compatibility}
                        options={[
                          "Android 8.0+", "Android 10+", "Android 12+", "Android 14+", "iOS 13+", "iOS 15+", "iOS 16+", "iOS 17+", 
                          "Windows 10/11", "macOS Monterey+", "macOS Sonoma+", "Ubuntu 20.04+", "Ubuntu 22.04+", "Node.js 16+", 
                          "Node.js 18+", "Node.js 20+", "PHP 7.4+", "PHP 8+", "Python 3.8+", "Python 3.10+", "Python 3.12+", 
                          "All Modern Browsers (Chrome/Edge/Firefox/Safari Latest)", "React 18+", "Next.js 13+/14+", "WordPress 5.0+", 
                          "WooCommerce 6.0+", "Unity 2021 LTS+", "Unreal Engine 5+", "Adobe CC 2023+", "Blender 3.x+", "Not Version-Dependent (Static Asset)"
                        ]}
                        onChange={(val) => setFormData({ ...formData, compatibility: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 10 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">File Type</label>
                      <InlineSelection 
                        value={formData.file_type}
                        options={[
                          ".zip (Full Source Code)", ".rar", ".apk (Android Package)", ".aab (Android App Bundle)", ".ipa (iOS App)", 
                          ".exe (Windows Installer)", ".dmg (macOS Installer)", ".apk + Full Source Code", "Source Code Only (No Build File)", 
                          "Figma File (.fig)", "Sketch File (.sketch)", "Adobe XD (.xd)", "PSD File (Photoshop)", "AI File (Illustrator)", 
                          "PDF Document", "EPUB/MOBI (E-books)", ".mp3/.wav/.flac (Audio)", ".mp4/.mov (Video)", ".fbx/.obj/.blend/.gltf (3D Models)", 
                          ".ttf/.otf/.woff (Fonts)", ".pptx/.key (Presentations)", ".xlsx/.csv (Spreadsheets)", ".docx (Documents)", 
                          "SQL Database Dump (.sql)", "JSON Dataset", "Docker Image", ".env Template Included", "Notion Template Link", "Canva Template Link"
                        ]}
                        onChange={(val) => setFormData({ ...formData, file_type: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 11 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Sale Mode</label>
                      <InlineSelection 
                        value={formData.mode}
                        options={[
                          "Unlimited (sell to unlimited buyers)", "Limited Quantity (fixed number of license slots)", "Exclusive (sold once to one buyer, then delisted)", 
                          "Auction Style (highest bidder)", "Subscription (recurring billing)", "One-Time Purchase", "Pay-What-You-Want", 
                          "Reserved / Pre-Order", "Bundle-Only (sold as part of a bundle)", "Free with Attribution"
                        ]}
                        onChange={(val) => setFormData({ ...formData, mode: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 12 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Cover Image (Required - PNG / JPG)</label>
                      <div className="border border-dashed border-gray-700 bg-[#111422] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative overflow-hidden">
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg" 
                          required
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                          onChange={handleImageChange}
                        />
                        {imagePreview ? (
                          <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
                        ) : null}
                        <div className="relative z-20 pointer-events-none">
                          <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                          <p className="text-base font-medium text-gray-300">{imageFile ? imageFile.name : "Click or drag to upload cover image"}</p>
                          <p className="text-sm text-gray-500 mt-2">PNG, JPG or JPEG format supported</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Screenshots (Exactly 8 Required - PNG / JPG)</label>
                       <div className="border border-dashed border-gray-700 bg-[#111422] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg" 
                            multiple
                            required
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            onChange={handleScreenshotsChange}
                          />
                          <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                          <p className="text-base font-medium text-gray-300">{screenshots.length > 0 ? `${screenshots.length} / 8 uploaded` : "Click or drag exactly 8 screenshots (PNG / JPG)"}</p>
                       </div>
                       {screenshots.length > 0 && screenshots.length !== 8 && (
                         <p className="text-red-400 text-sm mt-3 ml-1">You currently have {screenshots.length} selected. You must have exactly 8.</p>
                       )}
                       {screenshots.length > 0 && (
                         <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-4">
                            {screenshots.map((file, idx) => (
                              <div key={idx} className="aspect-square bg-black/50 rounded-lg overflow-hidden border border-gray-700 relative group">
                                <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-white px-1 rounded">{idx + 1}</span>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Digital Asset File (Allowed Formats Only)</label>
                      <div className="border border-dashed border-gray-700 bg-[#111422] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative overflow-hidden">
                        <input 
                          type="file" 
                          accept=".zip,.rar,.apk,.aab,.ipa,.exe,.dmg,.fig,.sketch,.xd,.psd,.ai,.pdf,.epub,.mobi,.mp3,.wav,.flac,.mp4,.mov,.fbx,.obj,.blend,.gltf,.ttf,.otf,.woff,.pptx,.key,.xlsx,.csv,.docx,.sql,.json"
                          required
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                          onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                        />
                        <LinkIcon className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                        <p className="text-base font-medium text-[#c4b5fd]">{assetFile ? assetFile.name : "Click or drag to upload source file"}</p>
                        <p className="text-xs text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
                          Supported: .zip, .rar, .apk, .aab, .ipa, .exe, .dmg, .fig, .sketch, .xd, .psd, .ai, .pdf, .epub, .mobi, .mp3, .wav, .flac, .mp4, .mov, .fbx, .obj, .blend, .gltf, .ttf, .otf, .woff, .pptx, .key, .xlsx, .csv, .docx, .sql, .json
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </form>

            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 flex items-center justify-center gap-6 pb-10">
              <Button 
                type="button" 
                onClick={handlePrev}
                disabled={currentStep === 1 || loading}
                className="h-14 px-8 bg-[#0b0f19] text-white hover:bg-white/5 font-medium border border-gray-800 rounded-2xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="h-14 px-12 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  form="sellForm"
                  disabled={loading || !isAuthenticated}
                  className="h-14 px-12 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all"
                >
                  {loading ? "Uploading..." : "Publish Asset"} <UploadCloud className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

          </div>
        </div>
      </>
      )}
      </div>
    </div>
  );
}
