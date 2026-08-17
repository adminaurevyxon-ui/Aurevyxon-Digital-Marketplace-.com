const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.tsx', 'utf8');

code = code.replace(
  `        } catch (err) {
          console.warn("Auth sync error:", err);
          setUser(null);
          setToken(null);
          localStorage.removeItem("aurevyxon_token");
        }`,
  `        } catch (err: any) {
          console.warn("Auth sync error:", err);
          setUser(null);
          setToken(null);
          setAuthError(err.message || "Failed to sync with backend");
          localStorage.removeItem("aurevyxon_token");
        }`
);

fs.writeFileSync('src/lib/auth.tsx', code);
