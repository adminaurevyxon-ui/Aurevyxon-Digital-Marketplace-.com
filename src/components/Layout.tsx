import { ErrorBoundary } from "./ErrorBoundary";
import { useState, FormEvent, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Bell, Menu, Cpu, LogOut, Check } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "sonner";

import { safeJson } from "@/lib/utils";

export default function Layout() {
  const { user, isAuthenticated, logout, authError, clearError } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("aurevyxon_token");
    try {
      const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      const data = await safeJson(res);
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch(e) { console.error(e) }
  };

  useEffect(() => {
    fetchNotifications();
    const inv = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(inv);
  }, [isAuthenticated]);

  const markNotificationsRead = async () => {
    if (unreadCount === 0) return;
    const token = localStorage.getItem("aurevyxon_token");
    try {
      await fetch("/api/notifications/read", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({...n, is_read: 1})));
    } catch (e) {
      console.warn("Failed to mark notifications read:", e);
    }
  };



  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border glass">
        {authError && (
          <div className="bg-red-500/90 text-foreground px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Authentication Error:</span>
              <span>{decodeURIComponent(authError)}</span>
            </div>
            <div className="flex items-center gap-2">
              <LoginDialog>
                <Button variant="outline" size="sm" className="h-7 text-xs bg-background/20 border-border/50 hover:bg-muted/40">Try Again</Button>
              </LoginDialog>
              <Button variant="ghost" size="sm" onClick={clearError} className="h-7 w-7 p-0 rounded-full hover:bg-background/20">
                &times;
              </Button>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4">
            <Logo className="w-16 h-16 md:w-20 md:h-20" />
            <span 
              className="font-display font-black text-2xl md:text-3xl tracking-widest hidden sm:inline-block italic"
              style={{
                background: "linear-gradient(to bottom, #ffffff 0%, #7accff 30%, #0066ff 60%, #002288 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0px 2px 4px rgba(0,100,255,0.5))"
              }}
            >
              AUREVYXON
            </span>
          </Link>

          {/* Search bar removed */}

          <nav className="flex items-center gap-1 sm:gap-2">
             <ThemeToggle />
             {/* Mobile search button removed */}
             {isAuthenticated && (
               <Popover onOpenChange={(open) => { if(open) markNotificationsRead() }}>
                 <PopoverTrigger render={<Button variant="ghost" size="icon" className="hidden sm:inline-flex relative" />}>
                     <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                     {unreadCount > 0 && (
                       <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                     )}
                 </PopoverTrigger>
                 <PopoverContent align="end" className="w-80 p-0 bg-popover/90 backdrop-blur-xl border border-border text-foreground">
                   <div className="p-4 border-b border-border flex justify-between items-center">
                     <h4 className="font-semibold text-sm">Notifications</h4>
                     {unreadCount > 0 && <Badge className="bg-pink-500 text-foreground">{unreadCount} New</Badge>}
                   </div>
                   <ScrollArea className="h-72">
                     {notifications.length === 0 ? (
                       <div className="p-8 text-center text-muted-foreground text-sm">No notifications right now.</div>
                     ) : (
                       <div className="divide-y divide-white/5">
                         {notifications.map((n: any) => (
                           <div key={n.id} className={`p-4 flex gap-3 hover:bg-muted transition-colors ${!n.is_read ? 'bg-white/[0.02]' : ''}`}>
                             <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                             <div>
                               <p className="text-sm">{n.message}</p>
                               <span className="text-xs text-muted-foreground mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </ScrollArea>
                 </PopoverContent>
               </Popover>
             )}
             
             <div className="hidden sm:flex ml-1 w-20">
               <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                 <SelectTrigger className="bg-transparent border-none focus:ring-0 text-sm h-8">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="USD">USD</SelectItem>
                   <SelectItem value="EUR">EUR</SelectItem>
                   <SelectItem value="GBP">GBP</SelectItem>
                   <SelectItem value="JPY">JPY</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <Popover open={cartOpen} onOpenChange={setCartOpen}>
               <PopoverTrigger render={<Button variant="ghost" size="icon" />}>
                   <ShoppingCart className="w-5 h-5 text-muted-foreground hover:text-foreground" />
               </PopoverTrigger>
               <PopoverContent align="end" className="w-64 p-4 bg-popover/90 backdrop-blur-xl border border-border text-foreground">
                 <h4 className="font-semibold text-sm mb-2">Shopping Cart</h4>
                 <div className="text-muted-foreground text-xs py-4 text-center">Your cart is empty.</div>
                 <Button className="w-full text-xs mt-2" variant="outline" disabled>Checkout</Button>
               </PopoverContent>
             </Popover>
             <div className="h-8 w-px bg-muted mx-1 sm:mx-2 hidden sm:block" />
             <LoginDialog>
               <Link to={user?.role === 'seller' || user?.role === 'admin' ? "/sell" : "/start-selling"} className="hidden sm:inline-flex">
                  <Button className={user?.role === 'seller' || user?.role === 'admin' ? "bg-emerald-600 text-white hover:bg-emerald-500 font-semibold rounded-full shadow-md shadow-emerald-600/20" : "bg-white text-black hover:bg-gray-200 font-medium rounded-full"}>
                    {user?.role === 'seller' || user?.role === 'admin' ? "Seller Dashboard" : "Sell Asset"}
                  </Button>
                </Link>
              </LoginDialog>
              {/* duplicate block removed */}
             
             {isAuthenticated ? (
               <div className="flex items-center gap-1 sm:gap-2 ml-1">
                 <Link to="/user/dashboard">
                   <Button variant="ghost" className="rounded-full border border-border px-4 hidden sm:inline-flex">
                     User Panel
                   </Button>
                 </Link>
                 {(user?.role === 'seller' || user?.role === 'admin') && (
                   <Link to="/seller/dashboard" className="hidden">
                     <Button variant="ghost" className="rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-4 hidden sm:inline-flex">
                       Seller Dashboard
                     </Button>
                   </Link>
                 )}
                 {user?.email && ['jagannathsing777@gmail.com', 'admin.aurevyxon@gmail.com'].includes(user.email) && (
                   <Link to="/admin">
                     <Button variant="ghost" className="rounded-full bg-red-500/20 text-red-400 border border-red-500/50 px-4 hidden sm:inline-flex">
                       Admin
                     </Button>
                   </Link>
                 )}
                 <Button variant="ghost" size="icon" onClick={() => logout()} className="rounded-full border border-border hidden sm:inline-flex">
                   <LogOut className="w-4 h-4" />
                 </Button>
               </div>
             ) : (
               <LoginDialog>
                 <Button variant="ghost" className="rounded-full border border-border ml-1 px-4 hidden sm:inline-flex">
                   Sign In
                 </Button>
               </LoginDialog>
             )}
             
             <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
               <Menu className="w-5 h-5" />
             </Button>
          </nav>
        </div>

        {/* Mobile Search Bar removed */}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border pb-4 flex flex-col px-4 gap-4 pt-4">
            <LoginDialog>
              <Link to={user?.role === 'seller' || user?.role === 'admin' ? "/sell" : "/start-selling"} onClick={() => setMobileMenuOpen(false)}>
                <Button className={user?.role === 'seller' || user?.role === 'admin' ? "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" : "w-full bg-white text-black font-medium"}>
                  {user?.role === 'seller' || user?.role === 'admin' ? "Seller Dashboard" : "Sell Asset"}
                </Button>
              </Link>
            </LoginDialog>
            
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link to="/user/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start border-border text-foreground">Dashboard</Button>
                </Link>
                {user?.email && ['jagannathsing777@gmail.com', 'admin.aurevyxon@gmail.com'].includes(user.email) && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start border-red-500/30 text-red-400">Admin Panel</Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start text-red-400" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            ) : (
              <LoginDialog>
                <Button variant="outline" className="w-full border-border text-foreground">Sign In</Button>
              </LoginDialog>
            )}
          </div>
        )}

        {/* Categories Bar */}
        <div className="border-t border-border/20 bg-muted/40 overflow-x-auto no-scrollbar">
           <div className="container mx-auto px-4 h-10 flex items-center gap-6 text-sm font-medium text-muted-foreground whitespace-nowrap">
             <Link to="/?q=App" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">Mobile Apps</Link>
             <Link to="/?q=AI" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">AI Systems</Link>
             <Link to="/?q=Website" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">Full Websites</Link>
             <Link to="/?q=SaaS" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">SaaS Platforms</Link>
             <Link to="/?q=Source Code" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">Source Code</Link>
             <Link to="/?q=UI Kit" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">UI/UX Kits</Link>
             <Link to="/?q=Plugin" className="hover:text-foreground transition-colors py-2 border-b-2 border-transparent hover:border-white">Plugins</Link>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <ErrorBoundary><Outlet /></ErrorBoundary>
      </main>
        <Toaster theme="dark" position="bottom-right" />

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 text-muted-foreground mt-24">
         <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <Logo className="w-8 h-8" />
                 <span className="font-display font-bold text-foreground">AUREVYXON</span>
              </div>
              <p className="text-sm">The world's premium marketplace for digital assets, businesses, and AI.</p>
            </div>
            <div>
               <h4 className="font-medium text-foreground mb-4">Buy</h4>
               <ul className="space-y-2 text-sm">
                 <li><Link to="/digital-products" className="hover:text-foreground transition-colors">Digital Products</Link></li>
                 <li><Link to="/exclusive-assets" className="hover:text-foreground transition-colors">Exclusive Assets</Link></li>
                 <li><Link to="/ai-models" className="hover:text-foreground transition-colors">AI Models</Link></li>
               </ul>
            </div>
            <div>
               <h4 className="font-medium text-foreground mb-4">Sell</h4>
               <ul className="space-y-2 text-sm">
                 <li><Link to="/start-selling" className="hover:text-foreground transition-colors">Start Selling</Link></li>
                 <li><Link to="/developer-api" className="hover:text-foreground transition-colors">Developer API</Link></li>
                 <li><Link to="/seller-guide" className="hover:text-foreground transition-colors">Seller Guide</Link></li>
               </ul>
            </div>
            <div>
               <h4 className="font-medium text-foreground mb-4">Platform</h4>
               <ul className="space-y-2 text-sm">
                 <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                 <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                 <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>\n                 <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund policy</Link></li>
               </ul>
            </div>
         </div>
      </footer>
    </div>
  );
}
