const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const ticketsApis = `
  app.get("/api/tickets", authenticate, (req: any, res) => {
    try {
      const tickets = db.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
      res.json({ tickets });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tickets", authenticate, (req: any, res) => {
    try {
      const { subject, message, priority } = req.body;
      const { ulid } = require('ulid');
      db.prepare("INSERT INTO support_tickets (id, user_id, subject, message, priority) VALUES (?, ?, ?, ?, ?)").run(
        ulid(), req.user.id, subject, message, priority || 'normal'
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

if (!content.includes('app.get("/api/tickets"')) {
  content = content.replace('app.get("/api/dashboard"', ticketsApis + '\n  app.get("/api/dashboard"');
  fs.writeFileSync('server.ts', content);
}
