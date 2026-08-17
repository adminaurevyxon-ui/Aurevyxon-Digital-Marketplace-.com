const fs = require('fs');
let content = fs.readFileSync('src/pages/StartSelling.tsx', 'utf8');
content = content.replace('px-4 py-6 text-white h-auto', 'px-4 py-3 text-white h-[46px]'); // Make it match exactly native select height
fs.writeFileSync('src/pages/StartSelling.tsx', content);
