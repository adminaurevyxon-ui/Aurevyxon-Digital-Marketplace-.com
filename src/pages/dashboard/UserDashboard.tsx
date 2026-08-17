import React, { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ReviewModal } from "@/components/ReviewModal";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, User, Shield, CreditCard, ShoppingBag, Download, Heart, Ticket, Settings, LogOut, Bell, History, Upload, Trash2, Camera, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateUniversalProfile, validateProfileImage } from "@/lib/storageService";

export default function UserDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, ticketsRes, reviewsRes] = await Promise.all([
        fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/tickets", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/user/reviews", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const checkJson = async (res: Response) => {
          if (!res.ok) {
              if (res.status === 401 || res.status === 403) return {};
              throw new Error(`Request failed with status ${res.status}`);
          }
          const text = await res.text();
          try {
              return JSON.parse(text);
          } catch(e) {
              console.error("Failed to parse JSON for", res.url, text.substring(0, 100));
              return {};
          }
      };

      const dash = await checkJson(dashRes);
      const tickets = await checkJson(ticketsRes);
      const reviews = await checkJson(reviewsRes);
      const wishlistRes = await fetch("/api/wishlists", { headers: { Authorization: `Bearer ${token}` } });
      const wishlist = await checkJson(wishlistRes);

      setDashboardData({ ...dash, tickets: tickets.tickets, reviews: reviews.reviews, wishlist: wishlist.wishlists || wishlist.items });
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "purchases", label: "My Purchases", icon: ShoppingBag },
    { id: "downloads", label: "Downloads & Licenses", icon: Download },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "tickets", label: "Support Tickets", icon: Ticket },
    { id: "billing", label: "Billing & Invoices", icon: CreditCard },
    { id: "profile", label: "Edit Profile", icon: User },
    { id: "security", label: "Security & 2FA", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  if (false) {
    return <div className="pt-32 pb-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background flex flex-col">
      <div className="container mx-auto px-4 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-4 sticky top-28">
            <div className="flex items-center gap-3 mb-6 p-2">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg border border-indigo-500/30 shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name || "User Avatar"} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || "U"
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-white leading-tight truncate">{user?.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-500/20 text-indigo-400 font-medium border border-indigo-500/30' 
                        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                    {tab.label}
                  </button>
                );
              })}
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
              {activeTab === 'purchases' && <PurchasesTab data={dashboardData} loading={loading} />}
              {activeTab === 'profile' && <ProfileTab user={user} token={token} />}
              {activeTab === 'security' && <SecurityTab user={user} token={token} />}
              {activeTab === 'tickets' && <TicketsTab data={dashboardData} token={token} />}
              {activeTab === 'downloads' && <DownloadsTab data={dashboardData} token={token} />}
              {activeTab === 'wishlist' && <WishlistTab data={dashboardData} loading={loading} />}
              {activeTab === 'billing' && <WalletTab data={dashboardData} token={token} onRefresh={fetchData} />}
              {activeTab === 'preferences' && <PreferencesTab token={token} />}
              {/* Add other tabs progressively */}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Welcome back!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg"><ShoppingBag className="w-6 h-6"/></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <h3 className="text-2xl font-bold">{data?.purchases?.length || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/20 text-pink-400 rounded-lg"><Heart className="w-6 h-6"/></div>
              <div>
                <p className="text-sm text-muted-foreground">Wishlisted Items</p>
                <h3 className="text-2xl font-bold">{data?.wishlist?.length || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg"><Ticket className="w-6 h-6"/></div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tickets</p>
                <h3 className="text-2xl font-bold">{data?.tickets?.length || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PurchasesTab({ data, loading }: { data: any, loading?: boolean }) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>({});

  const openReviewModal = (product: any) => {
      setSelectedProduct(product);
      setReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Order History</h2>
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-white/[0.02] animate-pulse">
              <div className="w-16 h-16 rounded-lg bg-muted/40"></div>
              <div className="flex-1 space-y-2 w-full">
                <div className="h-4 bg-muted/40 rounded w-1/3"></div>
                <div className="h-3 bg-muted/40 rounded w-1/4"></div>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <div className="h-10 w-32 bg-muted/40 rounded"></div>
                <div className="h-10 w-24 bg-muted/40 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.purchases?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.purchases?.map((p: any) => (
            <div key={p.order_id} className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <img src={p.image_url} className="w-16 h-16 rounded-lg object-cover" alt={p.title} />
              <div className="flex-1 text-left w-full">
                <h4 className="font-bold text-white">{p.title}</h4>
                <p className="text-sm text-muted-foreground">Order: {p.order_id} • ${p.amount}</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="border-border w-full md:w-auto" onClick={() => openReviewModal(p)}>
                      <Star className="w-4 h-4 mr-2" /> Rate Product
                  </Button>
                  <Button className="bg-indigo-500 hover:bg-indigo-600 text-white w-full md:w-auto">Download</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedProduct && (
          <ReviewModal 
              isOpen={reviewModalOpen} 
              onClose={() => setReviewModalOpen(false)} 
              product={selectedProduct} 
          />
      )}
    </div>
  );
}

