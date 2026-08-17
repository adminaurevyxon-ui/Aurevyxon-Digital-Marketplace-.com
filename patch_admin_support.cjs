const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminSupportTickets.tsx', 'utf8');

const emptyState = `            {tickets.map((t) => (`;
const newEmptyState = `            {tickets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No support tickets found.</td>
              </tr>
            )}
            {tickets.map((t) => (`

content = content.replace(emptyState, newEmptyState);
fs.writeFileSync('src/pages/AdminSupportTickets.tsx', content);
