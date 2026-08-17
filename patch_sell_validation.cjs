const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const target = `    if (!isAuthenticated) {
      setError("You must be logged in to sell items.");
      return;
    }`;

const replacement = `    if (!isAuthenticated) {
      setError("You must be logged in to sell items.");
      return;
    }
    if (!formData.type) {
      setError("Please select an app category.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Sell.tsx', code);
