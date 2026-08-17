const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { Navigate }')) {
  content = content.replace(/import \{ Routes, Route \} from "react-router-dom";/, 'import { Routes, Route, Navigate } from "react-router-dom";');
}
content = content.replace(/<Route path="dashboard" element=\{<Dashboard \/>\} \/>/, '<Route path="dashboard" element={<Navigate to="/user/dashboard" replace />} />');

fs.writeFileSync('src/App.tsx', content);
