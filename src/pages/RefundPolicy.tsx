import { motion } from "motion/react";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-4xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" /> Sale Finality
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Aurevyxon Sale Finality Policy
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed"
        >
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl mb-8 flex gap-4 items-start">
             <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
             <div>
               <h3 className="text-xl font-bold text-red-100 mt-0 mb-2">Digital Asset Finality Guarantee</h3>
               <p className="text-red-200/80 m-0 text-base">
                 Owing to the irrevocable and instantly replicable nature of digital assets, source code, and AI models, <strong>all completed sales on the Aurevyxon platform are final and non-refundable, except under the narrowly defined exceptions specified below.</strong>
               </p>
             </div>
          </div>

          <h2>1. The Nature of Digital Goods</h2>
          <p>
            Upon purchase, buyers are granted immediate access to download, inspect, and duplicate the underlying files or source code. Because digital goods cannot be "returned" in the physical sense — the buyer may retain a copy regardless of any refund — Aurevyxon's finality policy exists to protect the intellectual property rights of sellers from irrecoverable loss.
          </p>

          <h2>2. Buyer Responsibility</h2>
          <p>
            Buyers are responsible for thoroughly reviewing product descriptions, screenshots, live previews, benchmark data, and technical specifications before completing a purchase. A change of mind after download does not constitute grounds for reversal under this policy.
          </p>

          <h2>3. Defined Exceptions</h2>
          <p>Refunds, credits, or replacement assets will be considered only in the following documented circumstances:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Verified unauthorized transaction (fraud)</strong>, confirmed through payment processor investigation.</li>
            <li><strong>Non-functional or materially misrepresented asset</strong> — where the delivered file is empty, corrupted, contains malicious code, or fundamentally fails to match its listed specification, as confirmed by Aurevyxon's Security & Compliance Team following technical audit.</li>
            <li><strong>Duplicate or erroneous billing</strong> caused by a verified platform-side technical error.</li>
          </ul>
          <p>
            All exception claims must be submitted within <strong>48 hours of purchase</strong> with supporting documentation (order ID, screenshots, technical evidence where applicable).
          </p>

          <h2>4. Statutory Rights Notice</h2>
          <p>
            This policy operates alongside, and does not override, any statutory consumer protection rights that may apply to buyers under their local jurisdiction, including provisions under India's Consumer Protection (E-Commerce) Rules and applicable EU/UK consumer contract law. Nothing in this policy is intended to waive rights that cannot lawfully be waived by contract.
          </p>

          <h2>5. Acknowledgment</h2>
          <p>
            By completing a purchase on Aurevyxon, buyers acknowledge immediate access to and consumption of the digital intellectual property at time of purchase, and agree to route disputes through Aurevyxon's Dispute Resolution process in the first instance, in addition to — not instead of — any rights available directly through their payment provider or applicable consumer protection authority.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
