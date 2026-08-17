const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

// Find the end of the correct grid, which ends with:
const goodEndMarker = `                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sale Mode</label>
                  <div className="relative">
                    <select 
                      className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    >
                      <option value="">Select Sale Mode</option>
                      {[
                      "Unlimited (sell to unlimited buyers)", "Limited Quantity (fixed number of license slots)", "Exclusive (sold once to one buyer, then delisted)", 
                      "Auction Style (highest bidder)", "Subscription (recurring billing)", "One-Time Purchase", "Pay-What-You-Want", 
                      "Reserved / Pre-Order", "Bundle-Only (sold as part of a bundle)", "Free with Attribution"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                    </div>
                  </div>
                </div>
              </div>`;

const junkStartIndex = code.indexOf(goodEndMarker) + goodEndMarker.length;
console.log("Junk starts after", junkStartIndex);

// find the target to keep
const keepMarker = `            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image (Required)</label>`;
const junkEndIndex = code.lastIndexOf(keepMarker); // Last one, just to be sure we skip all junk copies

if (junkStartIndex !== -1 && junkEndIndex !== -1 && junkStartIndex < junkEndIndex) {
    code = code.substring(0, junkStartIndex) + "\n" + code.substring(junkEndIndex);
    fs.writeFileSync('src/pages/Sell.tsx', code);
    console.log("Fixed!");
} else {
    console.log("Could not fix", junkStartIndex, junkEndIndex);
}

