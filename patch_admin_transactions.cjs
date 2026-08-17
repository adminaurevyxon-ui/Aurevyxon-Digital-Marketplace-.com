const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const txSearchState = `  const [txSearch, setTxSearch] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [activeTab, setActiveTab] = useState('overview');`;

content = content.replace("  const [activeTab, setActiveTab] = useState('overview');", txSearchState);

const txSearchLogic = `{activeTab === 'transactions' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                 <h2 className="text-xl font-bold text-white">Transactions</h2>
                 <input 
                    type="text" 
                    placeholder="Search by ID, item, or user..." 
                    className="w-full max-w-sm bg-[#111422] border border-gray-800 rounded-md px-4 py-2 text-sm text-white"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                 />
               </div>
               <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">`;

content = content.replace(`{activeTab === 'transactions' && (\n             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl overflow-hidden shadow-2xl">\n               <div className="overflow-x-auto">\n             <table className="w-full text-sm text-left">`, txSearchLogic);

const txMapLogic = `{transactions.filter(tx => !txSearch || tx.id.includes(txSearch) || (tx.product_title && tx.product_title.toLowerCase().includes(txSearch.toLowerCase())) || (tx.buyer_name && tx.buyer_name.toLowerCase().includes(txSearch.toLowerCase())) || (tx.seller_name && tx.seller_name.toLowerCase().includes(txSearch.toLowerCase()))).map(tx => (`;
content = content.replace(`{transactions.map(tx => (`, txMapLogic);

const payoutSearchLogic = `{activeTab === 'payouts' && (
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl overflow-hidden shadow-2xl">
               <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                 <h2 className="text-xl font-bold text-white">Seller Payouts</h2>
                 <input 
                    type="text" 
                    placeholder="Search by ID, user, or status..." 
                    className="w-full max-w-sm bg-[#111422] border border-gray-800 rounded-md px-4 py-2 text-sm text-white"
                    value={payoutSearch}
                    onChange={(e) => setPayoutSearch(e.target.value)}
                 />
               </div>
               <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">`;
content = content.replace(`{activeTab === 'payouts' && (\n             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl overflow-hidden shadow-2xl">\n               <div className="overflow-x-auto">\n             <table className="w-full text-sm text-left">`, payoutSearchLogic);

const payoutMapLogic = `{payouts.filter(p => !payoutSearch || p.id.includes(payoutSearch) || (p.user_name && p.user_name.toLowerCase().includes(payoutSearch.toLowerCase())) || p.status.includes(payoutSearch.toLowerCase())).map(p => (`;
content = content.replace(`{payouts.map(p => (`, payoutMapLogic);

fs.writeFileSync('src/pages/Admin.tsx', content);
