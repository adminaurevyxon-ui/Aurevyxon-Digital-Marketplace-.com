const fs = require('fs');

const code = `import React, { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BigDropdown } from "@/components/BigDropdown";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { 
  Lock, UploadCloud, Link as LinkIcon, DollarSign, Tag, CheckCircle2,
  FileText, Percent, Folder, Monitor, Code, Bookmark, HelpCircle, 
  Globe, Cpu, File as FileIcon, ShoppingCart, Info, List, Star, ArrowRight, ArrowLeft
} from "lucide-react";

const STEPS = [
  { id: 1, title: 'Product Information', desc: 'Basic details', icon: FileText },
  { id: 2, title: 'Discount Type', desc: 'Choose discount type', icon: Percent },
  { id: 3, title: 'Category', desc: 'Select category', icon: Folder },
  { id: 4, title: 'Platform', desc: 'Select platform', icon: Monitor },
  { id: 5, title: 'Framework', desc: 'Select framework', icon: Code },
  { id: 6, title: 'License', desc: 'Choose license type', icon: Bookmark },
  { id: 7, title: 'Support', desc: 'Support & updates', icon: HelpCircle },
  { id: 8, title: 'Language', desc: 'Product language', icon: Globe },
  { id: 9, title: 'Compatibility', desc: 'Compatibility details', icon: Cpu },
  { id: 10, title: 'File Type', desc: 'Select file type', icon: FileIcon },
  { id: 11, title: 'Sale Mode', desc: 'Choose sale mode', icon: ShoppingCart },
  { id: 12, title: 'Uploads', desc: 'Asset files', icon: UploadCloud }
];

export default function Sell() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "",
    mode: "",
    tags: "",
    discount_percentage: "0",
    discount_type: "",
    custom_badge: "",
    platform: "",
    sub_category: "",
    framework: "",
    license_type: "",
    support_type: "",
    language: "",
    compatibility: "",
    file_type: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      if (filesArr.length !== 8) {
         setError("You must upload exactly 8 screenshots.");
         return;
      }
      setError("");
      setScreenshots(filesArr);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("You must be logged in to sell items.");
      return;
    }
    if (!formData.type) {
      setError("Please select an app category (Step 3).");
      return;
    }
    if (screenshots.length !== 8) {
      setError("You must upload exactly 8 screenshots before publishing (Step 12).");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value as string);
      });
      if (imageFile) data.append("image", imageFile);
      if (assetFile) data.append("asset", assetFile);
      screenshots.forEach(file => data.append("screenshots", file));

      const token = localStorage.getItem("omniverse_token");
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { Authorization: \`Bearer \${token}\` },
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload asset");
      setSuccess(true);
      setTimeout(() => navigate(\`/listing/\${json.listingId}\`), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">Upload Successful!</h1>
        <p className="text-muted-foreground text-lg mb-8">Your digital asset is now live on Aurevyxon.</p>
      </div>
    );
  }

  const activeStepData = STEPS.find(s => s.id === currentStep);
  const ActiveIcon = activeStepData?.icon || FileText;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl mb-8 flex items-center gap-3">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p>You must sign in to upload assets. Please use the SignIn button in the header.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - STEPPER */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="relative border-l border-gray-800 ml-6 space-y-8 py-4">
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isPast = step.id < currentStep;
                return (
                  <div 
                    key={step.id} 
                    className="relative flex items-center gap-4 cursor-pointer group"
                    onClick={() => setCurrentStep(step.id)}
                  >
                    {/* Circle */}
                    <div className={\`-ml-[1.15rem] w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 z-10 \${
                      isActive 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                        : isPast 
                          ? "bg-[#131825] border-indigo-500 text-indigo-400"
                          : "bg-[#131825] border-gray-800 text-gray-500"
                    }\`}>
                      {step.id}
                      <span className="absolute -top-1 -right-1 text-[8px] opacity-70">{step.id}</span>
                    </div>

                    {/* Text block */}
                    <div className={\`p-3 rounded-xl transition-all duration-300 w-full \${isActive ? 'bg-indigo-900/20 border border-indigo-500/30' : 'border border-transparent hover:bg-white/5'}\`}>
                      <h4 className={\`font-semibold text-sm \${isActive ? 'text-indigo-300' : isPast ? 'text-gray-300' : 'text-gray-500'}\`}>
                        {step.title}
                      </h4>
                      <p className={\`text-xs \${isActive ? 'text-indigo-200/70' : 'text-gray-600'}\`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE - CONTENT AREA */}
          <div className="flex-1">
            <div className="bg-[#131825] border border-gray-800/60 rounded-2xl p-6 md:p-10 min-h-[600px] flex flex-col relative shadow-2xl">
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <ActiveIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{activeStepData?.title}</h2>
                  <p className="text-gray-400 text-sm mt-1">{activeStepData?.desc}</p>
                </div>
              </div>

              {/* Form Fields Container */}
              <form id="sellForm" onSubmit={handleSubmit} className="flex-1">
                
                {currentStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Asset Title */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                        Asset Title <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-indigo-500/20 flex items-center justify-center">
                           <Tag className="w-4 h-4 text-indigo-400" />
                        </div>
                        <Input 
                          required 
                          placeholder="e.g. Apex SaaS Dashboard" 
                          className="bg-[#0B0F19] border-gray-800 text-white pl-14 h-14 rounded-xl focus-visible:ring-indigo-500"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Enter a clear and catchy title for your product</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                        Description <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-4 w-8 h-8 rounded-md flex items-center justify-center">
                           <List className="w-5 h-5 text-gray-500" />
                        </div>
                        <Textarea 
                          required 
                          placeholder="Describe your asset in detail..." 
                          className="bg-[#0B0F19] border-gray-800 text-white pl-12 pt-4 min-h-[200px] rounded-xl focus-visible:ring-indigo-500 resize-none"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Provide a detailed description of what your product does, its features, and benefits.</p>
                    </div>

                    {/* Custom Badge */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                        Custom Badge/Description Text <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-purple-500/20 flex items-center justify-center">
                           <Star className="w-4 h-4 text-purple-400" />
                        </div>
                        <Input 
                          placeholder="e.g. Limited Edition, Premium Version..." 
                          className="bg-[#0B0F19] border-gray-800 text-white pl-14 h-14 rounded-xl focus-visible:ring-indigo-500"
                          value={formData.custom_badge}
                          onChange={(e) => setFormData({ ...formData, custom_badge: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Add a custom badge or short text to highlight your product</p>
                    </div>

                    {/* Grid for Price & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                          Price (USD) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center">
                             <DollarSign className="w-4 h-4 text-indigo-400" />
                          </div>
                          <Input 
                            type="number" 
                            required 
                            min="0"
                            step="1"
                            placeholder="249" 
                            className="bg-[#0B0F19] border-gray-800 text-white pl-14 h-14 rounded-xl focus-visible:ring-indigo-500"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Set the price for your product</p>
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                          Tags (comma separated) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center">
                             <Tag className="w-4 h-4 text-indigo-400" />
                          </div>
                          <Input 
                            placeholder="React, Next.js, Android" 
                            className="bg-[#0B0F19] border-gray-800 text-white pl-14 h-14 rounded-xl focus-visible:ring-indigo-500"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Add relevant tags to help buyers find your product</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Discount Percentage (%)</label>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        placeholder="0" 
                        className="bg-[#0B0F19] border-gray-800 text-white max-w-[200px] h-12"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      />
                    </div>
                    <BigDropdown 
                      label="Discount Type"
                      value={formData.discount_type}
                      options={[
                        "Flat Amount ($ Off)", "Percentage (%) Off", "Buy 1 Get 1 Free", "Bundle Discount (multi-product)", 
                        "Seasonal/Limited-Time Offer", "First-Time Buyer Discount", "Volume Discount (bulk license purchase)", 
                        "Flash Sale (Time-Boxed)", "Loyalty/Repeat Buyer Discount", "Coupon Code Only"
                      ]}
                      onChange={(val) => setFormData({ ...formData, discount_type: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Mobile Apps (Category)"
                      value={formData.type}
                      options={[
                        "Utility Apps", "Social Media Apps", "E-commerce Apps", "Fitness & Health Apps", 
                        "Finance & Banking Apps", "Education & Learning Apps", "Games (Casual)", 
                        "Games (Hyper-Casual)", "Games (Puzzle)", "Games (Arcade)", "Productivity Apps", 
                        "Travel & Booking Apps", "Food Delivery Apps", "Dating Apps", "News & Media Apps", 
                        "Music & Audio Apps", "Photo & Video Editing Apps", "AR/VR Apps", "IoT Control Apps", 
                        "Chat & Messaging Apps", "Reservation/Booking Apps", "Weather Apps", "Calculator/Utility Tools", 
                        "QR/Barcode Scanner Apps", "Meditation & Wellness Apps", "Language Learning Apps"
                      ]}
                      onChange={(val) => setFormData({ ...formData, type: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Platform (expanded)"
                      value={formData.platform}
                      options={[
                        "Android", "iOS", "Web (Browser-Based)", "Windows", "macOS", "Linux", "Cross-Platform", "React Native", 
                        "Flutter", "Chrome Extension", "Firefox Extension", "WordPress", "Shopify", "Figma", "VS Code", 
                        "Telegram Bot", "Discord Bot", "Slack App", "API/Backend Only", "Smart TV", "Wearables (watchOS/Wear OS)", 
                        "Notion", "Adobe Creative Cloud (Photoshop/Premiere/After Effects)", "Unity", "Unreal Engine", "Roblox Studio", 
                        "Canva", "Zapier/Make/n8n", "Blockchain/Web3 (Ethereum, Solana, Polygon)", "Standalone/Any Platform (Non-Digital Media)"
                      ]}
                      onChange={(val) => setFormData({ ...formData, platform: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Framework (expanded)"
                      value={formData.framework}
                      options={[
                        "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte / SvelteKit", "Node.js", "Express.js", "NestJS", 
                        "Django", "Flask", "FastAPI", "Laravel", "Ruby on Rails", "Spring Boot", "ASP.NET Core", "Flutter", 
                        "React Native", "SwiftUI", "Jetpack Compose (Kotlin)", "Kotlin Multiplatform", "Unity", "Unreal Engine", 
                        "Godot", "TensorFlow", "PyTorch", "Keras", "LangChain", "LlamaIndex", "Electron.js", "jQuery", "Bootstrap", 
                        "Tailwind CSS", "Material UI", "Chakra UI", "WordPress (PHP)", "WooCommerce", "Shopify Liquid", "Solidity (Smart Contracts)", 
                        "Web3.js / Ethers.js", "Three.js (3D/WebGL)", "Blender Python API", "Not Applicable (Non-Code Asset)", "None / Vanilla Code"
                      ]}
                      onChange={(val) => setFormData({ ...formData, framework: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 6 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="License"
                      value={formData.license_type}
                      options={[
                        "Personal Use License", "Commercial Use License", "Extended Commercial License", "Single Site License", 
                        "Multi-Site License", "Developer License", "White-Label License", "Reseller License", "MIT License", 
                        "GPL License", "Apache 2.0 License", "Creative Commons (CC0)", "Creative Commons (CC-BY)", "Royalty-Free License", 
                        "Editorial Use Only License", "Exclusive License (sold once, then delisted)", "Non-Exclusive License (resellable to multiple buyers)", 
                        "Lifetime License", "Subscription-Based License", "Print-on-Demand License", "Broadcast/Film Use License", "Attribution Required License"
                      ]}
                      onChange={(val) => setFormData({ ...formData, license_type: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 7 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Support"
                      value={formData.support_type}
                      options={[
                        "Included — Lifetime", "Included — 1 Year", "Included — 6 Months", "Included — 90 Days", "Included — 30 Days", 
                        "Not Included", "Priority Support (Paid Add-on)", "Community Support Only", "Email Support", "Live Chat Support", 
                        "Phone Support", "Installation Support Included", "Custom Setup Service Available", "Documentation Only (Self-Service)"
                      ]}
                      onChange={(val) => setFormData({ ...formData, support_type: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 8 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Language"
                      value={formData.language}
                      options={[
                        "English", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic", "Chinese (Simplified)", 
                        "Chinese (Traditional)", "Japanese", "Korean", "Russian", "Italian", "Bengali", "Tamil", "Telugu", 
                        "Marathi", "Gujarati", "Punjabi", "Urdu", "Turkish", "Vietnamese", "Indonesian", "Thai", "Dutch", 
                        "Polish", "Multi-Language (i18n Ready)", "Language-Agnostic (Code/Asset Only, No UI Text)"
                      ]}
                      onChange={(val) => setFormData({ ...formData, language: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 9 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Compatibility"
                      value={formData.compatibility}
                      options={[
                        "Android 8.0+", "Android 10+", "Android 12+", "Android 14+", "iOS 13+", "iOS 15+", "iOS 16+", "iOS 17+", 
                        "Windows 10/11", "macOS Monterey+", "macOS Sonoma+", "Ubuntu 20.04+", "Ubuntu 22.04+", "Node.js 16+", 
                        "Node.js 18+", "Node.js 20+", "PHP 7.4+", "PHP 8+", "Python 3.8+", "Python 3.10+", "Python 3.12+", 
                        "All Modern Browsers (Chrome/Edge/Firefox/Safari Latest)", "React 18+", "Next.js 13+/14+", "WordPress 5.0+", 
                        "WooCommerce 6.0+", "Unity 2021 LTS+", "Unreal Engine 5+", "Adobe CC 2023+", "Blender 3.x+", "Not Version-Dependent (Static Asset)"
                      ]}
                      onChange={(val) => setFormData({ ...formData, compatibility: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 10 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="File Type"
                      value={formData.file_type}
                      options={[
                        ".zip (Full Source Code)", ".rar", ".apk (Android Package)", ".aab (Android App Bundle)", ".ipa (iOS App)", 
                        ".exe (Windows Installer)", ".dmg (macOS Installer)", ".apk + Full Source Code", "Source Code Only (No Build File)", 
                        "Figma File (.fig)", "Sketch File (.sketch)", "Adobe XD (.xd)", "PSD File (Photoshop)", "AI File (Illustrator)", 
                        "PDF Document", "EPUB/MOBI (E-books)", ".mp3/.wav/.flac (Audio)", ".mp4/.mov (Video)", ".fbx/.obj/.blend/.gltf (3D Models)", 
                        ".ttf/.otf/.woff (Fonts)", ".pptx/.key (Presentations)", ".xlsx/.csv (Spreadsheets)", ".docx (Documents)", 
                        "SQL Database Dump (.sql)", "JSON Dataset", "Docker Image", ".env Template Included", "Notion Template Link", "Canva Template Link"
                      ]}
                      onChange={(val) => setFormData({ ...formData, file_type: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 11 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <BigDropdown 
                      label="Sale Mode"
                      value={formData.mode}
                      options={[
                        "Unlimited (sell to unlimited buyers)", "Limited Quantity (fixed number of license slots)", "Exclusive (sold once to one buyer, then delisted)", 
                        "Auction Style (highest bidder)", "Subscription (recurring billing)", "One-Time Purchase", "Pay-What-You-Want", 
                        "Reserved / Pre-Order", "Bundle-Only (sold as part of a bundle)", "Free with Attribution"
                      ]}
                      onChange={(val) => setFormData({ ...formData, mode: val })}
                    />
                  </motion.div>
                )}

                {currentStep === 12 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image (Required)</label>
                      <div className="border-2 border-dashed border-gray-700 bg-[#0B0F19] rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative overflow-hidden">
                        <input 
                          type="file" 
                          accept="image/*" 
                          required
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                          onChange={handleImageChange}
                        />
                        {imagePreview ? (
                          <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
                        ) : null}
                        <div className="relative z-20 pointer-events-none">
                          <UploadCloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">{imageFile ? imageFile.name : "Click or drag to upload cover image"}</p>
                          <p className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Screenshots (Exactly 8 Required)</label>
                       <div className="border-2 border-dashed border-gray-700 bg-[#0B0F19] rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            multiple
                            required
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            onChange={handleScreenshotsChange}
                          />
                          <UploadCloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-300">{screenshots.length > 0 ? \`\${screenshots.length} / 8 uploaded\` : "Click or drag exactly 8 screenshots"}</p>
                       </div>
                       {screenshots.length > 0 && screenshots.length !== 8 && (
                         <p className="text-red-400 text-xs mt-2">You currently have {screenshots.length} selected. You must have exactly 8.</p>
                       )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Digital Asset File (ZIP/APK)</label>
                      <div className="border-2 border-dashed border-gray-700 bg-[#0B0F19] rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          accept=".zip,.rar,.tar,.gz,.apk"
                          required
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                          onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                        />
                        <LinkIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-indigo-300">{assetFile ? assetFile.name : "Click or drag to upload source file (.zip, .apk)"}</p>
                        <p className="text-xs text-gray-600 mt-1">This file will be securely delivered to buyers.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </form>

              {/* Bottom Action Bar */}
              <div className="mt-12 flex items-center justify-end gap-4 border-t border-gray-800/60 pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handlePrev}
                  disabled={currentStep === 1 || loading}
                  className="h-12 px-6 bg-transparent text-gray-300 hover:text-white hover:bg-white/5 font-medium border border-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    form="sellForm"
                    disabled={loading || !isAuthenticated}
                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
                  >
                    {loading ? "Uploading..." : "Publish Asset"} <UploadCloud className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`
fs.writeFileSync('src/pages/Sell.tsx', code);
