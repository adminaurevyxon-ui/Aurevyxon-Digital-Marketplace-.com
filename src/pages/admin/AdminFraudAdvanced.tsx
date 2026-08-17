import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Zap, Lock, Sliders, CheckCircle2, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminFraudAdvancedProps {
  token: string;
}

export function AdminFraudAdvanced({ token }: AdminFraudAdvancedProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchFraudData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/advanced/fraud/advanced", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setRules(data.rules || []);
        setEvaluations(data.evaluations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, [token]);

  const toggleRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/admin/advanced/fraud/rules/${ruleId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to toggle fraud rule");
      toast.success("Fraud rule state updated");
      fetchFraudData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUserFraudAction = async (userId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/advanced/fraud/user-action", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason: "Admin Security Review" })
      });
      if (!res.ok) throw new Error("Action failed");
      toast.success(`Executed ${action} on target user`);
      fetchFraudData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl font-sans text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Autonomous Risk & Fraud Engine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Server-computed risk scores, automated rule enforcement, security signal evaluation</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchFraudData} className="gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/10">
        {[
          { id: 'dashboard', label: 'Risk Alerts & High Risk Users' },
          { id: 'rules', label: 'Fraud Rule Engine' },
          { id: 'evaluations', label: 'Execution & Signals History' }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveTab(subTab.id)}
            className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === subTab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Risk Alerts & High Risk Users */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-[#101020] border border-border/50 rounded-xl p-4 overflow-x-auto">
            <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> High Risk User Accounts (Server Computed)
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono text-indigo-300 uppercase">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Disputes</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Restrict & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                {alerts.map((a) => (
                  <tr key={a.user_id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{a.user_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{a.user_email}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-red-400">{a.fraud_score}%</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{a.dispute_count || 0}</td>
                    <td className="py-2.5 px-3">
                      {a.is_suspended ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30">Suspended</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => handleUserFraudAction(a.user_id, 'mark_safe')} className="h-6 text-[10px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2">
                          Mark Safe
                        </Button>
                        {!a.is_suspended ? (
                          <Button size="sm" onClick={() => handleUserFraudAction(a.user_id, 'suspend')} className="h-6 text-[10px] bg-red-600 hover:bg-red-700 text-white px-2">
                            Suspend
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleUserFraudAction(a.user_id, 'unsuspend')} className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2">
                            Unsuspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground font-mono">
                      No high risk user security alerts detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fraud Rule Engine */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-[#101020] border border-border/50 rounded-xl p-5">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" /> Active Automated Fraud Rules
            </h3>
            <div className="space-y-3">
              {rules.map((r) => (
                <div key={r.id} className="p-4 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {r.name}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${r.is_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {r.is_enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      Condition: <span className="text-indigo-300">{r.condition_type} &gt; {r.threshold}</span> ➔ Action: <span className="text-amber-400">{r.action}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRule(r.id)}
                    className={`h-7 text-xs ${r.is_enabled ? 'border-amber-500/40 text-amber-300' : 'border-emerald-500/40 text-emerald-300'}`}
                  >
                    {r.is_enabled ? 'Disable Rule' : 'Enable Rule'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Execution History */}
      {activeTab === 'evaluations' && (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-5">
          <h3 className="font-bold text-white text-sm mb-3">Recent Fraud Evaluation Records</h3>
          <div className="space-y-2">
            {evaluations.map((ev) => (
              <div key={ev.id} className="p-3 bg-black/20 border border-white/5 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{ev.target_name || ev.target_id}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{ev.created_at}</div>
                </div>
                <div className="font-mono text-indigo-300 font-bold">Risk: {ev.risk_score}%</div>
                <div className="font-mono uppercase text-amber-400 font-bold">{ev.decision}</div>
              </div>
            ))}
            {evaluations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground font-mono">No evaluation logs recorded yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
