const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');
code = code.replace(
  '<Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05]">\n                      Mobile Apps &rarr;\n                    </Button>',
  '<Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05]">\n                      {formData.type || "Mobile Apps"} &rarr;\n                    </Button>'
);
fs.writeFileSync('src/pages/Sell.tsx', code);
