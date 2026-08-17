const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const requireSuperAdminDeclaration = `  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Super Admin access required" });
    }
    next();
  };`;

content = content.replace(requireSuperAdminDeclaration, ''); // Remove the old one

// Find "const authenticate = " and insert requireSuperAdmin right after it.
const authenticateDeclaration = `const authenticate = (req: any, res: any, next: any) => {`;
const authenticateFull = `  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev-only') as any;
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };`;

content = content.replace(authenticateFull, authenticateFull + '\n\n' + requireSuperAdminDeclaration);

fs.writeFileSync('server.ts', content);
