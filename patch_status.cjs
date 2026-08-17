const fs = require('fs');
let content = fs.readFileSync('src/pages/StartSelling.tsx', 'utf8');

// Fix the regex
content = content.replace(/!\/\^d\\{8,18\\}\$\/.test/, '!/^\\d{8,18}$/.test');

const statusPageCode = `
  const sellerProfile = (user as any)?.seller_profile;
  if (sellerProfile) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0b0f19] border border-gray-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl p-8 relative z-10 text-center"
        >
          {sellerProfile.kyc_status === 'pending' && (
            <>
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Shield className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 font-display text-white">Under Review</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Your seller application and payout details are currently being reviewed by our team. 
                This process usually takes 24-48 hours. We will notify you once approved.
              </p>
              <div className="flex justify-center gap-4">
                 <Button onClick={() => navigate("/")} variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Return Home</Button>
              </div>
            </>
          )}

          {sellerProfile.kyc_status === 'rejected' && (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Shield className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 font-display text-white">Application Rejected</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Unfortunately, your application was not approved.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm mb-8 text-left">
                 <strong>Reason:</strong> {sellerProfile.rejection_reason || "Invalid documents or payout details provided. Please review our policies and try again."}
              </div>
              <div className="flex justify-center gap-4">
                 <Button onClick={() => {
                     // Reset state logic could go here
                     window.location.href = "mailto:support@aurevyxon.com";
                 }} className="bg-emerald-600 hover:bg-emerald-500 text-white">Contact Support</Button>
                 <Button onClick={() => navigate("/")} variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Return Home</Button>
              </div>
            </>
          )}

          {sellerProfile.kyc_status === 'verified' && (
            <>
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 font-display text-white">Seller Account Active</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Congratulations! Your identity and payout details have been verified. You can now start creating listings and earning revenue.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Button onClick={() => navigate("/seller/dashboard")} variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Seller Dashboard</Button>
                 <Button onClick={() => navigate("/sell")} className="bg-emerald-600 hover:bg-emerald-500 text-white">Create First Listing</Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
`;

content = content.replace('  return (\n    <div className="min-h-screen', statusPageCode + '    <div className="min-h-screen');

const submitSuccessReplacement = `      if (res.ok) {
        toast.success("Seller profile created! KYC pending.");
        setShowOnboarding(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }`;
content = content.replace(/      if \(res.ok\) \{[\s\S]*?      \}/, submitSuccessReplacement);

fs.writeFileSync('src/pages/StartSelling.tsx', content);
