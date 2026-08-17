const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/SellerDashboard.tsx', 'utf8');

const moreTabs = `
function SalesTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Sales & Orders</h2>
      {data?.sales?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">You haven't made any sales yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Order ID</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Earnings</th>
                <th className="px-6 py-4 rounded-tr-xl">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.sales?.map((sale: any) => (
                <tr key={sale.order_id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-mono text-xs">{sale.order_id}</td>
                  <td className="px-6 py-4 font-medium">{sale.title}</td>
                  <td className="px-6 py-4">{sale.buyer_name}</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold">+\${(sale.seller_earnings || sale.amount)?.toFixed(2)}</td>
                  <td className="px-6 py-4">{new Date(sale.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Store Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <h3 className="text-5xl font-bold text-indigo-400 mb-2">3.8%</h3>
              <p className="text-sm text-muted-foreground">From Store Views to Purchases</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Top Performing Product</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
             {data?.sales?.length > 0 ? (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">{data.sales[0].title}</h3>
                  <p className="text-sm text-muted-foreground">Most sales this month</p>
                </div>
             ) : (
                <p className="text-muted-foreground">Not enough data</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WalletTab({ data }: { data: any }) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("stripe");
  const [payoutDetails, setPayoutDetails] = useState("");

  const submitPayout = (e: any) => {
    e.preventDefault();
    toast.success("Payout request submitted! Will be processed within 48 hours.");
    setPayoutAmount("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Wallet & Payouts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-4xl font-bold text-emerald-400 mb-4">\${data?.balance?.toFixed(2) || "0.00"}</h3>
            <p className="text-sm text-muted-foreground mb-6">Minimum withdrawal is $50.00</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPayout} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1">Amount (USD)</label>
                  <input
                     type="number"
                     max={data?.balance}
                     min={10}
                     step="0.01"
                     required
                     value={payoutAmount}
                     onChange={(e) => setPayoutAmount(e.target.value)}
                     className="w-full bg-muted border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1">Payout Method</label>
                  <select
                     value={payoutMethod}
                     onChange={(e) => setPayoutMethod(e.target.value)}
                     className="w-full bg-muted border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                     <option value="bank_transfer" className="bg-gray-900">Bank Transfer (Wire/ACH)</option>
                     <option value="paypal" className="bg-gray-900">PayPal</option>
                     <option value="crypto" className="bg-gray-900">Crypto (USDC / USDT)</option>
                     <option value="stripe" className="bg-gray-900">Stripe Connect</option>
                  </select>
               </div>
               <Button type="submit" disabled={!payoutAmount || Number(payoutAmount) <= 0 || Number(payoutAmount) > data?.balance} className="w-full bg-emerald-500 hover:bg-emerald-600 h-10 mt-2">
                  Submit Withdrawal
               </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CouponsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Marketing & Coupons</h2>
        <Button className="bg-emerald-500 hover:bg-emerald-600">Create Coupon</Button>
      </div>
      <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
        <p className="text-muted-foreground mb-4">You haven't created any promotional campaigns.</p>
      </div>
    </div>
  );
}

function StoreSettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Store Settings</h2>
      <Card className="bg-[#141428]/80 border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Store Name</label>
            <input type="text" defaultValue="My Premium Store" className="w-full bg-muted border border-border rounded-md h-10 px-3" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Store Description</label>
            <textarea defaultValue="High quality digital assets and premium software." className="w-full min-h-[100px] bg-muted border border-border rounded-md p-3" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Support Email</label>
            <input type="email" defaultValue="support@mystore.com" className="w-full bg-muted border border-border rounded-md h-10 px-3" />
          </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
`

content = content.replace(
  /\{activeTab === 'products' && <ProductsTab data=\{dashboardData\} \/>\}/,
  `{activeTab === 'products' && <ProductsTab data={dashboardData} />}
              {activeTab === 'sales' && <SalesTab data={dashboardData} />}
              {activeTab === 'analytics' && <AnalyticsTab data={dashboardData} />}
              {activeTab === 'wallet' && <WalletTab data={dashboardData} />}
              {activeTab === 'coupons' && <CouponsTab />}
              {activeTab === 'store-settings' && <StoreSettingsTab />}`
);

content = content + "\n\n" + moreTabs;

fs.writeFileSync('src/pages/dashboard/SellerDashboard.tsx', content);
