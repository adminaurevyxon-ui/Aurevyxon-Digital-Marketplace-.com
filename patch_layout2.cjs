const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(
  /<Link to="\/user\/dashboard">\s*<Button variant="ghost" className="rounded-full border border-border px-4 hidden sm:inline-flex">\s*\{user\?\.name\}\s*<\/Button>\s*<\/Link>/,
  `<Link to="/user/dashboard">
                   <Button variant="ghost" className="rounded-full border border-border px-4 hidden sm:inline-flex">
                     User Panel
                   </Button>
                 </Link>
                 {(user?.role === 'seller' || user?.role === 'admin') && (
                   <Link to="/seller/dashboard">
                     <Button variant="ghost" className="rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-4 hidden sm:inline-flex">
                       Seller Dashboard
                     </Button>
                   </Link>
                 )}`
);

fs.writeFileSync('src/components/Layout.tsx', content);
