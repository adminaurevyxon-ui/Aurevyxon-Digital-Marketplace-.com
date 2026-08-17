import { motion } from "motion/react";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-4xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Privacy & Security
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last Updated: July 2026</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed"
        >
          <h2>1. Data Collection Architecture</h2>
          <p>
            Aurevyxon employs secure data pipelines and operational telemetry to collect identity verification metrics, transaction histories, device/session data, and interaction signals necessary to ensure platform security, fraud prevention, and core service functionality.
          </p>

          <h2>2. Cryptographic Security Standard</h2>
          <p>
            All sensitive user data — including payment routing details, cryptographic wallet identifiers where applicable, and OAuth authentication tokens — is encrypted at rest using <strong>AES-256</strong> standards. Aurevyxon operates on a <strong>zero-trust security model</strong>: no internal system component is implicitly trusted, and every access request is independently authenticated and authorized.
          </p>

          <h2>3. Information Sharing Discipline</h2>
          <p>
            Aurevyxon does not sell or monetize personal user data to third-party advertisers under any circumstance. Data is shared exclusively with essential infrastructure partners required for core platform operation — regulated payment gateways (e.g., Razorpay, Stripe), cloud infrastructure providers, and fraud-detection services — governed by strict data processing agreements.
          </p>

          <h2>4. User Rights</h2>
          <p>
            Users retain the right to access, correct, export, or request deletion of their personal data, subject to applicable law — including India's Digital Personal Data Protection Act, and GDPR for users within the European Economic Area. Requests may be submitted through account settings or a designated data protection contact channel.
          </p>

          <h2>5. Data Retention Policy</h2>
          <p>
            Account and transaction data is retained for the duration of active account status, plus any additional period required to satisfy legal, tax, or regulatory obligations following account closure.
          </p>

          <h2>6. Cookies & Tracking Technologies</h2>
          <p>
            Aurevyxon uses cookies for authentication persistence, fraud detection, analytics, and personalization of marketplace recommendations. Users may manage cookie preferences through browser settings, subject to functional limitations on personalization capability.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
