const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(
  /<Link to="\/dashboard">/g,
  `<Link to="/user/dashboard">`
);
content = content.replace(
  /<Link to="\/dashboard" onClick=\{/g,
  `<Link to="/user/dashboard" onClick={`
);

// Add seller dashboard link if seller
content = content.replace(
  /<Link to="\/user\/dashboard">\s*<Button variant="ghost" className="hidden md:inline-flex text-muted-foreground hover:text-foreground dark:hover:text-white">Dashboard<\/Button>\s*<\/Link>/,
  `<Link to="/user/dashboard">\n                   <Button variant="ghost" className="hidden md:inline-flex text-muted-foreground hover:text-foreground dark:hover:text-white">User Panel</Button>\n                 </Link>\n                 {(user?.role === 'seller' || user?.role === 'admin') && (\n                   <Link to="/seller/dashboard">\n                     <Button variant="ghost" className="hidden md:inline-flex text-emerald-400 hover:text-emerald-300">Seller Dashboard</Button>\n                   </Link>\n                 )}`
);

fs.writeFileSync('src/components/Layout.tsx', content);
