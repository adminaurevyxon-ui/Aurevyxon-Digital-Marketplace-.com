import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/SellerDashboard.tsx', 'utf8');

const oldFormStart = `<Card className="bg-[#141428]/80 border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
          </CardHeader>`;

const newForm = `<Card className="bg-[#141428]/80 border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Automated Settlement Active</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-4">
               <ShieldCheck className="w-6 h-6 text-emerald-400 mt-1" />
               <div>
                  <h4 className="font-semibold text-emerald-100">Direct-to-Payout Active</h4>
                  <p className="text-sm text-emerald-200/80 mt-1">Your verified payout account receives your earnings instantly and automatically the moment a buyer purchases your product. No manual withdrawals required.</p>
               </div>
             </div>
          </CardContent>
        </Card>`;

content = content.replace(
  /<Card className="bg-\[#141428\]\/80 border-border md:col-span-2">[\s\S]*?<\/Card>/g,
  newForm
);

fs.writeFileSync('src/pages/dashboard/SellerDashboard.tsx', content);
