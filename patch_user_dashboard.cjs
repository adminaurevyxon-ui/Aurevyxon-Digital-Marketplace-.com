const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');

const importReviewModal = `import { ReviewModal } from "@/components/ReviewModal";\nimport { Star } from "lucide-react";`;
content = content.replace('import { Button } from "@/components/ui/button";', importReviewModal + '\nimport { Button } from "@/components/ui/button";');

const purchasesTabReplacement = `function PurchasesTab({ data }: { data: any }) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const openReviewModal = (product: any) => {
      setSelectedProduct(product);
      setReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Order History</h2>
      {data?.purchases?.length === 0 ? (
        <div className="p-8 text-center border border-border rounded-xl bg-white/[0.02]">
          <p className="text-muted-foreground">You haven't made any purchases yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data?.purchases?.map((p: any) => (
            <div key={p.order_id} className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border border-border bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <img src={p.image_url} className="w-16 h-16 rounded-lg object-cover" alt={p.title} />
              <div className="flex-1 text-left w-full">
                <h4 className="font-bold text-white">{p.title}</h4>
                <p className="text-sm text-muted-foreground">Order: {p.order_id} • \${p.amount}</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="border-border w-full md:w-auto" onClick={() => openReviewModal(p)}>
                      <Star className="w-4 h-4 mr-2" /> Rate Product
                  </Button>
                  <Button className="bg-indigo-500 hover:bg-indigo-600 text-white w-full md:w-auto">Download</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedProduct && (
          <ReviewModal 
              isOpen={reviewModalOpen} 
              onClose={() => setReviewModalOpen(false)} 
              product={selectedProduct} 
          />
      )}
    </div>
  );
}`;

content = content.replace(/function PurchasesTab\(\{ data \}: \{ data: any \}\) \{[\s\S]*?    <\/div>\n  \);\n\}/, purchasesTabReplacement);

fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', content);
