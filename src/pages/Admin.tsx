import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Users, DollarSign, Activity, FileCode, CheckCircle, XCircle, Shield, Server, Zap, Globe, Cpu, AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminAuditLogs } from "./AdminAuditLogs";
import { AdminSupportTickets } from "./AdminSupportTickets";
import { AdminKYC } from "./AdminKYC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';


import { AdminFraud } from "./admin/AdminFraud";
import { AdminFraudAdvanced } from "./admin/AdminFraudAdvanced";
import { AdminCMSAdvanced } from "./admin/AdminCMSAdvanced";
import { AdminReportsAdvanced } from "./admin/AdminReportsAdvanced";
import { AdminSupportAdvanced } from "./admin/AdminSupportAdvanced";
import { AdminSystemAdvanced } from "./admin/AdminSystemAdvanced";
import { AdminSecurityAdvanced } from "./admin/AdminSecurityAdvanced";
import { AdminSettingsAdvanced } from "./admin/AdminSettingsAdvanced";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminUsersAdvanced } from "./admin/AdminUsersAdvanced";
import { AdminProducts } from "./admin/AdminProducts";
import { AdminTransactions } from "./admin/AdminTransactions";
import { AdminPayouts } from "./admin/AdminPayouts";

const ALLOWED_ADMIN_EMAILS = ["jagannathsing777@gmail.com", "admin.aurevyxon@gmail.com"];

