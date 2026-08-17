import React, { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Package, DollarSign, Activity, FileText, Settings, Wallet, BarChart, MessageSquare, ShieldCheck, Upload, Trash2, Camera, X, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { KYCVerificationForm } from "@/components/KYCVerificationForm";
import { SellerMessageAdminModal } from "@/components/seller/SellerMessageAdminModal";
import { updateUniversalProfile, validateProfileImage } from "@/lib/storageService";

export default function SellerDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [msgModalOpen, setMsgModalOpen] = useState(false);

  const kycStatus = dashboardData?.seller_profile?.kyc_status || user?.seller_profile?.kyc_status || 'unverified';
  const isApprovedSeller = kycStatus === 'verified' || kycStatus === 'approved' || user?.role === 'admin';

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    if (user?.role !== 'seller' && user?.role !== 'admin') {
      navigate("/start-selling");
      return;
    }
    fetchData();
  }, [token, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashRes = await fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      const text = await dashRes.text();
      let dash;
      try {
          dash = JSON.parse(text);
      } catch(e) {
          console.error("Failed to parse JSON for seller dashboard:", text.substring(0, 100));
          dash = {};
      }
      setDashboardData(dash);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "sales", label: "Sales & Orders", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "wallet", label: "Wallet & Payouts", icon: Wallet },
    { id: "coupons", label: "Coupons", icon: FileText },
    { id: "store-settings", label: "Store Settings", icon: Settings },
    { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
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
            <div className="mb-6 px-2">
              <h3 className="font-display font-bold text-lg text-white">Seller Portal</h3>
              <p className="text-xs text-muted-foreground">Enterprise Dashboard</p>
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
                        ? 'bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30' 
                        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 pt-6 border-t border-border space-y-2">
               <Link to="/sell">
                 <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">Upload Product</Button>
               </Link>

               {/* Message Admin Button - Only visible for KYC Approved sellers */}
               {isApprovedSeller ? (
                 <Button
                   onClick={() => setMsgModalOpen(true)}
                   variant="outline"
                   className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs flex items-center justify-center gap-2"
                 >
                   <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Message Admin
                 </Button>
               ) : (
                 <div className="text-[10px] text-muted-foreground text-center py-1.5 px-2 bg-white/5 rounded-lg border border-white/5 font-mono">
                   Message Admin available after KYC Approval
                 </div>
               )}
            </div>
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
              {activeTab === 'products' && <ProductsTab data={dashboardData} loading={loading} />}
              {activeTab === 'sales' && <SalesTab data={dashboardData} />}
              {activeTab === 'analytics' && <AnalyticsTab data={dashboardData} />}
              {activeTab === 'wallet' && <WalletTab data={dashboardData} token={token} onRefresh={fetchData} />}
              {activeTab === 'coupons' && <CouponsTab token={token} />}
              {activeTab === 'store-settings' && <StoreSettingsTab token={token} />}
              {activeTab === 'kyc' && <KYCTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <SellerMessageAdminModal
        isOpen={msgModalOpen}
        onClose={() => setMsgModalOpen(false)}
        token={token}
        user={user}
        kycStatus={kycStatus}
      />
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Store Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold text-emerald-400">${data?.sales?.reduce((a:any,b:any) => a + (b.seller_earnings||0), 0)?.toFixed(2) || "0.00"}</h3>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
            <h3 className="text-2xl font-bold">{data?.sales?.length || 0}</h3>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active Products</p>
            <h3 className="text-2xl font-bold">{data?.listings?.length || 0}</h3>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
            <h3 className="text-2xl font-bold text-indigo-400">${data?.balance?.toFixed(2) || "0.00"}</h3>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProductsTab({ data, loading }: { data: any, loading?: boolean }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Manage Products</h2>
      {loading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white/[0.02] animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted/40 rounded w-1/3"></div>
                <div className="h-4 bg-muted/40 rounded w-1/4"></div>
              </div>
              <div className="h-10 w-24 bg-muted/40 rounded"></div>
            </div>
          ))}
        </div>
      ) : data?.listings?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground mb-4">You have no products listed.</p>
          <Link to="/sell"><Button className="bg-emerald-500">Create Product</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.listings?.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex-1">
                <h4 className="font-bold text-white">{p.title}</h4>
                <p className="text-sm text-muted-foreground">Price: ${p.price} • Status: {p.status}</p>
              </div>
              <Link to={`/manage/${p.id}`}>
                <Button variant="outline" className="border-border">Manage</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function SalesTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Sales & Orders</h2>
      {data?.sales?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">You haven't made any sales yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Order ID</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Earnings</th>
                <th className="px-6 py-4 rounded-tr-xl">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.sales?.map((sale: any) => (
                <tr key={sale.order_id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-mono text-xs">{sale.order_id}</td>
                  <td className="px-6 py-4 font-medium">{sale.title}</td>
                  <td className="px-6 py-4">{sale.buyer_name}</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold">+${(sale.seller_earnings || sale.amount)?.toFixed(2)}</td>
                  <td className="px-6 py-4">{new Date(sale.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Store Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <h3 className="text-5xl font-bold text-indigo-400 mb-2">{data?.sales?.length && data?.myListings?.length ? Math.min((data.sales.length / (data.myListings.length * 10)) * 100, 100).toFixed(1) : "0.0"}%</h3>
              <p className="text-sm text-muted-foreground">From Store Views to Purchases</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Top Performing Product</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
             {data?.sales?.length > 0 ? (
                <div className="text-center">
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">{data.sales[0].title}</h3>
                  <p className="text-sm text-muted-foreground">Most sales this month</p>
                </div>
             ) : (
                <p className="text-muted-foreground">Not enough data</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WalletTab({ data, token, onRefresh }: { data: any; token?: string; onRefresh?: () => void }) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("stripe");
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  
  const handleStripeConnect = () => {
    setConnectingStripe(true);
    // Placeholder logic for Stripe Connect
    setTimeout(() => {
      setConnectingStripe(false);
      setIsStripeConnected(true);
      toast.success("Successfully connected to Stripe!");
    }, 1500);
  };
  
  
      

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Wallet & Payouts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-4xl font-bold text-emerald-400 mb-4">${data?.balance?.toFixed(2) || "0.00"}</h3>
            <p className="text-sm text-muted-foreground mb-6">Minimum withdrawal is $50.00</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#141428]/80 border-border">
          <CardHeader>
            <CardTitle>Banking Details (Stripe Connect)</CardTitle>
          </CardHeader>
          <CardContent>
            {isStripeConnected ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Stripe Account Connected</p>
                  <p className="text-xs text-muted-foreground">acct_1XXXXXXXXXXXXXX</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your bank account via Stripe to receive automated payouts.
                </p>
                <Button 
                  onClick={handleStripeConnect} 
                  disabled={connectingStripe}
                  className="w-full bg-[#635BFF] hover:bg-[#5851E5] text-white h-10"
                >
                  {connectingStripe ? "Connecting..." : "Connect with Stripe"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[#141428]/80 border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Payout Settlement Destination</CardTitle>
          </CardHeader>
          <CardContent>
             {data?.sellerProfile?.payout_verified ? (
               <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-4 mb-6">
                 <ShieldCheck className="w-6 h-6 text-emerald-400 mt-1" />
                 <div>
                    <h4 className="font-semibold text-emerald-100">Direct-to-Payout Active</h4>
                    <p className="text-sm text-emerald-200/80 mt-1">
                      Your payout account is verified. Earnings from every sale are routed instantly to: <br/>
                      <span className="font-mono text-emerald-400 mt-2 block">{data?.sellerProfile?.payout_details}</span>
                    </p>
                 </div>
               </div>
             ) : (
               <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-4 mb-6">
                 <ShieldCheck className="w-6 h-6 text-amber-400 mt-1" />
                 <div>
                    <h4 className="font-semibold text-amber-100">Payout Verification Pending / Required</h4>
                    <p className="text-sm text-amber-200/80 mt-1">
                      Your payout account must be verified before you can list products for sale. Our team is reviewing your details or you need to update them.
                    </p>
                 </div>
               </div>
             )}
             
             <div className="border-t border-gray-800 pt-6">
                <h4 className="font-medium text-white mb-2">Change Payout Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  WARNING: Changing your payout destination requires a fresh verification check and triggers a mandatory 72-hour security cooling-off period.
                </p>
                <div className="flex gap-4">
                  <input id="newPayoutDetails" type="text" placeholder="New Bank Account / Stripe Connect ID" className="flex-1 bg-muted border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <Button onClick={async () => {
                    const el = document.getElementById('newPayoutDetails') as HTMLInputElement;
                    if (!el.value) return toast.error("Enter payout details");
                    try {
                      const res = await fetch('/api/seller/payout/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ payout_details: el.value })
                      });
                      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
                      toast.success("Payout account updated. Re-verification required.");
                      el.value = '';
                      if (onRefresh) onRefresh();
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }} className="bg-indigo-600 hover:bg-indigo-700 h-10">
                    Request Change
                  </Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CouponsTab({ token }: { token?: string }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  
  useEffect(() => {
    if(token) {
      fetch('/api/seller/coupons', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => safeJson(res, { coupons: [] }))
      .then(data => setCoupons(data.coupons || [])).catch(e => console.warn(e));
    }
  }, [token]);
  
  const createCoupon = async () => {
    try {
      const res = await fetch('/api/seller/coupons', {
         method: 'POST',
         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ code: 'PROMO' + Math.floor(Math.random()*1000), discount_percentage: 10, valid_until: new Date(Date.now() + 30*24*60*60*1000) })
      });
      const data = await safeJson(res);
      if(data.success) {
         toast.success("Coupon created!");
         setCoupons([...coupons, data.coupon]);
      } else {
         toast.error(data.error);
      }
    } catch(err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Marketing & Coupons</h2>
        <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={createCoupon}>Create Coupon</Button>
      </div>
      {coupons.length === 0 ? (
      <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
        <p className="text-muted-foreground mb-4">You haven't created any promotional campaigns.</p>
      </div>
  ) : (
      <div className="grid gap-4">
        {coupons.map((c: any) => (
           <div key={c.id} className="p-4 bg-white/[0.02] border border-border rounded-xl flex justify-between items-center">
              <div>
                 <p className="font-bold text-emerald-400">{c.code}</p>
                 <p className="text-xs text-muted-foreground">{c.discount_percentage}% off</p>
              </div>
           </div>
        ))}
      </div>
  )}
    </div>
  );
}

function StoreSettingsTab({ token }: { token?: string }) {
  const [storeName, setStoreName] = useState("My Premium Store");
  const [storeDesc, setStoreDesc] = useState("High quality digital assets and premium software.");
  const [supportEmail, setSupportEmail] = useState("support@mystore.com");

  useEffect(() => {
    if(token) {
      fetch('/api/seller/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => safeJson(res))
      .then(data => {
         if(data.settings) {
            setStoreName(data.settings.storeName || storeName);
            setStoreDesc(data.settings.storeDesc || storeDesc);
            setSupportEmail(data.settings.supportEmail || supportEmail);
         }
      }).catch(e => console.warn(e));
    }
  }, [token]);

  const saveSettings = async () => {
    try {
       await fetch('/api/seller/settings', {
         method: 'POST',
         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ storeName, storeDesc, supportEmail })
       });
       toast.success("Store settings updated successfully!");
    } catch(err) { toast.error("Error saving settings"); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Store Settings</h2>
      <Card className="bg-[#141428]/80 border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Store Name</label>
            <input type="text" value={storeName} onChange={(e)=>setStoreName(e.target.value)} className="w-full bg-muted border border-border rounded-md h-10 px-3" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Store Description</label>
            <textarea value={storeDesc} onChange={(e)=>setStoreDesc(e.target.value)} className="w-full min-h-[100px] bg-muted border border-border rounded-md p-3" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Support Email</label>
            <input type="email" value={supportEmail} onChange={(e)=>setSupportEmail(e.target.value)} className="w-full bg-muted border border-border rounded-md h-10 px-3" />
          </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={saveSettings}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function KYCTab() {
  return (
    <div className="space-y-6">
      <KYCVerificationForm />
    </div>
  );
}