const fs = require('fs');
let content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');

const oldStars = `                      <div className="flex items-center gap-2">
                         <div className="flex text-yellow-500">
                           <Star className="w-4 h-4 fill-yellow-500" />
                           <Star className="w-4 h-4 fill-yellow-500" />
                           <Star className="w-4 h-4 fill-yellow-500" />
                           <Star className="w-4 h-4 fill-yellow-500" />
                           <Star className="w-4 h-4 fill-yellow-500" />
                         </div>
                         <span className="font-medium">{listing.rating || "5.0"}</span>
                      </div>`;

const newStars = `                      <div className="flex items-center gap-2">
                         <div className="flex text-yellow-500 items-center">
                           <Star className="w-5 h-5 fill-yellow-500 mr-2" />
                           <span className="font-bold text-lg text-white">{listing.rating ? listing.rating.toFixed(1) : "0.0"}</span>
                           <span className="text-muted-foreground ml-2">({listing.review_count || 0} reviews)</span>
                         </div>
                      </div>`;

content = content.replace(oldStars, newStars);

const oldTabs = `<TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Overview</TabsTrigger>
                <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Features & Tech</TabsTrigger>
                {isExclusive && <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Business Analytics</TabsTrigger>}`;

const newTabs = `<TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Overview</TabsTrigger>
                <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Features & Tech</TabsTrigger>
                {isExclusive && <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Business Analytics</TabsTrigger>}
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-muted/50 data-[state=active]:text-foreground dark:text-white">Reviews ({listing.review_count || 0})</TabsTrigger>`;

content = content.replace(oldTabs, newTabs);

const newTabContent = `              <TabsContent value="reviews" className="space-y-6">
                  <h3 className="text-2xl font-display font-semibold text-foreground dark:text-white mb-4">Customer Reviews</h3>
                  {reviewsData && reviewsData.reviews.length > 0 ? (
                      <div className="space-y-6">
                          <div className="flex flex-col md:flex-row gap-8 bg-white/[0.02] p-6 rounded-2xl border border-border">
                              <div className="flex flex-col items-center justify-center min-w-[150px]">
                                  <div className="text-5xl font-bold font-display">{listing.rating ? listing.rating.toFixed(1) : "0.0"}</div>
                                  <div className="flex text-yellow-500 mt-2 mb-1">
                                      {[1,2,3,4,5].map(i => <Star key={i} className={\`w-4 h-4 \${i <= Math.round(listing.rating || 0) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}\`} />)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{listing.review_count || 0} reviews</div>
                              </div>
                              <div className="flex-1 flex flex-col justify-center gap-2">
                                  {[5,4,3,2,1].map(star => {
                                      const count = reviewsData.distribution[star.toString()] || 0;
                                      const pct = listing.review_count > 0 ? (count / listing.review_count) * 100 : 0;
                                      return (
                                          <div key={star} className="flex items-center gap-3 text-sm">
                                              <div className="w-8 flex items-center gap-1 text-muted-foreground">{star} <Star className="w-3 h-3"/></div>
                                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: \`\${pct}%\` }} />
                                              </div>
                                              <div className="w-10 text-right text-muted-foreground">{count}</div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                          
                          <div className="space-y-4">
                              {reviewsData.reviews.map((review: any) => (
                                  <div key={review.id} className="p-6 bg-white/[0.02] border border-border rounded-xl">
                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <div className="font-bold text-white flex items-center gap-2">
                                                  {review.user_name}
                                                  {review.verified_purchase && (
                                                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                          <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                                                      </span>
                                                  )}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString()}</div>
                                          </div>
                                          <div className="flex text-yellow-500">
                                              {[1,2,3,4,5].map(i => <Star key={i} className={\`w-4 h-4 \${i <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}\`} />)}
                                          </div>
                                      </div>
                                      {review.review_text && <p className="text-muted-foreground mt-2">{review.review_text}</p>}
                                      {review.media_url && (
                                          <div className="mt-4">
                                              <img src={review.media_url} alt="Review media" className="h-32 w-auto object-cover rounded-lg border border-border" />
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="text-center p-12 bg-white/[0.02] border border-border rounded-xl">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <h4 className="text-lg font-bold text-white mb-2">No reviews yet</h4>
                          <p className="text-muted-foreground">Be the first to review this product after purchase.</p>
                      </div>
                  )}
              </TabsContent>
            </Tabs>
`;

content = content.replace("            </Tabs>", newTabContent);

// Add CheckCircle2 import if missing
if (!content.includes("CheckCircle2")) {
    content = content.replace('import { Star, MessageSquare }', 'import { Star, MessageSquare, CheckCircle2 }');
}

fs.writeFileSync('src/pages/Listing.tsx', content);
