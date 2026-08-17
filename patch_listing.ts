import fs from 'fs';

let content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');

// Add import
content = content.replace(
  'import { useAuth } from "@/lib/auth";',
  'import { useAuth } from "@/lib/auth";\nimport { VerifiedBadge } from "@/components/VerifiedBadge";'
);

// Replace CheckCircle2 for verification with VerifiedBadge
content = content.replace(
  '{listing.is_verified ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}',
  '{listing.is_verified ? <VerifiedBadge className="ml-2" /> : null}'
);

fs.writeFileSync('src/pages/Listing.tsx', content);
