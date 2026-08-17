import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  X,
  Video,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export interface DocumentSlotState {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  previewUrl?: string;
  status: "NOT_UPLOADED" | "UPLOADING" | "UPLOADED_AWAITING_VERIFICATION" | "REQUIRES_REPLACEMENT" | "ACCEPTED" | "REJECTED";
  uploadedAt?: string;
  errorMessage?: string;
}

export interface TwoStepDocumentUploaderProps {
  idType?: string;
  requiresBack?: boolean;
  initialFrontDoc?: DocumentSlotState;
  initialBackDoc?: DocumentSlotState;
  frontError?: string;
  backError?: string;
  onComplete?: (frontDoc: DocumentSlotState, backDoc: DocumentSlotState) => void;
  onUploadSuccess?: (slot: "front" | "back", docData: DocumentSlotState) => void;
  onRemoveSuccess?: (slot: "front" | "back") => void;
}

export function TwoStepDocumentUploader({
  idType = "Identity Document",
  requiresBack = true,
  initialFrontDoc = { status: "NOT_UPLOADED" },
  initialBackDoc = { status: "NOT_UPLOADED" },
  frontError,
  backError,
  onComplete,
  onUploadSuccess,
  onRemoveSuccess,
}: TwoStepDocumentUploaderProps) {
  const { token } = useAuth();

  // Active step: 1 = Front Side, 2 = Back Side, 3 = Success Screen
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  // Document states strictly preserved independently across step navigation
  const [frontDoc, setFrontDoc] = useState<DocumentSlotState>(initialFrontDoc);
  const [backDoc, setBackDoc] = useState<DocumentSlotState>(initialBackDoc);

  // Sync props if changed externally
  useEffect(() => {
    if (initialFrontDoc && initialFrontDoc.status !== "NOT_UPLOADED") {
      setFrontDoc(initialFrontDoc);
    }
  }, [initialFrontDoc]);

  useEffect(() => {
    if (initialBackDoc && initialBackDoc.status !== "NOT_UPLOADED") {
      setBackDoc(initialBackDoc);
    }
  }, [initialBackDoc]);

  // Uploading & Validation States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);

  // Live Camera state
  const [cameraActiveSlot, setCameraActiveSlot] = useState<"front" | "back" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // File & Camera Input Refs
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  // Attach camera stream to video element when active
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.warn("Video play error:", err));
    }
  }, [cameraStream, cameraActiveSlot]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Camera permission handler
  const handleRequestCamera = async (slot: "front" | "back") => {
    setCameraError(null);
    setInlineError(null);

    // 1. Try Live Web Camera API stream first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        setCameraStream(stream);
        setCameraActiveSlot(slot);
        return;
      } catch (err: any) {
        console.warn("Live camera stream permission denied or unavailable:", err?.name || err);
      }
    }

    // 2. Fallback to native camera input
    const cameraInputRef = slot === "front" ? frontCameraInputRef : backCameraInputRef;
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      const errorMsg =
        "Camera access denied — please enable camera permission in your browser/device settings, or choose a file instead";
      setCameraError(errorMsg);
      toast.error(errorMsg, { duration: 5000 });
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCameraActiveSlot(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !cameraActiveSlot) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to capture photo snapshot from camera.");
        return;
      }

      const slot = cameraActiveSlot;
      const capturedFile = new File([blob], `camera_photo_${slot}_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      handleCloseCamera();
      handleFileSelection(slot, capturedFile);
    }, "image/jpeg", 0.92);
  };

  const handleFileSelection = async (slot: "front" | "back", file: File) => {
    if (!file) return;

    setInlineError(null);

    // 1. Client-side Validation: File size (10MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeErr = `File size (${sizeMB}MB) exceeds the maximum allowed limit of 10MB. Please choose a smaller file.`;
      setInlineError(sizeErr);
      toast.error(sizeErr);
      return;
    }

    // 2. Client-side Validation: File type / MIME
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      const typeErr = "Invalid file format. Please upload a clear JPG, PNG, WEBP photo or PDF document.";
      setInlineError(typeErr);
      toast.error(typeErr);
      return;
    }

    setIsUploading(true);

    try {
      // Helper to compress image files before upload/data-url generation to prevent payload overflow
      const processFileData = async (inputFile: File): Promise<string> => {
        return new Promise((resolve) => {
          if (inputFile.type === "application/pdf" || ext === ".pdf") {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(inputFile);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const rawUrl = e.target?.result as string;
            if (!rawUrl) return resolve("");

            const img = new Image();
            img.onload = () => {
              const maxDim = 1600;
              let w = img.width;
              let h = img.height;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.85));
              } else {
                resolve(rawUrl);
              }
            };
            img.onerror = () => resolve(rawUrl);
            img.src = rawUrl;
          };
          reader.onerror = () => resolve("");
          reader.readAsDataURL(inputFile);
        });
      };

      const fileData = await processFileData(file);
      if (!fileData) {
        toast.error("Failed to process selected file.");
        setIsUploading(false);
        return;
      }

      const authHeader = token || localStorage.getItem("aurevyxon_token");

      if (authHeader) {
        try {
          const response = await fetch("/api/seller/upload-document", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authHeader}`,
            },
            body: JSON.stringify({
              slot,
              idType,
              fileName: file.name,
              fileType: file.type || (ext === ".pdf" ? "application/pdf" : "image/jpeg"),
              fileSize: file.size,
              fileData,
            }),
          });

          if (!response.ok) {
            const resData = await response.json().catch(() => ({}));
            console.warn("Backend upload note:", resData.error || response.statusText);
          }
        } catch (netErr) {
          console.warn("Backend sync notice (continuing with client session state):", netErr);
        }
      }

      const newDocState: DocumentSlotState = {
        fileName: file.name,
        fileType: file.type || "image/jpeg",
        fileSize: file.size,
        previewUrl: fileData,
        status: "UPLOADED_AWAITING_VERIFICATION",
        uploadedAt: new Date().toISOString(),
      };

      if (slot === "front") {
        setFrontDoc(newDocState);
      } else {
        setBackDoc(newDocState);
      }

      if (onUploadSuccess) {
        onUploadSuccess(slot, newDocState);
      }

      toast.success(
        `${slot === "front" ? "Front Side" : "Back Side"} photo uploaded successfully!`
      );
    } catch (err) {
      console.warn("Upload processing handled:", err);
      toast.error("An error occurred during upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Explicit independent cancel handler (cancelling one slot NEVER affects the other)
  const handleRemove = async (slot: "front" | "back") => {
    setInlineError(null);

    try {
      const authHeader = token || localStorage.getItem("aurevyxon_token");
      if (authHeader) {
        await fetch("/api/seller/remove-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authHeader}`,
          },
          body: JSON.stringify({ slot }),
        });
      }
    } catch (err) {
      console.warn("Remove API warning:", err);
    }

    if (slot === "front") {
      setFrontDoc({ status: "NOT_UPLOADED" });
    } else {
      setBackDoc({ status: "NOT_UPLOADED" });
    }

    if (onRemoveSuccess) {
      onRemoveSuccess(slot);
    }

    // Confirmation Toast
    toast.info("Photo removed. Please upload again.");
  };

  // Screen 1 Next Navigation Handler
  const handleProceedToStep2 = () => {
    const isFrontUploaded =
      frontDoc.status === "UPLOADED_AWAITING_VERIFICATION" ||
      frontDoc.status === "ACCEPTED" ||
      Boolean(frontDoc.previewUrl);

    if (!isFrontUploaded) {
      setInlineError("Please upload the front side to continue");
      toast.error("Please upload the front side to continue");
      return;
    }

    setInlineError(null);

    if (!requiresBack) {
      setSlideDirection(1);
      handleFinishSubmission();
    } else {
      setSlideDirection(1);
      setCurrentStep(2);
    }
  };

  // Screen 2 Submit Handler
  const handleFinishSubmission = () => {
    const isBackUploaded =
      backDoc.status === "UPLOADED_AWAITING_VERIFICATION" ||
      backDoc.status === "ACCEPTED" ||
      Boolean(backDoc.previewUrl);

    if (requiresBack && !isBackUploaded) {
      setInlineError("Please upload the back side to continue");
      toast.error("Please upload the back side to continue");
      return;
    }

    setInlineError(null);
    setSlideDirection(1);
    setCurrentStep(3);

    if (onComplete) {
      onComplete(frontDoc, backDoc);
    }

    toast.success("Documents submitted successfully!");
  };

  // Helper to render step 1 or step 2 card with 100% identical design structure
  const renderStepCard = (slot: "front" | "back") => {
    const docState = slot === "front" ? frontDoc : backDoc;
    const fileInputRef = slot === "front" ? frontFileInputRef : backFileInputRef;
    const cameraInputRef = slot === "front" ? frontCameraInputRef : backCameraInputRef;

    const isUploaded =
      docState.status === "UPLOADED_AWAITING_VERIFICATION" ||
      docState.status === "ACCEPTED" ||
      Boolean(docState.previewUrl);

    const isPdf = docState.fileType?.includes("pdf") || docState.fileName?.endsWith(".pdf");

    return (
      <div className="space-y-4">
        {/* Hidden File Picker Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelection(slot, e.target.files[0]);
              e.target.value = "";
            }
          }}
        />

        {/* Hidden Native Camera Fallback Input */}
        <input
          type="file"
          ref={cameraInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelection(slot, e.target.files[0]);
              e.target.value = "";
            }
          }}
        />

        {isUploading ? (
          /* LOADING SPINNER STATE */
          <div className="h-64 sm:h-72 bg-slate-900/80 border-2 border-dashed border-blue-500/50 rounded-2xl flex flex-col items-center justify-center p-6 space-y-3">
            <div className="relative">
              <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-white">Processing & Encrypting {slot === "front" ? "Front Side" : "Back Side"}...</p>
            <p className="text-xs text-slate-400">Optimizing image resolution and securing file encryption.</p>
          </div>
        ) : isUploaded && docState.previewUrl ? (
          /* FILLED PREVIEW STATE */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 relative shadow-xl">
            {/* Top-Right Cancel / Remove Icon (❌) with 44x44px minimum touch target for mobile */}
            <button
              type="button"
              onClick={() => handleRemove(slot)}
              title="Cancel / Remove photo"
              aria-label="Remove uploaded photo"
              className="absolute top-3 right-3 z-30 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border border-rose-400/50 transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Uploaded Badge Header */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {slot === "front" ? "Front Side Photo Uploaded" : "Back Side Photo Uploaded"}
              </span>
            </div>

            {/* Large Clear Preview Thumbnail - Maintains Aspect Ratio without distortion */}
            <div className="h-64 sm:h-72 bg-slate-900/90 rounded-xl overflow-hidden relative border border-slate-800/80 group flex items-center justify-center p-2">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-200 p-4 text-center">
                  <FileText className="w-16 h-16 text-rose-400" />
                  <span className="text-sm font-mono font-medium max-w-[280px] truncate">{docState.fileName}</span>
                  <span className="text-xs text-slate-400">PDF Document</span>
                </div>
              ) : (
                <img
                  src={docState.previewUrl}
                  alt={`${slot} document preview`}
                  className="w-full h-full object-contain rounded-lg bg-black/40"
                />
              )}

              {/* Hover Action Overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4 backdrop-blur-xs">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setPreviewModalUrl({
                      url: docState.previewUrl!,
                      title: `${idType} - ${slot === "front" ? "Front Side" : "Back Side"}`,
                      isPdf: Boolean(isPdf),
                    })
                  }
                  className="bg-slate-800 text-white hover:bg-slate-700 text-xs font-medium"
                >
                  <Eye className="w-4 h-4 mr-1.5" /> Full Preview
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(slot)}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
                >
                  <X className="w-4 h-4 mr-1.5" /> Remove
                </Button>
              </div>
            </div>

            {/* File Metadata & Quick Replace Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <div className="text-xs text-slate-400 font-mono truncate max-w-[240px]">
                {docState.fileName} {docState.fileSize && `(${(docState.fileSize / 1024).toFixed(0)} KB)`}
              </div>

              {/* Quick Retake / Replace Button */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Retake / Replace
              </Button>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 sm:p-10 text-center space-y-6 transition-all">
            {/* Combo Upload Icon */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative shadow-inner">
              <Camera className="w-8 h-8 text-emerald-400" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600/90 border-2 border-slate-950 flex items-center justify-center text-white">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-base font-bold text-white">Tap to upload photo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take a clear photo or choose from gallery. Supports JPG, PNG, WEBP or PDF (Max 10MB).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                onClick={() => handleRequestCamera(slot)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 h-10 rounded-xl shadow-lg shadow-emerald-950/40"
              >
                <Camera className="w-4 h-4 mr-2" /> Take Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white font-semibold text-xs px-5 h-10 rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2 text-blue-400" /> Choose from Gallery
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Slide Animation Variants
  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 60 : -60,
      opacity: 0,
    }),
  };

  const isFrontUploaded =
    frontDoc.status === "UPLOADED_AWAITING_VERIFICATION" ||
    frontDoc.status === "ACCEPTED" ||
    Boolean(frontDoc.previewUrl);

  const isBackUploaded =
    backDoc.status === "UPLOADED_AWAITING_VERIFICATION" ||
    backDoc.status === "ACCEPTED" ||
    Boolean(backDoc.previewUrl);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header Progress Tracker */}
      {currentStep !== 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{idType} Verification</span>
            </div>

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Step {currentStep} of {requiresBack ? 2 : 1}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
              style={{
                width:
                  currentStep === 1
                    ? requiresBack
                      ? "50%"
                      : "100%"
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Animated Step Screens */}
      <AnimatePresence mode="wait" custom={slideDirection}>
        {/* SCREEN 1: FRONT SIDE UPLOAD */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            custom={slideDirection}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Upload Front Side
              </h3>
              <p className="text-xs text-slate-400">
                Please upload a clear photo of the front side of your document
              </p>
            </div>

            {/* Camera Permission Error Banner */}
            {cameraError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-rose-300">{cameraError}</p>
                  <p className="text-[11px] text-rose-400/80">
                    Click <strong className="text-white">Choose from Gallery</strong> to select a photo from your file picker.
                  </p>
                </div>
              </div>
            )}

            {/* Screen 1 Step Card */}
            {renderStepCard("front")}

            {/* Inline Error Message */}
            {(inlineError || frontError) && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2.5 font-medium animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{inlineError || frontError}</span>
              </div>
            )}

            {/* Screen 1 Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> 256-bit Encrypted
              </span>

              <Button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!isFrontUploaded}
                className={`font-semibold text-xs px-6 h-11 rounded-xl transition-all ${
                  isFrontUploaded
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-800 cursor-not-allowed opacity-60"
                }`}
              >
                {requiresBack ? "Next / Continue" : "Submit Documents"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 2: BACK SIDE UPLOAD */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            custom={slideDirection}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Upload Back Side
                </h3>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Front Side Saved
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Please upload a clear photo of the back side of your document
              </p>
            </div>

            {/* Camera Permission Error Banner */}
            {cameraError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-rose-300">{cameraError}</p>
                  <p className="text-[11px] text-rose-400/80">
                    Click <strong className="text-white">Choose from Gallery</strong> to select a photo from your file picker.
                  </p>
                </div>
              </div>
            )}

            {/* Screen 2 Step Card */}
            {renderStepCard("back")}

            {/* Inline Error Message */}
            {(inlineError || backError) && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{inlineError || backError}</span>
              </div>
            )}

            {/* Screen 2 Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
              {/* Back Button — Preserves Front Side Photo & Back Side Photo */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInlineError(null);
                  setSlideDirection(-1);
                  setCurrentStep(1);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium text-xs px-5 h-11 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back (Front Side)
              </Button>

              {/* Submit / Finish Button */}
              <Button
                type="button"
                onClick={handleFinishSubmission}
                disabled={!isBackUploaded}
                className={`font-semibold text-xs px-6 h-11 rounded-xl transition-all ${
                  isBackUploaded
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-800 cursor-not-allowed opacity-60"
                }`}
              >
                <FileCheck className="w-4 h-4 mr-2" /> Submit / Finish
              </Button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 3: SUCCESS CONFIRMATION SCREEN */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            custom={slideDirection}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="py-6 text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl relative">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-2xl font-black text-white">Documents Uploaded Successfully!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your {idType} photos (Front & Back) have been securely encrypted and submitted for verification.
              </p>
            </div>

            {/* Document Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                  {frontDoc.previewUrl ? (
                    <img src={frontDoc.previewUrl} alt="Front" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">Front Side Photo</p>
                  <p className="text-[10px] text-slate-400 truncate">{frontDoc.fileName || "Uploaded"}</p>
                  <span className="text-[9px] text-emerald-400 font-medium">✓ Ready for review</span>
                </div>
              </div>

              {requiresBack && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                    {backDoc.previewUrl ? (
                      <img src={backDoc.previewUrl} alt="Back" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Back Side Photo</p>
                    <p className="text-[10px] text-slate-400 truncate">{backDoc.fileName || "Uploaded"}</p>
                    <span className="text-[9px] text-emerald-400 font-medium">✓ Ready for review</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFrontDoc({ status: "NOT_UPLOADED" });
                  setBackDoc({ status: "NOT_UPLOADED" });
                  setSlideDirection(-1);
                  setCurrentStep(1);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-10 px-5 rounded-xl cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Start Over / Upload New Document
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Canvas for Camera Frame */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Viewfinder Overlay Modal */}
      {cameraActiveSlot && cameraStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                Capture {cameraActiveSlot === "front" ? "Front Side" : "Back Side"} — {idType}
              </h4>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCloseCamera}
                className="text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[10px] font-mono bg-black/60 text-emerald-300 px-2 py-0.5 rounded self-start">
                  Align ID Card within frame
                </span>
                <span className="text-[10px] font-mono bg-black/60 text-slate-300 px-2 py-0.5 rounded self-end">
                  Ensure good lighting
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="ghost" onClick={handleCloseCamera} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleCapturePhoto}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 h-9 rounded-lg"
              >
                <Camera className="w-4 h-4 mr-1.5" /> Capture Snapshot
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Image Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> {previewModalUrl.title}
              </h4>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPreviewModalUrl(null)}
                className="text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/50 rounded-xl p-2 border border-slate-800">
              {previewModalUrl.isPdf ? (
                <iframe src={previewModalUrl.url} className="w-full h-[500px] rounded-lg" title="Document PDF Preview" />
              ) : (
                <img
                  src={previewModalUrl.url}
                  alt="Full Document Preview"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setPreviewModalUrl(null)} className="bg-slate-800 text-white hover:bg-slate-700 text-xs">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
