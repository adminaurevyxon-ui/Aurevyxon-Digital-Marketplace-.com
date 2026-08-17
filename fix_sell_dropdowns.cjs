const fs = require('fs');
let content = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

content = content.replace(
  /<select\s+className="w-full bg-muted\/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"\s+value={formData\.discount_type}\s+onChange={\(e\) => setFormData\({ \.\.\.formData, discount_type: e\.target\.value }\)}\s+>[\s\S]*?<\/select>/m,
  `<select 
                    className="w-full bg-muted/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  >
                    <option value="" className="bg-gray-900">Select Discount Type</option>
                    {extraFilters.discountType.map(p => (
                       <option key={p} value={p} className="bg-gray-900">{p}</option>
                    ))}
                  </select>`
);

content = content.replace(
  /<select\s+className="w-full bg-muted\/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"\s+value={formData\.mode}\s+onChange={\(e\) => setFormData\({ \.\.\.formData, mode: e\.target\.value }\)}\s+>[\s\S]*?<\/select>/m,
  `<select 
                    className="w-full bg-muted/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <option value="" className="bg-gray-900">Select Sale Mode</option>
                    {extraFilters.saleMode.map(p => (
                       <option key={p} value={p} className="bg-gray-900">{p}</option>
                    ))}
                  </select>`
);

content = content.replace(
  /<select\s+className="w-full bg-muted\/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"\s+value={formData\.license_type}\s+onChange={\(e\) => setFormData\({ \.\.\.formData, license_type: e\.target\.value }\)}\s+>[\s\S]*?<\/select>/m,
  `<select 
                    className="w-full bg-muted/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  >
                    <option value="" className="bg-gray-900">Select License</option>
                    {extraFilters.license.map(p => (
                       <option key={p} value={p} className="bg-gray-900">{p}</option>
                    ))}
                  </select>`
);

content = content.replace(
  /<select\s+className="w-full bg-muted\/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"\s+value={formData\.support_type}\s+onChange={\(e\) => setFormData\({ \.\.\.formData, support_type: e\.target\.value }\)}\s+>[\s\S]*?<\/select>/m,
  `<select 
                    className="w-full bg-muted/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"
                    value={formData.support_type}
                    onChange={(e) => setFormData({ ...formData, support_type: e.target.value })}
                  >
                    <option value="" className="bg-gray-900">Select Support</option>
                    {extraFilters.support.map(p => (
                       <option key={p} value={p} className="bg-gray-900">{p}</option>
                    ))}
                  </select>`
);


fs.writeFileSync('src/pages/Sell.tsx', content);
