const fs = require('fs');
let content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');

const ratingCode = `
                 {!isExclusive && (
                    <>
                      <div className="w-px h-8 bg-muted/50" />
                      <div>
                         <p className="text-muted-foreground text-xs">Rating</p>
                         <p className="font-medium text-foreground dark:text-white flex items-center gap-1">
                           <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                           {listing.rating ? listing.rating.toFixed(1) : "0.0"} <span className="text-muted-foreground ml-1 font-normal">({listing.review_count || 0} reviews)</span>
                         </p>
                      </div>
                      <div className="w-px h-8 bg-muted/50" />
                      <div>
                         <p className="text-muted-foreground text-xs">Sales</p>
                         <p className="font-medium text-foreground dark:text-white">{listing.sales || 0}</p>
                      </div>
                    </>
                 )}
`;
// Need to find where to inject ratingCode if it's there.
// Let's first search for "Sales" or "Rating" in the file.
