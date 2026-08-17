const fs = require('fs');
let code = fs.readFileSync('src/components/LoginDialog.tsx', 'utf8');
code = code.replace('import { ReactNode', 'import React, { ReactNode');
fs.writeFileSync('src/components/LoginDialog.tsx', code);
