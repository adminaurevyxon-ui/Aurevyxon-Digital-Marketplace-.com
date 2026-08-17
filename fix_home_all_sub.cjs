const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  /<SelectContent>\s*\{categories\[categoryFilter as keyof typeof categories\]\?\.subCategories\.map/g,
  `<SelectContent>\n                   <SelectItem value="All">All</SelectItem>\n                   {categories[categoryFilter as keyof typeof categories]?.subCategories.map`
);

fs.writeFileSync('src/pages/Home.tsx', content);
