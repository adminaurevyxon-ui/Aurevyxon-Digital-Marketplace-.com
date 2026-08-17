const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const ths = `<th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Fee/TDS</th>
                   <th className="px-6 py-4">Net Payout</th>
                   <th className="px-6 py-4">Buyer / Seller</th>`;
content = content.replace(/<th className="px-6 py-4">Amount<\/th>\n                   <th className="px-6 py-4">Platform Fee<\/th>\n                   <th className="px-6 py-4">Seller Earnings<\/th>\n                   <th className="px-6 py-4">Buyer \/ Seller<\/th>/, ths);

const tdsLogic = `<td className="px-6 py-4 text-emerald-400 font-medium">\${tx.amount.toFixed(2)}</td>
                     <td className="px-6 py-4 text-indigo-400">
                        <div className="text-xs">Fee: \${tx.platform_fee.toFixed(2)}</div>
                        <div className="text-xs text-red-400">TDS: \${(tx.tds_deducted_amount || 0).toFixed(2)}</div>
                     </td>
                     <td className="px-6 py-4 font-bold">\${(tx.net_seller_payout_amount || tx.seller_earnings || 0).toFixed(2)}</td>
                     <td className="px-6 py-4">`;
content = content.replace(/<td className="px-6 py-4 text-emerald-400 font-medium">\$\{tx\.amount\.toFixed\(2\)\}<\/td>\n                     <td className="px-6 py-4 text-indigo-400">\$\{tx\.platform_fee\.toFixed\(2\)\}<\/td>\n                     <td className="px-6 py-4">\$\{tx\.seller_earnings\.toFixed\(2\)\}<\/td>\n                     <td className="px-6 py-4">/, tdsLogic);

fs.writeFileSync('src/pages/Admin.tsx', content);
