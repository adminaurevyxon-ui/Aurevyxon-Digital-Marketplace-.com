import React, { useState } from "react";
import { TwoStepDocumentUploader, DocumentSlotState } from "@/components/TwoStepDocumentUploader";
import { ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DocumentUploadPage() {
  const [idType, setIdType] = useState<string>("National ID Card");
  const [requiresBack, setRequiresBack] = useState<boolean>(true);
  const [frontDoc, setFrontDoc] = useState<DocumentSlotState>({ status: "NOT_UPLOADED" });
  const [backDoc, setBackDoc] = useState<DocumentSlotState>({ status: "NOT_UPLOADED" });
  const [submitted, setSubmitted] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-3xl space-y-8">
        {/* Navigation Bar Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Identity Verification Portal</span>
          </div>
        </div>

        {/* Document Selection Control */}
        {!submitted && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Selected Document Type:</label>
              <p className="text-xs text-slate-400">Choose document type to adjust required sides</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={idType}
                onChange={(e) => {
                  const val = e.target.value;
                  setIdType(val);
                  setRequiresBack(val !== "Passport");
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="National ID Card">National ID Card (Front & Back)</option>
                <option value="Driver's License">Driver's License (Front & Back)</option>
                <option value="Passport">Passport (Front Only)</option>
              </select>
            </div>
          </div>
        )}

        {/* Two Step Document Uploader Component */}
        <TwoStepDocumentUploader
          idType={idType}
          requiresBack={requiresBack}
          initialFrontDoc={frontDoc}
          initialBackDoc={backDoc}
          onUploadSuccess={(slot, doc) => {
            if (slot === "front") setFrontDoc(doc);
            else setBackDoc(doc);
          }}
          onRemoveSuccess={(slot) => {
            if (slot === "front") setFrontDoc({ status: "NOT_UPLOADED" });
            else setBackDoc({ status: "NOT_UPLOADED" });
          }}
          onComplete={(front, back) => {
            setFrontDoc(front);
            setBackDoc(back);
            setSubmitted(true);
          }}
        />
      </div>
    </div>
  );
}
