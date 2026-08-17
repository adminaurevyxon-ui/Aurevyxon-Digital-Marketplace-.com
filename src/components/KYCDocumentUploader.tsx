import React from "react";
import { TwoStepDocumentUploader, DocumentSlotState } from "./TwoStepDocumentUploader";

export type { DocumentSlotState };

export interface KYCDocumentUploaderProps {
  idType: string;
  requiresBack: boolean;
  frontDoc: DocumentSlotState;
  backDoc: DocumentSlotState;
  frontError?: string;
  backError?: string;
  onUploadSuccess: (slot: "front" | "back", docData: DocumentSlotState) => void;
  onRemoveSuccess: (slot: "front" | "back") => void;
}

export function KYCDocumentUploader({
  idType,
  requiresBack,
  frontDoc,
  backDoc,
  frontError,
  backError,
  onUploadSuccess,
  onRemoveSuccess,
}: KYCDocumentUploaderProps) {
  return (
    <TwoStepDocumentUploader
      idType={idType}
      requiresBack={requiresBack}
      initialFrontDoc={frontDoc}
      initialBackDoc={backDoc}
      frontError={frontError}
      backError={backError}
      onUploadSuccess={onUploadSuccess}
      onRemoveSuccess={onRemoveSuccess}
    />
  );
}
