const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const startMarker = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price (USD)</label>`;

const endMarker = `              <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image (Required)</label>`;

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find markers", startIndex, endIndex);
    process.exit(1);
}

const replacement = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      type="number" 
                      required 
                      min="0"
                      step="1"
                      placeholder="249" 
                      className="bg-[#1C1C1E] border-white/5 pl-9 rounded-lg"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                      placeholder="React, Next.js, Android" 
                      className="bg-[#1C1C1E] border-white/5 pl-9 rounded-lg"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Percentage (%)</label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    placeholder="0" 
                    className="bg-[#1C1C1E] border-white/5 rounded-lg"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Type</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  >
                    <option value="">None</option>
                    {[
                      "Flat Amount ($ Off)", "Percentage (%) Off", "Buy 1 Get 1 Free", "Bundle Discount (multi-product)", 
                      "Seasonal/Limited-Time Offer", "First-Time Buyer Discount", "Volume Discount (bulk license purchase)", 
                      "Flash Sale (Time-Boxed)", "Loyalty/Repeat Buyer Discount", "Coupon Code Only"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Asset Category</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {[
                      "Utility Apps", "Social Media Apps", "E-commerce Apps", "Fitness & Health Apps", 
                      "Finance & Banking Apps", "Education & Learning Apps", "Games (Casual)", 
                      "Games (Hyper-Casual)", "Games (Puzzle)", "Games (Arcade)", "Productivity Apps", 
                      "Travel & Booking Apps", "Food Delivery Apps", "Dating Apps", "News & Media Apps", 
                      "Music & Audio Apps", "Photo & Video Editing Apps", "AR/VR Apps", "IoT Control Apps", 
                      "Chat & Messaging Apps", "Reservation/Booking Apps", "Weather Apps", "Calculator/Utility Tools", 
                      "QR/Barcode Scanner Apps", "Meditation & Wellness Apps", "Language Learning Apps"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sub Category</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                  >
                    <option value="">Select Sub Category</option>
                    {(categories.find(c => c.name === formData.type)?.subcategories || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  >
                    <option value="">Select Platform</option>
                    {[
                      "Android", "iOS", "Web (Browser-Based)", "Windows", "macOS", "Linux", "Cross-Platform", "React Native", 
                      "Flutter", "Chrome Extension", "Firefox Extension", "WordPress", "Shopify", "Figma", "VS Code", 
                      "Telegram Bot", "Discord Bot", "Slack App", "API/Backend Only", "Smart TV", "Wearables (watchOS/Wear OS)", 
                      "Notion", "Adobe Creative Cloud (Photoshop/Premiere/After Effects)", "Unity", "Unreal Engine", "Roblox Studio", 
                      "Canva", "Zapier/Make/n8n", "Blockchain/Web3 (Ethereum, Solana, Polygon)", "Standalone/Any Platform (Non-Digital Media)"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Framework</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.framework}
                    onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                  >
                    <option value="">Select Framework</option>
                    {[
                      "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte / SvelteKit", "Node.js", "Express.js", "NestJS", 
                      "Django", "Flask", "FastAPI", "Laravel", "Ruby on Rails", "Spring Boot", "ASP.NET Core", "Flutter", 
                      "React Native", "SwiftUI", "Jetpack Compose (Kotlin)", "Kotlin Multiplatform", "Unity", "Unreal Engine", 
                      "Godot", "TensorFlow", "PyTorch", "Keras", "LangChain", "LlamaIndex", "Electron.js", "jQuery", "Bootstrap", 
                      "Tailwind CSS", "Material UI", "Chakra UI", "WordPress (PHP)", "WooCommerce", "Shopify Liquid", "Solidity (Smart Contracts)", 
                      "Web3.js / Ethers.js", "Three.js (3D/WebGL)", "Blender Python API", "Not Applicable (Non-Code Asset)", "None / Vanilla Code"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">License</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  >
                    <option value="">Select License</option>
                    {[
                      "Personal Use License", "Commercial Use License", "Extended Commercial License", "Single Site License", 
                      "Multi-Site License", "Developer License", "White-Label License", "Reseller License", "MIT License", 
                      "GPL License", "Apache 2.0 License", "Creative Commons (CC0)", "Creative Commons (CC-BY)", "Royalty-Free License", 
                      "Editorial Use Only License", "Exclusive License (sold once, then delisted)", "Non-Exclusive License (resellable to multiple buyers)", 
                      "Lifetime License", "Subscription-Based License", "Print-on-Demand License", "Broadcast/Film Use License", "Attribution Required License"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Support</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.support_type}
                    onChange={(e) => setFormData({ ...formData, support_type: e.target.value })}
                  >
                    <option value="">Select Support</option>
                    {[
                      "Included — Lifetime", "Included — 1 Year", "Included — 6 Months", "Included — 90 Days", "Included — 30 Days", 
                      "Not Included", "Priority Support (Paid Add-on)", "Community Support Only", "Email Support", "Live Chat Support", 
                      "Phone Support", "Installation Support Included", "Custom Setup Service Available", "Documentation Only (Self-Service)"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="">Select Language</option>
                    {[
                      "English", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic", "Chinese (Simplified)", 
                      "Chinese (Traditional)", "Japanese", "Korean", "Russian", "Italian", "Bengali", "Tamil", "Telugu", 
                      "Marathi", "Gujarati", "Punjabi", "Urdu", "Turkish", "Vietnamese", "Indonesian", "Thai", "Dutch", 
                      "Polish", "Multi-Language (i18n Ready)", "Language-Agnostic (Code/Asset Only, No UI Text)"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Compatibility</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.compatibility}
                    onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                  >
                    <option value="">Select Compatibility</option>
                    {[
                      "Android 8.0+", "Android 10+", "Android 12+", "Android 14+", "iOS 13+", "iOS 15+", "iOS 16+", "iOS 17+", 
                      "Windows 10/11", "macOS Monterey+", "macOS Sonoma+", "Ubuntu 20.04+", "Ubuntu 22.04+", "Node.js 16+", 
                      "Node.js 18+", "Node.js 20+", "PHP 7.4+", "PHP 8+", "Python 3.8+", "Python 3.10+", "Python 3.12+", 
                      "All Modern Browsers (Chrome/Edge/Firefox/Safari Latest)", "React 18+", "Next.js 13+/14+", "WordPress 5.0+", 
                      "WooCommerce 6.0+", "Unity 2021 LTS+", "Unreal Engine 5+", "Adobe CC 2023+", "Blender 3.x+", "Not Version-Dependent (Static Asset)"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">File Type</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.file_type}
                    onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                  >
                    <option value="">Select File Type</option>
                    {[
                      ".zip (Full Source Code)", ".rar", ".apk (Android Package)", ".aab (Android App Bundle)", ".ipa (iOS App)", 
                      ".exe (Windows Installer)", ".dmg (macOS Installer)", ".apk + Full Source Code", "Source Code Only (No Build File)", 
                      "Figma File (.fig)", "Sketch File (.sketch)", "Adobe XD (.xd)", "PSD File (Photoshop)", "AI File (Illustrator)", 
                      "PDF Document", "EPUB/MOBI (E-books)", ".mp3/.wav/.flac (Audio)", ".mp4/.mov (Video)", ".fbx/.obj/.blend/.gltf (3D Models)", 
                      ".ttf/.otf/.woff (Fonts)", ".pptx/.key (Presentations)", ".xlsx/.csv (Spreadsheets)", ".docx (Documents)", 
                      "SQL Database Dump (.sql)", "JSON Dataset", "Docker Image", ".env Template Included", "Notion Template Link", "Canva Template Link"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sale Mode</label>
                  <select 
                    className="w-full bg-[#1C1C1E] border border-white/5 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <option value="">Select Sale Mode</option>
                    {[
                      "Unlimited (sell to unlimited buyers)", "Limited Quantity (fixed number of license slots)", "Exclusive (sold once to one buyer, then delisted)", 
                      "Auction Style (highest bidder)", "Subscription (recurring billing)", "One-Time Purchase", "Pay-What-You-Want", 
                      "Reserved / Pre-Order", "Bundle-Only (sold as part of a bundle)", "Free with Attribution"
                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

            </div>
              
            `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

fs.writeFileSync('src/pages/Sell.tsx', code);
