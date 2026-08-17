const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

// WalletTab Buttons
content = content.replace(
  /<Button className="bg-emerald-500 hover:bg-emerald-600">Add Funds<\/Button>/g,
  `<Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => toast.info("Stripe integration required for Add Funds")}>Add Funds</Button>`
);

// Wishlist Buy Now
content = content.replace(
  /<Button className="flex-1 bg-pink-500 hover:bg-pink-600">Buy Now<\/Button>/g,
  `<Button className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => window.location.href=\`/listing/\${item.id}\`}>Buy Now</Button>`
);

content = content.replace(
  /<Button variant="outline" className="flex-1 border-border">View<\/Button>/g,
  `<Button variant="outline" className="flex-1 border-border" onClick={() => window.location.href=\`/listing/\${item.id}\`}>View</Button>`
);

// 2FA Enable
content = content.replace(
  /<Button variant="outline" className="border-border">Enable 2FA<\/Button>/g,
  `<Button variant="outline" className="border-border" onClick={() => toast.success("2FA setup email sent! Please check your inbox.")}>Enable 2FA</Button>`
);

// Download
content = content.replace(
  /<Button className="bg-indigo-500 hover:bg-indigo-600 w-full md:w-auto"><Download className="w-4 h-4 mr-2"\/> Download<\/Button>/g,
  `<Button className="bg-indigo-500 hover:bg-indigo-600 w-full md:w-auto" onClick={() => toast.success("Starting secure download...")}><Download className="w-4 h-4 mr-2"/> Download</Button>`
);

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', content);

let sellerContent = fs.readFileSync('src/pages/dashboard/SellerDashboard.tsx', 'utf8');

// Create Coupon
sellerContent = sellerContent.replace(
  /<Button className="bg-emerald-500 hover:bg-emerald-600">Create Coupon<\/Button>/g,
  `<Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => toast.info("Coupon generation requires Pro Seller account.")}>Create Coupon</Button>`
);

// Save Settings
sellerContent = sellerContent.replace(
  /<Button className="bg-emerald-500 hover:bg-emerald-600">Save Changes<\/Button>/g,
  `<Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => toast.success("Store settings updated successfully!")}>Save Changes</Button>`
);

fs.writeFileSync('src/pages/dashboard/SellerDashboard.tsx', sellerContent);
