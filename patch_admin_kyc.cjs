const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminKYC.tsx', 'utf8');

const newAdminKYC = `import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AdminKYC() {
  const [kycRecords, setKycRecords] = useState<any[]>([]);
  const { token } = useAuth();
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchKYC = () => {
    fetch("/api/admin/kyc", { headers: { Authorization: \`Bearer \${token}\` }})
      .then(r => r.json())
      .then(d => setKycRecords(d.kycRecords || []));
  };

  useEffect(() => { fetchKYC(); }, [token]);

  const handleUpdate = async (id: string, status: string) => {
    if (status === 'rejected' && !rejectReason.trim()) {
        toast.error("You must provide a rejection reason.");
        return;
    }
    try {
      const res = await fetch(\`/api/admin/kyc/\${id}/status\`, {
        method: "POST",
        headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: status === 'rejected' ? rejectReason : '' })
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast(\`Seller \${status} successfully\`);
      fetchKYC();
      setSelectedKyc(null);
      setRejectReason("");
    } catch(e: any) {
      toast(e.message);
    }
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm("Are you sure you want to permanently delete this seller application?")) return;
      try {
          const res = await fetch(\`/api/admin/kyc/\${id}\`, {
              method: "DELETE",
              headers: { Authorization: \`Bearer \${token}\` }
          });
          if (!res.ok) throw new Error("Failed to delete application");
          toast.success("Application deleted");
          fetchKYC();
          setSelectedKyc(null);
      } catch (e: any) {
          toast.error(e.message);
      }
  };

  const maskDetails = (details: string) => {
      if (!details) return "N/A";
      if (details.length <= 4) return details;
      return "•••• " + details.slice(-4);
  };

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-4">Seller Review Queue</h2>
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="text-xs uppercase bg-black/40 text-foreground dark:text-white">
            <tr>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {kycRecords.map((k) => (
              <tr key={k.id} className="border-b border-border hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                   <div className="font-medium text-white">{k.display_name}</div>
                   <div className="text-xs">{k.user_email}</div>
                </td>
                <td className="px-4 py-3 uppercase text-xs">{k.payout_method}</td>
                <td className="px-4 py-3">
                  <span className={\`px-2 py-1 rounded text-xs \${
                    k.kyc_status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 
                    k.kyc_status === 'verified' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                  }\`}>
                    {k.kyc_status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedKyc(k); setRejectReason(k.admin_notes || ""); }}>
                    Review
                  </Button>
                </td>
              </tr>
            ))}
            {kycRecords.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">No pending applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedKyc && (
        <div className="w-full md:w-[400px] border-l border-border pl-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">Review Details</h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedKyc(null)}>✕</Button>
          </div>
          <div className="bg-black/20 p-4 rounded-lg mb-4 text-sm text-gray-300 space-y-3 flex-1">
            <p><span className="text-muted-foreground block text-xs uppercase">Display Name</span> <span className="text-white font-medium">{selectedKyc.display_name}</span></p>
            <p><span className="text-muted-foreground block text-xs uppercase">Email</span> {selectedKyc.user_email}</p>
            <p><span className="text-muted-foreground block text-xs uppercase">Type</span> <span className="capitalize">{selectedKyc.seller_type}</span></p>
            <p><span className="text-muted-foreground block text-xs uppercase">PAN / ID</span> {selectedKyc.pan_number || "N/A"}</p>
            {selectedKyc.seller_type === 'business' && <p><span className="text-muted-foreground block text-xs uppercase">GSTIN</span> {selectedKyc.gstin || "N/A"}</p>}
            <hr className="border-border/30 my-2" />
            <p><span className="text-muted-foreground block text-xs uppercase">Payout Method</span> <span className="uppercase">{selectedKyc.payout_method}</span></p>
            <p><span className="text-muted-foreground block text-xs uppercase">Payout Account</span> <span className="font-mono text-emerald-400">{maskDetails(selectedKyc.payout_details)}</span></p>
          </div>
          
          <div className="space-y-3">
              <input 
                 type="text" 
                 placeholder="Reason (Required for Reject)" 
                 className="w-full bg-[#111422] border border-gray-800 rounded-md px-3 py-2 text-sm text-white"
                 value={rejectReason}
                 onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUpdate(selectedKyc.id, 'verified')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Approve
                </Button>
                <Button 
                  onClick={() => handleUpdate(selectedKyc.id, 'rejected')}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Reject
                </Button>
              </div>
              <Button 
                  onClick={() => handleDelete(selectedKyc.id)}
                  variant="outline"
                  className="w-full border-red-900 text-red-500 hover:bg-red-950"
              >
                  Delete Application
              </Button>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/AdminKYC.tsx', newAdminKYC);
