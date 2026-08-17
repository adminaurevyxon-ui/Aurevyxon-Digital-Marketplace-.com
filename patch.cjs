const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const newField = `
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Discount Percentage (%)</label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    placeholder="0" 
                    className="bg-muted border-border"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  />
                </div>
`;

code = code.replace(
  '                <div>\n                  <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>',
  newField + '                <div>\n                  <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>'
);

fs.writeFileSync('src/pages/Sell.tsx', code);
