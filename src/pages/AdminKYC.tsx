import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, ShieldAlert, FileText, RefreshCw, CheckCircle, XCircle, AlertCircle, HelpCircle, Eye } from "lucide-react";
import { Seller360DetailModal } from "@/components/admin/Seller360DetailModal";

export function AdminKYC() {
  const [activeTab, setActiveTab] = useState('pending');
  const [kycRecords, setKycRecords] = useState<any[]>([]);
  const { token } = useAuth();
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("Blurry");
  const [adminNotes, setAdminNotes] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [kycSlaHours, setKycSlaHours] = useState("72");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.kyc_sla_hours) {
          setKycSlaHours(String(data.settings.kyc_sla_hours));
        }
      }
    } catch (e) {
      console.warn("Fetch settings error:", e);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_sla_hours: kycSlaHours })
      });
      if (res.ok) {
        toast.success("KYC SLA & Policy Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    }
  };

  const fetchKYC = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/advanced/kyc/advanced?tab=${activeTab}&search=${encodeURIComponent(search)}&page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKycRecords(data.records || []);
        setTabCounts(data.tabCounts || {});
        setPagination(data.pagination || { page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
      }
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    } else {
      fetchKYC();
    }
  }, [token, activeTab, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchKYC();
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/advanced/kyc/${id}/action`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: rejectReason, admin_notes: adminNotes })
      });
      if (!res.ok) throw new Error("Failed to execute KYC action");
      const data = await res.json();
      toast.success(data.message || `KYC status updated to ${action}`);
      fetchKYC();
      setSelectedKyc(null);
      setAdminNotes("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this seller KYC application?")) return;
    try {
      const res = await fetch(`/api/admin/kyc/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
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
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 font-sans text-sm shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">KYC Verification & Identity Portal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Review seller identity documents, tax registrations, and bank verification queues</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchKYC} className="gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* KYC Sub Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/10">
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved (Verified)' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'requires_info', label: 'Requires Information' },
          { id: 'resubmission', label: 'Resubmission' },
          { id: 'expired', label: 'Expired' },
          { id: 'settings', label: 'Verification Settings' }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => { setActiveTab(subTab.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === subTab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {subTab.label}
            {tabCounts[subTab.id] !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-300">
                {tabCounts[subTab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Verification Settings View */}
      {activeTab === 'settings' ? (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-6 max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-white mb-2">Platform KYC Policy Settings</h3>
          <div className="space-y-3 text-xs text-gray-300">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <div className="font-bold text-white">Require KYC for Seller Withdrawals</div>
                <div className="text-muted-foreground text-[11px]">Sellers must be KYC verified before releasing payout requests.</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <div className="font-bold text-white">Auto-Flag High Risk Identity Submissions</div>
                <div className="text-muted-foreground text-[11px]">Route submissions with risk score &gt; 50% to step-up admin review.</div>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500" />
            </div>
            <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-2">
              <div className="font-bold text-white">KYC Review SLA Countdown Target (Hours)</div>
              <div className="text-muted-foreground text-[11px] mb-1">
                Configurable review window displayed on the seller's approval pending banner (e.g. 24, 48, 72, 96 hours).
              </div>
              <select 
                value={kycSlaHours} 
                onChange={(e) => setKycSlaHours(e.target.value)}
                className="w-full bg-[#141428] border border-border rounded px-3 py-2 text-xs text-white"
              >
                <option value="24">24 Hours (1 Day Express Review)</option>
                <option value="48">48 Hours (2 Days Fast Track)</option>
                <option value="72">72 Hours (3 Days Standard SLA)</option>
                <option value="96">96 Hours (4 Days Extended SLA)</option>
                <option value="120">120 Hours (5 Days Full Review)</option>
              </select>
            </div>
            <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-2">
              <div className="font-bold text-white">Document Retention Policy</div>
              <select className="w-full bg-[#141428] border border-border rounded px-3 py-2 text-xs text-white">
                <option value="90">90 Days Post-Verification Encrypted Storage</option>
                <option value="180">180 Days Post-Verification Encrypted Storage</option>
                <option value="365">1 Year Retention (Tax Compliant)</option>
              </select>
            </div>
          </div>
          <Button size="sm" onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            Save Verification Settings
          </Button>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Applicant, Seller ID, Email or Tax ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#101020] border border-border/50 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
              />
            </div>
          </form>

          {/* Table + Inspector Split View */}
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono text-indigo-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Applicant & Seller ID</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Payout Method</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                  {kycRecords.map((k) => (
                    <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{k.display_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{k.user_email || k.user_email_account}</div>
                        <div className="text-[9px] font-mono text-indigo-400/80">ID: {k.user_id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono uppercase text-gray-300">{k.country || k.user_country || 'US'}</td>
                      <td className="py-3 px-4 uppercase text-xs font-mono">{k.payout_method || 'Bank Transfer'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                          (k.risk_score || 15) > 50 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {k.risk_score || 15}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          k.kyc_status === 'verified' || k.kyc_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          k.kyc_status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          k.kyc_status === 'requires_info' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {k.kyc_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedKyc(k); setAdminNotes(k.admin_notes || ""); }} className="h-7 text-[10px] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20">
                          Inspect & Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {kycRecords.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground font-mono">
                        No seller KYC records found for tab "{activeTab}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs font-mono text-muted-foreground">
                <div>
                  Showing {kycRecords.length} of {pagination.totalRecords} records (Page {pagination.page} of {pagination.totalPages})
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-7 text-xs border-border"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-7 text-xs border-border"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Render 360° Seller Detail Modal */}
            {selectedKyc && (
              <Seller360DetailModal
                sellerId={selectedKyc.id || selectedKyc.user_id}
                onClose={() => setSelectedKyc(null)}
                onRefreshList={fetchKYC}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
