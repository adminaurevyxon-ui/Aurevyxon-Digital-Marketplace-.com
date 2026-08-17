const fs = require('fs');
let content = fs.readFileSync('src/pages/Listing.tsx', 'utf8');

const importReviews = `import { Star, MessageSquare } from "lucide-react";`;
content = content.replace('import { Star } from "lucide-react";', importReviews);

// Add states for reviews
const stateReplacement = `  const [listing, setListing] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);
`;
content = content.replace('const [listing, setListing] = useState<any>(null);', stateReplacement);

// Add fetchReviews
const fetchReplacement = `
  const fetchReviews = () => {
      fetch(\`/api/products/\${id}/reviews\`)
        .then(res => res.json())
        .then(data => setReviewsData(data))
        .catch(console.error);
  };
  
  useEffect(() => {
    fetchListing();
    fetchWishlistStatus();
    fetchReviews();
  }, [id, isAuthenticated]);
`;
content = content.replace(/  useEffect\(\(\) => \{\n    fetchListing\(\);\n    fetchWishlistStatus\(\);\n  \}, \[id, isAuthenticated\]\);/, fetchReplacement);

fs.writeFileSync('src/pages/Listing.tsx', content);
