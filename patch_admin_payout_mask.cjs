const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const maskFunction = `  const maskDetails = (details: string) => {
      if (!details) return "N/A";
      if (details.length <= 4) return details;
      return "•••• " + details.slice(-4);
  };
  
  const handlePayoutStatus = async`;

content = content.replace("  const handlePayoutStatus = async", maskFunction);

const payoutDetails = `<div className="text-xs text-muted-foreground whitespace-pre-wrap">{p.details}</div>`;
const maskedPayoutDetails = `<div className="text-xs text-muted-foreground whitespace-pre-wrap">{maskDetails(p.details)}</div>`;
content = content.replace(payoutDetails, maskedPayoutDetails);

fs.writeFileSync('src/pages/Admin.tsx', content);
