const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

code = code.replace(
  `      const checkJson = async (res: Response) => {
          const text = await res.text();
          try {
              return JSON.parse(text);
          } catch(e) {
              console.error("Failed to parse JSON for", res.url, text.substring(0, 100));
              return {};
          }
      };`,
  `      const checkJson = async (res: Response) => {
          if (!res.ok) {
              if (res.status === 401 || res.status === 403) return {};
              throw new Error(\`Request failed with status \${res.status}\`);
          }
          const text = await res.text();
          try {
              return JSON.parse(text);
          } catch(e) {
              console.error("Failed to parse JSON for", res.url, text.substring(0, 100));
              return {};
          }
      };`
);

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', code);
