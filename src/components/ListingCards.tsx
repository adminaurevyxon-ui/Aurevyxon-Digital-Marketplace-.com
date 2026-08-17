import React from "react";
import { safeJson } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Star, Download, Heart, CheckCircle, User as UserIcon, Share, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Listing, User } from "@/types";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
export function ListingCard({ listing, i, currentUserId, initialWishlist = false }: { key?: string | number, listing: Listing; i: number; currentUserId?: string, initialWishlist?: boolean }) {
  const { convert } = useCurrency();
  const navigate = useNavigate();
  const [inWishlist, setInWishlist] = useState(initialWishlist);

  useEffect(() => {
     setInWishlist(initialWishlist);
  }, [initialWishlist]);

  // Initial check could be done if we passed it down, but for now we just handle toggle
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/listing/${listing.id}`;
    if (navigator.share) {
      navigator.share({ title: listing.title, url }).catch(console.warn);
    } else {
      navigator.clipboard.writeText(url).catch(e => console.warn("Clipboard failed", e));
      toast("Link copied to clipboard!");
    }
  };
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("aurevyxon_token");
    if (!token) {
        toast("Please login to use wishlist");
        return;
    }
    
    try {
      const res = await fetch(`/api/wishlists/${listing.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await safeJson(res);
      if (data.status === "added") setInWishlist(true);
      else if (data.status === "removed") setInWishlist(false);
    } catch(err) {
      console.warn(err);
    }
  };

  const discountPct = listing.discount_percentage || 0;
  const discountedPrice = listing.price - (listing.price * (discountPct / 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
    >
      <Link to={`/listing/${listing.id}`} className="block group">
        <Card className="bg-muted/40 border-border/20 hover:bg-white/[0.02] hover:border-indigo-500/30 transition-all duration-300 h-full flex flex-col relative">
          <button 
            onClick={handleShare}
            className="absolute top-3 right-12 z-30 p-2 rounded-full bg-muted/40 hover:bg-background/60 backdrop-blur-md transition-colors"
          >
            <Share className="w-4 h-4 text-foreground dark:text-white" />
          </button>
          
          <button 
            onClick={toggleWishlist}
            className="absolute top-3 right-3 z-30 p-2 rounded-full bg-muted/40 hover:bg-background/60 backdrop-blur-md transition-colors"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? "fill-pink-500 text-pink-500" : "text-foreground dark:text-white"}`} />
          </button>

          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-muted/50">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <img 
              src={listing.image_url || listing.image} 
              alt={listing.title}
              referrerPolicy="no-referrer"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
            <Badge variant="secondary" className="absolute top-3 left-3 bg-background/70 backdrop-blur-md border-border z-20">
              {listing.type}
            </Badge>
            {listing.platform && listing.platform !== "All" && (
              <Badge variant="secondary" className="absolute top-3 left-24 bg-indigo-500/20 text-indigo-300 backdrop-blur-md border-border z-20">
                {listing.platform}
              </Badge>
            )}
            {listing.mode === "Exclusive" && (
              <Badge className="absolute top-12 right-3 bg-amber-500 text-black hover:bg-amber-400 font-semibold border-none z-20">
                EXCLUSIVE
              </Badge>
            )}
            {listing.is_featured ? (
              <Badge className="absolute top-12 left-3 bg-indigo-500 text-foreground dark:text-white border-none z-20">
                FEATURED
              </Badge>
            ) : null}
            {listing.custom_badge && (
              <Badge className="absolute bottom-3 left-3 bg-pink-500 text-foreground dark:text-white border-none z-20">
                {listing.custom_badge}
              </Badge>
            )}
            {discountPct > 0 && listing.discount_type !== "None" && (
              <Badge className="absolute top-3 right-12 bg-red-500 text-foreground dark:text-white border-none z-20 animate-pulse">
                {discountPct}% OFF (Limited Time)
              </Badge>
            )}
          </div>
          <CardContent className="p-4 flex-1">
            <h3 className="font-display font-medium text-base mb-1 line-clamp-2 min-h-[3rem] group-hover:text-indigo-400 transition-colors">
              {listing.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center"><Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" /> {listing.rating ? listing.rating.toFixed(1) : "0.0"} <span className="ml-1 opacity-70">({listing.review_count || 0})</span></span>
                <span className="flex items-center"><Download className="w-3 h-3 mr-1" /> {listing.sales || 0}</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex flex-col items-start justify-between border-t border-border/20 mt-auto bg-white/[0.01]">
              <div className="flex w-full items-center justify-between mb-2 mt-3">
                <div className="flex flex-col">
                   {discountPct > 0 ? (
                     <>
                        <span className="text-xs text-muted-foreground line-through">{convert(listing.price)}</span>
                        <span className="text-lg font-bold text-emerald-400">{convert(discountedPrice)}</span>
                     </>
                   ) : (
                      <span className="text-lg font-bold">{convert(listing.price)}</span>
                   )}
                </div>
                {currentUserId && currentUserId === listing.seller_id ? (
                  <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/manage/${listing.id}`); }} className="h-8 rounded-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                    Manage
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="h-8 rounded-full bg-muted/50 hover:bg-white/20">
                    Get details
                  </Button>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                <UserIcon className="w-3 h-3" />
                {listing.author}
                {listing.is_verified ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : null}
              </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Play Store Style Card for Mobile Apps
