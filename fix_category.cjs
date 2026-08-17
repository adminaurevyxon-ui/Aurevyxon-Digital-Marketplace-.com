const fs = require('fs');
let content = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

content = content.replace(
  /<select\s+className="w-full bg-muted\/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"\s+value={formData\.type}\s+onChange={\(e\) => setFormData\({ \.\.\.formData, type: e\.target\.value, sub_category: "" }\)}\s+>[\s\S]*?<\/select>/m,
  `<select 
                    className="w-full bg-muted/50 border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground dark:text-white"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, sub_category: "" })}
                  >
                    <option value="" className="bg-gray-900">Select Category</option>
                    {Object.keys(categories).map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                    ))}
                  </select>`
);

fs.writeFileSync('src/pages/Sell.tsx', content);

let manageContent = fs.readFileSync('src/pages/ManageListing.tsx', 'utf8');
manageContent = manageContent.replace(
  /<select\s+value={formData\.type}\s+onChange={e => setFormData\(\{\.\.\.formData, type: e\.target\.value, sub_category: ""\}\)}\s+className="w-full bg-muted\/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"\s+>[\s\S]*?<\/select>/m,
  `<select 
                       value={formData.type}
                       onChange={e => setFormData({...formData, type: e.target.value, sub_category: ""})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Category</option>
                        {Object.keys(categories).map((cat) => (
                          <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                        ))}
                     </select>`
);
fs.writeFileSync('src/pages/ManageListing.tsx', manageContent);
