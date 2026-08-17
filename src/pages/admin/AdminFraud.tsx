import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Shield, AlertTriangle, Gavel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function AdminFraud() {
  const { token } = useAuth();
  const [data, setData] = useState({ disputes: [], suspiciousUsers: [] });
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/fraud", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const confirmSuspendUser = async () => {
    try {
      const res = await fetch(`/api/admin/fraud/suspend/${suspendUserId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || "Error suspending user");
      }
      toast("User suspended");
      setSuspendModalOpen(false);
      loadData();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const openSuspendModal = (id: string) => {
    setSuspendUserId(id);
    setSuspendModalOpen(true);
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
                           <Button size="sm" variant="destructive" onClick={() => openSuspendModal(u.id)}>Suspend</Button>
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
                     <td className="px-4 py-3">${d.amount} {d.currency}</td>
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
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="bg-[#141428] border-border text-white">
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-gray-300">
            Are you sure you want to suspend this user? They will lose access to their account.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSuspendUser}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
