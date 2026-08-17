const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /db\.prepare\("UPDATE listings SET is_approved = \? WHERE id = \?"\)\.run\(is_approved \? 1 : 0, req\.params\.id\);/g,
  `db.prepare("UPDATE listings SET is_approved = ? WHERE id = ?").run(is_approved ? 1 : 0, req.params.id);\n         logAudit((req as any).user.id, "UPDATE_LISTING_STATUS", req.params.id, { is_approved });`
);

content = content.replace(
  /db\.prepare\("UPDATE listings SET is_featured = \? WHERE id = \?"\)\.run\(is_featured \? 1 : 0, req\.params\.id\);/g,
  `db.prepare("UPDATE listings SET is_featured = ? WHERE id = ?").run(is_featured ? 1 : 0, req.params.id);\n         logAudit((req as any).user.id, "UPDATE_LISTING_FEATURED", req.params.id, { is_featured });`
);

content = content.replace(
  /db\.prepare\("DELETE FROM listings WHERE id = \?"\)\.run\(req\.params\.id\);/g,
  `db.prepare("DELETE FROM listings WHERE id = ?").run(req.params.id);\n      logAudit((req as any).user.id, "DELETE_LISTING", req.params.id);`
);

content = content.replace(
  /db\.prepare\("UPDATE users SET is_banned = \? WHERE id = \?"\)\.run\(is_banned \? 1 : 0, req\.params\.id\);/g,
  `db.prepare("UPDATE users SET is_banned = ? WHERE id = ?").run(is_banned ? 1 : 0, req.params.id);\n         logAudit((req as any).user.id, "UPDATE_USER_BANNED", req.params.id, { is_banned });`
);

content = content.replace(
  /db\.prepare\("UPDATE users SET is_verified = \? WHERE id = \?"\)\.run\(is_verified \? 1 : 0, req\.params\.id\);/g,
  `db.prepare("UPDATE users SET is_verified = ? WHERE id = ?").run(is_verified ? 1 : 0, req.params.id);\n         logAudit((req as any).user.id, "UPDATE_USER_VERIFIED", req.params.id, { is_verified });`
);

fs.writeFileSync('server.ts', content);
