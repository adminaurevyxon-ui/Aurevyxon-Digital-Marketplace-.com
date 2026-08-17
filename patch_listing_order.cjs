const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const orderReplacement = `    if (mode && mode !== "All") {
      queryStr += " AND l.mode = ?";
      queryArgs.push(mode);
    }
    
    const sortBy = req.query.sort as string;
    if (sortBy === 'newest') {
      queryStr += " ORDER BY l.is_featured DESC, l.created_at DESC";
    } else if (sortBy === 'price_asc') {
      queryStr += " ORDER BY l.is_featured DESC, l.price ASC";
    } else if (sortBy === 'price_desc') {
      queryStr += " ORDER BY l.is_featured DESC, l.price DESC";
    } else if (sortBy === 'sales') {
      queryStr += " ORDER BY l.is_featured DESC, l.sales DESC";
    } else {
      queryStr += " ORDER BY l.is_featured DESC, l.weighted_rating DESC, l.sales DESC, l.created_at DESC";
    }
`;

content = content.replace(/    \}[\s\S]*?queryStr \+\= " ORDER BY l\.is_featured DESC, l\.created_at DESC";/, orderReplacement);

fs.writeFileSync('server.ts', content);
