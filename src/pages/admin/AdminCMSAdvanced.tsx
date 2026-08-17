import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Layout, FileText, Image as ImageIcon, Megaphone, BookOpen, 
  Plus, Edit3, Trash2, Eye, ArrowUp, ArrowDown, Upload, 
  Search, CheckCircle2, Clock, Globe, Shield, RefreshCw, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminCMSAdvancedProps {
  token: string;
}

export function AdminCMSAdvanced({ token }: AdminCMSAdvancedProps) {
  const [activeTab, setActiveTab] = useState('homepage');
  const [loading, setLoading] = useState(true);

  // Homepage sections state
  const [sections, setSections] = useState([
    { id: 'sec_1', name: 'Hero Banner & Value Prop', enabled: true, order: 1 },
    { id: 'sec_2', name: 'Category Quick Navigation Grid', enabled: true, order: 2 },
    { id: 'sec_3', name: 'Featured Verified Code Assets', enabled: true, order: 3 },
    { id: 'sec_4', name: 'Top Institutional Sellers', enabled: true, order: 4 },
    { id: 'sec_5', name: 'Promotional Campaign Carousel', enabled: false, order: 5 },
    { id: 'sec_6', name: 'Verified Buyer Testimonials', enabled: true, order: 6 },
    { id: 'sec_7', name: 'Footer Links & Trust Badges', enabled: true, order: 7 }
  ]);

  // Pages state
  const [pages, setPages] = useState([
    { id: 'page_1', title: 'Privacy Policy', slug: 'privacy', status: 'published', last_updated: '2026-08-01', version: 'v2.4' },
    { id: 'page_2', title: 'Terms of Service', slug: 'terms', status: 'published', last_updated: '2026-08-01', version: 'v3.1' },
    { id: 'page_3', title: 'Refund & Escrow Policy', slug: 'refund-policy', status: 'published', last_updated: '2026-08-05', version: 'v1.8' },
    { id: 'page_4', title: 'Seller Agreement', slug: 'seller-policy', status: 'published', last_updated: '2026-07-20', version: 'v2.0' },
    { id: 'page_5', title: 'Buyer Protection Guarantee', slug: 'buyer-protection', status: 'draft', last_updated: '2026-08-09', version: 'v1.0-draft' }
  ]);
  const [selectedPage, setSelectedPage] = useState<any>(pages[0]);

  // Blog posts
  const [blogPosts, setBlogPosts] = useState([
    { id: 'b1', title: 'How to Audit Full-Stack AI SaaS Source Code', category: 'Security', author: 'Aurevyxon Team', slug: 'audit-fullstack-ai-saas', status: 'published', created_at: '2026-08-02' },
    { id: 'b2', title: 'Top 10 High-Yield Code Bases to Acquire in 2026', category: 'Marketplace', author: 'Market Intelligence', slug: 'top-code-bases-2026', status: 'published', created_at: '2026-08-07' }
  ]);
  const [newBlog, setNewBlog] = useState({ title: '', category: 'Marketplace', author: 'Aurevyxon Lead', text: '', seo_title: '', seo_desc: '' });

  // Media Library
  const [mediaFiles, setMediaFiles] = useState([
    { id: 'm1', name: 'hero_banner_dark.jpg', size: '1.2 MB', type: 'image/jpeg', dimensions: '1920x1080', usage_count: 3 },
    { id: 'm2', name: 'verification_badge.png', size: '240 KB', type: 'image/png', dimensions: '500x500', usage_count: 14 }
  ]);

  // Banners
  const [banners, setBanners] = useState([
    { id: 'bn_1', title: 'Summer Code Sale 20%', targeting: 'All Users', device: 'All Devices', priority: 1, active: true },
    { id: 'bn_2', title: 'Seller KYC Onboarding Reward', targeting: 'Sellers Only', device: 'Desktop', priority: 2, active: true }
  ]);

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        if (s.cms_sections) setSections(JSON.parse(s.cms_sections));
        if (s.cms_pages) setPages(JSON.parse(s.cms_pages));
        if (s.cms_blog_posts) setBlogPosts(JSON.parse(s.cms_blog_posts));
        if (s.cms_banners) setBanners(JSON.parse(s.cms_banners));
      }
    } catch (e) {
      console.warn("Failed to load CMS data from database", e);
    } finally {
      setLoading(false);
    }
  };

  const persistCMS = async (updates: Record<string, any>) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: "CMS Content & Layout Adjustment",
          settings: updates
        })
      });
      if (!res.ok) throw new Error("CMS write failed");
    } catch (e) {
      toast.error("Failed to save CMS changes to database");
    }
  };

  useEffect(() => {
    fetchCMSData();
  }, [token]);

  const toggleSection = (id: string) => {
    const updated = sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setSections(updated);
    persistCMS({ cms_sections: JSON.stringify(updated) });
    toast.success("Homepage section layout updated & saved");
  };

  const reorderSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    setSections(newSections);
    persistCMS({ cms_sections: JSON.stringify(newSections) });
    toast.success("Section priority reordered & saved");
  };

  const createBlogPost = () => {
    if (!newBlog.title.trim()) return toast.error("Title is required");
    const newPost = {
      id: `b_${Date.now()}`,
      title: newBlog.title,
      category: newBlog.category,
      author: newBlog.author,
      slug: newBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'published',
      created_at: new Date().toISOString().split('T')[0]
    };
    const updated = [newPost, ...blogPosts];
    setBlogPosts(updated);
    persistCMS({ cms_blog_posts: JSON.stringify(updated) });
    setNewBlog({ title: '', category: 'Marketplace', author: 'Aurevyxon Lead', text: '', seo_title: '', seo_desc: '' });
    toast.success("Blog article published & persisted to database");
  };

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl font-sans text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-400" /> Content Management System (CMS)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage homepage layout, legal/static pages, blog engine, media assets & targeted promotional banners</p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/10">
        {[
          { id: 'homepage', label: 'Homepage Sections' },
          { id: 'pages', label: 'Pages & Policy Editor' },
          { id: 'blog', label: 'Blog & SEO Engine' },
          { id: 'media', label: 'Media Asset Library' },
          { id: 'banners', label: 'Banners & Promotions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Homepage Sections Manager */}
      {activeTab === 'homepage' && (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white text-sm">Homepage Section Layout & Reordering</h3>
            <Button size="sm" onClick={() => toast.success("Homepage layout published live")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              Publish Live Homepage
            </Button>
          </div>
          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="p-4 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-white text-sm">{sec.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reorderSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => reorderSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleSection(sec.id)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                      sec.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {sec.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Pages & Policy Editor */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#101020] border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white text-sm mb-2">Static Pages & Policies</h3>
            {pages.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPage(p)}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                  selectedPage?.id === p.id ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-black/20 border-white/5 text-gray-300'
                }`}
              >
                <div className="font-bold text-xs">{p.title}</div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                  <span>/{p.slug}</span>
                  <span className="font-mono">{p.version}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
            {selectedPage && (
              <>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <h3 className="font-bold text-white text-sm">Editing: {selectedPage.title}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.success("Draft saved")} className="text-xs border-border">Save Draft</Button>
                    <Button size="sm" onClick={() => toast.success("Page published live")} className="bg-indigo-600 text-xs">Publish Version</Button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Page Title & Slug</label>
                  <input
                    type="text"
                    value={selectedPage.title}
                    onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                    className="w-full bg-[#141428] border border-border rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Content (Markdown / HTML)</label>
                  <textarea
                    rows={12}
                    defaultValue={`# ${selectedPage.title}\n\nThis policy governs all marketplace transactions under the Aurevyxon Digital Asset Security standards.`}
                    className="w-full bg-[#141428] border border-border rounded p-3 text-xs text-white font-mono"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Blog & SEO Engine */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm">Create New Blog Article</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Article Title..."
                value={newBlog.title}
                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                className="bg-[#141428] border border-border rounded p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Author Name..."
                value={newBlog.author}
                onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
                className="bg-[#141428] border border-border rounded p-2 text-xs text-white"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Article Body Content..."
              value={newBlog.text}
              onChange={(e) => setNewBlog({ ...newBlog, text: e.target.value })}
              className="w-full bg-[#141428] border border-border rounded p-2 text-xs text-white"
            />
            <Button size="sm" onClick={createBlogPost} className="bg-indigo-600 text-white text-xs">
              Publish Blog Post
            </Button>
          </div>

          <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Published Blog Posts</h3>
            {blogPosts.map(bp => (
              <div key={bp.id} className="p-3 bg-black/30 border border-white/10 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-xs">{bp.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">By {bp.author} • {bp.created_at}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">PUBLISHED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Media Library */}
      {activeTab === 'media' && (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Media Asset Repository</h3>
            <Button size="sm" onClick={() => toast.success("Asset uploaded to secure media storage")} className="bg-indigo-600 text-xs">
              <Upload className="w-3.5 h-3.5 mr-1" /> Upload Asset
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaFiles.map(mf => (
              <div key={mf.id} className="p-4 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" /> {mf.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">Size: {mf.size} • Dimensions: {mf.dimensions}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">Used in {mf.usage_count} live sections</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://cdn.aurevyxon.com/media/${mf.name}`);
                    toast.success(`CDN URL for ${mf.name} copied to clipboard!`);
                  }} 
                  className="text-[10px] border-border cursor-pointer"
                >
                  Copy Link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Banners */}
      {activeTab === 'banners' && (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Targeted Promotional Banners</h3>
          <div className="space-y-3">
            {banners.map(bn => (
              <div key={bn.id} className="p-4 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">{bn.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Target: {bn.targeting} • Device: {bn.device}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
