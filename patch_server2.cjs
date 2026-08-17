const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('app.get("/api/tickets"')) {
  content = content.replace(
    /app\.get\("\/api\/admin\/tickets", authenticate, requireAdmin, \(req: any, res\) => \{/,
    `app.get("/api/tickets", authenticate, (req: any, res) => {
    try {
      const tickets = db.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
      res.json({ tickets });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.post("/api/tickets", authenticate, (req: any, res) => {
    try {
      const { subject, message } = req.body;
      db.prepare("INSERT INTO support_tickets (id, user_id, subject, message) VALUES (?, ?, ?, ?)").run(
        require('crypto').randomUUID(), req.user.id, subject, message
      );
      res.json({ message: "Ticket created" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  app.get("/api/admin/tickets", authenticate, requireAdmin, (req: any, res) => {`
  );
  fs.writeFileSync('server.ts', content);
}
