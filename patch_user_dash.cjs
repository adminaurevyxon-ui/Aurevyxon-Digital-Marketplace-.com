const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

const additionalTabs = `
function SecurityTab({ user, token }: { user: any, token: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/security", {
        method: "PUT",
        headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) throw new Error("Failed to update security settings");
      toast.success("Security settings updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch(e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#141428]/80 border-border">
      <CardHeader>
        <CardTitle>Security & Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Current Password</label>
          <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-background border-border" />
        </div>
        <Button onClick={handleUpdate} disabled={loading} className="bg-indigo-500 hover:bg-indigo-600">
          {loading ? "Updating..." : "Update Password"}
        </Button>

        <div className="mt-8 pt-6 border-t border-border">
           <h3 className="text-lg font-bold mb-4">Two-Factor Authentication (2FA)</h3>
           <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
             <div>
               <h4 className="font-semibold">Authenticator App</h4>
               <p className="text-sm text-muted-foreground">Not configured</p>
             </div>
             <Button variant="outline" className="border-border">Enable 2FA</Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketsTab({ data, token }: { data: any, token: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message })
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      toast.success("Support ticket created");
      setSubject("");
      setMessage("");
      // Need to refresh tickets ideally, but for now just show success
      setTimeout(() => window.location.reload(), 1000);
    } catch(e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>Open Support Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
              <Input required value={subject} onChange={e => setSubject(e.target.value)} className="bg-background border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Message</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)} className="w-full min-h-[120px] bg-background border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <Button type="submit" disabled={creating} className="bg-indigo-500">
              {creating ? "Submitting..." : "Submit Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.tickets?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets found.</p>
          ) : (
            <div className="space-y-4">
              {data?.tickets?.map((t: any) => (
                <div key={t.id} className="p-4 bg-white/[0.02] border border-border rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold">{t.subject}</h4>
                    <span className={\`text-xs px-2 py-1 rounded \${t.status === 'open' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}\`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{t.message}</p>
                  {t.resolution && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-indigo-400 mb-1">Support Resolution:</p>
                      <p className="text-sm text-gray-300">{t.resolution}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Created: {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadsTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Downloads & Licenses</h2>
      {data?.purchases?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">You haven't acquired any licenses.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.purchases?.map((p: any) => (
            <div key={p.order_id} className="p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex flex-col md:flex-row gap-4 items-center">
              <img src={p.image_url} className="w-16 h-16 rounded-lg object-cover" alt={p.title} />
              <div className="flex-1 text-left w-full">
                <h4 className="font-bold text-white">{p.title}</h4>
                <p className="text-sm text-muted-foreground">License ID: {p.order_id}</p>
                <div className="mt-2 text-xs text-indigo-400 font-mono bg-indigo-500/10 inline-block px-2 py-1 rounded">
                  {p.mode === 'Exclusive' ? 'Exclusive Full-Ownership License' : 'Standard License'}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button variant="outline" className="border-border w-full md:w-auto">View License</Button>
                <Button className="bg-indigo-500 hover:bg-indigo-600 w-full md:w-auto"><Download className="w-4 h-4 mr-2"/> Download</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`

content = content.replace(
  /\{activeTab === 'profile' && <ProfileTab user=\{user\} token=\{token\} \/>\}/,
  `{activeTab === 'profile' && <ProfileTab user={user} token={token} />}
              {activeTab === 'security' && <SecurityTab user={user} token={token} />}
              {activeTab === 'tickets' && <TicketsTab data={data} token={token} />}
              {activeTab === 'downloads' && <DownloadsTab data={data} />}`
);

content = content.replace(
  /\{activeTab === 'profile' && <ProfileTab user=\{user\} token=\{token\} \/>\}/,
  `{activeTab === 'profile' && <ProfileTab user={user} token={token} />}`
);

content = content.replace(
  /\{activeTab === 'tickets' && <TicketsTab data=\{data\} token=\{token\} \/>\}/,
  `{activeTab === 'tickets' && <TicketsTab data={dashboardData} token={token} />}`
);
content = content.replace(
  /\{activeTab === 'downloads' && <DownloadsTab data=\{data\} \/>\}/,
  `{activeTab === 'downloads' && <DownloadsTab data={dashboardData} />}`
);


content = content + "\n\n" + additionalTabs;

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', content);
