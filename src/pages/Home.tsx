import { toast } from "sonner";
import React, { useEffect, useState } from "react";
import { safeJson } from "@/lib/utils";
import { motion } from "motion/react";
import { ArrowRight, Star, Shield, Zap, Lock, Download, ChevronRight, User, Search, CheckCircle, Filter, Smartphone, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { categories, extraFilters } from "@/lib/categories";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoginDialog } from "@/components/LoginDialog";
import { ListingCard, PlayStoreCard, WebsiteCard, ListingSkeleton, PlayStoreSkeleton, WebsiteSkeleton } from "@/components/ListingCards";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  mode: string;
  sales: number;
  rating: number;
  author: string;
  image_url: string;
  image: string;
  demo_url?: string;
  tags: string[];
  is_verified?: boolean;
  is_featured?: boolean;
  review_count?: number;
  weighted_rating?: number;
  discount_percentage?: number;
  discount_type?: string;
  custom_badge?: string;
  screenshots?: string;
  seller_id?: string;
  platform?: string;
}

export default function Home() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "All";
  const subCategoryFilter = searchParams.get("sub_category") || "All";
  const platformFilter = searchParams.get("platform") || "All";
  const modeFilter = searchParams.get("mode") || "All";
  const minPriceFilter = searchParams.get("minPrice") || "";
  const maxPriceFilter = searchParams.get("maxPrice") || "";
  const frameworkFilter = searchParams.get("framework") || "All";
  const licenseFilter = searchParams.get("license_type") || "All";
  const fileTypeFilter = searchParams.get("file_type") || "All";
  const languageFilter = searchParams.get("language") || "All";
  const compatibilityFilter = searchParams.get("compatibility") || "All";
  const supportFilter = searchParams.get("support_type") || "All";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let url = `/api/listings?q=${encodeURIComponent(q)}`;
    if (categoryFilter !== "All") url += `&category=${encodeURIComponent(categoryFilter)}`;
    if (subCategoryFilter !== "All") url += `&sub_category=${encodeURIComponent(subCategoryFilter)}`;
    if (platformFilter !== "All") url += `&platform=${encodeURIComponent(platformFilter)}`;
    if (modeFilter !== "All") url += `&mode=${encodeURIComponent(modeFilter)}`;
    if (frameworkFilter !== "All") url += `&framework=${encodeURIComponent(frameworkFilter)}`;
    if (licenseFilter !== "All") url += `&license_type=${encodeURIComponent(licenseFilter)}`;
    if (fileTypeFilter !== "All") url += `&file_type=${encodeURIComponent(fileTypeFilter)}`;
    if (languageFilter !== "All") url += `&language=${encodeURIComponent(languageFilter)}`;
    if (compatibilityFilter !== "All") url += `&compatibility=${encodeURIComponent(compatibilityFilter)}`;
    if (supportFilter !== "All") url += `&support_type=${encodeURIComponent(supportFilter)}`;
    if (minPriceFilter) url += `&minPrice=${encodeURIComponent(minPriceFilter)}`;
    if (maxPriceFilter) url += `&maxPrice=${encodeURIComponent(maxPriceFilter)}`;

    setLoading(true);
    fetch(url)
      .then((res) => safeJson(res, { listings: [] }))
      .then((data) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Fetch error:", err);
        setLoading(false);
      });
      
    if (user) {
       const token = localStorage.getItem("aurevyxon_token");
       if (token) {
           fetch('/api/wishlists', { headers: { Authorization: `Bearer ${token}` }})
             .then(res => safeJson(res, { wishlists: [] }))
             .then(data => {
                if (data.wishlists) {
                    setWishlistIds(new Set(data.wishlists.map((w: any) => w.id)));
                }
             })
             .catch(err => console.warn("Wishlist fetch error:", err));
       }
    }
  }, [q, categoryFilter, platformFilter, modeFilter, minPriceFilter, maxPriceFilter, user]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "All") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    if (key === "category" && value !== "Mobile Apps") {
       newParams.delete("platform");
    }
    
    setSearchParams(newParams);
  };

  const exclusiveListings = listings.filter((l) => l.mode === "Exclusive");
  const unlimitedListings = listings.filter((l) => l.mode === "Unlimited");
  
  const mobileApps = listings.filter((l) => l.type === "Mobile Apps");
  const websites = listings.filter((l) => l.type === "Website");

  const renderCategorizedGrid = () => {
    if (loading) {
       if (categoryFilter === "Mobile Apps") {
           return (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {[...Array(12)].map((_, i) => (
                 <PlayStoreSkeleton key={i} />
               ))}
             </div>
           );
       } else if (categoryFilter === "Website") {
           return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[...Array(4)].map((_, i) => (
                 <WebsiteSkeleton key={i} />
               ))}
             </div>
           );
       } else {
           return (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[...Array(8)].map((_, i) => (
                 <ListingSkeleton key={i} />
               ))}
             </div>
           );
       }
    }
    if (categoryFilter === "Mobile Apps") {
       return (
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {listings.map((listing, i) => (
             <PlayStoreCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} />
           ))}
         </div>
       );
    } else if (categoryFilter === "Website") {
       return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {listings.map((listing, i) => (
             <WebsiteCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} />
           ))}
         </div>
       );
    } else {
       return (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {listings.map((listing, i) => (
             <ListingCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} initialWishlist={typeof wishlistIds !== 'undefined' ? wishlistIds.has(listing.id) : false} />
           ))}
         </div>
       );
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      {!q && categoryFilter === "All" && (
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 py-1.5 px-4 backdrop-blur-md bg-muted border-border text-indigo-300 font-medium">
              <Zap className="w-3.5 h-3.5 mr-2 inline-block" />
              The Next-Gen Digital Economy
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Buy & Sell <br />
              <span className="text-gradient-primary">Premium Digital Assets</span>
            </h1>
            <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              The ultimate marketplace for full businesses, SaaS platforms, AI systems, source codes, and premium UI kits. Acquire exclusive ownership or scale unlimited products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 rounded-full text-base font-medium w-full sm:w-auto bg-white text-black hover:bg-gray-200" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>
                Explore Marketplace <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <LoginDialog>
                <Link to="/start-selling" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-medium w-full border-border hover:bg-muted">
                    Start Selling
                  </Button>
                </Link>
              </LoginDialog>
            </div>
          </motion.div>
        </div>
      </section>
      )}

      {/* Universal Search & Filter Bar */}
      <section id="explore" className="container mx-auto px-4 mt-8">
        <div className="glass-card border border-border/20 bg-white/[0.02] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
             <Input 
               placeholder="Search premium digital assets..." 
               value={q}
               onChange={(e) => updateFilter("q", e.target.value)}
               className="w-full pl-10 bg-muted border-border h-12"
             />
           </div>
           
           <Popover>
             <PopoverTrigger render={<Button variant="outline" className="h-12 px-6 gap-2 border-border bg-muted/50 hover:bg-muted shrink-0" />}>
                 <Filter className="w-4 h-4" />
                 Filters
             </PopoverTrigger>
             <PopoverContent className="w-[340px] md:w-[700px] p-6 bg-[#0f121b] border-border" align="end">
               <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                   <h4 className="font-medium text-lg flex items-center gap-2"><Filter className="w-4 h-4 text-indigo-400" /> All Filters</h4>
                   <Button onClick={() => setSearchParams(new URLSearchParams())} variant="ghost" size="sm" className="h-8 text-xs">Clear All</Button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <Select value={categoryFilter === "All" ? undefined : categoryFilter} onValueChange={(val) => {
                       const newParams = new URLSearchParams(searchParams);
                       if (val === "All") {
                         newParams.delete("category");
                         newParams.delete("sub_category");
                       } else {
                         newParams.set("category", val);
                         newParams.delete("sub_category");
                       }
                       setSearchParams(newParams);
                   }}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Category" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {Object.keys(categories).map(cat => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   {categoryFilter !== "All" && (
                     <Select value={searchParams.get("sub_category") || undefined} onValueChange={(val) => {
                       const newParams = new URLSearchParams(searchParams);
                       if (val === "All") {
                         newParams.delete("sub_category");
                       } else {
                         newParams.set("sub_category", val);
                       }
                       setSearchParams(newParams);
                     }}>
                       <SelectTrigger className="w-full h-10 bg-muted border-border">
                         <SelectValue placeholder="Sub Category" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="All">All</SelectItem>
                         {categories[categoryFilter as keyof typeof categories]?.subCategories.map(sub => (
                           <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   )}

                   <Select value={platformFilter === "All" ? undefined : platformFilter} onValueChange={(val) => updateFilter("platform", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Platform" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.platform.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={frameworkFilter === "All" ? undefined : frameworkFilter} onValueChange={(val) => updateFilter("framework", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Framework" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.framework.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={licenseFilter === "All" ? undefined : licenseFilter} onValueChange={(val) => updateFilter("license_type", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="License" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.license.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={fileTypeFilter === "All" ? undefined : fileTypeFilter} onValueChange={(val) => updateFilter("file_type", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="File Type" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.fileType.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={languageFilter === "All" ? undefined : languageFilter} onValueChange={(val) => updateFilter("language", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Language" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.language.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={compatibilityFilter === "All" ? undefined : compatibilityFilter} onValueChange={(val) => updateFilter("compatibility", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Compatibility" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.compatibility.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={supportFilter === "All" ? undefined : supportFilter} onValueChange={(val) => updateFilter("support_type", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Support" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All</SelectItem>
                       {extraFilters.support.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Select value={modeFilter === "All" ? undefined : modeFilter} onValueChange={(val) => updateFilter("mode", val)}>
                     <SelectTrigger className="w-full h-10 bg-muted border-border">
                       <SelectValue placeholder="Sale Mode" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="All">All Modes</SelectItem>
                       {extraFilters.saleMode.map(p => (
                         <SelectItem key={p} value={p}>{p}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   
                   <div className="flex items-center gap-2 w-full col-span-1 md:col-span-2">
                     <Input 
                       type="number"
                       placeholder="Min $"
                       value={minPriceFilter}
                       onChange={(e) => updateFilter("minPrice", e.target.value)}
                       className="w-full h-10 bg-muted border-border"
                     />
                     <span className="text-muted-foreground">-</span>
                     <Input 
                       type="number"
                       placeholder="Max $"
                       value={maxPriceFilter}
                       onChange={(e) => updateFilter("maxPrice", e.target.value)}
                       className="w-full h-10 bg-muted border-border"
                     />
                   </div>
                 </div>
               </div>
             </PopoverContent>
           </Popover>
        </div>
      </section>

      {/* When filtering explicitly by search or category */}
      {(q || categoryFilter !== "All" || modeFilter !== "All" || minPriceFilter || maxPriceFilter) && (
        <section className="pt-4 px-4 container mx-auto">
           <div className="flex items-center justify-between mb-6 border-b border-border/20 pb-4">
              <h2 className="text-2xl font-display font-medium flex items-center gap-3">
                <Filter className="text-indigo-400 w-5 h-5" />
                {categoryFilter !== "All" ? `${categoryFilter}s` : "Search Results"}
              </h2>
              <Button onClick={() => { setSearchParams(new URLSearchParams()); }} variant="ghost" className="text-sm">
                Clear Filters
              </Button>
           </div>
           
           {listings.length > 0 ? (
             renderCategorizedGrid()
           ) : (
             <div className="py-20 text-center glass-card border border-border/20 rounded-2xl">
               <p className="text-muted-foreground text-lg">No assets found matching your criteria.</p>
               <Button onClick={() => { setSearchParams(new URLSearchParams()); }} variant="outline" className="mt-4 border-border hover:bg-muted">
                 Clear All Filters
               </Button>
             </div>
           )}
        </section>
      )}

      {!q && categoryFilter === "All" && !minPriceFilter && !maxPriceFilter && modeFilter === "All" && (
        <>
      {/* Trust Badges */}
      <section className="border-y border-border/20 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-8">
           <div className="flex flex-wrap justify-center gap-12 sm:gap-24 opacity-60 grayscale brightness-200">
              <div className="flex items-center gap-2 font-display font-bold text-xl"><Shield className="w-6 h-6"/> SECURE ESCROW</div>
              <div className="flex items-center gap-2 font-display font-bold text-xl"><Lock className="w-6 h-6"/> BLOCKCHAIN VERIFIED</div>
              <div className="flex items-center gap-2 font-display font-bold text-xl"><Zap className="w-6 h-6"/> INSTANT TRANSFER</div>
           </div>
        </div>
      </section>

      {/* Featured Listings */}
      {listings.filter(l => l.is_featured).length > 0 && !q && (
      <section className="container mx-auto px-4 mt-12 mb-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <span className="bg-gradient-to-r from-pink-500/20 to-indigo-500/20 text-pink-400 p-2 rounded-lg">
                <Star className="w-6 h-6 fill-pink-500" />
              </span>
              Featured Assets
            </h2>
            <p className="text-muted-foreground">Handpicked premium products across all categories.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.filter(l => l.is_featured).slice(0, 4).map((listing, i) => (
               <ListingCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} initialWishlist={typeof wishlistIds !== 'undefined' ? wishlistIds.has(listing.id) : false} />
            ))}
          </div>
        )}
      </section>
      )}

          {/* Dedicated Play Store Section */}
          {mobileApps.length > 0 && (
          <section className="container mx-auto px-4 mt-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
                  <span className="bg-green-500/20 text-green-400 p-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]"><Smartphone className="w-5 h-5" /></span>
                  App Marketplace
                </h2>
                <p className="text-muted-foreground">Premium mobile apps and templates ready to launch.</p>
              </div>
              <Button variant="ghost" onClick={() => updateFilter("category", "Mobile Apps")} className="hidden sm:flex group">
                Open App Store <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mobileApps.slice(0, 6).map((listing, i) => (
                <PlayStoreCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} />
              ))}
            </div>
          </section>
          )}

          {/* Dedicated Website Section */}
          {websites.length > 0 && (
          <section className="container mx-auto px-4 mt-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
                  <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Globe className="w-5 h-5" /></span>
                  Website & Portals
                </h2>
                <p className="text-muted-foreground">High-converting websites and scalable SaaS frontends.</p>
              </div>
              <Button variant="ghost" onClick={() => updateFilter("category", "Website")} className="hidden sm:flex group">
                Browse Websites <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {websites.slice(0, 4).map((listing, i) => (
                <WebsiteCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} />
              ))}
            </div>
          </section>
          )}

      {/* Exclusive Acquisitions */}
      {exclusiveListings.length > 0 && (
      <section className="container mx-auto px-4 mt-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-400 p-2 rounded-lg"><Lock className="w-6 h-6" /></span>
              Exclusive Acquisitions
            </h2>
            <p className="text-muted-foreground">One-time sales. Full ownership transfer. NDAs included.</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex group">
            View All <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exclusiveListings.map((listing, i) => (
               <ListingCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} initialWishlist={typeof wishlistIds !== 'undefined' ? wishlistIds.has(listing.id) : false} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* Unlimited Digital Products */}
      {unlimitedListings.length > 0 && (
      <section className="container mx-auto px-4 mt-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg"><Download className="w-6 h-6" /></span>
              Digital Assets
            </h2>
            <p className="text-muted-foreground">Unlimited licensing. Apps, UI kits, AI prompts, and more.</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex group">
            Browse Market <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {unlimitedListings.map((listing, i) => (
               <ListingCard key={listing.id} listing={listing} i={i} currentUserId={currentUserId} initialWishlist={typeof wishlistIds !== 'undefined' ? wishlistIds.has(listing.id) : false} />
            ))}
          </div>
        )}
      </section>
      )}
        </>
      )}
      
      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-12">
        <div className="rounded-3xl glass-card border border-border p-10 md:p-20 relative overflow-hidden text-center">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
           
           <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative z-10">Ready to Monopolize Your Code?</h2>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 relative z-10">
             Join 50,000+ ultimate creators selling premium digital real estate. Access the billion-dollar digital economy platform.
           </p>
           <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
             <LoginDialog>
               <Link to="/start-selling" className="w-full sm:w-auto">
                 <Button size="lg" className="w-full h-14 px-8 rounded-full text-base font-medium xl">
                   Become a Seller Today
                 </Button>
               </Link>
             </LoginDialog>
             <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-medium border-border bg-muted/50">
               Explore AI Systems
             </Button>
           </div>
        </div>
      </section>
    </div>
  );
}
