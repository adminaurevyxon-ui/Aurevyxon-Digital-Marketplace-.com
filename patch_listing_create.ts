import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const checkSeller = `
    const sellerProfile = db.prepare("SELECT * FROM seller_profiles WHERE user_id = ? AND kyc_status = 'verified' AND payout_verified = 1").get(req.user.id);
    if (!sellerProfile) {
      return res.status(403).json({ error: "You must complete KYC and verify your payout account before listing products." });
    }
`;

content = content.replace(
  'const { title, description, price, type, mode, tags, discount_percentage, discount_type, custom_badge, platform, sub_category, framework, license_type, support_type, language, compatibility, file_type } = req.body;',
  'const { title, description, price, type, mode, tags, discount_percentage, discount_type, custom_badge, platform, sub_category, framework, license_type, support_type, language, compatibility, file_type } = req.body;\n' + checkSeller
);

fs.writeFileSync('server.ts', content);