function ProfileTab({ user, token }: { user: any, token: string }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemovePhoto, setIsRemovePhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const currentAvatar = isRemovePhoto ? "" : previewUrl || user?.photoURL || user?.avatar_url || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateProfileImage(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    setIsRemovePhoto(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsRemovePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelImageSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsRemovePhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a valid display name.");
      return;
    }

    setSaving(true);
    try {
      await updateUniversalProfile({
        uid: user?.id,
        displayName: name,
        file: selectedFile,
        isRemovePhoto,
        role: "user",
        token
      });

      await refreshUser();
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsRemovePhoto(false);
      toast.success("User profile & avatar updated successfully in Firebase Storage & Firestore!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-[#141428]/80 border-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          Edit User Profile
        </CardTitle>
        <CardDescription>Manage your display name and profile picture with permanent Firebase Cloud Storage & Firestore persistence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Profile Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-2 border-indigo-400/50 shadow-xl">
              {currentAvatar ? (
                <img src={currentAvatar} alt={name || "User Avatar"} className="w-full h-full object-cover" />
              ) : (
                name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-all"
              title="Upload New Avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h4 className="font-semibold text-white text-base">Profile Picture</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Allowed formats: <span className="text-indigo-300 font-mono font-bold">PNG, JPG, JPEG</span> (Max file size: <span className="text-indigo-300 font-mono font-bold">5MB</span>).
            </p>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange} 
              className="hidden" 
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 text-xs gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Select Image
              </Button>

              {(selectedFile || previewUrl) && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelImageSelection}
                  className="text-xs text-gray-400 hover:text-white gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              )}

              {(user?.photoURL || user?.avatar_url || currentAvatar) && !isRemovePhoto && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleRemovePhoto}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </Button>
              )}
            </div>

            {selectedFile && (
              <p className="text-xs text-emerald-400 font-mono mt-1">
                ✓ Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}

            {isRemovePhoto && (
              <p className="text-xs text-amber-400 font-mono mt-1">
                ⚠️ Photo marked for removal upon saving.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">Full Display Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-background border-border text-white" placeholder="Enter display name" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">Email Address (Read Only)</label>
          <Input value={user?.email} disabled className="bg-background border-border opacity-50 text-gray-400 cursor-not-allowed" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md shadow-indigo-600/30">
          {saving ? "Uploading & Saving to Firebase..." : "Save Profile Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}



function SecurityTab({ user, token }: { user: any, token: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/security", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) throw new Error("Failed to update security settings");
      toast.success("Security settings updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch(e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#141428]/80 border-border">
      <CardHeader>
        <CardTitle>Security & Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Current Password</label>
          <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-background border-border" />
        </div>
        <Button onClick={handleUpdate} disabled={loading} className="bg-indigo-500 hover:bg-indigo-600">
          {loading ? "Updating..." : "Update Password"}
        </Button>

        <div className="mt-8 pt-6 border-t border-border">
           <h3 className="text-lg font-bold mb-4">Two-Factor Authentication (2FA)</h3>
           <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
             <div>
               <h4 className="font-semibold">Authenticator App</h4>
               <p className="text-sm text-muted-foreground">Not configured</p>
             </div>
             <Button variant="outline" className="border-border" onClick={async () => {
    try {
       const res = await fetch('/api/user/2fa/enable', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
       if(res.ok) toast.success("2FA setup email sent! Please check your inbox.");
       else throw new Error("Failed to enable 2FA");
    } catch(err: any) { toast.error(err.message); }
  }}>Enable 2FA</Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketsTab({ data, token }: { data: any, token: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message })
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      toast.success("Support ticket created");
      setSubject("");
      setMessage("");
      // Need to refresh tickets ideally, but for now just show success
      setTimeout(() => window.location.reload(), 1000);
    } catch(e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>Open Support Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
              <Input required value={subject} onChange={e => setSubject(e.target.value)} className="bg-background border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Message</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)} className="w-full min-h-[120px] bg-background border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <Button type="submit" disabled={creating} className="bg-indigo-500">
              {creating ? "Submitting..." : "Submit Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.tickets?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets found.</p>
          ) : (
            <div className="space-y-4">
              {data?.tickets?.map((t: any) => (
                <div key={t.id} className="p-4 bg-white/[0.02] border border-border rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold">{t.subject}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{t.message}</p>
                  {t.resolution && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-indigo-400 mb-1">Support Resolution:</p>
                      <p className="text-sm text-gray-300">{t.resolution}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Created: {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadsTab({ data, token }: { data: any; token?: string }) {
    const downloadItem = async (orderId: string) => {
        try {
            const res = await fetch(`/api/download/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `purchase-${orderId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Download started!");
        } catch(err: any) {
            toast.error(err.message);
        }
    };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Downloads & Licenses</h2>
      {data?.purchases?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">You haven't acquired any licenses.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.purchases?.map((p: any) => (
            <div key={p.order_id} className="p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex flex-col md:flex-row gap-4 items-center">
              <img src={p.image_url} className="w-16 h-16 rounded-lg object-cover" alt={p.title} />
              <div className="flex-1 text-left w-full">
                <h4 className="font-bold text-white">{p.title}</h4>
                <p className="text-sm text-muted-foreground">License ID: {p.order_id}</p>
                <div className="mt-2 text-xs text-indigo-400 font-mono bg-indigo-500/10 inline-block px-2 py-1 rounded">
                  {p.mode === 'Exclusive' ? 'Exclusive Full-Ownership License' : 'Standard License'}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <Button variant="outline" className="border-border w-full md:w-auto">View License</Button>
                <Button className="bg-indigo-500 hover:bg-indigo-600 w-full md:w-auto" onClick={() => downloadItem(p.order_id)}><Download className="w-4 h-4 mr-2"/> Download</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function WishlistTab({ data, loading }: { data: any, loading?: boolean }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">My Wishlist</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-white/[0.02] overflow-hidden flex flex-col h-full animate-pulse">
              <div className="h-32 bg-muted/40"></div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="h-5 bg-muted/40 rounded w-3/4 mb-1"></div>
                <div className="h-4 bg-muted/40 rounded w-1/4 mb-4"></div>
                <div className="mt-auto flex gap-2">
                  <div className="h-10 bg-muted/40 rounded flex-1"></div>
                  <div className="h-10 bg-muted/40 rounded flex-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.wishlist?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.wishlist?.map((item: any) => (
            <div key={item.wishlist_id} className="rounded-xl border border-border bg-white/[0.02] overflow-hidden flex flex-col h-full hover:border-pink-500/30 transition-colors">
              <div className="h-32 bg-muted/50 overflow-hidden relative">
                <img src={item.image_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">{item.title}</h3>
                <p className="text-emerald-400 font-bold mb-4">${item.price}</p>
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" className="flex-1 border-border" onClick={() => window.location.href=`/listing/${item.id}`}>View</Button>
                  <Button className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => window.location.href=`/listing/${item.id}`}>Buy Now</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletTab({ data, token, onRefresh }: { data: any; token?: string; onRefresh?: () => void }) {
    const [methods, setMethods] = useState<any[]>([]);
    
    useEffect(() => {
        if(token) {
           fetch('/api/payout/methods', { headers: { Authorization: `Bearer ${token}` } })
           .then(r=>safeJson(r, { methods: [] }))
           .then(d=>setMethods(d.methods || [])).catch(e => console.warn(e));
        }
    }, [token]);
    
    const addFunds = async () => {
        try {
            const res = await fetch('/api/user/wallet/add-funds', {
               method: 'POST',
               headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
               headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({ method_type: 'credit_card', details: { last4: Math.floor(1000 + Math.random() * 9000).toString() }, is_default: true })
            });
            if(!res.ok) throw new Error(await res.text());
            toast.success("Payment method added!");
            fetch('/api/payout/methods', { headers: { Authorization: `Bearer ${token}` } }).then(r=>safeJson(r, { methods: [] })).then(d=>setMethods(d.methods || [])).catch(e => console.warn(e));
        } catch(err: any) { toast.error(err.message); }
    };
    
    const removeMethod = async (id: string) => {
        try {
            const res = await fetch(`/api/payout/methods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
          <h3 className="text-3xl font-bold text-emerald-400">${data?.balance?.toFixed(2) || "0.00"}</h3>
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
}

function PreferencesTab({ token }: { token?: string }) {
    const [prefs, setPrefs] = useState({ order_updates: true, promos: false, theme: 'dark' });
    
    useEffect(() => {
        if(token) {
           fetch('/api/user/preferences', { headers: { Authorization: `Bearer ${token}` } })
           .then(r=>safeJson(r))
           .then(d=> { if(d.preferences) setPrefs(JSON.parse(d.preferences)); }).catch(e=>console.warn(e));
        }
    }, [token]);
    
    const savePrefs = async (newPrefs: any) => {
        setPrefs(newPrefs);
        if(token) {
           await fetch('/api/user/preferences', {
               method: 'POST',
               headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify(newPrefs)
           });
           toast.success("Preferences saved!");
        }
    };
  
    return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Preferences</h2>
      
      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what we notify you about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
            <div>
              <p className="font-bold text-white">Order Updates</p>
              <p className="text-sm text-muted-foreground">Get notified about your purchases.</p>
            </div>
            <div 
       className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer ${prefs.order_updates ? 'bg-indigo-500' : 'bg-muted border border-border'}`}
       onClick={() => savePrefs({...prefs, order_updates: !prefs.order_updates})}
   >
      <div className={`w-4 h-4 rounded-full transition-transform ${prefs.order_updates ? 'bg-white translate-x-6' : 'bg-muted-foreground'}`}></div>
   </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
            <div>
              <p className="font-bold text-white">Promotional Emails</p>
              <p className="text-sm text-muted-foreground">Receive discounts and offers.</p>
            </div>
            <div 
       className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer ${prefs.promos ? 'bg-indigo-500' : 'bg-muted border border-border'}`}
       onClick={() => savePrefs({...prefs, promos: !prefs.promos})}
   >
      <div className={`w-4 h-4 rounded-full transition-transform ${prefs.promos ? 'bg-white translate-x-6' : 'bg-muted-foreground'}`}></div>
   </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-[#141428]/80 border-border">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button 
      className={`flex-1 p-4 rounded-xl border text-center font-bold ${prefs.theme === 'dark' ? 'border-indigo-500/50 bg-[#0A0A1E] text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-border bg-white/[0.02] text-muted-foreground'}`}
      onClick={() => savePrefs({...prefs, theme: 'dark'})}
   >
      Dark Mode {prefs.theme === 'dark' ? '(Active)' : ''}
   </button>
            <button 
      className={`flex-1 p-4 rounded-xl border text-center font-bold ${prefs.theme === 'light' ? 'border-indigo-500/50 bg-gray-100 text-gray-900 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-border bg-white/[0.02] text-muted-foreground'}`}
      onClick={() => savePrefs({...prefs, theme: 'light'})}
   >
      Light Mode {prefs.theme === 'light' ? '(Active)' : ''}
   </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
