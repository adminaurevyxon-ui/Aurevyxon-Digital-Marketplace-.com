const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('/api/admin/tickets')) {
  const adminApiBlock = `
  // Admin Support Tickets
  app.get("/api/admin/tickets", authenticate, requireSuperAdmin, (req, res) => {
    try {
      const tickets = db.prepare("SELECT t.*, u.name as user_name, u.email as user_email FROM support_tickets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC").all();
      res.json({ tickets });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/tickets/:id", authenticate, requireSuperAdmin, (req, res) => {
    const { status, resolution, assigned_to } = req.body;
    try {
      if (status) db.prepare("UPDATE support_tickets SET status = ? WHERE id = ?").run(status, req.params.id);
      if (resolution !== undefined) db.prepare("UPDATE support_tickets SET resolution = ? WHERE id = ?").run(resolution, req.params.id);
      if (assigned_to !== undefined) db.prepare("UPDATE support_tickets SET assigned_to = ? WHERE id = ?").run(assigned_to, req.params.id);
      
      logAudit((req as any).user.id, "UPDATE_TICKET", req.params.id, { status, resolution, assigned_to });
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;
  content = content.replace('// ========== ENTERPRISE ADMIN APIs ==========', '// ========== ENTERPRISE ADMIN APIs ==========\n' + adminApiBlock);
}

if (!content.includes('/api/tickets')) {
  const userApiBlock = `
  app.post("/api/tickets", authenticate, (req, res) => {
    const { subject, message } = req.body;
    try {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO support_tickets (id, user_id, subject, message) VALUES (?, ?, ?, ?)").run(id, (req as any).user.id, subject, message);
      res.json({ success: true, id });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.get("/api/tickets", authenticate, (req, res) => {
    try {
      const tickets = db.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").all((req as any).user.id);
      res.json({ tickets });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;
  content = content.replace('// ========== API ROUTES ==========', '// ========== API ROUTES ==========\n' + userApiBlock);
}

fs.writeFileSync('server.ts', content);
