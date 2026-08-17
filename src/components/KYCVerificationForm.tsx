import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, UploadCloud, Building, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export function KYCVerificationForm({ onSubmitSuccess }: { onSubmitSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    address: "",
    company_name: "",
    tax_id: ""
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Please login first");
    setLoading(true);
    
    try {
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit KYC");
      
      setIsSubmitted(true);
      toast.success("KYC details submitted successfully for verification.");
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-[#141428]/80 border-border max-w-2xl mx-auto">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">KYC Submitted</h3>
          <p className="text-muted-foreground mb-6">
            Your documents are under review. This usually takes 1-2 business days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#141428]/80 border-border max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" /> Identity Verification
        </CardTitle>
        <CardDescription>
          Required for global payout compliance and anti-fraud policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-muted-foreground" /> Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Legal Name</label>
                <Input required placeholder="John Doe" className="bg-background/50 border-gray-700" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <Input type="date" required className="bg-background/50 border-gray-700 block w-full" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Residential Address</label>
              <Input required placeholder="123 Main St, City, Country" className="bg-background/50 border-gray-700" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h4 className="text-lg font-medium flex items-center gap-2 text-white">
              <Building className="w-5 h-5 text-muted-foreground" /> Business Details (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <Input placeholder="Acme Corp" className="bg-background/50 border-gray-700" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax ID / EIN</label>
                <Input placeholder="XX-XXXXXXX" className="bg-background/50 border-gray-700" value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h4 className="text-lg font-medium flex items-center gap-2 text-white">
              <UploadCloud className="w-5 h-5 text-muted-foreground" /> Document Upload
            </h4>
            <p className="text-xs text-muted-foreground mb-4">Please upload a valid government-issued ID (Passport, Driver's License, or National ID).</p>
            <div className="border-2 border-dashed border-gray-700 hover:border-emerald-500/50 transition-colors rounded-xl p-8 text-center cursor-pointer bg-background/30">
              <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium text-white mb-1">Click to upload document</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, or PNG up to 10MB</p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-lg">
            {loading ? "Submitting..." : "Submit for Verification"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
