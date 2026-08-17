const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

if (!code.includes('import { categories }')) {
    code = code.replace('import { Button }', 'import { categories } from "@/lib/categories";\nimport { Button }');
}

const targetStart = '{currentStep === 3 && (';
const targetEnd = '                {currentStep === 4 && (';

const startIdx = code.indexOf(targetStart);
const endIdx = code.indexOf(targetEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const newStep3 = `{currentStep === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Category</label>
                      <InlineSelection 
                        value={formData.type}
                        options={Object.keys(categories)}
                        onChange={(val) => setFormData({ ...formData, type: val, sub_category: "" })}
                      />
                    </div>
                    {formData.type && categories[formData.type as keyof typeof categories] && (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">Sub Category</label>
                        <InlineSelection 
                          value={formData.sub_category}
                          options={categories[formData.type as keyof typeof categories].subCategories}
                          onChange={(val) => setFormData({ ...formData, sub_category: val })}
                        />
                      </div>
                    )}
                  </motion.div>
                )}

                `;
    code = code.substring(0, startIdx) + newStep3 + code.substring(endIdx);
    fs.writeFileSync('src/pages/Sell.tsx', code);
    console.log("Updated Sell.tsx step 3");
} else {
    console.log("Could not find step 3");
}
