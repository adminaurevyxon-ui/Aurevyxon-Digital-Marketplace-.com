import { toast } from "sonner";
import { useEffect, useState } from "react";
import { safeJson } from "@/lib/utils";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Star, Shield, Lock, Download, CheckCircle2, TrendingUp, Users, Cpu, FileJson, Check, ShoppingBag, Heart , MessageSquare, Share, Calculator, X, Tag, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { LoginDialog } from "@/components/LoginDialog";

export default function Listing() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);

  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [error, setError] = useState("");
  const [inWishlist, setInWishlist] = useState(false);

  // Lightbox Modal & Media Gallery State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeCommissionRate, setActiveCommissionRate] = useState<number>(15);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  const fetchPublicSettings = () => {
    fetch('/api/public/settings')
      .then(res => safeJson(res))
      .then(data => {
        if (data && data.global_commission_rate) {
          const num = Number(data.global_commission_rate);
          if (!isNaN(num)) setActiveCommissionRate(num);
        }
      })
      .catch(e => console.warn("Failed to fetch public settings:", e));
  };

  const fetchListing = () => {
    fetch(`/api/listings/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Item not found");
        return safeJson(res);
      })
      .then((data) => {
        if (data && data.listing) setListing(data.listing);
        else setError("Failed to fetch listing");
      })
      .catch((err) => setError("Failed to fetch listing"));
  };

  const fetchWishlistStatus = () => {
     if (!isAuthenticated) return;
     const token = localStorage.getItem("aurevyxon_token");
     if (!token) return;
     fetch('/api/wishlists', { headers: { Authorization: `Bearer ${token}` }})
       .then(res => safeJson(res, { wishlists: [] }))
       .then(data => {
          if (data.wishlists) {
              setInWishlist(data.wishlists.some((w: any) => w.id === id));
          }
       })
       .catch(e => console.warn(e));
  };


  const fetchReviews = () => {
      fetch(`/api/products/${id}/reviews`)
        .then(res => safeJson(res, { reviews: [] }))
        .then(data => setReviewsData(data))
        .catch(e => console.warn(e));
  };
  
  useEffect(() => {
    fetchListing();
    fetchWishlistStatus();
    fetchReviews();
    fetchPublicSettings();
  }, [id, isAuthenticated]);


  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: listing?.title || "Listing", url }).catch(console.warn);
    } else {
      navigator.clipboard.writeText(url).catch(e => console.warn("Clipboard failed", e));
      toast("Link copied to clipboard!");
    }
  };
  const toggleWishlist = async () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("aurevyxon_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/wishlists/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "added") setInWishlist(true);
      else if (data.status === "removed") setInWishlist(false);
    } catch(err) {
      console.warn(err);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) return;
    setPurchasing(true);
    setError("");
    
    try {
      const token = localStorage.getItem("aurevyxon_token");
      const res = await fetch(`/api/buy/${listing.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete transaction.");
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPurchaseSuccess(true);
        fetchListing(); // Refresh listing to show 'sold' status or updated sales
      }
    } catch(err: any) {
      setError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = () => {
    const token = localStorage.getItem("aurevyxon_token");
    window.open(`/api/downloads/${listing.id}?token=${token}`, "_blank");
  };

  if (error) {
    return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  if (!listing) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  }

  const isExclusive = listing.mode === "Exclusive";
  const isSoldOut = isExclusive && listing.status === 'sold';
  const isSeller = listing.seller_id === user?.id;
  const isBuyer = listing.buyer_id === user?.id;
  const hasAccess = isSeller || isBuyer;
  const discountPct = listing.discount_percentage || 0;
  const originalPrice = listing.price || 0;
  const discountedPrice = originalPrice - (originalPrice * (discountPct / 100));

  return (
    <div className="pb-20">
      {/* Header bar */}
      <div className="border-b border-border/20 bg-background/80 backdrop-blur-md sticky top-16 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
           <Link to="/" className="text-muted-foreground hover:text-foreground dark:text-white flex items-center text-sm font-medium">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Market
           </Link>
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                {discountPct > 0 ? (
                  <>
                     <span className="text-xs text-muted-foreground line-through">${originalPrice.toLocaleString()}</span>
                     <span className="font-display font-bold text-lg text-emerald-400">${discountedPrice.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="font-display font-bold text-lg">${originalPrice.toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={handleShare} className="border-border bg-muted">
                  <Share className="w-4 h-4 text-foreground dark:text-white" />
                </Button>
                {isSeller ? (
                  <Link to={`/manage/${listing.id}`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white font-semibold shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                       Manage System
                    </Button>
                  </Link>
                ) : isSoldOut ? (
                  <Badge variant="outline" className="text-red-500 border-red-500 bg-red-500/10 h-8">SOLD OUT</Badge>
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={toggleWishlist} className={`border-border ${inWishlist ? 'bg-pink-500/10 border-pink-500/30' : 'bg-muted'}`}>
                      <Heart className={`w-4 h-4 ${inWishlist ? 'fill-pink-500 text-pink-500' : 'text-foreground dark:text-white'}`} />
                    </Button>
                    <Button size="sm" onClick={() => setShowCheckoutModal(true)} disabled={purchasing} className={isExclusive ? "bg-amber-500 hover:bg-amber-400 text-black font-semibold cursor-pointer" : "bg-indigo-500 hover:bg-indigo-600 font-semibold cursor-pointer"}>
                       {purchasing ? "Processing..." : (isExclusive ? "Acquire Now" : "Purchase License")}
                    </Button>
                  </div>
                ) : (
                  <LoginDialog>
                    <Button size="sm" className={isExclusive ? "bg-amber-500 hover:bg-amber-400 text-black font-semibold" : "bg-indigo-500 hover:bg-indigo-600 font-semibold"}>
                       Sign in to Buy
                    </Button>
                  </LoginDialog>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {purchaseSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-6 rounded-2xl flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Transaction Successful!</h3>
                  <p className="text-sm opacity-80">You have successfully acquired {listing.title}.</p>
                </div>
              </div>
            )}
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="flex gap-2 mb-4 flex-wrap">
                 {isSoldOut ? (
                   <Badge className="bg-red-500 text-foreground dark:text-white hover:bg-red-600">UNAVAILABLE: ACQUIRED</Badge>
                 ) : isExclusive ? (
                   <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20">EXCLUSIVE ACQUISITION</Badge>
                 ) : (
                   <Badge variant="secondary" className="bg-muted border-border">UNLIMITED LICENSE</Badge>
                 )}
                 <Badge variant="secondary" className="bg-muted border-border">{listing.type}</Badge>
                 {listing.platform && listing.platform !== "All" && (
                   <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-border">{listing.platform}</Badge>
                 )}
                 {listing.custom_badge && (
                   <Badge className="bg-pink-500 text-foreground dark:text-white border-none">{listing.custom_badge}</Badge>
                 )}
                 {discountPct > 0 && listing.discount_type !== "None" && (
                   <Badge className="bg-red-500 text-foreground dark:text-white border-none animate-pulse">{discountPct}% OFF (Limited Time)</Badge>
                 )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">{listing.title}</h1>
              <p className="text-xl text-muted-foreground mb-6">{listing.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                     {listing.author?.[0] || "U"}
                   </div>
                   <div>
                     <p className="text-muted-foreground text-xs">Creator</p>
                     <p className="font-medium text-foreground dark:text-white flex items-center gap-1">
                       {listing.author || "Unknown"}
                       {listing.is_verified ? <VerifiedBadge className="ml-2" /> : null}
                     </p>
                   </div>
                 </div>
                 {!isExclusive && (
                    <>
                      <div className="w-px h-8 bg-muted/50" />
                      <div className="flex items-center gap-2">
                         <div className="flex text-yellow-500 items-center">
                           <Star className="w-5 h-5 fill-yellow-500 mr-2" />
                           <span className="font-bold text-lg text-white">{listing.rating ? listing.rating.toFixed(1) : "0.0"}</span>
                           <span className="text-muted-foreground ml-2">({listing.review_count || 0} reviews)</span>
                         </div>
                      </div>
                      <div className="w-px h-8 bg-muted/50" />
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Download className="w-4 h-4" /> {listing.sales || 0} Sales
                      </div>
                    </>
                 )}
                 {isSoldOut && (
                    <>
                      <div className="w-px h-8 bg-muted/50" />
                      <div className="flex items-center gap-2 text-red-400">
                        <Lock className="w-4 h-4" /> Permanently Transferred
                      </div>
                    </>
                 )}
              </div>
            </motion.div>

            {/* Media Gallery */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }} 
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="space-y-4"
            >
               {listing.screenshots && listing.screenshots.length > 0 ? (
                 <div className="space-y-4">
                    {/* Horizontal Scrollable Carousel */}
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
                       {listing.screenshots.map((src: string, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => setLightboxImage(src)}
                            className="aspect-video shrink-0 w-full md:w-[85%] snap-center rounded-2xl overflow-hidden glass border border-border/40 hover:border-indigo-500/60 transition-all cursor-zoom-in relative group"
                          >
                            <img 
                              src={src} 
                              alt={`${listing.title} screenshot ${i+1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              onError={(e: any) => {
                                const target = e.target as HTMLImageElement;
                                const filename = src.split('/').pop();
                                if (filename && !target.dataset.retried) {
                                  target.dataset.retried = 'true';
                                  target.src = `/uploads/images/${filename}`;
                                } else if (listing.image_url) {
                                  target.src = listing.image_url;
                                }
                              }}
                            />
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to expand ({i + 1}/{listing.screenshots.length})
                            </div>
                          </div>
                       ))}
                    </div>

                    {/* Thumbnail Selector Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
                       {listing.screenshots.map((src: string, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => setLightboxImage(src)}
                            className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-indigo-500 cursor-pointer transition-all hover:scale-105 bg-black/40 relative"
                          >
                            <img 
                              src={src} 
                              alt={`Thumb ${i+1}`} 
                              className="w-full h-full object-cover" 
                              onError={(e: any) => {
                                const target = e.target as HTMLImageElement;
                                const filename = src.split('/').pop();
                                if (filename && !target.dataset.retried) {
                                  target.dataset.retried = 'true';
                                  target.src = `/uploads/images/${filename}`;
                                }
                              }}
                            />
                          </div>
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className="rounded-2xl overflow-hidden border border-border glass relative aspect-video">
                   <img 
                     src={listing.image_url || listing.image} 
                     alt={listing.title} 
                     referrerPolicy="no-referrer" 
                     className="w-full h-full object-cover" 
                   />
                 </div>
               )}
            </motion.div>

            {/* Lightbox Fullscreen Modal */}
            {lightboxImage && (
               <div 
                 className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                 onClick={() => setLightboxImage(null)}
               >
                 <button 
                   onClick={() => setLightboxImage(null)} 
                   className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-50"
                 >
                   <X className="w-6 h-6" />
                 </button>
                 <div className="max-w-6xl max-h-[90vh] relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                   <img 
                     src={lightboxImage} 
                     alt="Enlarged Screenshot" 
                     className="w-full h-full object-contain max-h-[85vh]" 
                     onError={(e: any) => {
                       const target = e.target as HTMLImageElement;
                       const filename = lightboxImage.split('/').pop();
                       if (filename && !target.dataset.retried) {
                         target.dataset.retried = 'true';
                         target.src = `/uploads/images/${filename}`;
                       }
                     }}
                   />
                 </div>
               </div>
            )}

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="mt-12">
              <TabsList className="bg-muted border border-border p-1 rounded-xl mb-6">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Overview</TabsTrigger>
                <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Features & Tech</TabsTrigger>
                {isExclusive && <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Business Analytics</TabsTrigger>}
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Reviews ({listing.review_count || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 text-muted-foreground leading-relaxed">
                 <h3 className="text-2xl font-display font-semibold text-foreground dark:text-white mb-4">About this Product</h3>
                 <p>This premium digital asset is built using the latest modern technologies and follows best practices for scalable architecture and high-performance user interfaces.</p>
                 <p>Whether you are looking to bootstrap a new startup, upgrade existing infrastructure, or acquire a cash-flowing business, this product delivers exceptional value.</p>
                 
                 <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="p-4 rounded-xl bg-muted border border-border/20">
                       <Cpu className="w-6 h-6 text-indigo-400 mb-3" />
                       <h4 className="font-medium text-foreground dark:text-white mb-1">Production Ready</h4>
                       <p className="text-sm">Optimized for immediate deployment to cloud providers.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted border border-border/20">
                       <FileJson className="w-6 h-6 text-pink-400 mb-3" />
                       <h4 className="font-medium text-foreground dark:text-white mb-1">Clean Architecture</h4>
                       <p className="text-sm">Highly modular and maintainable codebase structure.</p>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  {listing.tags?.length > 0 ? listing.tags.map((tag: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-foreground dark:text-white">{tag}</span>
                    </div>
                  )) : (
                    ['React Component', 'Tailwind Supported', 'Clean Code'].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-foreground dark:text-white">{feature}</span>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {isExclusive && (
                <TabsContent value="analytics" className="space-y-6">
                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-muted border border-border text-center">
                        <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-3xl font-display font-bold text-foreground dark:text-white">$15.2k</p>
                        <p className="text-sm text-muted-foreground">Monthly Rev</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted border border-border text-center">
                        <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-3xl font-display font-bold text-foreground dark:text-white">45k</p>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted border border-border text-center">
                        <Shield className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-3xl font-display font-bold text-foreground dark:text-white">92%</p>
                        <p className="text-sm text-muted-foreground">Retention Rate</p>
                      </div>
                   </div>
                   <div className="aspect-[21/9] rounded-2xl bg-muted border border-border flex items-center justify-center relative overflow-hidden mt-6">
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/20 to-transparent" />
                      <p className="text-muted-foreground z-10 flex items-center gap-2"><Lock className="w-4 h-4" /> Comprehensive Analytics available upon NDA signing.</p>
                   </div>
                </TabsContent>
              )}
              <TabsContent value="reviews" className="space-y-6">
                  <h3 className="text-2xl font-display font-semibold text-foreground dark:text-white mb-4">Customer Reviews</h3>
                  {reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                      <div className="space-y-6">
                          <div className="flex flex-col md:flex-row gap-8 bg-white/[0.02] p-6 rounded-2xl border border-border">
                              <div className="flex flex-col items-center justify-center min-w-[150px]">
                                  <div className="text-5xl font-bold font-display">{listing.rating ? listing.rating.toFixed(1) : "0.0"}</div>
                                  <div className="flex text-yellow-500 mt-2 mb-1">
                                      {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(listing.rating || 0) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{listing.review_count || 0} reviews</div>
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-2">
                                  {[5,4,3,2,1].map(star => {
                                      const count = (reviewsData.distribution || {})[star.toString()] || 0;
                                      const pct = listing.review_count > 0 ? (count / listing.review_count) * 100 : 0;
                                      return (
                                          <div key={star} className="flex items-center gap-3 text-sm">
                                              <div className="w-8 flex items-center gap-1 text-muted-foreground">{star} <Star className="w-3 h-3"/></div>
                                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} />
                                              </div>
                                              <div className="w-10 text-right text-muted-foreground">{count}</div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                          
                          <div className="space-y-4">
                              {reviewsData.reviews.map((review: any) => (
                                  <div key={review.id} className="p-6 bg-white/[0.02] border border-border rounded-xl">
                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <div className="font-bold text-white flex items-center gap-2">
                                                  {review.user_name}
                                                  {review.verified_purchase && (
                                                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                          <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                                                      </span>
                                                  )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString()}</div>
                                          </div>
                                          <div className="flex text-yellow-500">
                                              {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />)}
                                          </div>
                                      </div>
                                      {review.review_text && <p className="text-muted-foreground mt-2">{review.review_text}</p>}
                                      {review.media_url && (
                                          <div className="mt-4">
                                              <img src={review.media_url} alt="Review media" className="h-32 w-auto object-cover rounded-lg border border-border" />
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="text-center p-12 bg-white/[0.02] border border-border rounded-xl">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h4 className="text-lg font-bold text-white mb-2">No reviews yet</h4>
                          <p className="text-muted-foreground">Be the first to review this product after purchase.</p>
                      </div>
                  )}
              </TabsContent>
            </Tabs>

          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="rounded-2xl border border-border glass-card p-6">
                 {isSoldOut ? (
                   <div className="text-center py-6">
                     <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">Acquired</h3>
                     <p className="text-muted-foreground mb-6">This asset has been permanently fully-transferred to its new owner.</p>
                     {hasAccess && listing.file_url ? (
                        <div onClick={handleDownload} className="cursor-pointer">
                          <Button className="w-full bg-indigo-500 hover:bg-indigo-400 text-foreground dark:text-white font-bold h-12">
                            <Download className="w-4 h-4 mr-2" /> Download Assets
                          </Button>
                        </div>
                     ) : null}
                     {isSeller && (
                       <Link to={`/manage/${listing.id}`}>
                         <Button className="w-full mt-3 bg-muted/50 hover:bg-white/20 text-foreground dark:text-white font-bold h-12">
                           Manage System
                         </Button>
                       </Link>
                     )}
                   </div>
                 ) : isExclusive ? (
                   <>
                     <div className="flex items-center gap-3 mb-6">
                       <span className="bg-amber-500/20 text-amber-400 p-2.5 rounded-xl"><Lock className="w-7 h-7" /></span>
                       <div>
                         <h3 className="font-display font-bold text-xl text-foreground dark:text-white">Exclusive Rights</h3>
                         <p className="text-sm text-amber-400 font-medium">1 of 1 Available</p>
                       </div>
                     </div>
                     <div className="flex items-end gap-3 mb-6">
                       {discountPct > 0 ? (
                         <>
                           <div className="text-4xl font-display font-bold text-emerald-400">${discountedPrice.toLocaleString()}</div>
                           <div className="text-xl text-muted-foreground line-through mb-1">${originalPrice.toLocaleString()}</div>
                         </>
                       ) : (
                         <div className="text-4xl font-display font-bold">${originalPrice.toLocaleString()}</div>
                       )}
                     </div>
                     
                     {isSeller ? (
                       <Link to={`/manage/${listing.id}`}>
                         <Button size="lg" className="w-full mb-4 bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white font-bold h-14 text-lg">
                           Manage System
                         </Button>
                       </Link>
                     ) : isBuyer ? (
                       <Button size="lg" onClick={handleDownload} className="w-full mb-4 bg-emerald-500 hover:bg-emerald-400 text-foreground dark:text-white font-bold h-14 text-lg">
                         <Download className="w-5 h-5 mr-2" /> Download Source
                       </Button>
                     ) : isAuthenticated ? (
                       <>
                       {/* Discount & Savings Breakdown Card */}
                        <div className="my-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1 text-xs mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-medium flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Original Price:
                            </span>
                            <span className={`font-mono font-bold ${discountPct > 0 ? "line-through text-slate-400" : "text-white"}`}>
                              ${originalPrice.toFixed(2)}
                            </span>
                          </div>
                          {discountPct > 0 ? (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5 text-emerald-400" /> Instant Discount ({discountPct}% OFF):
                              </span>
                              <span className="font-mono font-bold text-emerald-400">-${(originalPrice * (discountPct / 100)).toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Discount:</span>
                              <span className="font-mono">0% OFF</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                            <span className="text-white font-medium">Final Price You Pay:</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">${discountedPrice.toFixed(2)}</span>
                          </div>
                        </div>
                       <Button size="lg" onClick={() => setShowCheckoutModal(true)} disabled={purchasing} className="w-full mb-4 bg-amber-500 hover:bg-amber-400 text-black font-bold h-14 text-lg cursor-pointer">
                         {purchasing ? "Processing..." : "Acquire Full Ownership"}
                       </Button>
                       </>
                     ) : (
                       <LoginDialog>
                         <Button size="lg" className="w-full mb-4 bg-amber-500 hover:bg-amber-400 text-black font-bold h-14 text-lg">
                           Sign In To Acquire
                         </Button>
                       </LoginDialog>
                     )}
                     
                     {!isSeller && !isBuyer && (
                       <Button variant="outline" className="w-full bg-muted border-border h-12">
                         Contact Seller via Escrow
                       </Button>
                     )}

                     <Separator className="my-6 bg-muted/50" />

                     <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-500 mt-0.5" /> Sole ownership transfer</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-500 mt-0.5" /> Source code & IP rights</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-500 mt-0.5" /> Tech stack migration support</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-amber-500 mt-0.5" /> Blockchain certificate minted</li>
                     </ul>
                   </>
                 ) : (
                   <>
                     <div className="mb-6">
                         <div className="flex items-end gap-3 mb-2">
                           {discountPct > 0 ? (
                             <>
                               <h3 className="font-display font-bold text-3xl text-emerald-400">${discountedPrice.toLocaleString()}</h3>
                               <h3 className="font-display font-medium text-lg text-muted-foreground line-through mb-1">${originalPrice.toLocaleString()}</h3>
                             </>
                           ) : (
                             <h3 className="font-display font-bold text-2xl text-foreground dark:text-white">${originalPrice.toLocaleString()}</h3>
                           )}
                         </div>
                         <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 bg-indigo-400/10">Standard License</Badge>
                     </div>

                     {isSeller ? (
                       <Link to={`/manage/${listing.id}`}>
                          <Button size="lg" className="w-full mb-4 bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white font-bold h-14 text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                            Manage System
                          </Button>
                       </Link>
                     ) : isBuyer ? (
                       <Button size="lg" onClick={handleDownload} className="w-full mb-4 bg-emerald-500 hover:bg-emerald-400 text-foreground dark:text-white font-bold h-14 text-lg">
                         <Download className="w-5 h-5 mr-2" /> Download Source
                       </Button>
                     ) : isAuthenticated ? (
                       <>
                       {/* Discount & Savings Breakdown Card */}
                        <div className="my-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1 text-xs mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-medium flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Original Price:
                            </span>
                            <span className={`font-mono font-bold ${discountPct > 0 ? "line-through text-slate-400" : "text-white"}`}>
                              ${originalPrice.toFixed(2)}
                            </span>
                          </div>
                          {discountPct > 0 ? (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5 text-emerald-400" /> Instant Discount ({discountPct}% OFF):
                              </span>
                              <span className="font-mono font-bold text-emerald-400">-${(originalPrice * (discountPct / 100)).toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Discount:</span>
                              <span className="font-mono">0% OFF</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                            <span className="text-white font-medium">Final Price You Pay:</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">${discountedPrice.toFixed(2)}</span>
                          </div>
                        </div>
                       <Button size="lg" onClick={() => setShowCheckoutModal(true)} disabled={purchasing} className="w-full mb-4 bg-indigo-500 hover:bg-indigo-600 text-foreground dark:text-white font-bold h-14 text-lg cursor-pointer">
                         {purchasing ? "Processing..." : "Purchase & Download"}
                       </Button>
                       </>
                     ) : (
                       <LoginDialog>
                         <Button size="lg" className="w-full mb-4 bg-indigo-500 hover:bg-indigo-600 text-foreground dark:text-white font-bold h-14 text-lg">
                           Sign In To Purchase
                         </Button>
                       </LoginDialog>
                     )}

                     {hasAccess && listing.file_url ? (
                        <div onClick={handleDownload} className="block mb-4 cursor-pointer">
                          <Button variant="outline" className="w-full border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 h-12">
                            <Download className="w-4 h-4 mr-2" /> Download File (Owned)
                          </Button>
                        </div>
                     ) : null}
                     
                     <Separator className="my-6 bg-muted/50" />

                     <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 mt-0.5" /> Use for unlimited projects</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 mt-0.5" /> Direct support from creator</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 mt-0.5" /> Lifetime free updates</li>
                     </ul>
                   </>
                 )}
              </div>

              <div className="rounded-2xl border border-border bg-muted p-5 flex items-center gap-4">
                 <Shield className="w-10 h-10 text-green-400 p-2 bg-green-400/10 rounded-full" />
                 <div>
                    <h4 className="font-medium text-foreground dark:text-white">Payment Protected</h4>
                    <p className="text-xs text-muted-foreground">Transactions are secured by enterprise encryption.</p>
                 </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Payment & Order Summary Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101020] border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" /> Payment & Order Breakdown
                </h3>
                <p className="text-xs text-slate-400">Review price breakdown and discount savings before payment</p>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-black/60 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">Item Name:</span>
                <span className="font-bold text-white max-w-[200px] truncate">{listing?.title}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">Original Item Price:</span>
                <span className={`font-bold font-mono ${discountPct > 0 ? "line-through text-slate-400" : "text-white"}`}>
                  ${originalPrice.toFixed(2)}
                </span>
              </div>

              {discountPct > 0 ? (
                <div className="flex justify-between items-center text-sm text-emerald-400">
                  <span className="font-medium flex items-center gap-1">
                    <Percent className="w-4 h-4 text-emerald-400" /> Instant Discount ({discountPct}% OFF):
                  </span>
                  <span className="font-bold font-mono">-${(originalPrice * (discountPct / 100)).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span className="font-medium flex items-center gap-1">
                    <Tag className="w-4 h-4 text-slate-400" /> Instant Discount:
                  </span>
                  <span className="font-mono text-slate-400">$0.00 (0% OFF)</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-base font-bold">
                <span className="text-white">Total Amount You Pay:</span>
                <span className="text-emerald-400 font-mono text-xl">${discountedPrice.toFixed(2)}</span>
              </div>
            </div>

            {discountPct > 0 ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Special Offer Savings:</strong> You receive an instant discount of <strong>${(originalPrice * (discountPct / 100)).toFixed(2)} ({discountPct}% OFF)</strong> on this product with immediate digital download access.
                </span>
              </div>
            ) : (
              <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Buyer Protection Guaranteed:</strong> Encrypted payment process with instant source access and lifetime product updates.
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline"
                onClick={() => setShowCheckoutModal(false)}
                className="w-1/3 border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowCheckoutModal(false);
                  handlePurchase();
                }}
                disabled={purchasing}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                {purchasing ? "Processing..." : `Confirm & Pay $${discountedPrice.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
