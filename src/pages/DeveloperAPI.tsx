import { motion } from "motion/react";
import { Terminal, Code, Network, Braces, Layers, Link as LinkIcon, Database, Zap, ShieldCheck } from "lucide-react";

export default function DeveloperAPI() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6 tracking-wide uppercase">
            <Terminal className="w-4 h-4" /> Infrastructure Level
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-8">
            The Aurevyxon <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Developer API</span>
          </h1>
          <blockquote className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto italic border-l-4 border-blue-500 pl-6 text-left">
            "Aurevyxon is not just a marketplace you browse — it is infrastructure you can build on top of. The Developer API exposes the platform's full operational core, letting teams automate commerce, sync inventory, and construct entirely new experiences on Aurevyxon's foundation."
          </blockquote>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none mb-16"
        >
          <p className="text-lg text-muted-foreground leading-relaxed text-center max-w-4xl mx-auto">
            The Aurevyxon API is a clean, predictable, fully versioned REST interface exposing listings, orders, payouts, licensing, and account management — engineered for teams who need marketplace commerce embedded directly into their own dashboards, internal tools, or fully automated pipelines.
          </p>
        </motion.div>

        <div className="bg-[#0D1117] border border-border/50 rounded-2xl overflow-hidden mb-16 shadow-2xl">
          <div className="flex items-center px-4 py-3 bg-[#161B22] border-b border-border/50">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="mx-auto text-xs font-mono text-muted-foreground">Authentication Example</div>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-300">
              <span className="text-pink-400">curl</span> -X GET <span className="text-green-300">'https://api.aurevyxon.dev/v1/listings'</span> \<br/>
              {'  '}-H <span className="text-green-300">'Authorization: Bearer YOUR_API_KEY'</span>
            </pre>
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold mb-8">Core Endpoint Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {[
            { end: "/v1/products", desc: "Programmatic creation, update, retrieval, and delisting of products." },
            { end: "/v1/orders", desc: "Query full order history, transaction state, and refund/dispute status." },
            { end: "/v1/sellers", desc: "Manage seller profile data, payout configuration, and verification state." },
            { end: "/v1/payouts", desc: "Trigger and audit payout schedules and settlement history." },
            { end: "/v1/webhooks", desc: "Subscribe to real-time events: sale.completed, dispute.opened." },
            { end: "/v1/ai-models", desc: "Specialized endpoint for AI model metadata and benchmark records." },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-border/50 rounded-xl hover:border-blue-500/30 transition-colors">
              <div className="font-mono text-sm text-blue-400 mb-3 px-2 py-1 bg-blue-500/10 rounded inline-block">{item.end}</div>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-display font-bold mb-8">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: "Real-Time Event Webhooks", desc: "Instant, event-driven delivery for sales, transfers, disputes, and account state changes; zero polling required.", icon: Zap },
            { title: "First-Party SDKs", desc: "Official libraries for Node.js, Python, and Go, with community-maintained SDKs for additional ecosystems.", icon: Code },
            { title: "Isolated Sandbox Environment", desc: "Fully simulated transactions, mock webhook events, and zero real financial exposure during integration testing.", icon: Layers },
            { title: "Long-Term API Stability", desc: "Breaking changes are confined strictly to new major versions, with a minimum 12-month deprecation window.", icon: ShieldCheck },
          ].map((item, i) => (
             <div key={i} className="flex gap-4 items-start">
               <item.icon className="w-8 h-8 text-blue-400 shrink-0 mt-1" />
               <div>
                 <h5 className="font-bold text-lg mb-1">{item.title}</h5>
                 <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
