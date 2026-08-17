const fs = require('fs');

const adminFraud = `import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Shield, AlertTriangle, Gavel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AdminFraud() {
  const { token } = useAuth();
  const [data, setData] = useState({ disputes: [], suspiciousUsers: [] });

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/fraud", { headers: { Authorization: \`Bearer \${token}\` } });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const suspendUser = async (id) => {
    if (!confirm("Suspend user?")) return;
    try {
      await fetch(\`/api/admin/fraud/suspend/\${id}\`, { method: "POST", headers: { Authorization: \`Bearer \${token}\` } });
      toast("User suspended");
      loadData();
    } catch (e) {
      toast("Error suspending user");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#141428]/80 backdrop-blur-xl border-border">
        <CardContent className="p-6">
           <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4 text-red-400">
             <AlertTriangle className="w-5 h-5" /> Suspicious Users & Fraud Scoring
           </h2>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs uppercase bg-white/[0.02] text-muted-foreground">
                 <tr>
                   <th className="px-4 py-3">User</th>
                   <th className="px-4 py-3">Email</th>
                   <th className="px-4 py-3">Fraud Score</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {data.suspiciousUsers.map((u) => (
                   <tr key={u.id} className="border-b border-border/10 hover:bg-white/[0.01]">
                     <td className="px-4 py-3">{u.name}</td>
                     <td className="px-4 py-3">{u.email}</td>
                     <td className="px-4 py-3 font-mono text-red-400">{u.fraud_score}</td>
                     <td className="px-4 py-3">
                        {u.is_suspended ? <span className="text-red-400">Suspended</span> : <span className="text-emerald-400">Active</span>}
                     </td>
                     <td className="px-4 py-3">
                        {!u.is_suspended && (
                           <Button size="sm" variant="destructive" onClick={() => suspendUser(u.id)}>Suspend</Button>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {data.suspiciousUsers.length === 0 && <p className="text-muted-foreground p-4">No suspicious users found.</p>}
           </div>
        </CardContent>
      </Card>

      <Card className="bg-[#141428]/80 backdrop-blur-xl border-border">
        <CardContent className="p-6">
           <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4 text-orange-400">
             <Gavel className="w-5 h-5" /> Active Disputes
           </h2>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-xs uppercase bg-white/[0.02] text-muted-foreground">
                 <tr>
                   <th className="px-4 py-3">Tx ID</th>
                   <th className="px-4 py-3">Buyer</th>
                   <th className="px-4 py-3">Seller</th>
                   <th className="px-4 py-3">Amount</th>
                   <th className="px-4 py-3">Reason</th>
                   <th className="px-4 py-3">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {data.disputes.map((d) => (
                   <tr key={d.id} className="border-b border-border/10 hover:bg-white/[0.01]">
                     <td className="px-4 py-3 font-mono text-xs">{d.transaction_id}</td>
                     <td className="px-4 py-3">{d.buyer_name}</td>
                     <td className="px-4 py-3">{d.seller_name}</td>
                     <td className="px-4 py-3">\${d.amount} {d.currency}</td>
                     <td className="px-4 py-3">{d.reason}</td>
                     <td className="px-4 py-3">
                        <span className="uppercase text-xs font-bold text-orange-400">{d.status}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {data.disputes.length === 0 && <p className="text-muted-foreground p-4">No active disputes.</p>}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

const adminCMS = `import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Layout, Megaphone } from "lucide-react";

export function AdminCMS() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/cms/announcements", { headers: { Authorization: \`Bearer \${token}\` } });
      const json = await res.json();
      if (res.ok) setAnnouncements(json.announcements || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const addAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/cms/announcements", {
        method: "POST",
        headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        toast("Announcement posted");
        setTitle("");
        setContent("");
        loadData();
      }
    } catch (err) {
      toast("Error posting announcement");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#141428]/80 backdrop-blur-xl border-border">
        <CardContent className="p-6">
           <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
             <Megaphone className="w-5 h-5 text-indigo-400" /> Platform Announcements
           </h2>
           <form onSubmit={addAnnouncement} className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Content</label>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  required 
                  className="w-full h-24 bg-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">Post Announcement</Button>
           </form>

           <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Recent Announcements</h3>
              {announcements.map((a) => (
                <div key={a.id} className="bg-white/[0.02] border border-border/10 p-4 rounded-lg">
                  <h4 className="font-bold text-white mb-1">{a.title}</h4>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

const adminReports = `import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

export function AdminReports() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(null);

  const downloadReport = async (type) => {
    setLoading(type);
    try {
      const res = await fetch(\`/api/admin/reports/export?type=\${type}\`, { headers: { Authorization: \`Bearer \${token}\` } });
      const json = await res.json();
      if (res.ok) {
        // Convert to CSV
        const data = json.data;
        if (!data || data.length === 0) {
            toast("No data available for export");
            setLoading(null);
            return;
        }
        
        const header = Object.keys(data[0]).join(",");
        const rows = data.map((row) => Object.values(row).map(val => \`"\${String(val).replace(/"/g, '""')}"\`).join(","));
        const csv = [header, ...rows].join("\\n");
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', \`\${type}_export_\${new Date().toISOString().split('T')[0]}.csv\`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast(\`\${type} report downloaded successfully\`);
      }
    } catch (e) {
      toast("Error generating report");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#141428]/80 backdrop-blur-xl border-border">
        <CardContent className="p-6">
           <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
             <FileText className="w-5 h-5 text-indigo-400" /> Data Exports & Reports
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/[0.02] border border-border/10 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-bold text-white mb-1">Users Export</h3>
                    <p className="text-xs text-muted-foreground">Download all registered users and roles</p>
                 </div>
                 <Button variant="outline" className="w-full mt-2 border-border" onClick={() => downloadReport('users')} disabled={loading === 'users'}>
                    <Download className="w-4 h-4 mr-2" /> {loading === 'users' ? 'Exporting...' : 'Export CSV'}
                 </Button>
              </div>

              <div className="bg-white/[0.02] border border-border/10 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-bold text-white mb-1">Transactions Export</h3>
                    <p className="text-xs text-muted-foreground">Download all platform transactions</p>
                 </div>
                 <Button variant="outline" className="w-full mt-2 border-border" onClick={() => downloadReport('transactions')} disabled={loading === 'transactions'}>
                    <Download className="w-4 h-4 mr-2" /> {loading === 'transactions' ? 'Exporting...' : 'Export CSV'}
                 </Button>
              </div>

              <div className="bg-white/[0.02] border border-border/10 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-bold text-white mb-1">Products Export</h3>
                    <p className="text-xs text-muted-foreground">Download product catalog data</p>
                 </div>
                 <Button variant="outline" className="w-full mt-2 border-border" onClick={() => downloadReport('products')} disabled={loading === 'products'}>
                    <Download className="w-4 h-4 mr-2" /> {loading === 'products' ? 'Exporting...' : 'Export CSV'}
                 </Button>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/admin/AdminFraud.tsx', adminFraud);
fs.writeFileSync('src/pages/admin/AdminCMS.tsx', adminCMS);
fs.writeFileSync('src/pages/admin/AdminReports.tsx', adminReports);
