import React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";


export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onFilterChange
}: {
  minPrice: string;
  maxPrice: string;
  onFilterChange: (min: string, max: string) => void;
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalMin(val);
    onFilterChange(val, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalMax(val);
    onFilterChange(localMin, val);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="grid gap-1.5 flex-1">
          <label className="text-xs text-muted-foreground">Min Price ($)</label>
          <Input 
            type="number"
            placeholder="0"
            value={localMin}
            onChange={handleMinChange}
            className="h-9 bg-muted/50 border-border"
          />
        </div>
        <div className="pt-5 text-muted-foreground">-</div>
        <div className="grid gap-1.5 flex-1">
          <label className="text-xs text-muted-foreground">Max Price ($)</label>
          <Input 
            type="number"
            placeholder="No limit"
            value={localMax}
            onChange={handleMaxChange}
            className="h-9 bg-muted/50 border-border"
          />
        </div>
      </div>
      
      {/* Quick selectable ranges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Under $50", min: "", max: "50" },
          { label: "$50 - $200", min: "50", max: "200" },
          { label: "$200 - $500", min: "200", max: "500" },
          { label: "$500+", min: "500", max: "" }
        ].map((range, i) => (
          <button
            key={i}
            onClick={() => {
              setLocalMin(range.min);
              setLocalMax(range.max);
              onFilterChange(range.min, range.max);
            }}
            className="px-2.5 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
