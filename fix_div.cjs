const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const marker = '<div className="space-y-4 pt-4 border-t border-border">';
code = code.replace(marker, '</div>\n            ' + marker);

fs.writeFileSync('src/pages/Sell.tsx', code);
