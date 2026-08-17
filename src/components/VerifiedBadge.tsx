import React from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className = '' }: VerifiedBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-bold select-none cursor-help transition-colors hover:bg-emerald-500/20 ${className}`}>
            <ShieldCheck className="w-3 h-3" />
            Verified
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#1a1b26] border-gray-800 text-gray-200 p-3">
          <p className="max-w-[200px] text-xs leading-relaxed font-normal normal-case tracking-normal">
            This seller has completed identity verification and their details have been verified by our team.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
