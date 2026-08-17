const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');
code = code.replace(/\\n/g, '\n');
fs.writeFileSync('src/pages/Sell.tsx', code);
