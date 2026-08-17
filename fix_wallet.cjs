const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

const correctWalletTab = `function WalletTab({ data, token, onRefresh }: { data: any; token?: string; onRefresh?: () => void }) {
    const [methods, setMethods] = useState<any[]>([]);
    
    useEffect(() => {
        if(token) {
           fetch('/api/payout/methods', { headers: { Authorization: \`Bearer \${token}\` } })
           .then(r=>r.json())
           .then(d=>setMethods(d.methods || []));
        }
    }, [token]);
    
    const addFunds = async () => {
        try {
            const res = await fetch('/api/user/wallet/add-funds', {
               method: 'POST',
               headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
               body: JSON.stringify({ amount: 50 })
            });
            if(!res.ok) throw new Error(await res.text());
            toast.success("Added $50 to wallet!");
            if(onRefresh) onRefresh();
        } catch(err: any) { toast.error(err.message); }
    };

    const addMethod = async () => {
        try {
            const res = await fetch('/api/payout/methods', {
               method: 'POST',
               headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
               body: JSON.stringify({ method_type: 'credit_card', details: { last4: Math.floor(1000 + Math.random() * 9000).toString() }, is_default: true })
            });
            if(!res.ok) throw new Error(await res.text());
            toast.success("Payment method added!");
            fetch('/api/payout/methods', { headers: { Authorization: \`Bearer \${token}\` } }).then(r=>r.json()).then(d=>setMethods(d.methods || []));
        } catch(err: any) { toast.error(err.message); }
    };
    
    const removeMethod = async (id: string) => {
        try {
            const res = await fetch(\`/api/payout/methods/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` } });
            setMethods(methods.filter(m => m.id !== id));
            toast.success("Payment method removed!");
        } catch(err: any) { toast.error(err.message); }
    };

    return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">My Wallet & Billing</h2>
      <Card className="bg-[#141428]/80 border-border">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <h3 className="text-3xl font-bold text-emerald-400">\${data?.balance?.toFixed(2) || "0.00"}</h3>
          <div className="mt-6 flex gap-4">
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={addFunds}>Add Funds</Button>
            <Button variant="outline" className="border-border">Transaction History</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="pt-6 border-t border-border">
        <h3 className="text-xl font-bold mb-4">Payment Methods</h3>
        {methods.map((m) => (
        <div key={m.id} className="p-4 rounded-xl border border-border bg-white/[0.02] flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold">•••• •••• •••• {m.details ? JSON.parse(m.details).last4 || '4242' : '4242'}</p>
              <p className="text-xs text-muted-foreground">Active Method</p>
            </div>
          </div>
          <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => removeMethod(m.id)}>Remove</Button>
        </div>
        ))}
        <Button variant="outline" onClick={addMethod} className="w-full mt-4 border-dashed border-border text-muted-foreground">
          + Add Payment Method
        </Button>
      </div>
    </div>
  );
}`;

code = code.replace(/function WalletTab\({ data, token, onRefresh }: { data: any; token\?: string; onRefresh\?: \(\) => void }\) {[\s\S]*?^}$/m, correctWalletTab);
// The above regex might fail if there's multiple matches, let's use a split or replace with function.

const parts = code.split('function WalletTab({ data, token, onRefresh }: { data: any; token?: string; onRefresh?: () => void }) {');
if (parts.length > 1) {
  const part2 = parts[1].split('function PreferencesTab({ token }: { token?: string }) {');
  code = parts[0] + correctWalletTab + '\n\nfunction PreferencesTab({ token }: { token?: string }) {' + part2[1];
}

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', code);
