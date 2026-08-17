import { motion } from "motion/react";
import { Shield, Key, Fingerprint, Lock, FileSignature, Globe2, Sparkles, CheckCircle2 } from "lucide-react";

export default function ExclusiveAssets() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium mb-6 uppercase tracking-wider">
            <Key className="w-4 h-4" /> Sovereign Ownership
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-8">
            Aurevyxon <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">Exclusive</span>
          </h1>
          <blockquote className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto italic border-l-4 border-amber-500 pl-6 text-left">
            "There is a category of buyer for whom 'non-exclusive license' is not an acceptable answer — enterprises architecting proprietary competitive moats, acquirers building IP portfolios, studios that cannot tolerate their core technology existing anywhere else on earth. Aurevyxon Exclusive was built entirely for them."
          </blockquote>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none mb-16"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            An Exclusive Asset transaction on Aurevyxon is not a purchase in the conventional sense — it is a <strong className="text-foreground">complete, irrevocable chain-of-title transfer</strong>. The moment settlement clears, the seller's rights are permanently and cryptographically extinguished. The asset is hash-verified as sold, delisted platform-wide, and can never again be offered — by the original seller, by an affiliate, or by any third party who may have had prior access.
          </p>
        </motion.div>

        <h2 className="text-3xl font-display font-bold mb-8">The Sovereign Ownership Framework</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {[
            { title: "Absolute IP Transfer", desc: "Full intellectual property rights — source code, design files, trademarks where applicable, and all derivative rights — pass directly and permanently to the buyer, with no residual claim retained by the seller.", icon: Lock },
            { title: "Cryptographic Uniqueness Guarantee", desc: "Once sold, the asset's file hash is permanently registered as 'exclusively owned' in Aurevyxon's ledger — it is architecturally impossible for it to be re-listed on this platform again.", icon: Fingerprint },
            { title: "Institutional Escrow Settlement", desc: "Funds are held in a regulated escrow account and released to the seller only after independent, buyer-side technical verification confirms full conformity with the listed specification.", icon: Shield },
            { title: "Formal IP Assignment Certificate", desc: "Every Exclusive Asset transaction generates a digitally signed, timestamped Intellectual Property Assignment Certificate — a legal instrument both parties retain permanently.", icon: FileSignature },
            { title: "Pre-Acquisition Technical Due Diligence", desc: "Buyers receive a full technical audit — codebase health, originality verification, and disclosure of any prior commercial use — before committing capital.", icon: CheckCircle2 },
            { title: "Global Enforcement Trail", desc: "Transfer records are cryptographically timestamped to support enforcement of ownership claims across jurisdictions, should disputes arise post-sale.", icon: Globe2 },
          ].map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-white/[0.02] to-transparent border border-amber-500/20 p-8 rounded-2xl hover:border-amber-500/40 transition-colors"
            >
              <step.icon className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Built For The Elite</h2>
          <p className="text-lg text-amber-200/70 max-w-3xl mx-auto leading-relaxed">
            Enterprises constructing defensible competitive advantage; acquirers assembling strategic IP and AI-model portfolios; studios requiring absolute, contractually enforced non-compete uniqueness; investors seeking to convert one-time acquisition cost into permanent, sole-owned digital infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}
