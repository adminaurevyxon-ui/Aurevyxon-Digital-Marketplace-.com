import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface BigDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

export function BigDropdown({ label, value, options, onChange }: BigDropdownProps) {
  return (
    <div className="mt-8 mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button" 
            variant="outline" 
            className="text-white border-border hover:bg-white/[0.05] h-14 px-8 text-lg font-medium w-full sm:w-auto shadow-sm"
          >
            {label} &rarr;
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={16} className="h-80 w-72 overflow-y-auto bg-card border-border p-2">
          {options.map((opt) => (
            <DropdownMenuItem 
              key={opt}
              className="text-base py-3 px-4 cursor-pointer hover:bg-white/[0.05]" 
              onSelect={() => onChange(opt)}
            >
              {opt}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {value && (
        <p className="mt-3 text-sm text-gray-400 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Category selected: <span className="text-white">{value}</span>
        </p>
      )}
    </div>
  );
}