// -------------------------------------------------------------
export function PlayStoreCard({ listing, i, currentUserId }: { key?: string | number, listing: Listing; i: number; currentUserId?: string }) {
  const { convert } = useCurrency();
  const navigate = useNavigate();
  const discountPct = listing.discount_percentage || 0;
  const discountedPrice = listing.price - (listing.price * (discountPct / 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
    >
      <Link to={`/listing/${listing.id}`} className="block group h-full">
        <div className="flex flex-col h-full bg-white/[0.02] hover:bg-white/[0.05] p-3 rounded-2xl border border-transparent hover:border-border transition-all cursor-pointer">
          <div className="relative mb-3">
             <img 
               src={listing.image_url || listing.image} 
               alt={listing.title}
               className="w-full aspect-square rounded-2xl object-cover shadow-lg group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
             />
             {discountPct > 0 && listing.discount_type !== "None" && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-foreground dark:text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-red-500/20 z-10 animate-pulse">
                  {discountPct}% OFF
                </div>
             )}
          </div>
          <div className="flex-1">
             <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">{listing.title}</h3>
             <div className="flex items-center gap-2 mb-1 flex-wrap">
               <p className="text-[11px] text-muted-foreground line-clamp-1">{listing.custom_badge || listing.type}</p>
               {listing.platform && listing.platform !== "All" && (
                 <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 font-medium whitespace-nowrap">
                   {listing.platform}
                 </span>
               )}
             </div>
             <div className="flex items-center text-[10px] text-yellow-500 mb-2">
                <span>★ {listing.rating ? listing.rating.toFixed(1) : "0.0"} <span className="text-gray-500 ml-0.5">({listing.review_count || 0})</span></span>
             </div>
          </div>
          <div className="mt-auto flex items-center justify-between">
             <div>
               {discountPct > 0 ? (
                 <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground line-through">{convert(listing.price)}</span>
                    <span className="text-sm font-bold text-emerald-400">{convert(discountedPrice)}</span>
                 </div>
               ) : (
                  <span className="text-sm font-bold">{convert(listing.price)}</span>
               )}
             </div>
             {currentUserId && currentUserId === listing.seller_id && (
               <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/manage/${listing.id}`); }} className="h-6 text-[10px] px-2 rounded-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">Manage</Button>
             )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Large Website Showcase Card
// -------------------------------------------------------------
export function WebsiteCard({ listing, i, currentUserId }: { key?: string | number, listing: Listing; i: number; currentUserId?: string }) {
  const { convert } = useCurrency();
  const navigate = useNavigate();
  const discountPct = listing.discount_percentage || 0;
  const discountedPrice = listing.price - (listing.price * (discountPct / 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1 }}
      className="h-full"
    >
      <Link to={`/listing/${listing.id}`} className="block group h-full">
        <Card className="bg-background/20 border-border/20 hover:border-blue-500/30 transition-all duration-300 h-full overflow-hidden flex flex-col">
          {/* MacOS style window header */}
          <div className="h-8 bg-white/[0.03] border-b border-border/20 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <div className="ml-4 text-xs text-muted-foreground truncate opacity-50 flex items-center gap-2">
               <Lock className="w-3 h-3" /> {listing.demo_url ? new URL(listing.demo_url).hostname : `Local Environment`}
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden bg-muted/50">
            <img 
               src={listing.image_url || listing.image} 
               alt={listing.title}
               className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            {discountPct > 0 && listing.discount_type !== "None" && (
                <Badge className="absolute top-4 right-4 bg-red-500 text-foreground dark:text-white font-bold border-none shadow-lg animate-pulse">
                  {discountPct}% OFF - Limited Time
                </Badge>
             )}
             {listing.custom_badge && (
               <Badge className="absolute bottom-4 left-4 bg-indigo-600/90 backdrop-blur-md text-foreground dark:text-white font-medium border-none shadow-lg">
                  {listing.custom_badge}
               </Badge>
             )}
          </div>
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-display font-medium text-2xl group-hover:text-blue-400 transition-colors leading-tight">
                {listing.title}
              </h3>
              <div className="bg-muted px-3 py-1 rounded-full text-sm font-medium flex items-center gap-3">
                {currentUserId && currentUserId === listing.seller_id && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/manage/${listing.id}`); }}>
                     <span className="text-indigo-400 text-xs hover:underline cursor-pointer">Manage System</span>
                  </button>
                )}
                {discountPct > 0 ? (
                   <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground line-through">{convert(listing.price)}</span>
                      <span className="text-emerald-400 leading-none">{convert(discountedPrice)}</span>
                   </div>
                ) : (
                   <span>{convert(listing.price)}</span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-auto">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="bg-muted/20 rounded-xl overflow-hidden animate-pulse border border-border/10 flex flex-col h-full">
      <div className="w-full aspect-[4/3] bg-muted/40"></div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="h-5 bg-muted/40 rounded w-3/4"></div>
        <div className="h-4 bg-muted/40 rounded w-1/2"></div>
        <div className="mt-auto flex justify-between items-center pt-2">
           <div className="h-5 bg-muted/40 rounded w-1/4"></div>
           <div className="h-5 bg-muted/40 rounded w-8"></div>
        </div>
      </div>
    </div>
  );
}


