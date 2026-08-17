const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const target = `{formData.type || "Mobile Apps"} &rarr;`;
const replacement = `Select App Category &rarr;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Sell.tsx', code);
