const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageListing.tsx', 'utf8');

content = content.replace(
  /<select\s+value={formData\.discount_type}\s+onChange={e => setFormData\(\{\.\.\.formData, discount_type: e\.target\.value\}\)}\s+className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm text-foreground dark:text-white"\s+>[\s\S]*?<\/select>/m,
  `<select 
                                 value={formData.discount_type}
                                 onChange={e => setFormData({...formData, discount_type: e.target.value})}
                                 className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm text-foreground dark:text-white"
                               >
                                 <option value="">Select Discount Type</option>
                                 {extraFilters.discountType.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                 ))}
                               </select>`
);

content = content.replace(
  /<select\s+value={formData\.license_type}\s+onChange={e => setFormData\(\{\.\.\.formData, license_type: e\.target\.value\}\)}\s+className="w-full bg-muted\/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"\s+>[\s\S]*?<\/select>/m,
  `<select 
                       value={formData.license_type}
                       onChange={e => setFormData({...formData, license_type: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select License</option>
                       {extraFilters.license.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>`
);

content = content.replace(
  /<select\s+value={formData\.support_type}\s+onChange={e => setFormData\(\{\.\.\.formData, support_type: e\.target\.value\}\)}\s+className="w-full bg-muted\/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"\s+>[\s\S]*?<\/select>/m,
  `<select 
                       value={formData.support_type}
                       onChange={e => setFormData({...formData, support_type: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Support</option>
                       {extraFilters.support.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>`
);


fs.writeFileSync('src/pages/ManageListing.tsx', content);
