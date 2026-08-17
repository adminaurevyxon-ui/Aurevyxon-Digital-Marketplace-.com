const fs = require('fs');
const code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const marker = '  const activeStepData = STEPS.find(s => s.id === currentStep);';
const startIndex = code.indexOf(marker);

const replacement = `
  const InlineSelection = ({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) => (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={\`px-4 py-3 rounded-xl border text-sm font-medium transition-all \${
            value === opt 
              ? 'bg-[#5b21b6] border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
              : 'bg-[#111422] border-gray-800/80 text-gray-400 hover:border-gray-600 hover:text-gray-200'
          }\`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const activeStepData = STEPS.find(s => s.id === currentStep);
  const ActiveIcon = activeStepData?.icon || FileText;

  return (
    <div className="min-h-screen bg-[#07090e] text-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
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

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* LEFT SIDEBAR - STEPPER */}
          <div className="w-full lg:w-72 flex-shrink-0 relative py-4">
            {/* Connecting Vertical Line */}
            <div className="absolute top-8 bottom-8 left-[34px] w-px bg-gray-800/80 z-0" />
            
            <div className="flex flex-col gap-1 relative z-10">
              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isPast = step.id < currentStep;
                const StepIcon = step.icon;
                
                return (
                  <div 
                    key={step.id} 
                    className={\`relative flex items-center gap-4 cursor-pointer p-3 rounded-2xl transition-all duration-300 \${
                      isActive ? 'bg-[#181134] border border-[#7c3aed]' : 'border border-transparent hover:bg-[#111422]'
                    }\`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    {/* Circle */}
                    <div className={\`relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold border transition-colors duration-300 z-10 \${
                      isActive 
                        ? "bg-[#5b21b6] border-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]" 
                        : "bg-[#0f121b] border-gray-800/80 text-gray-400"
                    }\`}>
                      <span className={\`absolute top-1 left-2 text-[9px] font-bold \${isActive ? 'text-white' : 'text-gray-500'}\`}>{step.id}</span>
                      {step.id === 1 ? (
                        <span className="text-lg mt-1 font-semibold">{isActive ? '1' : '1'}</span>
                      ) : (
                        <StepIcon className="w-5 h-5 mt-1" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 mt-0.5">
                      <h4 className={\`font-semibold text-sm \${isActive ? 'text-white' : 'text-gray-300'}\`}>
                        {step.title}
                      </h4>
                      <p className={\`text-xs \${isActive ? 'text-gray-300' : 'text-gray-500'}\`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE - CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pl-2">
              <div className="w-14 h-14 rounded-full bg-[#1a153a] border border-[#5b21b6] flex flex-shrink-0 items-center justify-center">
                <ActiveIcon className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#c4b5fd] mb-1">{activeStepData?.title}</h2>
                <p className="text-gray-300 text-sm">
                  {activeStepData?.title === 'Product Information' ? 'Provide the basic details about your product' : activeStepData?.desc}
                </p>
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-gray-800/60 rounded-3xl p-6 md:p-8 min-h-[500px] flex flex-col relative shadow-xl">
              
              {/* Form Fields Container */}
              <form id="sellForm" onSubmit={handleSubmit} className="flex-1">
                
                {currentStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Asset Title */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                        Asset Title <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                           <Tag className="w-5 h-5 text-[#c4b5fd]" />
                        </div>
                        <Input 
                          required 
                          placeholder="e.g. Apex SaaS Dashboard" 
                          className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-1">Enter a clear and catchy title for your product</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                        Description <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-2 w-10 h-10 rounded-lg flex items-center justify-center">
                           <List className="w-6 h-6 text-gray-400" />
                        </div>
                        <Textarea 
                          required 
                          placeholder="Describe your asset in detail..." 
                          className="bg-[#111422] border-gray-800 text-white pl-12 pt-4 min-h-[180px] rounded-2xl focus-visible:ring-purple-500 resize-none placeholder:text-gray-500"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-1">Provide a detailed description of what your product does, its features, and benefits.</p>
                    </div>

                    {/* Custom Badge */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                        Custom Badge/Description Text <Info className="w-4 h-4 text-gray-500" />
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                           <Star className="w-5 h-5 text-[#c4b5fd]" />
                        </div>
                        <Input 
                          placeholder="e.g. Limited Edition, Premium Version..." 
                          className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500"
                          value={formData.custom_badge}
                          onChange={(e) => setFormData({ ...formData, custom_badge: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 ml-1">Add a custom badge or short text to highlight your product</p>
                    </div>

                    {/* Grid for Price & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                          Price (USD) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                             <DollarSign className="w-5 h-5 text-[#c4b5fd]" />
                          </div>
                          <Input 
                            type="number" 
                            required 
                            min="0"
                            step="1"
                            placeholder="249" 
                            className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500 font-medium text-lg"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-1">Set the price for your product</p>
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
                          Tags (comma separated) <Info className="w-4 h-4 text-gray-500" />
                        </label>
                        <div className="relative">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#2a1b54] flex items-center justify-center">
                             <Tag className="w-5 h-5 text-[#c4b5fd]" />
                          </div>
                          <Input 
                            placeholder="React, Next.js, Android" 
                            className="bg-[#111422] border-gray-800 text-white pl-16 h-14 rounded-2xl focus-visible:ring-purple-500 placeholder:text-gray-500"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2 ml-1">Add relevant tags to help buyers find your product</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-white mb-3">Discount Percentage (%)</label>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        placeholder="0" 
                        className="bg-[#111422] border-gray-800 text-white max-w-[200px] h-14 rounded-2xl focus-visible:ring-purple-500 font-medium text-lg"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Discount Type</label>
                      <InlineSelection 
                        value={formData.discount_type}
                        options={[
                          "Flat Amount ($ Off)", "Percentage (%) Off", "Buy 1 Get 1 Free", "Bundle Discount (multi-product)", 
                          "Seasonal/Limited-Time Offer", "First-Time Buyer Discount", "Volume Discount (bulk license purchase)", 
                          "Flash Sale (Time-Boxed)", "Loyalty/Repeat Buyer Discount", "Coupon Code Only"
                        ]}
                        onChange={(val) => setFormData({ ...formData, discount_type: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Category</label>
                      <InlineSelection 
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
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Platform</label>
                      <InlineSelection 
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
                    </div>
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Framework</label>
                      <InlineSelection 
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
                    </div>
                  </motion.div>
                )}

                {currentStep === 6 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">License</label>
                      <InlineSelection 
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
                    </div>
                  </motion.div>
                )}

                {currentStep === 7 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Support</label>
                      <InlineSelection 
                        value={formData.support_type}
                        options={[
                          "Included — Lifetime", "Included — 1 Year", "Included — 6 Months", "Included — 90 Days", "Included — 30 Days", 
                          "Not Included", "Priority Support (Paid Add-on)", "Community Support Only", "Email Support", "Live Chat Support", 
                          "Phone Support", "Installation Support Included", "Custom Setup Service Available", "Documentation Only (Self-Service)"
                        ]}
                        onChange={(val) => setFormData({ ...formData, support_type: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 8 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Language</label>
                      <InlineSelection 
                        value={formData.language}
                        options={[
                          "English", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic", "Chinese (Simplified)", 
                          "Chinese (Traditional)", "Japanese", "Korean", "Russian", "Italian", "Bengali", "Tamil", "Telugu", 
                          "Marathi", "Gujarati", "Punjabi", "Urdu", "Turkish", "Vietnamese", "Indonesian", "Thai", "Dutch", 
                          "Polish", "Multi-Language (i18n Ready)", "Language-Agnostic (Code/Asset Only, No UI Text)"
                        ]}
                        onChange={(val) => setFormData({ ...formData, language: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 9 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Compatibility</label>
                      <InlineSelection 
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
                    </div>
                  </motion.div>
                )}

                {currentStep === 10 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">File Type</label>
                      <InlineSelection 
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
                    </div>
                  </motion.div>
                )}

                {currentStep === 11 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Sale Mode</label>
                      <InlineSelection 
                        value={formData.mode}
                        options={[
                          "Unlimited (sell to unlimited buyers)", "Limited Quantity (fixed number of license slots)", "Exclusive (sold once to one buyer, then delisted)", 
                          "Auction Style (highest bidder)", "Subscription (recurring billing)", "One-Time Purchase", "Pay-What-You-Want", 
                          "Reserved / Pre-Order", "Bundle-Only (sold as part of a bundle)", "Free with Attribution"
                        ]}
                        onChange={(val) => setFormData({ ...formData, mode: val })}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 12 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Cover Image (Required)</label>
                      <div className="border border-dashed border-gray-700 bg-[#111422] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative overflow-hidden">
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
                          <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                          <p className="text-base font-medium text-gray-300">{imageFile ? imageFile.name : "Click or drag to upload cover image"}</p>
                          <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Screenshots (Exactly 8 Required)</label>
                       <div className="border border-dashed border-gray-700 bg-[#111422] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            multiple
                            required
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            onChange={handleScreenshotsChange}
                          />
                          <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                          <p className="text-base font-medium text-gray-300">{screenshots.length > 0 ? \`\${screenshots.length} / 8 uploaded\` : "Click or drag exactly 8 screenshots"}</p>
                       </div>
                       {screenshots.length > 0 && screenshots.length !== 8 && (
                         <p className="text-red-400 text-sm mt-3 ml-1">You currently have {screenshots.length} selected. You must have exactly 8.</p>
                       )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">Digital Asset File (ZIP/APK)</label>
                      <div className="border border-dashed border-gray-700 bg-[#111422] rounded-2xl p-8 text-center hover:bg-white/[0.02] transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          accept=".zip,.rar,.tar,.gz,.apk"
                          required
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                          onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                        />
                        <LinkIcon className="w-10 h-10 text-[#a78bfa] mx-auto mb-3" />
                        <p className="text-base font-medium text-[#c4b5fd]">{assetFile ? assetFile.name : "Click or drag to upload source file (.zip, .apk)"}</p>
                        <p className="text-sm text-gray-500 mt-2">This file will be securely delivered to buyers.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </form>

            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 flex items-center justify-center gap-6 pb-10">
              <Button 
                type="button" 
                onClick={handlePrev}
                disabled={currentStep === 1 || loading}
                className="h-14 px-8 bg-[#0b0f19] text-white hover:bg-white/5 font-medium border border-gray-800 rounded-2xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="h-14 px-12 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  form="sellForm"
                  disabled={loading || !isAuthenticated}
                  className="h-14 px-12 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all"
                >
                  {loading ? "Uploading..." : "Publish Asset"} <UploadCloud className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
`;

if (startIndex !== -1) {
  const newCode = code.substring(0, startIndex) + replacement;
  fs.writeFileSync('src/pages/Sell.tsx', newCode);
  console.log('Replaced successfully');
} else {
  console.log('Could not find start index');
}
