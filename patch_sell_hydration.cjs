const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const target = `<DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05] h-14 px-8 text-lg font-medium w-full sm:w-auto shadow-sm">
                      Select App Category &rarr;
                    </Button>
                  </DropdownMenuTrigger>`;

const replacement = `<DropdownMenuTrigger render={<Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05] h-14 px-8 text-lg font-medium w-full sm:w-auto shadow-sm" />}>
                    Select App Category &rarr;
                  </DropdownMenuTrigger>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Sell.tsx', code);
