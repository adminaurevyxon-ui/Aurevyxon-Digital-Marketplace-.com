import React, { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, ShieldCheck, Globe, Target, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LoginDialog } from "@/components/LoginDialog";
import { SellerOnboarding } from "@/components/SellerOnboarding";

export default function StartSelling() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleStartSellingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      return; // LoginDialog triggers sign in
    }
    if (user.role === 'seller' || user.role === 'admin') {
      navigate("/sell");
    } else {
      setShowOnboarding(true);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Seller Onboarding KYC Modal */}
      {showOnboarding && (
        <SellerOnboarding
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onSuccess={() => {
            setShowOnboarding(false);
            navigate("/sell");
          }}
        />
      )}

      <div className="container mx-auto px-4 py-24 max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 uppercase tracking-wider">
            <Rocket className="w-4 h-4" /> Global Monetization Architecture
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-8">
            Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Revenue Engine</span> on Aurevyxon
          </h1>
          <blockquote className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto italic border-l-4 border-emerald-500 pl-6 text-left mb-8">
            "Your engineering, design, and AI expertise is an asset class. Aurevyxon converts it into a scalable, global revenue stream — reaching verified enterprise buyers, developers, and studios across international markets. Zero cost to list. You are paid only when you deliver value."
          </blockquote>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Button 
                onClick={handleStartSellingClick} 
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-600/20"
              >
                {user.role === 'seller' || user.role === 'admin' ? "Go to Sell Portal" : "Complete KYC & Start Selling"}
              </Button>
            ) : (
              <LoginDialog>
                <Button className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-600/20">
                  Start Selling Today
                </Button>
              </LoginDialog>
            )}
            <Link to="/seller-guide">
              <Button variant="outline" className="h-12 px-8 border-border text-foreground rounded-xl">
                Read Seller Guide
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none mb-16 text-center"
        >
          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            Aurevyxon's seller infrastructure was engineered to eliminate every point of friction between "I built something valuable" and "I am being paid for it, reliably, at scale." Licensing enforcement, global payment settlement, fraud interdiction, and tax-compliant payout routing are handled entirely by the platform — freeing sellers to focus exclusively on the craft of building.
          </p>
        </motion.div>

        <h2 className="text-3xl font-display font-bold mb-8 text-center">The Seller Onboarding Architecture</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-20">
          {[
            { step: "01", title: "Identity & Portfolio", desc: "KYC verification & identity document submission." },
            { step: "02", title: "Tax Compliance", desc: "TDS & Tax residency identification." },
            { step: "03", title: "Bank & Payout Details", desc: "Bank wire, NEFT or UPI routing setup." },
            { step: "04", title: "Firestore Role Upgrade", desc: "Instant upgrade to verified seller status." },
            { step: "05", title: "Publish & Earn", desc: "Earnings routed to your payout account." },
          ].map((item, i) => (
            <div key={i} className="bg-muted/20 border border-border/50 p-6 rounded-2xl relative text-center flex flex-col items-center group hover:border-emerald-500/30 transition-colors">
               <div className="text-4xl font-display font-bold text-emerald-500/30 group-hover:text-emerald-500/50 transition-colors mb-4">{item.step}</div>
               <h3 className="font-bold mb-2">{item.title}</h3>
               <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-muted/30 to-transparent border border-border/50 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
               <Target className="w-6 h-6 text-emerald-400" /> Commission Architecture
            </h3>
            <div className="space-y-4">
               {[
                 { tier: "Standard Seller", fee: "15%", qual: "Verified identity, passed automated quality gate" },
                 { tier: "Pro Seller", fee: "10%", qual: "50+ completed sales, sustained 4.5★+ rating" },
                 { tier: "Enterprise Partner", fee: "Custom", qual: "High-volume catalog or exclusive partnership" },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-muted/40 rounded-xl border border-border/30">
                    <div>
                      <h4 className="font-bold text-foreground">{item.tier}</h4>
                      <p className="text-xs text-muted-foreground">{item.qual}</p>
                    </div>
                    <div className="text-xl font-display font-bold text-emerald-400 shrink-0 ml-4">{item.fee}</div>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-muted/20 border border-border/50 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                 <Globe className="w-6 h-6 text-emerald-400" /> Global Payout Rails
              </h3>
              <p className="text-muted-foreground mb-4">Direct Bank Transfer, UPI (India), Stripe, PayPal, Enterprise Wire Transfer.</p>
              <div className="flex flex-wrap gap-2">
                 {['Bank Transfer', 'UPI', 'Stripe', 'PayPal', 'Wire'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-muted/50 border border-border rounded-full text-xs font-medium">{tag}</span>
                 ))}
              </div>
            </div>

            <div className="bg-muted/20 border border-border/50 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                 <Shield className="w-6 h-6 text-emerald-400" /> Seller Protection Guarantee
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Buyer funds are held in regulated escrow until delivery is confirmed — shielding sellers from illegitimate chargebacks on properly delivered digital goods, while Aurevyxon's Dispute Resolution Team adjudicates edge cases with documented fairness on both sides.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
