import React, { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "motion/react";
import { 
  DollarSign, Activity, Users, FileCode, CheckCircle, AlertTriangle, 
  Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, 
  Calendar, Layers, UserCheck, UserPlus, ShoppingBag, CreditCard, 
  LifeBuoy, FileText, Zap, Radio
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface AdminOverviewProps {
  token: string;
  onNavigateTab?: (tab: string) => void;
}

export function AdminOverview({ token, onNavigateTab }: AdminOverviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Controls state
  const [range, setRange] = useState<'today' | '7d' | '30d' | '90d' | '12mo' | 'custom'>('7d');
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOverview = async (showToast = false) => {
    if (!token) return;
    try {
      if (showToast) setRefreshing(true);
      const query = new URLSearchParams({
        range,
        groupBy,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      }).toString();

      const res = await fetch(`/api/admin/overview?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load overview data");
      const result = await safeJson(res);
      setData(result);
      if (showToast) toast.success("Overview stats updated live");
    } catch (err: any) {
      console.warn(err);
      toast.error(err.message || "Failed to fetch overview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // Auto refresh every 15 seconds for live online counter & feed
    const interval = setInterval(() => {
      fetchOverview(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [token, range, groupBy, startDate, endDate]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full" />
        <p className="text-sm font-mono text-indigo-300/80">Loading Real-Time Analytics Engine...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const chartData = data?.chartData || [];
  const feed = data?.liveActivityFeed || [];

  const pieColors = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];
  const orderPieData = [
    { name: 'Completed', value: metrics.ordersByStatus?.completed || 0 },
    { name: 'Pending', value: metrics.ordersByStatus?.pending || 0 },
    { name: 'Refunded', value: metrics.ordersByStatus?.refunded || 0 },
    { name: 'Cancelled', value: metrics.ordersByStatus?.cancelled || 0 },
    { name: 'Disputed', value: metrics.ordersByStatus?.disputed || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#141428]/90 backdrop-blur-xl border border-indigo-500/20 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">Live Command Monitor</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {metrics.onlineUsersCount || 1} ONLINE NOW
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Wired directly to Database • Auto-synced
            </p>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex bg-[#0A0A0F] border border-border p-1 rounded-xl">
            {(['today', '7d', '30d', '90d', '12mo', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  range === r 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {r === '12mo' ? '12 Months' : r}
              </button>
            ))}
          </div>

          <div className="flex bg-[#0A0A0F] border border-border p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  groupBy === g 
                    ? 'bg-cyan-600 text-white shadow-md' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            className="border-border hover:bg-indigo-500/20 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Custom Date Inputs if 'custom' selected */}
      {range === 'custom' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 bg-[#141428] border border-indigo-500/30 p-4 rounded-xl">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black/50 border-gray-800 text-white text-xs" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">End Date</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black/50 border-gray-800 text-white text-xs" />
          </div>
        </motion.div>
      )}

      {/* Primary Financial Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-[#141428]/80 backdrop-blur-xl border-border hover:border-indigo-400/50 transition-all shadow-lg group relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-indigo-300/70 tracking-wider mb-1 font-mono">Platform Revenue</p>
                <h3 className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow-md">
                  ${metrics.platformRevenue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
                </h3>
                <p className="text-[11px] text-indigo-200/60 mt-1 font-mono">
                  Net Cut: ${metrics.platformCommission?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141428]/80 backdrop-blur-xl border-border hover:border-emerald-400/50 transition-all shadow-lg group relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-300/70 tracking-wider mb-1 font-mono">Gross Volume</p>
                <h3 className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow-md">
                  ${metrics.grossVolume?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
                </h3>
                <p className="text-[11px] text-emerald-300/60 mt-1 font-mono">
                  Net: ${metrics.netRevenue?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141428]/80 backdrop-blur-xl border-border hover:border-cyan-400/50 transition-all shadow-lg group relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-cyan-300/70 tracking-wider mb-1 font-mono">Total Users</p>
                <h3 className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow-md">
                  {metrics.totalUsers?.toLocaleString() || "0"}
                </h3>
                <p className="text-[11px] text-cyan-300/60 mt-1 font-mono flex items-center gap-1">
                  <UserPlus className="w-3 h-3 text-emerald-400" />
                  +{metrics.newUsersToday || 0} New Today
                </p>
              </div>
              <div className="w-11 h-11 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5"/>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141428]/80 backdrop-blur-xl border-border hover:border-purple-400/50 transition-all shadow-lg group relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-purple-300/70 tracking-wider mb-1 font-mono">Seller Earnings</p>
                <h3 className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow-md">
                  ${metrics.sellerEarnings?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
                </h3>
                <p className="text-[11px] text-purple-300/60 mt-1 font-mono">
                  {metrics.sellersCount || 0} Registered Sellers
                </p>
              </div>
              <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5"/>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#141428]/60 border border-border/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] uppercase font-mono text-muted-foreground">Buyers / Sellers</span>
          <div className="mt-2 text-lg font-bold text-white flex items-center gap-1">
            <span className="text-indigo-400">{metrics.buyersCount || 0}</span>
            <span className="text-muted-foreground font-normal">/</span>
            <span className="text-purple-400">{metrics.sellersCount || 0}</span>
          </div>
        </div>

        <div className="bg-[#141428]/60 border border-border/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] uppercase font-mono text-muted-foreground">Total / Pending Products</span>
          <div className="mt-2 text-lg font-bold text-white flex items-center gap-1">
            <span className="text-emerald-400">{metrics.totalProducts || 0}</span>
            <span className="text-muted-foreground font-normal">/</span>
            <span className="text-amber-400">{metrics.pendingProducts || 0}</span>
          </div>
        </div>

        <div className="bg-[#141428]/60 border border-border/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] uppercase font-mono text-muted-foreground">Pending Payouts</span>
          <div className="mt-2 text-lg font-bold text-amber-400">
            ${metrics.pendingPayoutsAmount?.toFixed(2) || "0.00"}
            <span className="text-xs text-muted-foreground font-normal ml-1">({metrics.pendingPayoutsCount || 0})</span>
          </div>
        </div>

        <div className="bg-[#141428]/60 border border-border/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] uppercase font-mono text-muted-foreground">Refunds & Chargebacks</span>
          <div className="mt-2 text-lg font-bold text-rose-400">
            ${metrics.refundAmounts?.toFixed(2) || "0.00"}
          </div>
        </div>

        <div className="bg-[#141428]/60 border border-border/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] uppercase font-mono text-muted-foreground">Pending KYC & Tickets</span>
          <div className="mt-2 text-lg font-bold text-white flex items-center gap-1">
            <span className="text-amber-400">{metrics.pendingKYCCount || 0} KYC</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="text-cyan-400">{metrics.openTicketsCount || 0} Tkt</span>
          </div>
        </div>

        <div className="bg-[#141428]/60 border border-border/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] uppercase font-mono text-muted-foreground">Fraud Alerts</span>
          <div className="mt-2 text-lg font-bold text-rose-400 flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {metrics.fraudAlertsCount || 0} Alerts
          </div>
        </div>
      </div>

      {/* Analytics Charts & Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Financial Velocity Chart */}
        <Card className="lg:col-span-2 bg-[#141428]/90 border-border">
          <CardHeader className="border-b border-border/30 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold tracking-widest text-indigo-300 uppercase">
                Revenue & Gross Volume Trajectory
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">Grouped {groupBy} ({range})</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Commission
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Gross Volume
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f0f1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="grossVolume" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGross)" name="Gross Volume ($)" />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Commission ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Breakdown Pie Chart */}
        <Card className="bg-[#141428]/90 border-border flex flex-col">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-sm font-bold tracking-widest text-cyan-300 uppercase">
              Order Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center">
            {orderPieData.length > 0 ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f0f1d', border: '1px solid #333', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs font-mono">
                  {orderPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }}></span>
                      <span className="text-muted-foreground">{d.name}:</span>
                      <span className="text-white font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs font-mono">
                No orders recorded in database yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card className="bg-[#141428]/90 border-border">
        <CardHeader className="border-b border-border/30 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-sm font-bold tracking-widest text-white uppercase">
              Live Activity Stream (Real Platform Events)
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Showing last {feed.length} events
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
            {feed.map((item: any) => (
              <div 
                key={item.id}
                className="flex items-start justify-between p-3.5 bg-[#0D0D18] border border-border/40 rounded-xl hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border text-xs font-bold uppercase mt-0.5 ${
                    item.type === 'transaction' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    item.type === 'payout' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    item.type === 'user' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                    item.type === 'ticket' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                    item.type === 'refund' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  }`}>
                    {item.type}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {item.relatedId && onNavigateTab && (
                    <button 
                      onClick={() => onNavigateTab(item.type === 'user' ? 'users' : item.type === 'payout' ? 'payouts' : 'transactions')}
                      className="text-[10px] text-indigo-400 hover:underline font-mono mt-0.5"
                    >
                      View Record →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {feed.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No activity records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
