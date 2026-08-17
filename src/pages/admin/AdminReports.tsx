import React, { useState } from "react";
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
      const res = await fetch(`/api/admin/reports/export?type=${type}`, { headers: { Authorization: `Bearer ${token}` } });
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
        const rows = data.map((row) => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
        const csv = [header, ...rows].join("\n");
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast(`${type} report downloaded successfully`);
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
