const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /app\.post\("\/api\/user\/wallet\/add-funds"/,
  `app.post("/api/user/2fa/enable", authenticate, (req: any, res) => {
     res.json({ success: true });
  });\n\n  app.post("/api/user/wallet/add-funds"`
);
fs.writeFileSync('server.ts', code);
