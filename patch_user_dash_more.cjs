const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

const moreTabs = `
function WishlistTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">My Wishlist</h2>
      {data?.wishlist?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.wishlist?.map((item: any) => (
            <div key={item.wishlist_id} className="rounded-xl border border-border bg-white/[0.02] overflow-hidden flex flex-col h-full hover:border-pink-500/30 transition-colors">
              <div className="h-32 bg-muted/50 overflow-hidden relative">
                <img src={item.image_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">{item.title}</h3>
                <p className="text-emerald-400 font-bold mb-4">\${item.price}</p>
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" className="flex-1 border-border">View</Button>
                  <Button className="flex-1 bg-pink-500 hover:bg-pink-600">Buy Now</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">My Wallet & Billing</h2>
      <Card className="bg-[#141428]/80 border-border">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <h3 className="text-3xl font-bold text-emerald-400">\${data?.balance?.toFixed(2) || "0.00"}</h3>
          <div className="mt-6 flex gap-4">
            <Button className="bg-emerald-500 hover:bg-emerald-600">Add Funds</Button>
            <Button variant="outline" className="border-border">Transaction History</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="pt-6 border-t border-border">
        <h3 className="text-xl font-bold mb-4">Payment Methods</h3>
        <div className="p-4 rounded-xl border border-border bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold">•••• •••• •••• 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/25</p>
            </div>
          </div>
          <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300">Remove</Button>
        </div>
        <Button variant="outline" className="w-full mt-4 border-dashed border-border text-muted-foreground">
          + Add Payment Method
        </Button>
      </div>
    </div>
  );
}
`

content = content.replace(
  /\{activeTab === 'downloads' && <DownloadsTab data=\{dashboardData\} \/>\}/,
  `{activeTab === 'downloads' && <DownloadsTab data={dashboardData} />}
              {activeTab === 'wishlist' && <WishlistTab data={dashboardData} />}
              {activeTab === 'billing' && <WalletTab data={dashboardData} />}`
);

content = content + "\n\n" + moreTabs;

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', content);
