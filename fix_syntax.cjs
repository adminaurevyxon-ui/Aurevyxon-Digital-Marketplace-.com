const fs = require('fs');

// Fix server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(/      tx\(\);\n      res\.json\(\{ success: true \}\);\n    \} catch\(err: any\) \{\n      res\.status\(500\)\.json\(\{ error: err\.message \}\);\n    \}\n  \}\);\n      tx\(\);\n      res\.json\(\{ success: true \}\);\n    \} catch\(err: any\) \{\n      res\.status\(500\)\.json\(\{ error: err\.message \}\);\n    \}\n  \}\);/,
`      tx();
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });`);
fs.writeFileSync('server.ts', serverContent);

// Fix StartSelling.tsx
let startSellingContent = fs.readFileSync('src/pages/StartSelling.tsx', 'utf8');
startSellingContent = startSellingContent.replace(/        setTimeout\(\(\) => \{\n          window\.location\.reload\(\);\n        \}, 1500\);\n      \}, 1500\);\n      \} else \{/,
`        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {`);
fs.writeFileSync('src/pages/StartSelling.tsx', startSellingContent);
