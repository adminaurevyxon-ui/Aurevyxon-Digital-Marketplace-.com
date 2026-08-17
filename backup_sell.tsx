import React, { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BigDropdown } from "@/components/BigDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { categories, extraFilters } from "@/lib/categories";
import { Lock, UploadCloud, Link as LinkIcon, DollarSign, Tag, CheckCircle2 } from "lucide-react";

export default function Sell() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    type: "",
    mode: "Unlimited",
    tags: "",
    discount_percentage: "0",
    discount_type: "None",
    custom_badge: "",
    platform: "Android",
    sub_category: "",
    framework: "",
    license_type: "Personal",
    support_type: "Included",
    language: "English",
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
      setError("Please select an app category.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (screenshots.length !== 8) {
      setError("You must upload exactly 8 screenshots before publishing.");
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
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload asset");

      setSuccess(true);
      setTimeout(() => navigate(`/listing/${json.listingId}`), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        <p className="text-sm text-gray-500">Redirecting to your listing...</p>
      </div>
    );
  }

  const originalPrice = Number(formData.price) || 0;
  const discountPct = Number(formData.discount_percentage) || 0;
  const discountedPrice = originalPrice - (originalPrice * (discountPct / 100));

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-display font-bold mb-2">Sell an Asset</h1>
        <p className="text-muted-foreground mb-8">Upload your digital product, codebase, or AI model to the marketplace.</p>

        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl mb-8 flex items-center gap-3">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p>You must sign in to upload assets. Please use the SignIn button in the header.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 glass-card p-6 md:p-8 rounded-2xl border border-border/20">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Asset Title</label>
                <Input 
                  required 
                  placeholder="e.g. Apex SaaS Dashboard" 
                  className="bg-muted border-border"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <Textarea 
                  required 
                  placeholder="Describe your asset in detail..." 
                  className="bg-muted border-border min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Custom Badge/Description Text</label>
                <Input 
                  placeholder="e.g. Limited Edition, Premium Version..." 
                  className="bg-muted border-border"
                  value={formData.custom_badge}
                  onChange={(e) => setFormData({ ...formData, custom_badge: e.target.value })}
                />
              </div>

              
              {/* Discount Inputs as standard inputs first, if needed. But the user said "discount button" so maybe discount was standard? 
                 User prompt 1: "Jahan per Tumne yah Jo button lagaya hai ke Jo discount button lagaya hai aur uske niche Jo button hai use chhodkar thoda space dekar vahan ek yah button create karo jiska Naam Mobile Apps -> yah hoga"
                 Meaning: "Where you put the discount button, and the button below it, skip them, give some space, and create a button named Mobile Apps -> there."
              */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      type="number" 
                      required 
                      min="0"
                      step="1"
                      placeholder="249" 
                      className="bg-muted border-border pl-9"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Discount Percentage (%)</label>
                <Input 
                  type="number" 
                  min="0"
                  max="100"
                  placeholder="0" 
                  className="bg-muted border-border max-w-[200px]"
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

              <div className="pt-4" />

              <BigDropdown 
                label="Mobile Apps"
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

            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image (Required)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative overflow-hidden">
                  <input 
                    type="file" 
                    accept="image/*" 
                    required
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
                  ) : null}
                  <div className="relative z-20 pointer-events-none">
                    <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-300">{imageFile ? imageFile.name : "Click or drag to upload cover image"}</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Screenshots (Exactly 8 Required)</label>
                 <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      multiple
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                      onChange={handleScreenshotsChange}
                    />
                    <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-300">{screenshots.length > 0 ? `${screenshots.length} / 8 uploaded` : "Click or drag exactly 8 screenshots"}</p>
                 </div>
                 {screenshots.length > 0 && screenshots.length !== 8 && (
                   <p className="text-red-400 text-xs mt-1">You currently have {screenshots.length} selected. You must have exactly 8.</p>
                 )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Digital Asset File (ZIP/APK)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".zip,.rar,.tar,.gz,.apk"
                    required
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                    onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                  />
                  <LinkIcon className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-indigo-300">{assetFile ? assetFile.name : "Click or drag to upload source file (.zip, .apk)"}</p>
                  <p className="text-xs text-gray-500 mt-1">This file will be securely delivered to buyers.</p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              disabled={loading || !isAuthenticated} 
              className="w-full h-14 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-foreground dark:text-white"
            >
              {loading ? "Uploading to Aurevyxon..." : "Publish Asset"}
            </Button>
          </form>

          {/* Real-time Preview */}
          <div>
            <div className="sticky top-24">
              <h3 className="font-display text-xl font-semibold mb-4 text-foreground dark:text-white">Live Preview</h3>
              <div className="glass-card rounded-2xl border border-border/20 overflow-hidden">
                <div className="aspect-[4/3] bg-muted/50 relative">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview Cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Cover Image</div>
                  )}
                  {formData.type && (
                     <div className="absolute top-3 left-3 bg-background/70 backdrop-blur-md px-2 py-1 rounded text-xs font-semibold z-10">
                       {formData.type}
                     </div>
                  )}
                  {formData.mode === "Exclusive" && (
                    <div className="absolute top-12 right-3 bg-amber-500 text-black px-2 py-1 rounded text-xs font-bold z-10">
                      EXCLUSIVE
                    </div>
                  )}
                  {formData.custom_badge && (
                    <div className="absolute bottom-3 left-3 bg-indigo-500 text-foreground dark:text-white px-2 py-1 rounded text-xs font-semibold z-10">
                      {formData.custom_badge}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-lg line-clamp-1 mb-1">{formData.title || "Asset Title"}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{formData.description || "Description will appear here..."}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/20">
                    <div className="flex flex-col">
                      {discountPct > 0 ? (
                        <>
                           <span className="text-xs text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                           <span className="text-xl font-bold font-display text-emerald-400">
                             ${discountedPrice.toFixed(2)}
                             {formData.discount_type === "Limited Time" && (
                               <span className="ml-2 text-xs bg-red-500 text-foreground dark:text-white px-1 py-0.5 rounded animate-pulse">Limited Time</span>
                             )}
                           </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold font-display">${originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
