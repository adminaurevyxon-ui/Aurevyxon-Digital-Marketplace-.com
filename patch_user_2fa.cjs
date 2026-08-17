const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/UserDashboard.tsx', 'utf8');
code = code.replace(
  /onClick={\(\) => toast\.success\("2FA setup email sent! Please check your inbox\."\)}/,
  `onClick={async () => {
    try {
       const res = await fetch('/api/user/2fa/enable', { method: 'POST', headers: { Authorization: \`Bearer \${token}\` } });
       if(res.ok) toast.success("2FA setup email sent! Please check your inbox.");
       else throw new Error("Failed to enable 2FA");
    } catch(err: any) { toast.error(err.message); }
  }}`
);
fs.writeFileSync('src/pages/dashboard/UserDashboard.tsx', code);
