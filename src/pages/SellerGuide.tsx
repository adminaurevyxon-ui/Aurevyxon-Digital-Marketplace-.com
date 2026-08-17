import { motion } from "motion/react";
import { BookOpen, TrendingUp, Key, MessageSquare, Layers, Star } from "lucide-react";

export default function SellerGuide() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-24 max-w-4xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> The Playbook
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8">
            The Aurevyxon <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Mastery Guide</span> for Sellers
          </h1>
          <blockquote className="text-xl text-muted-foreground max-w-3xl mx-auto italic border-l-4 border-purple-500 pl-6 text-left">
            "The gap between an average listing and a top-1% listing on Aurevyxon is rarely talent — it is method. This guide distills the patterns observed across the platform's highest-performing seller accounts into a direct, actionable playbook."
          </blockquote>
        </motion.div>

        <div className="space-y-12">
          {[
            {
              title: "1. Listing Optimization as a Discipline",
              icon: Star,
              content: "High-resolution previews, comprehensive markdown documentation, and a clear articulation of what is and isn't included consistently outperform minimal-effort listings. Top-tier listings include: live demo links, embedded changelogs, explicit licensing scope, and a README-grade technical breakdown — treated as a product deliverable, not an afterthought."
            },
            {
              title: "2. Pricing as Strategic Positioning",
              icon: TrendingUp,
              content: "Exclusive Assets command 10x–50x the pricing ceiling of Standard Licensed equivalents, in exchange for full IP transfer. Standard License products, by contrast, benefit from competitively structured volume pricing paired with SEO-optimized titles and precise tagging for discoverability."
            },
            {
              title: "3. Intellectual Property Discipline",
              icon: Key,
              content: "List only assets over which you hold full, verifiable legal rights. Use watermarked previews where sensitive, avoid exposing unobfuscated core logic in public screenshots, and define licensing terms — personal, commercial, resale — with zero ambiguity to preempt disputes before they occur."
            },
            {
              title: "4. Trust as a Compounding Asset",
              icon: MessageSquare,
              content: "Response latency to buyer inquiries directly influences your Seller Trust Score, which in turn governs listing visibility across search and recommendation surfaces. Maintain disciplined changelog hygiene and respond to both praise and criticism with the same professionalism."
            },
            {
              title: "5. Scaling Beyond a Single Listing",
              icon: Layers,
              content: "The highest-earning sellers architect a catalog strategy: bundling complementary assets, offering tiered licensing structures (Basic / Pro / Enterprise), and maintaining a consistent update cadence — converting one-time buyers into long-term, repeat customers."
            }
          ].map((section, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white/[0.02] border border-border/50 p-8 rounded-3xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <section.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold">{section.title}</h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed pl-16">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
