const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find where "validate: {" is.
const startIdx = code.indexOf('    validate: {\n      xForwardedForHeader: false,\n      trustProxy: false,\n      forwardedHeader: false');
if (startIdx === -1) {
  console.log("Could not find rate limiter validate block.");
  process.exit(1);
}

// Find where the end of the broken listings route is
const endStr = '        return { ...l, tags };\n      })\n    });\n  });';
const endIdx = code.indexOf(endStr);
if (endIdx === -1) {
  console.log("Could not find end of listings route.");
  process.exit(1);
}

const replacement = `    validate: {
      xForwardedForHeader: false,
      trustProxy: false,
      forwardedHeader: false
    }
  });
  
  app.use(limiter);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

  const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.sendStatus(403);
    next();
  };

  const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') return res.sendStatus(403);
    next();
  };

  app.post("/api/auth/firebase-login", async (req, res) => {
    const { idToken } = req.body;
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const email = decodedToken.email;
      const name = decodedToken.name || email?.split("@")[0] || "User";
      let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      
      if (!user) {
        user = {
          id: ulid(),
          email,
          name,
          role: "user"
        };
        db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)").run(user.id, user.email, user.name, user.role);
      }
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch(err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.get("/api/dashboard", authenticate, (req, res) => {
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      const purchases = db.prepare(\`
        SELECT o.*, l.title, l.price as amount
        FROM orders o
        JOIN listings l ON o.listing_id = l.id
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC
      \`).all(req.user.id);
      
      const sales = db.prepare(\`
        SELECT o.*, l.title, l.price as amount
        FROM orders o
        JOIN listings l ON o.listing_id = l.id
        WHERE o.seller_id = ?
        ORDER BY o.created_at DESC
      \`).all(req.user.id);
      
      const listings = db.prepare("SELECT * FROM listings WHERE seller_id = ? ORDER BY created_at DESC").all(req.user.id);
      
      res.json({ user, purchases, sales, listings });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/user/profile", authenticate, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).send("Not found");
    res.json({ user });
  });
  
  app.post("/api/user/profile", authenticate, (req, res) => {
    const { name, bio } = req.body;
    db.prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?").run(name, bio, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/user/security", authenticate, (req, res) => {
    res.json({ security: { twoFactorEnabled: false } });
  });

  app.get("/api/user/reviews", authenticate, (req, res) => {
    const reviews = db.prepare("SELECT * FROM reviews WHERE user_id = ?").all(req.user.id);
    res.json({ reviews });
  });

  app.get("/api/wishlists", authenticate, (req, res) => {
    const items = db.prepare(\`
      SELECT w.id as wishlist_id, l.*
      FROM wishlists w
      JOIN listings l ON w.listing_id = l.id
      WHERE w.user_id = ?
    \`).all(req.user.id);
    res.json({ items });
  });
  
  app.get("/api/download/:orderId", authenticate, (req, res) => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND buyer_id = ?").get(req.params.orderId, req.user.id);
    if (!order) return res.status(404).send("Not found");
    res.setHeader('Content-disposition', 'attachment; filename=purchase.zip');
    res.setHeader('Content-type', 'application/zip');
    res.send("MOCK_ZIP_CONTENT_PROD_READY");
  });
  
  app.post("/api/seller/onboard", authenticate, (req, res) => {
    db.prepare("UPDATE users SET role = 'seller' WHERE id = ?").run(req.user.id);
    res.json({ success: true });
  });

  // RESTORE listings API
  app.get("/api/listings", (req, res) => {
    let queryStr = "SELECT l.*, u.name as seller_name, u.avatar_url as seller_avatar FROM listings l JOIN users u ON l.seller_id = u.id WHERE 1=1";
    let queryArgs = [];

    const category = req.query.category;
    if (category && category !== "All") {
      queryStr += " AND l.type = ?";
      queryArgs.push(category);
    }
    
    const mode = req.query.mode;
    if (mode && mode !== "All") {
      queryStr += " AND l.mode = ?";
      queryArgs.push(mode);
    }
    
    const sortBy = req.query.sort;
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

    const listings = db.prepare(queryStr).all(...queryArgs);
    res.json({
      listings: listings.map((l) => {
        let tags = [];
        try { tags = l.tags ? JSON.parse(l.tags) : []; } catch(e) {}
        return { ...l, tags };
      })
    });
  });`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx + endStr.length);
fs.writeFileSync('server.ts', code);
console.log("Restored API routes.");
