const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

code = code.replace(
  '(categories.find(c => c.name === formData.type)?.subcategories || [])',
  '((categories as any)[formData.type]?.subCategories || [])'
);

fs.writeFileSync('src/pages/Sell.tsx', code);
