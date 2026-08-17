const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.tsx', 'utf8');

code = code.replace(
  /const isMobile = \/iPhone\|iPad\|iPod\|Android\/i\.test\(navigator\.userAgent\);\s*if \(isMobile\) \{\s*await signInWithRedirect\(auth, provider\);\s*\} else \{\s*await signInWithPopup\(auth, provider\);\s*\}/,
  `await signInWithPopup(auth, provider);`
);

fs.writeFileSync('src/lib/auth.tsx', code);
