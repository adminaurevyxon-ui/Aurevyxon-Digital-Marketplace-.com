import { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { motion } from "motion/react";
import { Brain, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Listing } from "@/types";
import { ListingCard, ListingSkeleton } from "@/components/ListingCards";
import { PriceRangeFilter } from "@/components/PriceRangeFilter";
import { useAuth } from "@/lib/auth";

export default function AIModels() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  // Fixed category for this page
  const categoryFilter = "AI Systems";

  useEffect(() => {
    let url = `/api/listings?q=${encodeURIComponent(q)}&category=${encodeURIComponent(categoryFilter)}`;
    if (minPrice) url += `&minPrice=${encodeURIComponent(minPrice)}`;
    if (maxPrice) url += `&maxPrice=${encodeURIComponent(maxPrice)}`;

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

    if (user?.id) {
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
  }, [q, minPrice, maxPrice, user]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-full h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6 tracking-wide">
            <Brain className="w-4 h-4" /> Institutional-Grade ML Infrastructure
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-8">
            Aurevyxon <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI Models</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover independently reproduced benchmark data, training-data provenance, and complete model cards.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 mb-16">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-border/50">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                Search Models
              </h3>
              <Input 
                type="text" 
                placeholder="Search models..." 
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>
            
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-border/50">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                Price Range
              </h3>
              <PriceRangeFilter 
                minPrice={minPrice} 
                maxPrice={maxPrice} 
                onFilterChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }} 
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="w-full lg:w-3/4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <ListingSkeleton key={i} />)}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing, i) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing} 
                    i={i} 
                    currentUserId={user?.id}
                    initialWishlist={wishlistIds.has(listing.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white/[0.02] border border-border/50 rounded-2xl">
                <p className="text-muted-foreground text-lg">No AI models found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
