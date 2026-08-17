import fs from 'fs';
const file = 'src/pages/dashboard/SellerDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { KYCVerificationForm }')) {
  content = content.replace('import { motion, AnimatePresence } from "framer-motion";', 'import { motion, AnimatePresence } from "framer-motion";\nimport { KYCVerificationForm } from "@/components/KYCVerificationForm";\nimport { ShieldCheck } from "lucide-react";');
}

content = content.replace('{ id: "store-settings", label: "Store Settings", icon: Settings },', '{ id: "store-settings", label: "Store Settings", icon: Settings },\n    { id: "kyc", label: "KYC Verification", icon: ShieldCheck },');

content = content.replace('{activeTab === \'store-settings\' && <StoreSettingsTab token={token} />}', '{activeTab === \'store-settings\' && <StoreSettingsTab token={token} />}\n              {activeTab === \'kyc\' && <KYCTab />}');

content = content.replace('[\'sales\', \'analytics\', \'wallet\', \'coupons\', \'store-settings\']', '[\'sales\', \'analytics\', \'wallet\', \'coupons\', \'store-settings\', \'kyc\']');

content += `\nfunction KYCTab() {
  return (
    <div className="space-y-6">
      <KYCVerificationForm />
    </div>
  );
}`;

fs.writeFileSync(file, content);