export default function Admin() {
    const { user, isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [refundTxId, setRefundTxId] = useState("");
    const [refundReason, setRefundReason] = useState("");

    const [commissionModalOpen, setCommissionModalOpen] = useState(false);
    const [commissionUserId, setCommissionUserId] = useState("");
    const [commissionRate, setCommissionRate] = useState("");

    const openRefundModal = (id: string) => {
      setRefundTxId(id);
      setRefundReason("");
      setRefundModalOpen(true);
    };

    const confirmRefund = async () => {
      if (!refundReason) return;
      try {
        const res = await fetch(`/api/admin/transactions/${refundTxId}/refund`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ reason: refundReason })
        });
        if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Refund failed"); }
        toast("Transaction refunded successfully");
        setRefundModalOpen(false);
        fetch("/api/admin/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(d=>setTransactions(d.transactions)).catch(e => console.warn(e));
      } catch (err: any) { toast(err.message); }
    };
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [systemStats, setSystemStats] = useState<any>(null);
    const [platformSettings, setPlatformSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [txSearch, setTxSearch] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [activeTab, setActiveTab] = useState('overview');

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleGlobalSearch = async (q: string) => {
    setGlobalSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/advanced/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsSearching(false);
    }
  };

    useEffect(() => {
        if (!isAuthenticated) return navigate("/");
        if (!user?.email || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
          toast.error("Unauthorized: Admin Panel access is strictly locked to authorized admin emails");
          return navigate("/");
        }
        if (!token) return;

        Promise.all([
            fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/admin/transactions", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/admin/payouts", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/admin/listings", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/admin/system", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
        ])
        .then(responses => Promise.all(responses.map(res => safeJson(res))))
        .then(([statsData, txData, payoutData, usersData, listingsData, systemData, settingsData]) => {
            setStats(statsData);
            setTransactions(txData.transactions || []);
            setPayouts(payoutData.payouts || []);
            setUsers(usersData.users || []);
            setListings(listingsData.listings || []);
            setSystemStats(systemData || null);
            setPlatformSettings(settingsData.settings || {});
        })
        .catch(e => console.warn(e))
        .finally(() => setLoading(false));

    }, [isAuthenticated, user, navigate, token]);

  const maskDetails = (details: string) => {
      if (!details) return "N/A";
      if (details.length <= 4) return details;
      return "•••• " + details.slice(-4);
  };
  
  const handlePayoutStatus = async (id: string, status: string) => {
     
     
     try {
       const res = await fetch(`/api/admin/payouts/${id}/status`, {
         method: "POST",
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "application/json"
         },
         body: JSON.stringify({ status })
       });
       if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Failed to update status"); }
       setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
     } catch (err: any) {
       toast(err.message);
     }
  };

  const openCommissionModal = (id: string) => {
    setCommissionUserId(id);
    setCommissionRate("");
    setCommissionModalOpen(true);
  };

  const confirmCommission = async () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate)) return;
    try {
       const res = await fetch(`/api/admin/users/${commissionUserId}/commission`, {
         method: "POST",
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "application/json"
         },
         body: JSON.stringify({ rate })
       });
       if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Update failed"); }
       setUsers(prev => prev.map(u => u.id === commissionUserId ? { ...u, commission_rate: rate } : u));
       setCommissionModalOpen(false);
       toast("Commission rate updated");
    } catch (err: any) {
       toast(err.message);
    }
  };

  const toggleUserStatus = async (id: string, field: string, currentValue: boolean) => {
     try {
       const res = await fetch(`/api/admin/users/${id}/status`, {
         method: "POST",
         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
         body: JSON.stringify({ [field]: !currentValue })
       });
       if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Update failed"); }
       setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: !currentValue } : u));
     } catch (err: any) { toast(err.message); }
  };

  const toggleListingStatus = async (id: string, field: string, currentValue: boolean) => {
     try {
       const res = await fetch(`/api/admin/listings/${id}/status`, {
         method: "POST",
         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
         body: JSON.stringify({ [field]: !currentValue })
       });
       if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Update failed"); }
       setListings(prev => prev.map(l => l.id === id ? { ...l, [field]: !currentValue } : l));
     } catch (err: any) { toast(err.message); }
  };

  const deleteListing = async (id: string) => {
     
     try {
       const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
       if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Delete failed"); }
       setListings(prev => prev.filter(l => l.id !== id));
     } catch (err: any) { toast(err.message); }
  };

  const saveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = Object.fromEntries(formData.entries());
    
    try {
      const res = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Failed to save settings"); }
      toast("Platform Settings Saved!");
    } catch (err: any) {
      toast(err.message);
    }
  };

  if (!isAuthenticated || !user || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
    return (
      <div id="admin-security-lockout" className="min-h-screen bg-[#06080F] flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
        <div id="admin-lockout-backdrop" className="absolute inset-0 bg-red-600/5 blur-[120px] pointer-events-none" />
        <div id="admin-lockout-card" className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-2xl relative z-10">
          <div id="admin-lockout-badge" className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          <div id="admin-lockout-text" className="space-y-2">
            <h2 id="admin-lockout-title" className="text-2xl font-extrabold tracking-tight text-white">Owner Security Lock</h2>
            <p id="admin-lockout-desc" className="text-slate-400 text-sm leading-relaxed">
              The AUREVYXON Admin Panel is strictly locked to Authorized Admin Emails (<span className="text-amber-400 font-mono font-semibold">jagannathsing777@gmail.com</span>, <span className="text-amber-400 font-mono font-semibold">admin.aurevyxon@gmail.com</span>).
            </p>
          </div>
          <div id="admin-lockout-status" className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 font-mono">
            UNAUTHORIZED_IDENTITY_BLOCKED :: Session Logged
          </div>
          <Button id="admin-lockout-return-btn" onClick={() => navigate("/")} className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-red-900/30">
            Return to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
         <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-[50px] opacity-20 rounded-full"></div>
            <div className="animate-spin w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0FF] selection:bg-indigo-500/30 font-sans pb-20 relative overflow-hidden">
       {/* Cyber Background */}
       <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen" />
       </div>

       <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Shield className="w-8 h-8 text-indigo-400" />
               <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                 OMEGA-NEXUS 
               </h1>
            </div>
            <p className="text-indigo-200/60 tracking-[0.2em] text-xs uppercase ml-11 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              God-Mode Command Center
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4 bg-muted border border-border px-4 py-2 rounded-xl backdrop-blur-md">
             <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400">GLOBAL CLUSTER: NOMINAL</span>
             </div>
             <div className="w-px h-4 bg-white/20 mx-2" />
             <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-400">EDGE NODES: ONLINE</span>
             </div>
          </div>
        </motion.div>

        {/* Global OMEGA Search Bar */}
        <div className="relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-indigo-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Global Search (Users, Sellers, Products, Orders, Transactions, KYC, Tickets, Fraud)..."
              value={globalSearchQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              className="w-full bg-[#101020]/90 border border-indigo-500/30 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-indigo-300/40 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 shadow-lg"
            />
            {isSearching && (
              <div className="absolute right-4 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#141428] border border-indigo-500/30 rounded-xl p-4 shadow-2xl z-50 max-h-[400px] overflow-y-auto space-y-4 font-sans text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="font-mono text-indigo-300 text-xs font-bold uppercase tracking-wider">Search Results</span>
                <button onClick={() => setSearchResults(null)} className="text-gray-400 hover:text-white">✕ Close</button>
              </div>

              {searchResults.users?.length > 0 && (
                <div>
                  <div className="text-indigo-400 font-bold uppercase mb-1">Users / Sellers ({searchResults.users.length})</div>
                  <div className="space-y-1">
                    {searchResults.users.map((u: any) => (
                      <div key={u.id} onClick={() => { setActiveTab('users'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-indigo-500/20 cursor-pointer flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white mr-2">{u.name}</span>
                          <span className="text-gray-400">{u.email}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase text-[10px]">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.products?.length > 0 && (
                <div>
                  <div className="text-purple-400 font-bold uppercase mb-1">Products ({searchResults.products.length})</div>
                  <div className="space-y-1">
                    {searchResults.products.map((p: any) => (
                      <div key={p.id} onClick={() => { setActiveTab('products'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-purple-500/20 cursor-pointer flex justify-between items-center">
                        <span className="font-bold text-white">{p.title}</span>
                        <span className="text-emerald-400 font-mono">${p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.transactions?.length > 0 && (
                <div>
                  <div className="text-emerald-400 font-bold uppercase mb-1">Transactions ({searchResults.transactions.length})</div>
                  <div className="space-y-1">
                    {searchResults.transactions.map((t: any) => (
                      <div key={t.id} onClick={() => { setActiveTab('transactions'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-emerald-500/20 cursor-pointer flex justify-between items-center">
                        <span className="font-mono text-gray-300">{t.id} - {t.product_title || 'Item'}</span>
                        <span className="text-emerald-400 font-bold">${t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.payouts?.length > 0 && (
                <div>
                  <div className="text-amber-400 font-bold uppercase mb-1">Payouts ({searchResults.payouts.length})</div>
                  <div className="space-y-1">
                    {searchResults.payouts.map((po: any) => (
                      <div key={po.id} onClick={() => { setActiveTab('payouts'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-amber-500/20 cursor-pointer flex justify-between items-center">
                        <span className="text-white">{po.user_name} ({po.method_type})</span>
                        <span className="text-amber-400 font-bold">${po.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.kyc?.length > 0 && (
                <div>
                  <div className="text-cyan-400 font-bold uppercase mb-1">KYC Applications ({searchResults.kyc.length})</div>
                  <div className="space-y-1">
                    {searchResults.kyc.map((k: any) => (
                      <div key={k.id} onClick={() => { setActiveTab('kyc'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-cyan-500/20 cursor-pointer flex justify-between items-center">
                        <span className="text-white">{k.display_name} ({k.user_email})</span>
                        <span className="text-cyan-300 uppercase">{k.kyc_status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.fraud?.length > 0 && (
                <div>
                  <div className="text-red-400 font-bold uppercase mb-1">Fraud Alerts ({searchResults.fraud.length})</div>
                  <div className="space-y-1">
                    {searchResults.fraud.map((f: any) => (
                      <div key={f.id} onClick={() => { setActiveTab('fraud'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-red-500/20 cursor-pointer flex justify-between items-center">
                        <span className="text-white">{f.type}: {f.description}</span>
                        <span className="text-red-400 font-bold uppercase">{f.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.tickets?.length > 0 && (
                <div>
                  <div className="text-blue-400 font-bold uppercase mb-1">Support Tickets ({searchResults.tickets.length})</div>
                  <div className="space-y-1">
                    {searchResults.tickets.map((st: any) => (
                      <div key={st.id} onClick={() => { setActiveTab('support'); setSearchResults(null); }} className="p-2 bg-white/5 rounded hover:bg-blue-500/20 cursor-pointer flex justify-between items-center">
                        <span className="text-white">{st.subject} ({st.user_name})</span>
                        <span className="text-blue-300 uppercase">{st.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!searchResults.users?.length && !searchResults.products?.length && !searchResults.transactions?.length && !searchResults.payouts?.length && !searchResults.kyc?.length && !searchResults.fraud?.length && !searchResults.tickets?.length) && (
                <div className="text-center py-4 text-gray-400">No matching records found across OMEGA-NEXUS database.</div>
              )}
            </div>
          )}
        </div>

        {/* Sub-Nav */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {['overview', 'users', 'kyc', 'products', 'transactions', 'payouts', 'fraud', 'support', 'cms', 'reports', 'system', 'security', 'settings'].map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={`uppercase text-xs font-bold tracking-widest px-6 py-3 rounded-lg transition-all whitespace-nowrap 
                 ${activeTab === tab 
                   ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                   : 'bg-white/[0.02] border border-border/20 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground dark:text-white'}`}
             >
               {tab}
             </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
           {activeTab === 'overview' && (
             <AdminOverview token={token || ''} onNavigateTab={(t) => setActiveTab(t)} />
           )}

           {activeTab === 'transactions' && (
             <AdminTransactions token={token || ''} />
           )}

           {activeTab === 'payouts' && (
             <AdminPayouts token={token || ''} />
           )}

           {activeTab === 'users' && (
         <AdminUsersAdvanced token={token || ''} />
       )}

       {activeTab === 'kyc' && (
         <AdminKYC />
       )}

       {activeTab === 'products' && (
         <AdminProducts token={token || ''} />
       )}

       {activeTab === 'support' && <AdminSupportAdvanced token={token || ''} />}
       {activeTab === 'fraud' && <AdminFraudAdvanced token={token || ''} />}
       {activeTab === 'cms' && <AdminCMSAdvanced token={token || ''} />}
       {activeTab === 'reports' && <AdminReportsAdvanced token={token || ''} />}

       {activeTab === 'system' && <AdminSystemAdvanced token={token || ''} />}
       {activeTab === 'security' && <AdminSecurityAdvanced token={token || ''} />}
       {activeTab === 'settings' && <AdminSettingsAdvanced token={token || ''} />}
        </motion.div>
      </AnimatePresence>
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="bg-[#141428] border-border text-white">
          <DialogHeader>
            <DialogTitle>Refund Transaction</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund"
              className="bg-black/50 border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRefund}>Confirm Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={commissionModalOpen} onOpenChange={setCommissionModalOpen}>
        <DialogContent className="bg-[#141428] border-border text-white">
          <DialogHeader>
            <DialogTitle>Adjust Commission Rate</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="e.g., 0.15 for 15% fee"
              className="bg-black/50 border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionModalOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={confirmCommission}>Update Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       </div>
    </div>
  );
}
