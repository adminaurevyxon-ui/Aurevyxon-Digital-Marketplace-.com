import { motion } from "motion/react";
import { ShieldCheck, Anchor, Globe, Lock } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-4xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-sm font-medium mb-6 uppercase tracking-wider">
            <Anchor className="w-4 h-4" /> Our Foundation
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">Aurevyxon</span>
          </h1>
          <blockquote className="text-xl md:text-2xl text-muted-foreground italic border-l-4 border-slate-500 pl-6 text-left">
            "Aurevyxon was founded on a singular, uncompromising premise: that the exchange of digital intellectual property deserves the same institutional rigor as the exchange of any other high-value asset class — nothing less."
          </blockquote>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none mb-16"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            We believe code, design systems, and trained AI models are the foundational architecture of the next economic era. Aurevyxon exists to let creators convert genuine technical craftsmanship into durable income, while giving enterprises reliable, audited access to production-ready digital infrastructure — vetted to a standard the broader marketplace ecosystem has never attempted.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            By closing the distance between elite independent builders and ambitious enterprise buyers, Aurevyxon accelerates the pace at which real digital innovation reaches the people who can deploy it. Every transaction on this platform is engineered to represent genuine, verified value — never volume manufactured for its own sake.
          </p>
        </motion.div>

        <h2 className="text-3xl font-display font-bold mb-8">Our Founding Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            { title: "Integrity Over Volume", desc: "Every single listing is vetted; ten thousand verified assets outweigh a million unverified ones.", icon: ShieldCheck },
            { title: "Creator-First Economics", desc: "Commission structures that improve as sellers demonstrate sustained quality, not extractive flat-rate models.", icon: Anchor },
            { title: "Radical Transparency", desc: "Buyers see exactly what they are acquiring: reproducible benchmarks, unambiguous licensing terms, and full technical specification.", icon: Globe },
            { title: "Security as Architecture", desc: "Encryption, escrow, and fraud detection are embedded in the core transaction layer from first principles, not layered on retroactively.", icon: Lock },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white/[0.02] border border-border/50 p-6 rounded-2xl"
            >
              <item.icon className="w-8 h-8 text-slate-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-slate-200">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-background border border-border p-8 rounded-3xl text-center">
          <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-4">Global Footprint</h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Aurevyxon serves a growing international base of verified developers, designers, and enterprise buyers across Mobile Applications, AI Systems, Full Websites, SaaS Platforms, Source Code, UI/UX Design Systems, and Plugin Architectures.
          </p>
        </div>
      </div>
    </div>
  );
}
