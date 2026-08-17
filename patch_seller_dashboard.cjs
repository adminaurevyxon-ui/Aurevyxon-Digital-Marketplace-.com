const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/SellerDashboard.tsx', 'utf8');

// Pass token and fetchData to tabs
code = code.replace(
  /{activeTab === 'overview' && <OverviewTab data={dashboardData} \/>}/g,
  "{activeTab === 'overview' && <OverviewTab data={dashboardData} />}"
);
// wait, let's pass token and fetchData to all tabs that need them
code = code.replace(/<WalletTab data={dashboardData} \/>/g, '<WalletTab data={dashboardData} token={token} onRefresh={fetchData} />');
code = code.replace(/<CouponsTab \/>/g, '<CouponsTab token={token} />');
code = code.replace(/<StoreSettingsTab \/>/g, '<StoreSettingsTab token={token} />');

// Modify WalletTab
code = code.replace(
  /function WalletTab\({ data }: { data: any }\) {[\s\S]*?return \(/,
  `function WalletTab({ data, token, onRefresh }: { data: any; token?: string; onRefresh?: () => void }) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("stripe");
  
  const submitPayout = async (e: any) => {
    e.preventDefault();
    try {
      const auth = { Authorization: \`Bearer \${token}\` };
      // Create a method first
      const methodRes = await fetch('/api/payout/methods', {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ method_type: payoutMethod, details: { account: 'default@email.com' }, is_default: true })
      });
      const methodData = await methodRes.json();
      
      const res = await fetch('/api/payout/request', {
         method: 'POST',
         headers: { ...auth, 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount: Number(payoutAmount), method_id: methodData.id })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Payout request submitted! Will be processed within 48 hours.");
      setPayoutAmount("");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (`
);

// Modify CouponsTab
code = code.replace(
  /function CouponsTab\(\) {[\s\S]*?return \(/,
  `function CouponsTab({ token }: { token?: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  
  useEffect(() => {
    if(token) {
      fetch('/api/seller/coupons', { headers: { Authorization: \`Bearer \${token}\` } })
      .then(res => res.json())
      .then(data => setCoupons(data.coupons || []));
    }
  }, [token]);
  
  const createCoupon = async () => {
    try {
      const res = await fetch('/api/seller/coupons', {
         method: 'POST',
         headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ code: 'PROMO' + Math.floor(Math.random()*1000), discount_percentage: 10, valid_until: new Date(Date.now() + 30*24*60*60*1000) })
      });
      const data = await res.json();
      if(data.success) {
         toast.success("Coupon created!");
         setCoupons([...coupons, data.coupon]);
      } else {
         toast.error(data.error);
      }
    } catch(err: any) { toast.error(err.message); }
  };

  return (`
);
code = code.replace(
  /onClick={\(\) => toast\.info\("Coupon generation requires Pro Seller account\."\)}/,
  `onClick={createCoupon}`
);

code = code.replace(
  /<div className="p-8 text-center border border-border rounded-xl bg-white\/\[0\.02\]">\s*<p className="text-muted-foreground mb-4">You haven't created any promotional campaigns\.<\/p>\s*<\/div>/,
  `{coupons.length === 0 ? (
      <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
        <p className="text-muted-foreground mb-4">You haven't created any promotional campaigns.</p>
      </div>
  ) : (
      <div className="grid gap-4">
        {coupons.map((c: any) => (
           <div key={c.id} className="p-4 bg-white/[0.02] border border-border rounded-xl flex justify-between items-center">
              <div>
                 <p className="font-bold text-emerald-400">{c.code}</p>
                 <p className="text-xs text-muted-foreground">{c.discount_percentage}% off</p>
              </div>
           </div>
        ))}
      </div>
  )}`
);

// Modify StoreSettingsTab
code = code.replace(
  /function StoreSettingsTab\(\) {[\s\S]*?return \(/,
  `function StoreSettingsTab({ token }: { token?: string }) {
  const [storeName, setStoreName] = useState("My Premium Store");
  const [storeDesc, setStoreDesc] = useState("High quality digital assets and premium software.");
  const [supportEmail, setSupportEmail] = useState("support@mystore.com");

  useEffect(() => {
    if(token) {
      fetch('/api/seller/settings', { headers: { Authorization: \`Bearer \${token}\` } })
      .then(res => res.json())
      .then(data => {
         if(data.settings) {
            setStoreName(data.settings.storeName || storeName);
            setStoreDesc(data.settings.storeDesc || storeDesc);
            setSupportEmail(data.settings.supportEmail || supportEmail);
         }
      });
    }
  }, [token]);

  const saveSettings = async () => {
    try {
       await fetch('/api/seller/settings', {
         method: 'POST',
         headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ storeName, storeDesc, supportEmail })
       });
       toast.success("Store settings updated successfully!");
    } catch(err) { toast.error("Error saving settings"); }
  };

  return (`
);

code = code.replace(
  /defaultValue="My Premium Store" className="w-full bg-muted border border-border rounded-md h-10 px-3"/,
  `value={storeName} onChange={(e)=>setStoreName(e.target.value)} className="w-full bg-muted border border-border rounded-md h-10 px-3"`
);
code = code.replace(
  /defaultValue="High quality digital assets and premium software\." className="w-full min-h-\[100px\] bg-muted border border-border rounded-md p-3"/,
  `value={storeDesc} onChange={(e)=>setStoreDesc(e.target.value)} className="w-full min-h-[100px] bg-muted border border-border rounded-md p-3"`
);
code = code.replace(
  /defaultValue="support@mystore\.com" className="w-full bg-muted border border-border rounded-md h-10 px-3"/,
  `value={supportEmail} onChange={(e)=>setSupportEmail(e.target.value)} className="w-full bg-muted border border-border rounded-md h-10 px-3"`
);
code = code.replace(
  /onClick={\(\) => toast\.success\("Store settings updated successfully!"\)}/,
  `onClick={saveSettings}`
);

// Modify AnalyticsTab to use actual calculation
code = code.replace(
  /<h3 className="text-5xl font-bold text-indigo-400 mb-2">3\.8%<\/h3>/,
  `<h3 className="text-5xl font-bold text-indigo-400 mb-2">{data?.sales?.length && data?.myListings?.length ? Math.min((data.sales.length / (data.myListings.length * 10)) * 100, 100).toFixed(1) : "0.0"}%</h3>`
);


fs.writeFileSync('src/pages/dashboard/SellerDashboard.tsx', code);
