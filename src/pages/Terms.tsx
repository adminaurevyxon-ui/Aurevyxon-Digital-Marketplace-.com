import { motion } from "motion/react";
import { Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-zinc-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-4xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-sm font-medium mb-6">
            <Scale className="w-4 h-4" /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last Updated: July 2026</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed"
        >
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or utilizing the Aurevyxon platform in any capacity, you agree to be bound by these operational directives and contractual obligations in full. Continued use of the platform constitutes ongoing acceptance of these Terms as they may be updated from time to time.
          </p>

          <h2>2. Digital Asset Licensing Structure</h2>
          <p>
            Assets acquired under a <strong>Standard License</strong> grant the buyer a non-exclusive, non-transferable right to use the asset strictly within the scope defined by the seller at time of listing. Assets acquired under an <strong>Exclusive License</strong> constitute a complete, irrevocable transfer of intellectual property rights from seller to buyer, subject to escrow clearance and full identity verification of both transacting parties.
          </p>

          <h2>3. Seller Representations & Warranties</h2>
          <p>
            Sellers warrant that they possess full, legitimate legal ownership and intellectual property rights over every asset published on Aurevyxon; that listed assets are free of malicious code; that they do not infringe any third-party copyright, patent, or trademark; and that they accurately represent the asset's functionality as described. Breach of these warranties will result in immediate listing removal, account termination, and potential financial liability for damages to affected parties.
          </p>

          <h2>4. Buyer Obligations</h2>
          <p>
            Buyers agree to use acquired assets strictly within the bounds of the applicable license. Circumventing licensing restrictions — including but not limited to redistributing a Standard License asset as though it were Exclusive — constitutes a material breach of these Terms and may result in account suspension and further legal action.
          </p>

          <h2>5. Platform Fees & Payment Processing</h2>
          <p>
            Aurevyxon deducts a commission from each completed transaction as disclosed in the Seller Guide and seller dashboard. All payment processing is conducted through regulated third-party processors; Aurevyxon does not directly store full payment card data.
          </p>

          <h2>6. Account Suspension & Termination</h2>
          <p>
            Aurevyxon reserves the right to suspend or permanently terminate any account found in violation of these Terms — including intellectual property infringement, fraudulent transaction activity, malicious code distribution, or abusive conduct toward other users — without prior notice where immediate action is required to protect platform integrity.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            Aurevyxon functions as a marketplace facilitator and disclaims liability for indirect, incidental, or consequential damages arising from the use, misuse, or failure of any third-party asset acquired through the platform. Where liability applies, it is limited to the transaction value of the specific purchase in question.
          </p>

          <h2>8. Dispute Resolution</h2>
          <p>
            Disputes between buyers and sellers are first directed through Aurevyxon's internal Dispute Resolution process. Unresolved disputes may proceed to binding arbitration to the extent permitted under applicable law.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India, without regard to conflict-of-law principles, and without prejudice to any mandatory consumer protection rights available to users under their local jurisdiction.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
