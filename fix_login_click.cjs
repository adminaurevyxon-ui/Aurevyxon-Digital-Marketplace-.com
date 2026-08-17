const fs = require('fs');
let code = fs.readFileSync('src/components/LoginDialog.tsx', 'utf8');

code = code.replace(
`        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isAuthenticated) {
              if (auth.currentUser && !auth.currentUser.emailVerified && auth.currentUser.providerData.some(p => p.providerId === 'password')) {
                  setMode('verify');
                  setOpen(true);
              }
              // If already authenticated and verified, no need to open, or maybe they just wanted to login.
          } else {
              setOpen(true);
          }
        }}`,
`        onClickCapture={(e) => {
          if (isAuthenticated) {
              if (auth.currentUser && !auth.currentUser.emailVerified && auth.currentUser.providerData.some(p => p.providerId === 'password')) {
                  e.preventDefault();
                  e.stopPropagation();
                  setMode('verify');
                  setOpen(true);
              }
              // Allow normal click to propagate if authenticated and verified
          } else {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
          }
        }}`
);

fs.writeFileSync('src/components/LoginDialog.tsx', code);
