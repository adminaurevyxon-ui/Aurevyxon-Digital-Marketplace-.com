const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `        user = {
          id: ulid(),
          email,
          name,
          role: "user"
        };`,
  `        user = {
          id: ulid(),
          email,
          name,
          role: email === 'jagannathsing777@gmail.com' ? 'admin' : 'user'
        };`
);

fs.writeFileSync('server.ts', code);
