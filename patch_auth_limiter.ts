import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const rateLimiters = `
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 failed requests per windowMs for auth
    skipSuccessfulRequests: true,
    message: "Too many login attempts from this IP, please try again after 15 minutes.",
  });
`;

if(!content.includes("authLimiter = rateLimit")) {
  content = content.replace(
    'const limiter = rateLimit({',
    rateLimiters + '\n  const limiter = rateLimit({'
  );

  content = content.replace(
    'app.post("/api/auth/login", ',
    'app.post("/api/auth/login", authLimiter, '
  );
  content = content.replace(
    'app.post("/api/auth/register", ',
    'app.post("/api/auth/register", authLimiter, '
  );
  content = content.replace(
    'app.post("/api/auth/firebase-login", ',
    'app.post("/api/auth/firebase-login", authLimiter, '
  );
  content = content.replace(
    'app.post("/api/auth/otp/verify", ',
    'app.post("/api/auth/otp/verify", authLimiter, '
  );

  fs.writeFileSync('server.ts', content);
}
