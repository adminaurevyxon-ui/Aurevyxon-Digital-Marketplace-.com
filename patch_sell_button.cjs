const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const target = `                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      placeholder="React, Next.js, Android" 
                      className="bg-muted border-border pl-9"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>`;

const replacement = `                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      placeholder="React, Next.js, Android" 
                      className="bg-muted border-border pl-9"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 mb-4">
                <Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05]">
                  Mobile Apps &rarr;
                </Button>
              </div>
            </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Sell.tsx', code);
