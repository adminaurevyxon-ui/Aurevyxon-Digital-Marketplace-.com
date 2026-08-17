const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /import Dashboard from "\.\/pages\/Dashboard";/,
  `import Dashboard from "./pages/Dashboard";\nimport UserDashboard from "./pages/dashboard/UserDashboard";\nimport SellerDashboard from "./pages/dashboard/SellerDashboard";`
);

content = content.replace(
  /<Route path="dashboard" element=\{<Dashboard \/>\} \/>/,
  `<Route path="dashboard" element={<Dashboard />} />\n        <Route path="user/dashboard" element={<UserDashboard />} />\n        <Route path="seller/dashboard" element={<SellerDashboard />} />`
);

fs.writeFileSync('src/App.tsx', content);
