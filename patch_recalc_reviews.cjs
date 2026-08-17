const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const reviewsAPI = `
  // ========== REVIEWS API ==========
  const RECALCULATE_RATING = (listing_id: string) => {
      const stats = db.prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE listing_id = ? AND moderation_status = 'visible'").get(listing_id) as any;
      
      const v = stats.count || 0;
      const R = stats.avg_rating || 0;
      const m = 10;
      const C = 4.0; // Platform average
      
      let weighted_rating = 0;
      if (v > 0) {
          weighted_rating = (v / (v + m)) * R + (m / (v + m)) * C;
      } else {
          weighted_rating = 0; // Or C, but 0 means it drops if no reviews. Wait, actually if v=0, weighted_rating = (0)*R + (1)*C = C.
          // Let's use 0 so unreviewed items don't artificially sit at 4.0 above poorly reviewed items, OR let's use C to trust them initially.
          // The prompt says: "pulled toward the platform average until it accumulates enough reviews to be trusted".
          weighted_rating = (v / (v + m)) * R + (m / (v + m)) * C;
      }
      
      db.prepare("UPDATE listings SET rating = ?, review_count = ?, weighted_rating = ? WHERE id = ?").run(R, v, weighted_rating, listing_id);
  };

  app.post("/api/reviews", authenticate, (req, res) => {
      try {
          const { product_id, rating, review_text, media_url } = req.body;
          if (!product_id || !rating || rating < 1 || rating > 5) {
              return res.status(400).json({ error: "Invalid rating data" });
          }
          
          const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(product_id) as any;
          if (!listing) return res.status(404).json({ error: "Product not found" });
          
          if (listing.seller_id === req.user.id) {
              return res.status(403).json({ error: "You cannot review your own product" });
          }
          
          // Verify purchase
          const purchase = db.prepare("SELECT id FROM transactions WHERE buyer_id = ? AND listing_id = ? AND status = 'completed' LIMIT 1").get(req.user.id, product_id) as any;
          if (!purchase) {
              return res.status(403).json({ error: "You must purchase this product to review it" });
          }
          
          // Check if already reviewed
          const existing = db.prepare("SELECT id FROM reviews WHERE user_id = ? AND listing_id = ?").get(req.user.id, product_id);
          if (existing) {
              return res.status(400).json({ error: "You have already reviewed this product" });
          }
          
          // Add review
          const edit_locked_at = new Date();
          edit_locked_at.setHours(edit_locked_at.getHours() + 48); // 48h edit window
          
          db.prepare("INSERT INTO reviews (id, listing_id, user_id, rating, review_text, media_url, verified_purchase, order_id, edit_locked_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)").run(
              ulid(), product_id, req.user.id, rating, review_text || null, media_url || null, purchase.id, edit_locked_at.toISOString()
          );
          
          // Recalculate
          RECALCULATE_RATING(product_id);
          
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  app.patch("/api/reviews/:id", authenticate, (req, res) => {
      try {
          const { rating, review_text, media_url } = req.body;
          const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id) as any;
          if (!review) return res.status(404).json({ error: "Review not found" });
          if (review.user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
          
          if (new Date() > new Date(review.edit_locked_at)) {
              return res.status(400).json({ error: "Edit window has closed for this review (48 hours)" });
          }
          
          db.prepare("UPDATE reviews SET rating = ?, review_text = ?, media_url = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?").run(
              rating || review.rating, review_text ?? review.review_text, media_url ?? review.media_url, review.id
          );
          
          RECALCULATE_RATING(review.listing_id);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });
  
  app.get("/api/products/:id/reviews", (req, res) => {
      try {
          const reviews = db.prepare("SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.listing_id = ? AND r.moderation_status = 'visible' ORDER BY r.created_at DESC").all(req.params.id);
          const distribution = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
          reviews.forEach((r: any) => {
              if (r.rating >= 1 && r.rating <= 5) distribution[r.rating as keyof typeof distribution]++;
          });
          res.json({ reviews, distribution });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });
`;

content = content.replace("// ========== ENTERPRISE ADMIN APIs ==========", reviewsAPI + "\n  // ========== ENTERPRISE ADMIN APIs ==========");
fs.writeFileSync('server.ts', content);
