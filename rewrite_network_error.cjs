const fs = require('fs');
let code = fs.readFileSync('src/components/LoginDialog.tsx', 'utf8');

code = code.replace(
  `          if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
              setError(err.message);
          }`,
  `          if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
              if (err.code === 'auth/network-request-failed') {
                  setError("Network error: Please check your connection or try disabling any ad-blockers/brave shields.");
              } else {
                  setError(err.message);
              }
          }`
);

code = code.replace(
  `      if (err.code === 'auth/invalid-credential') {
          setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
          setError("Email is already in use.");
      } else {
          setError(err.message || "An error occurred");
      }`,
  `      if (err.code === 'auth/invalid-credential') {
          setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
          setError("Email is already in use.");
      } else if (err.code === 'auth/network-request-failed') {
          setError("Network error: Please check your connection or try disabling any ad-blockers/brave shields.");
      } else {
          setError(err.message || "An error occurred");
      }`
);

fs.writeFileSync('src/components/LoginDialog.tsx', code);
