const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

const prefTab = `
function PreferencesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Preferences</h2>
      
      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what we notify you about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
            <div>
              <p className="font-bold text-white">Order Updates</p>
              <p className="text-sm text-muted-foreground">Get notified about your purchases.</p>
            </div>
            <div className="w-12 h-6 bg-indigo-500 rounded-full flex items-center px-1">
              <div className="w-4 h-4 bg-white rounded-full translate-x-6"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
            <div>
              <p className="font-bold text-white">Promotional Emails</p>
              <p className="text-sm text-muted-foreground">Receive discounts and offers.</p>
            </div>
            <div className="w-12 h-6 bg-muted rounded-full flex items-center px-1 border border-border">
              <div className="w-4 h-4 bg-muted-foreground rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button className="flex-1 p-4 rounded-xl border border-indigo-500/50 bg-[#0A0A1E] text-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              Dark Mode (Active)
            </button>
            <button className="flex-1 p-4 rounded-xl border border-border bg-gray-100 text-center font-bold text-gray-900 opacity-50 cursor-not-allowed">
              Light Mode
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`

content = content.replace(
  /\{activeTab === 'billing' && <WalletTab data=\{dashboardData\} \/>\}/,
  `{activeTab === 'billing' && <WalletTab data={dashboardData} />}
              {activeTab === 'preferences' && <PreferencesTab />}`
);

content = content + "\n\n" + prefTab;

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', content);
