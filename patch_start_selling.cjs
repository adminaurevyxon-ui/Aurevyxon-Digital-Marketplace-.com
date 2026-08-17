const fs = require('fs');
let content = fs.readFileSync('src/pages/StartSelling.tsx', 'utf8');

const importSelect = `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n`;
if (!content.includes('SelectContent')) {
  content = content.replace('import { Button }', importSelect + 'import { Button }');
}

// Add state for validation and connected status
const stateUpdate = `  const [formData, setFormData] = useState({
    display_name: "",
    seller_type: "individual",
    pan_number: "",
    gstin: "",
    payout_method: "bank",
    payout_details: "",
    ifsc: "",
    agreement_accepted: false
  });
  const [stripeConnected, setStripeConnected] = useState(false);
  const [razorpayConnected, setRazorpayConnected] = useState(false);
  
  const validateStep = (currentStep) => {
      if (currentStep === 1) {
          if (!formData.display_name) { toast.error("Display Name is required"); return false; }
          return true;
      }
      if (currentStep === 2) {
          if (!formData.pan_number) { toast.error("PAN/National ID is required"); return false; }
          if (formData.seller_type === 'business' && !formData.gstin) { toast.error("GSTIN is required for business"); return false; }
          return true;
      }
      if (currentStep === 3) {
          if (!formData.payout_method) {
              toast.error("Please select a payout method");
              return false;
          }
          if (formData.payout_method === 'bank') {
              if (!formData.payout_details) { toast.error("Account Number is required"); return false; }
              if (!/^\d{8,18}$/.test(formData.payout_details)) { toast.error("Please enter a valid Account Number"); return false; }
              if (!formData.ifsc) { toast.error("IFSC Code is required"); return false; }
              if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc.toUpperCase())) { toast.error("Please enter a valid IFSC Code"); return false; }
          } else if (formData.payout_method === 'upi') {
              if (!formData.payout_details) { toast.error("UPI ID is required"); return false; }
              if (!/^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.payout_details)) { toast.error("Please enter a valid UPI ID (e.g., name@bank)"); return false; }
          } else if (formData.payout_method === 'stripe') {
              if (!stripeConnected) { toast.error("Please connect your Stripe account to proceed"); return false; }
          } else if (formData.payout_method === 'razorpay') {
              if (!razorpayConnected) { toast.error("Please connect your Razorpay account to proceed"); return false; }
          }
          return true;
      }
      return true;
  };
`;

content = content.replace(/  const \[formData, setFormData\] = useState\(\{[\s\S]*?agreement_accepted: false\n  \}\);/, stateUpdate);

const nextButtonReplacement = `<Button onClick={() => { if (validateStep(step)) setStep(step + 1); }} className="bg-emerald-600 hover:bg-emerald-500 text-white">`;
content = content.replace(/<Button onClick=\{\(\) => setStep\(step \+ 1\)\} className="bg-emerald-600 hover:bg-emerald-500 text-white">/, nextButtonReplacement);

const step3Replacement = `{step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h3 className="text-xl font-bold">3. Payout Setup (Commission Split)</h3>
                    <p className="text-sm text-gray-400">Select how you want to receive your earnings automatically.</p>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Payout Method</label>
                      <Select value={formData.payout_method} onValueChange={(val) => setFormData({...formData, payout_method: val, payout_details: "", ifsc: ""})}>
                        <SelectTrigger className="w-full bg-[#111422] border border-gray-800 rounded-xl px-4 py-6 text-white h-auto">
                           <SelectValue placeholder="Select payout method" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111422] border-gray-800 text-white">
                           <SelectItem value="bank">Bank Transfer (India / Global)</SelectItem>
                           <SelectItem value="upi">UPI (India)</SelectItem>
                           <SelectItem value="stripe">Stripe Connect (International)</SelectItem>
                           <SelectItem value="razorpay">Razorpay Route (India)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.payout_method === 'bank' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2">Account Number</label>
                            <input 
                              type="text" 
                              className="w-full bg-[#111422] border border-gray-800 rounded-xl px-4 py-3 text-white"
                              placeholder="Account Number"
                              value={formData.payout_details}
                              onChange={e => setFormData({...formData, payout_details: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2">IFSC / SWIFT Code</label>
                            <input 
                              type="text" 
                              className="w-full bg-[#111422] border border-gray-800 rounded-xl px-4 py-3 text-white uppercase"
                              placeholder="IFSC Code"
                              value={formData.ifsc}
                              onChange={e => setFormData({...formData, ifsc: e.target.value.toUpperCase()})}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">We will perform a micro-deposit verification (₹1) before your first payout.</p>
                        </div>
                    )}

                    {formData.payout_method === 'upi' && (
                        <div>
                          <label className="block text-sm font-semibold mb-2">UPI ID</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#111422] border border-gray-800 rounded-xl px-4 py-3 text-white"
                            placeholder="yourname@upi"
                            value={formData.payout_details}
                            onChange={e => setFormData({...formData, payout_details: e.target.value})}
                          />
                          <p className="text-xs text-gray-400 mt-2">Payouts will be settled instantly via UPI.</p>
                        </div>
                    )}

                    {formData.payout_method === 'stripe' && (
                        <div>
                          <label className="block text-sm font-semibold mb-2">Stripe Connect</label>
                          {!stripeConnected ? (
                              <Button type="button" onClick={() => { setStripeConnected(true); setFormData({...formData, payout_details: "acct_connected_" + Date.now()}) }} className="w-full bg-[#635BFF] hover:bg-[#635BFF]/80 text-white rounded-xl py-6 h-auto">Connect with Stripe</Button>
                          ) : (
                              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-4 flex items-center justify-center gap-2 font-medium">
                                  <CheckCircle2 className="w-5 h-5" /> Connected to Stripe
                              </div>
                          )}
                          <p className="text-xs text-gray-400 mt-3">Funds will be auto-split and deposited directly to your bank account via Stripe.</p>
                        </div>
                    )}

                    {formData.payout_method === 'razorpay' && (
                        <div>
                          <label className="block text-sm font-semibold mb-2">Razorpay Route</label>
                          {!razorpayConnected ? (
                              <Button type="button" onClick={() => { setRazorpayConnected(true); setFormData({...formData, payout_details: "rzp_acc_" + Date.now()}) }} className="w-full bg-[#02042B] hover:bg-[#02042B]/80 border border-[#3395FF]/50 text-white rounded-xl py-6 h-auto">Connect with Razorpay Route</Button>
                          ) : (
                              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-4 flex items-center justify-center gap-2 font-medium">
                                  <CheckCircle2 className="w-5 h-5" /> Connected to Razorpay Route
                              </div>
                          )}
                          <p className="text-xs text-gray-400 mt-3">Funds will be auto-split and deposited directly to your bank account via Razorpay.</p>
                        </div>
                    )}

                  </motion.div>
                )}`;

content = content.replace(/\{step === 3 && \([\s\S]*?<\/motion.div>\n                \)\}/, step3Replacement);

fs.writeFileSync('src/pages/StartSelling.tsx', content);
