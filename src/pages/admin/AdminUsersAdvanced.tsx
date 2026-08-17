import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Search, Filter, Shield, ShieldAlert, CheckCircle, XCircle, 
  UserCheck, UserX, Key, LogOut, FileText, Bell, Lock, Unlock, RefreshCw, 
  ChevronLeft, ChevronRight, MoreVertical, Edit3, DollarSign, ShoppingBag, 
  Globe, Phone, Mail, AlertTriangle, Eye, ArrowUpDown, Calendar, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AdminUsersAdvancedProps {
  token: string;
}

export function AdminUsersAdvanced({ token }: AdminUsersAdvancedProps) {
  // State for user list
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<any>({});
  
  // Filters & Controls
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Selected User Detail Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'account' | 'orders' | 'payments' | 'wallet' | 'activity' | 'security'>('profile');

  // Action Confirmation Modals State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'ban' | 'suspend' | 'verify' | 'logout' | 'reset' | null;
    user: any;
    data?: any;
  }>({ open: false, type: null, user: null });

  // Action Inputs State
  const [editForm, setEditForm] = useState<any>({});
  const [internalNote, setInternalNote] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetPassResult, setResetPassResult] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        status: statusFilter,
        verification: verificationFilter,
        kycStatus: kycFilter,
        filterTab: activeTab,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      });

      const res = await fetch(`/api/admin/users/advanced?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
      setCounts(data.counts || {});
    } catch (err: any) {
      toast.error(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, activeTab, roleFilter, statusFilter, verificationFilter, kycFilter, sortBy, sortOrder, page, limit]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch full user detail drawer
  const openUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setModalTab('profile');
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch user details");
      const data = await res.json();
      setUserDetail(data);
      setEditForm({
        name: data.profile?.name || '',
        username: data.profile?.username || '',
        email: data.profile?.email || '',
        phone_number: data.profile?.phone_number || '',
        country: data.profile?.country || 'US',
        role: data.profile?.role || 'user',
        commission_rate: data.wallet?.commission_rate || 0.25
      });
      setInternalNote(data.account?.admin_notes || '');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Perform User Action
  const handleUserAction = async (actionType: string, payload: any = {}) => {
    if (!selectedUserId && !confirmDialog.user?.id) return;
    const targetId = selectedUserId || confirmDialog.user?.id;

    try {
      const res = await fetch(`/api/admin/users/${targetId}/${actionType}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Action failed");
      }

      const result = await res.json();
      toast.success(result.message || "Action completed successfully");

      if (actionType === 'password-reset') {
        setResetPassResult(result.temporary_password);
      } else {
        setConfirmDialog({ open: false, type: null, user: null });
      }

      // Refresh list & detail view
      fetchUsers();
      if (selectedUserId) openUserDetail(selectedUserId);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 50) return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30">HIGH ({score})</span>;
    if (score >= 20) return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MED ({score})</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LOW ({score})</span>;
  };

  const getKycBadge = (status: string) => {
    if (status === 'verified') return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400">Verified</span>;
    if (status === 'pending') return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400">Pending</span>;
    if (status === 'rejected') return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400">Rejected</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-gray-500/20 text-gray-400">None</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/40">
        {[
          { id: 'all', label: 'All Users', count: counts.all },
          { id: 'buyers', label: 'Buyers', count: counts.buyers },
          { id: 'sellers', label: 'Sellers', count: counts.sellers },
          { id: 'admins', label: 'Admins', count: counts.admins },
          { id: 'active', label: 'Active', count: counts.active },
          { id: 'suspended', label: 'Suspended', count: counts.suspended },
          { id: 'banned', label: 'Banned', count: counts.banned },
          { id: 'pending_verification', label: 'Pending Verification', count: counts.pending_verification }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30'
                : 'bg-[#141428]/60 text-muted-foreground border border-border/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Control Toolbar */}
      <div className="bg-[#141428]/80 backdrop-blur-md p-4 rounded-2xl border border-border flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by ID, name, email, username, phone, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-black/40 border-gray-800 text-white text-xs h-10 rounded-xl"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Role: All</option>
            <option value="buyer">Buyers Only</option>
            <option value="seller">Sellers Only</option>
            <option value="admin">Admins Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>

          <select
            value={kycFilter}
            onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">KYC: All</option>
            <option value="verified">KYC Verified</option>
            <option value="pending">KYC Pending</option>
            <option value="rejected">KYC Rejected</option>
            <option value="none">No KYC</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/40 border border-gray-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="created_at">Sort: Join Date</option>
            <option value="spending">Sort: Total Spending</option>
            <option value="orders">Sort: Orders Count</option>
            <option value="risk_score">Sort: Risk Score</option>
            <option value="name">Sort: Name</option>
            <option value="last_login">Sort: Last Login</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="border-gray-800 text-xs h-9 px-3"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            {sortOrder.toUpperCase()}
          </Button>

          <Button
            size="sm"
            onClick={() => fetchUsers()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Reload
          </Button>
        </div>
      </div>

      {/* Main Users Table */}
      <Card className="bg-[#141428]/80 backdrop-blur-xl border-border overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0A0A0F] text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/50 font-mono">
              <tr>
                <th className="px-5 py-3.5">User Info</th>
                <th className="px-5 py-3.5">Type / Role</th>
                <th className="px-5 py-3.5">Contact & Location</th>
                <th className="px-5 py-3.5">KYC & Status</th>
                <th className="px-5 py-3.5">Orders & Spend</th>
                <th className="px-5 py-3.5">Risk Score</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white uppercase text-xs shadow-md">
                        {u.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                          {u.name}
                          {u.is_verified ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : null}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          @{u.username} • <span className="text-gray-500">{u.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' || u.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      u.role === 'seller' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-white text-xs">{u.email}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{u.phone_number || 'No phone'}</span>
                      <span>•</span>
                      <span className="font-mono">{u.country}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 space-y-1">
                    <div className="flex items-center gap-2">
                      {getKycBadge(u.kyc_status)}
                      {u.is_banned ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400">Banned</span>
                      ) : u.is_suspended ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400">Suspended</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400">Active</span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-xs">{u.orders_count || 0} Orders</div>
                    <div className="text-[11px] text-emerald-400 font-mono">${(u.total_spending || 0).toFixed(2)} spent</div>
                  </td>

                  <td className="px-5 py-4">
                    {getRiskScoreBadge(u.risk_score || 0)}
                  </td>

                  <td className="px-5 py-4 text-[11px] font-mono text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUserDetail(u.id)}
                        className="h-8 border-indigo-500/30 hover:bg-indigo-500/20 text-xs px-2.5 text-indigo-300"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDialog({ open: true, type: u.is_banned ? 'ban' : 'ban', user: u })}
                        className={`h-8 text-xs ${u.is_banned ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-rose-400 hover:bg-rose-500/20'}`}
                      >
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No matching users found for current filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-border/50 bg-[#0A0A0F] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-mono">
            Showing Page <span className="text-white font-bold">{pagination.page}</span> of{' '}
            <span className="text-white font-bold">{pagination.totalPages}</span> ({pagination.total} total users)
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-4 text-xs">
              <span className="text-muted-foreground">Per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-black/50 border border-gray-800 text-white rounded px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="h-8 border-gray-800 text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-8 border-gray-800 text-xs"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* USER DETAIL MODAL / DRAWER */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="bg-[#141428] border border-indigo-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
                  {userDetail?.profile?.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {userDetail?.profile?.name}
                    {userDetail?.account?.is_verified && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    @{userDetail?.profile?.username} • ID: {userDetail?.profile?.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRiskScoreBadge(userDetail?.security?.risk_score || 0)}
              </div>
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="p-12 text-center text-muted-foreground font-mono">
              Loading user profile payload...
            </div>
          ) : userDetail ? (
            <div className="space-y-6 pt-2">
              {/* Modal Tabs Header */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/40 scrollbar-none">
                {[
                  { id: 'profile', label: 'Profile' },
                  { id: 'account', label: 'Account' },
                  { id: 'orders', label: `Orders (${userDetail.orders?.length || 0})` },
                  { id: 'payments', label: 'Payments & Payouts' },
                  { id: 'wallet', label: 'Wallet & Earnings' },
                  { id: 'activity', label: 'Activity Logs' },
                  { id: 'security', label: 'Security & Risk' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setModalTab(t.id as any)}
                    className={`text-xs font-bold px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                      modalTab === t.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-muted-foreground hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PROFILE EDIT */}
              {modalTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
                      <Input
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-black/50 border-gray-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Username</label>
                      <Input
                        value={editForm.username}
                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                        className="bg-black/50 border-gray-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Email</label>
                      <Input
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-black/50 border-gray-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Phone Number</label>
                      <Input
                        value={editForm.phone_number}
                        onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="bg-black/50 border-gray-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Country</label>
                      <Input
                        value={editForm.country}
                        onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                        className="bg-black/50 border-gray-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Role</label>
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full bg-black/50 border border-gray-800 text-white text-xs rounded-md p-2"
                      >
                        <option value="user">User / Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleUserAction('edit', editForm)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    >
                      Save Profile Updates
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCOUNT */}
              {modalTab === 'account' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block">Login Provider:</span>
                      <span className="text-white font-bold uppercase">{userDetail.account?.provider}</span>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block">Joined On:</span>
                      <span className="text-white font-bold">{new Date(userDetail.account?.created_at).toLocaleString()}</span>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block">Last Login IP:</span>
                      <span className="text-emerald-400 font-mono font-bold">{userDetail.account?.last_login_ip}</span>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                      <span className="text-muted-foreground block">Verification Badge:</span>
                      <span className={userDetail.account?.is_verified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {userDetail.account?.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>
                  </div>

                  {/* Internal Admin Note */}
                  <div className="bg-[#0A0A0F] p-4 rounded-xl border border-border/50 space-y-2">
                    <label className="text-xs font-bold text-indigo-300 block">Internal Admin Note</label>
                    <textarea
                      rows={3}
                      value={internalNote}
                      onChange={e => setInternalNote(e.target.value)}
                      placeholder="Add confidential admin observations..."
                      className="w-full bg-black/60 border border-gray-800 text-white text-xs p-2.5 rounded-lg"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => handleUserAction('note', { note: internalNote })} className="bg-indigo-600 text-xs">
                        Save Internal Note
                      </Button>
                    </div>
                  </div>

                  {/* Send In-App Notification */}
                  <div className="bg-[#0A0A0F] p-4 rounded-xl border border-border/50 space-y-2">
                    <label className="text-xs font-bold text-cyan-300 block">Send Custom Notification / Email Alert</label>
                    <Input
                      value={notificationMsg}
                      onChange={e => setNotificationMsg(e.target.value)}
                      placeholder="Type alert message to send to user..."
                      className="bg-black/60 border-gray-800 text-white text-xs"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => { handleUserAction('notify', { message: notificationMsg }); setNotificationMsg(''); }} className="bg-cyan-600 text-xs">
                        Send Notification
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDERS */}
              {modalTab === 'orders' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-indigo-300">Purchases & Orders</h4>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-black/60 font-mono text-muted-foreground">
                        <tr>
                          <th className="p-2">Order ID</th>
                          <th className="p-2">Product</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {userDetail.orders?.map((o: any) => (
                          <tr key={o.id}>
                            <td className="p-2 font-mono text-muted-foreground">{o.id}</td>
                            <td className="p-2 font-medium text-white">{o.product_title || 'Item'}</td>
                            <td className="p-2 text-emerald-400 font-bold">${o.amount?.toFixed(2)}</td>
                            <td className="p-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="p-2 uppercase font-bold text-xs text-emerald-400">{o.status}</td>
                          </tr>
                        ))}
                        {(!userDetail.orders || userDetail.orders.length === 0) && (
                          <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No purchases recorded</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENTS & PAYOUTS */}
              {modalTab === 'payments' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-cyan-300">Payout Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userDetail.payoutMethods?.map((m: any) => (
                      <div key={m.id} className="p-3 bg-black/40 border border-gray-800 rounded-lg text-xs">
                        <span className="font-bold text-white uppercase">{m.method_type}</span>
                        <div className="text-muted-foreground mt-1">{m.details}</div>
                      </div>
                    ))}
                    {(!userDetail.payoutMethods || userDetail.payoutMethods.length === 0) && (
                      <div className="text-xs text-muted-foreground">No saved payout methods</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: WALLET */}
              {modalTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/20">
                      <span className="text-xs text-muted-foreground block">Seller Wallet Balance</span>
                      <span className="text-2xl font-bold text-emerald-400">${userDetail.wallet?.seller_balance?.toFixed(2)}</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/20">
                      <span className="text-xs text-muted-foreground block">Commission Rate</span>
                      <span className="text-2xl font-bold text-indigo-400">{((userDetail.wallet?.commission_rate || 0.25) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ACTIVITY */}
              {modalTab === 'activity' && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {userDetail.activity?.map((a: any) => (
                    <div key={a.id} className="p-2.5 bg-black/40 border border-gray-800 rounded-lg text-xs">
                      <span className="font-bold text-indigo-300 block">{a.title}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                  {(!userDetail.activity || userDetail.activity.length === 0) && (
                    <div className="text-xs text-muted-foreground">No recent activity logs</div>
                  )}
                </div>
              )}

              {/* TAB 7: SECURITY & ACTIONS */}
              {modalTab === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#0A0A0F] rounded-xl border border-rose-500/30 space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Administrative Control Actions
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Executing these actions will immediately modify user security credentials or system access and append an entry to audit logs.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction('verify', { is_verified: !userDetail.account?.is_verified })}
                        className="border-indigo-500/40 text-indigo-300 text-xs"
                      >
                        {userDetail.account?.is_verified ? 'Revoke Verification' : 'Verify User'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction('suspend', { is_suspended: !userDetail.account?.is_suspended })}
                        className="border-amber-500/40 text-amber-300 text-xs"
                      >
                        {userDetail.account?.is_suspended ? 'Unsuspend User' : 'Suspend Account'}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUserAction('ban', { is_banned: !userDetail.account?.is_banned })}
                        className="text-xs"
                      >
                        {userDetail.account?.is_banned ? 'Unban User' : 'Ban Account'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction('force-logout')}
                        className="border-rose-500/40 text-rose-300 text-xs"
                      >
                        Force Logout & Revoke Sessions
                      </Button>
                    </div>
                  </div>

                  {/* Reset Password */}
                  <div className="p-4 bg-[#0A0A0F] rounded-xl border border-border/50 space-y-2">
                    <h4 className="text-xs font-bold text-white">Reset User Password</h4>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="New temporary password (or leave blank to auto-generate)"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="bg-black/60 border-gray-800 text-white text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUserAction('password-reset', { new_password: newPassword })}
                        className="bg-indigo-600 text-xs"
                      >
                        Reset Password
                      </Button>
                    </div>

                    {resetPassResult && (
                      <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded mt-2">
                        Temporary Password Set: <strong>{resetPassResult}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ open: false, type: null, user: null })}>
        <DialogContent className="bg-[#141428] border border-rose-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-400">
              Confirm Action: {confirmDialog.type?.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground">
            Are you sure you want to perform <strong>{confirmDialog.type}</strong> on user{' '}
            <strong className="text-white">{confirmDialog.user?.name}</strong> ({confirmDialog.user?.email})?
            This operation will be logged to audit security records.
          </div>
          <DialogFooter>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDialog({ open: false, type: null, user: null })}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirmDialog.type === 'ban') {
                  handleUserAction('ban', { is_banned: !confirmDialog.user?.is_banned });
                }
              }}
            >
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
