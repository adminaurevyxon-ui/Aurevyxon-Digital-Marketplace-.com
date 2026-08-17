import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const kycEndpoint = `
  app.post("/api/user/kyc", authenticate, (req: any, res) => {
     const { full_name, dob, address, company_name, tax_id } = req.body;
     try {
       // Check if pending already exists
       const existing = db.prepare("SELECT * FROM user_kyc WHERE user_id = ? AND status = 'pending'").get(req.user.id);
       if (existing) {
         return res.status(400).json({ error: "KYC already submitted and pending review" });
       }
       
       const bank_details = JSON.stringify({ full_name, dob, address, company_name, tax_id });
       db.prepare("INSERT INTO user_kyc (id, user_id, bank_details, status) VALUES (?, ?, ?, 'pending')").run(ulid(), req.user.id, bank_details);
       res.json({ success: true });
     } catch (err: any) {
       res.status(500).json({ error: err.message });
     }
  });

`;

content = content.replace('app.put("/api/user/security", authenticate', kycEndpoint + '  app.put("/api/user/security", authenticate');

fs.writeFileSync('server.ts', content);
