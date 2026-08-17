const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const target = `                </DropdownMenu>
              </div>
            </div>`;

const replacement = `                </DropdownMenu>
                {formData.type && (
                  <p className="mt-3 text-sm text-gray-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Category selected: <span className="text-white">{formData.type}</span>
                  </p>
                )}
              </div>
            </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Sell.tsx', code);
