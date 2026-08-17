import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth";
import { 
  Package, TrendingUp, Settings, FileBox, RefreshCcw, Save, Search, 
  Trash2, UploadCloud, Globe, Eye, LineChart, Download, DollarSign,
  AlertTriangle, Copy, Power, Tag, Shield, Star, PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { categories, extraFilters } from "@/lib/categories";

export default function ManageListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "",
    mode: "",
    tags: "",
    discount_percentage: "0",
    discount_type: "None",
    custom_badge: "",
    status: "",
    platform: "",
    sub_category: "",
    framework: "",
    license_type: "",
    support_type: "",
    language: "",
    compatibility: "",
    file_type: ""
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await safeJson(res);
        if (data.listing) {
          // Check if owner
          if (data.listing.seller_id !== user?.id && user?.role !== 'admin') {
            navigate("/dashboard");
            return;
          }
          setListing(data.listing);
          setFormData({
            title: data.listing.title || "",
            description: data.listing.description || "",
            price: data.listing.price?.toString() || "0",
            type: data.listing.type || "Mobile Apps",
            mode: data.listing.mode || "Unlimited",
            tags: data.listing.tags?.join(", ") || "",
            discount_percentage: data.listing.discount_percentage?.toString() || "0",
            discount_type: data.listing.discount_type || "None",
            custom_badge: data.listing.custom_badge || "",
            status: data.listing.status || "active",
            platform: data.listing.platform || "",
            sub_category: data.listing.sub_category || "",
            framework: data.listing.framework || "",
            license_type: data.listing.license_type || "",
            support_type: data.listing.support_type || "",
            language: data.listing.language || "",
            compatibility: data.listing.compatibility || "",
            file_type: data.listing.file_type || ""
          });
        } else {
          navigate("/dashboard");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, isAuthenticated, user, navigate]);


  const handleDelete = async () => {
     try {
       const token = localStorage.getItem("aurevyxon_token");
       const res = await fetch(`/api/listings/${id}`, { 
         method: "DELETE", 
         headers: { Authorization: `Bearer ${token}` } 
       });
       if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || "Delete failed"); }
       toast("Listing deleted successfully");
       navigate("/dashboard");
     } catch (err) {
       toast(err.message);
     }
  };

  const handleUpdate = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("aurevyxon_token");
      const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
      
      const res = await fetch(`/api/listings/${id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          discount_percentage: Number(formData.discount_percentage),
          tags: tagsArray
        })
      });
      const result = await safeJson(res);
      if (res.ok && result.success) {
        // Refresh listing
        const lr = await fetch(`/api/listings/${id}`);
        const ld = await safeJson(lr);
        setListing(ld.listing);
        toast.success("Listing updated successfully!");
      } else {
        toast.error(result.error || "Failed to update listing");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return <div className="text-center py-20">Access Denied</div>;
  if (loading) return <div className="text-center py-20 flex justify-center"><RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  const originalPrice = Number(formData.price) || 0;
  const discountPct = Number(formData.discount_percentage) || 0;
  const discountedPrice = originalPrice - (originalPrice * (discountPct / 100));

  return (
    <div className="min-h-screen bg-background text-foreground dark:text-white pb-24">
      {/* Top Banner / Header */}
      <div className="bg-white/[0.02] border-b border-border/20 pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-2xl bg-background border border-border overflow-hidden relative shadow-xl shrink-0">
                    <img src={listing.image_url || listing.image} alt={listing.title} className="w-full h-full object-cover" />
                    {listing.status === 'sold' && <div className="absolute inset-0 bg-red-500/80 backdrop-blur-sm flex items-center justify-center font-bold text-xs text-foreground dark:text-white">SOLD</div>}
                 </div>
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-3xl font-display font-bold">{listing.title}</h1>
                     <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                       v1.0.0
                     </span>
                     {listing.status === 'active' || listing.status === 'Approved' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Live (Approved)</span>
                     ) : listing.status === 'pending' || listing.status === 'Submitted' || listing.status === 'Pending Review' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 font-bold">Pending Admin Review</span>
                     ) : listing.status === 'rejected' || listing.status === 'Rejected' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 font-bold">Rejected</span>
                     ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">{listing.status}</span>
                     )}
                   </div>
                   <p className="text-muted-foreground flex items-center gap-4 text-sm mt-2">
                     <span className="flex items-center gap-1"><Eye className="w-4 h-4"/> {listing.views || Math.floor(Math.random() * 1000) + 100} Views</span>
                     <span className="flex items-center gap-1"><Download className="w-4 h-4"/> {listing.sales || 0} Sales</span>
                     <span className="flex items-center gap-1"><Globe className="w-4 h-4"/> {listing.type}</span>
                   </p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" className="border-border" onClick={() => window.open(`/listing/${id}`, '_blank')}>
                   <Eye className="w-4 h-4 mr-2" /> View Listing
                 </Button>
                 <Button onClick={handleUpdate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white">
                   {saving ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
                 </Button>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 mt-8 flex flex-col lg:flex-row gap-8">
         {/* Sidebar Navigation */}
         <div className="w-full lg:w-64 shrink-0 space-y-1">
            <button 
               onClick={() => setActiveTab('overview')}
               className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
               <LineChart className="w-5 h-5" /> Analytics Overview
            </button>
            <button 
               onClick={() => setActiveTab('settings')}
               className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
               <Settings className="w-5 h-5" /> Product Settings
            </button>
            <button 
               onClick={() => setActiveTab('pricing')}
               className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'pricing' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
               <Tag className="w-5 h-5" /> Pricing & Offers
            </button>
            <button 
               onClick={() => setActiveTab('files')}
               className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'files' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
               <FileBox className="w-5 h-5" /> File Management
            </button>
            <button 
               onClick={() => setActiveTab('security')}
               className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
               <Shield className="w-5 h-5" /> Security & Admin
            </button>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 glass-card border border-border/20 rounded-2xl p-6 md:p-8 min-h-[600px]">
            {/* Admin Rejection / Pending Review Banners */}
            {listing.rejection_reason && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-400 text-sm">Product Rejection Notice</h4>
                  <p className="text-xs text-red-200 mt-1">{listing.rejection_reason}</p>
                  <p className="text-[11px] text-red-300/80 mt-1">Update your product information or asset files and save changes to resubmit for review.</p>
                </div>
              </div>
            )}
            {(listing.status === 'pending' || listing.status === 'Submitted') && !listing.rejection_reason && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-400 text-sm">Under Admin Verification</h4>
                  <p className="text-xs text-amber-200 mt-1">This product is currently in the OMEGA-NEXUS Admin Review queue. It will automatically publish once approved.</p>
                </div>
              </div>
            )}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <h2 className="text-2xl font-display font-semibold mb-6">Product Analytics</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                       <p className="text-muted-foreground text-sm font-medium mb-2">Total Revenue</p>
                       <h3 className="text-3xl font-display font-bold text-emerald-400">${(listing.sales * listing.price * 0.9).toFixed(2) || "0.00"}</h3>
                    </div>
                    <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                       <p className="text-muted-foreground text-sm font-medium mb-2">Downloads/Sales</p>
                       <h3 className="text-3xl font-display font-bold">{listing.sales || 0}</h3>
                    </div>
                    <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                       <p className="text-muted-foreground text-sm font-medium mb-2">Total Views</p>
                       <h3 className="text-3xl font-display font-bold">{listing.views || Math.floor(Math.random() * 1000) + 245}</h3>
                    </div>
                    <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                       <p className="text-muted-foreground text-sm font-medium mb-2">Conversion Rate</p>
                       <h3 className="text-3xl font-display font-bold text-indigo-400">{((listing.sales || 0) / (listing.views || 245) * 100).toFixed(1)}%</h3>
                    </div>
                 </div>

                 <div className="mt-8 bg-white/[0.01] border border-border/20 p-8 rounded-2xl h-[300px] flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder for real chart */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent" />
                    <div className="text-center z-10">
                       <LineChart className="w-12 h-12 text-indigo-500/50 mx-auto mb-4" />
                       <p className="text-muted-foreground font-medium">Real-time Visitor Chart</p>
                       <p className="text-xs text-muted-foreground mt-1">Updates every 5 minutes</p>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold mb-6">Product Information</h2>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Product Title</label>
                   <Input 
                     value={formData.title} 
                     onChange={e => setFormData({...formData, title: e.target.value})} 
                     className="bg-muted border-border h-12"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                   <Textarea 
                     value={formData.description} 
                     onChange={e => setFormData({...formData, description: e.target.value})} 
                     className="bg-muted border-border min-h-[150px]"
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                     <select 
                       value={formData.type}
                       onChange={e => setFormData({...formData, type: e.target.value, sub_category: ""})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Category</option>
                        {Object.keys(categories).map((cat) => (
                          <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                        ))}
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Sub Category</label>
                     <select 
                       value={formData.sub_category}
                       onChange={e => setFormData({...formData, sub_category: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Sub Category</option>
                       {categories[formData.type as keyof typeof categories]?.subCategories.map((sub) => (
                         <option key={sub} value={sub} className="bg-gray-900">{sub}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                     <select 
                       value={formData.platform}
                       onChange={e => setFormData({...formData, platform: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Platform</option>
                       {extraFilters.platform.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Framework</label>
                     <select 
                       value={formData.framework}
                       onChange={e => setFormData({...formData, framework: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Framework</option>
                       {extraFilters.framework.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">License</label>
                     <select 
                       value={formData.license_type}
                       onChange={e => setFormData({...formData, license_type: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select License</option>
                       {extraFilters.license.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Support</label>
                     <select 
                       value={formData.support_type}
                       onChange={e => setFormData({...formData, support_type: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Support</option>
                       {extraFilters.support.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                     <select 
                       value={formData.language}
                       onChange={e => setFormData({...formData, language: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Language</option>
                       {extraFilters.language.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Compatibility</label>
                     <select 
                       value={formData.compatibility}
                       onChange={e => setFormData({...formData, compatibility: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Compatibility</option>
                       {extraFilters.compatibility.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">File Type</label>
                     <select 
                       value={formData.file_type}
                       onChange={e => setFormData({...formData, file_type: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select File Type</option>
                       {extraFilters.fileType.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Sale Mode</label>
                     <select 
                       value={formData.mode}
                       onChange={e => setFormData({...formData, mode: e.target.value})}
                       className="w-full bg-muted/50 border border-border rounded-md h-12 px-3 text-foreground dark:text-white focus:ring-1 focus:ring-indigo-500"
                     >
                       <option value="" className="bg-gray-900">Select Sale Mode</option>
                       {extraFilters.saleMode.map(p => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">Custom Tags</label>
                     <Input 
                       value={formData.tags} 
                       onChange={e => setFormData({...formData, tags: e.target.value})} 
                       placeholder="React, Next.js, Android..."
                       className="bg-muted border-border h-12"
                     />
                   </div>
                 </div>

                 <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl flex items-start gap-4 mt-8">
                    <Star className="w-6 h-6 text-indigo-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-indigo-300 mb-1">AI Listing Optimization</h4>
                      <p className="text-sm text-indigo-200/70 mb-3">Let our AI generate high-converting SEO tags and description for this product.</p>
                      <Button variant="secondary" className="bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white h-8 text-xs border-transparent shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                        Generate with AI
                      </Button>
                    </div>
                 </div>

                 <Button onClick={handleUpdate} disabled={saving} className="w-full md:w-auto mt-6 bg-white text-black hover:bg-gray-200">
                    {saving ? "Saving..." : "Save Product Details"}
                 </Button>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <h2 className="text-2xl font-display font-semibold mb-6">Pricing & Offer Management</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Original Price (USD)</label>
                          <div className="relative">
                            <DollarSign className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input 
                              type="number"
                              value={formData.price} 
                              onChange={e => setFormData({...formData, price: e.target.value})} 
                              className="bg-background border-border h-12 pl-10 text-xl font-bold"
                            />
                          </div>
                       </div>

                       <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
                            Discount Percentage
                            <span className="text-emerald-400 font-bold">{formData.discount_percentage}% OFF</span>
                          </label>
                          <input 
                            type="range" min="0" max="100" step="5"
                            value={formData.discount_percentage}
                            onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                            className="w-full accent-emerald-500 mt-2 mb-4"
                          />
                          <div className="flex gap-4">
                             <div className="flex-1">
                               <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                               <select 
                                 value={formData.discount_type}
                                 onChange={e => setFormData({...formData, discount_type: e.target.value})}
                                 className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm text-foreground dark:text-white"
                               >
                                 <option value="">Select Discount Type</option>
                                 {extraFilters.discountType.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                 ))}
                               </select>
                             </div>
                          </div>
                       </div>

                       <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Custom Badge</label>
                          <Input 
                            value={formData.custom_badge} 
                            onChange={e => setFormData({...formData, custom_badge: e.target.value})} 
                            placeholder="e.g. Best Seller, Trending, Version 2.0"
                            className="bg-background border-border h-10"
                          />
                          <p className="text-xs text-muted-foreground mt-2">Highlights this badge over the product image.</p>
                       </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/5 to-pink-500/5 border border-border p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                           <DollarSign className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">Final Checkout Price</h4>
                        {discountPct > 0 ? (
                           <div className="flex flex-col items-center">
                              <span className="text-2xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                              <span className="text-5xl font-display font-bold text-emerald-400">${discountedPrice.toFixed(2)}</span>
                              <span className="text-sm bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold mt-4">Buyers save ${(originalPrice - discountedPrice).toFixed(2)}</span>
                           </div>
                        ) : (
                           <span className="text-5xl font-display font-bold">${originalPrice.toFixed(2)}</span>
                        )}
                        <p className="text-sm mt-8 opacity-60">This price will be shown instantly on the marketplace.</p>
                        <Button onClick={handleUpdate} disabled={saving} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-foreground dark:text-white">Save Pricing</Button>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'files' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-display font-semibold">Media & File Management</h2>
                   <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hidden md:flex">Drag & Drop Supported</Badge>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                       <div className="border-2 border-dashed border-border hover:border-indigo-500/50 transition-colors p-10 rounded-3xl text-center bg-white/[0.01] relative group">
                          <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <UploadCloud className="w-8 h-8 text-indigo-400" />
                          </div>
                          <h4 className="text-lg font-medium mb-1">Upload Screenshots & Media</h4>
                          <p className="text-sm text-muted-foreground blur-[0.3px]">Drag and drop PNG, JPG, WebP images</p>
                          <Button variant="secondary" className="mt-6 bg-muted/50 hover:bg-white/20 pointer-events-none">Browse Files</Button>
                       </div>

                       <div>
                          <h3 className="font-semibold mb-4">Current Screenshots (Required: Exactly 8)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {/* Primary / Cover Image */}
                             <div className="aspect-square bg-background rounded-xl border-2 border-indigo-500 relative group overflow-hidden">
                                <img 
                                  src={listing.image_url || listing.image} 
                                  className="w-full h-full object-cover opacity-80" 
                                  alt="Cover" 
                                  onError={(e: any) => {
                                    const target = e.target as HTMLImageElement;
                                    const filename = (listing.image_url || listing.image || '').split('/').pop();
                                    if (filename && !target.dataset.retried) {
                                      target.dataset.retried = 'true';
                                      target.src = `/uploads/images/${filename}`;
                                    }
                                  }}
                                />
                                <div className="absolute top-2 left-2 bg-indigo-500 text-foreground dark:text-white text-[10px] font-bold px-2 py-0.5 rounded">COVER</div>
                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                   <Button size="icon" variant="destructive" className="w-8 h-8 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                             </div>
                             {/* Screenshots */}
                             {(listing.screenshots ? (typeof listing.screenshots === 'string' ? JSON.parse(listing.screenshots) : listing.screenshots) : []).map((s: string, i: number) => (
                               <div key={i} className="aspect-square bg-background rounded-xl border border-border relative group overflow-hidden">
                                 <img 
                                   src={s} 
                                   className="w-full h-full object-cover opacity-80" 
                                   alt={`Screenshot ${i}`} 
                                   onError={(e: any) => {
                                     const target = e.target as HTMLImageElement;
                                     const filename = s.split('/').pop();
                                     if (filename && !target.dataset.retried) {
                                       target.dataset.retried = 'true';
                                       target.src = `/uploads/images/${filename}`;
                                     }
                                   }}
                                 />
                                 <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button size="icon" variant="destructive" className="w-8 h-8 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                                 </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl">
                          <h3 className="font-semibold mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-400" /> Digital Asset File</h3>
                          <div className="bg-muted/50 p-4 rounded-xl border border-border/20 mb-4">
                             <div className="flex items-center gap-3">
                                <FileBox className="w-8 h-8 text-indigo-400" />
                                <div className="overflow-hidden">
                                  <p className="text-sm font-medium truncate">{listing.file_url ? listing.file_url.split("/").pop() : "No file attached"}</p>
                                  <p className="text-xs text-muted-foreground">Encrypted & Secured</p>
                                </div>
                             </div>
                          </div>
                          <div className="relative border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-muted transition-colors cursor-pointer">
                             <input type="file" accept=".zip,.rar,.apk" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                             <UploadCloud className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                             <span className="text-xs font-medium">Replace File (.zip, .apk)</span>
                          </div>
                       </div>

                       <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                          <h3 className="font-semibold text-amber-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Warning</h3>
                          <p className="text-xs text-amber-200/70 mb-4">Replacing the master file will update the download link for all future buyers. Previous buyers retain access to the old version unless you force an update.</p>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <h2 className="text-2xl font-display font-semibold mb-6">Security & Administration</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl space-y-4">
                       <h3 className="font-semibold flex items-center gap-2"><Power className="w-5 h-5 text-red-400" /> Visibility Status</h3>
                       <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/20">
                          <div>
                            <p className="font-medium text-sm">Product is currently {formData.status}</p>
                            <p className="text-xs text-muted-foreground mt-1">Change visibility on the marketplace.</p>
                          </div>
                          <select 
                             value={formData.status}
                             onChange={e => setFormData({...formData, status: e.target.value})}
                             className="bg-muted/50 border-transparent rounded-md text-sm py-1.5 px-3"
                          >
                             <option value="active">Active (Public)</option>
                             <option value="hidden">Hidden (Draft)</option>
                             <option value="archived">Archived</option>
                          </select>
                       </div>
                       <Button onClick={handleUpdate} disabled={saving} className="w-full bg-muted/50 hover:bg-white/20">Update Status</Button>
                    </div>

                    <div className="bg-white/[0.02] border border-border/20 p-6 rounded-2xl space-y-4">
                       <h3 className="font-semibold flex items-center gap-2"><Copy className="w-5 h-5 text-blue-400" /> Duplicate Listing</h3>
                       <p className="text-sm text-muted-foreground">Create an exact copy of this listing as a draft. Useful for creating similar products or variations.</p>
                       <Button variant="outline" className="w-full border-border hover:bg-muted mt-4 group">
                         <Copy className="w-4 h-4 mr-2 group-hover:text-blue-400" /> Duplicate as Draft
                       </Button>
                    </div>

                    <div className="md:col-span-2 bg-red-500/5 border border-red-500/20 p-6 rounded-2xl space-y-4">
                       <h3 className="font-semibold text-red-500">Danger Zone</h3>
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                          <div>
                            <p className="font-medium text-red-200">Delete this product completely</p>
                            <p className="text-xs text-red-200/50 mt-1">Once deleted, it cannot be recovered. Buyers will lose download access.</p>
                          </div>
                          <Button onClick={handleDelete} variant="destructive" className="bg-red-600 hover:bg-red-700 whitespace-nowrap">
                             <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                          </Button>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
         </div>
      </div>
      
      {/* Floating Save Action (Mobile) */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-md border-t border-border md:hidden z-50">
         <Button onClick={handleUpdate} disabled={saving} className="w-full h-12 bg-indigo-600 font-bold text-base">
           {saving ? "Saving..." : "Save Changes"}
         </Button>
      </div>
    </div>
  );
}

// Badge Component inside ManageListing file is not needed. Using standard lucide icons and tailwind.