export function PlayStoreSkeleton() {
  return (
    <div className="flex flex-col h-full p-3 rounded-2xl border border-transparent bg-muted/20 animate-pulse">
      <div className="w-full aspect-square rounded-2xl bg-muted/40 mb-3"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted/40 rounded w-full"></div>
        <div className="h-3 bg-muted/40 rounded w-2/3"></div>
      </div>
      <div className="mt-3">
        <div className="h-4 bg-muted/40 rounded w-1/3"></div>
      </div>
    </div>
  );
}

export function WebsiteSkeleton() {
  return (
    <div className="bg-background/20 rounded-xl overflow-hidden animate-pulse border border-border/10 flex flex-col h-full">
      <div className="h-8 bg-muted/30 border-b border-border/20 flex items-center px-4 gap-2">
         <div className="w-3 h-3 rounded-full bg-muted/50" />
         <div className="w-3 h-3 rounded-full bg-muted/50" />
         <div className="w-3 h-3 rounded-full bg-muted/50" />
      </div>
      <div className="w-full aspect-[16/10] bg-muted/40"></div>
      <div className="p-6 flex-1 flex flex-col gap-3">
        <div className="h-6 bg-muted/40 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted/40 rounded w-1/2"></div>
        <div className="h-4 bg-muted/40 rounded w-5/6"></div>
        <div className="mt-auto flex justify-between items-center pt-4">
           <div className="h-6 bg-muted/40 rounded w-1/4"></div>
           <div className="h-6 bg-muted/40 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
}
