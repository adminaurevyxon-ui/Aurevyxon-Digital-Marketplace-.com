import React, { useState, useEffect } from "react";
import { safeJson } from "@/lib/utils";
import { toast } from "sonner";
import { Search, ShieldAlert, Star, CheckCircle, XCircle, Trash2, Eye, RefreshCw, Flag, Tag, Archive, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminProductsProps {
  token: string;
}

export function AdminProducts({ token }: AdminProductsProps) {
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [flagReason, setFlagReason] = useState("Policy Violation");

  // Double confirmation deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/advanced/products/advanced?tab=${activeSubTab}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await safeJson(res);
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
        setTabCounts(data.tabCounts || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeSubTab, page, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openDeleteModal = (product: any) => {
    setProductToDelete(product);
    setDeleteConfirmText("");
    setDeleteConfirmChecked(false);
    setDeleteModalOpen(true);
  };

  const executeAction = async (id: string, action: string, extraBody: any = {}) => {
    try {
      const res = await fetch(`/api/admin/advanced/products/${id}/action`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, moderation_note: flagReason, ...extraBody })
      });
      if (!res.ok) throw new Error("Action failed");
      const data = await safeJson(res);
      toast.success(data.message || `Action ${action} executed`);
      fetchProducts();
      if (selectedProduct && selectedProduct.id === id) {
        if (action === 'delete') {
          setSelectedProduct(null);
        } else if (data.product) {
          setSelectedProduct(data.product);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute action");
    }
  };

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl font-sans text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Products & Assets Command</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage, review, feature and moderate digital products across marketplace</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchProducts} className="gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/10">
        {[
          { id: 'all', label: 'All Products' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'suspended', label: 'Suspended' },
          { id: 'archived', label: 'Archived' },
          { id: 'featured', label: 'Featured' },
          { id: 'reported', label: 'Reported / Moderated' }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => { setActiveSubTab(subTab.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all ${
              activeSubTab === subTab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            {subTab.label}
            {tabCounts[subTab.id] !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-300">
                {tabCounts[subTab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Title, ID, Seller Name, Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101020] border border-border/50 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs w-full">
            Filter Results
          </Button>
        </div>
      </form>

      {/* Main Table + Detail Modal Panel */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono text-indigo-300 uppercase tracking-wider">
                <th className="py-3 px-4">Product ID & Title</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-gray-300">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-9 h-9 object-cover rounded-lg border border-border/50" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                          {p.title?.charAt(0) || 'P'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {p.title}
                          {p.is_featured === 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5" /> FEATURED
                            </span>
                          )}
                          {p.moderation_flags && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-mono flex items-center gap-0.5">
                              <ShieldAlert className="w-2.5 h-2.5" /> {p.moderation_flags}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{p.seller_name || 'System Seller'}</div>
                    <div className="text-[10px] text-muted-foreground">{p.seller_email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">${p.price?.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      p.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      p.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      p.status === 'suspended' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-300">{p.sales || 0}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setSelectedProduct(p)} className="h-7 text-[10px] border-border text-gray-300 hover:text-white px-2">
                        <Eye className="w-3 h-3 mr-1" /> Inspect
                      </Button>
                      {p.status === 'pending' && (
                        <Button size="sm" onClick={() => executeAction(p.id, 'approve')} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2">
                          Approve
                        </Button>
                      )}
                      {p.status === 'active' && (
                        <Button size="sm" onClick={() => executeAction(p.id, 'suspend')} className="h-7 text-[10px] bg-red-600/30 text-red-400 hover:bg-red-600/50 border border-red-500/30 px-2">
                          Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground font-mono">
                    No products found matching active filter state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs font-mono text-muted-foreground">
            <div>
              Showing {products.length} of {pagination.totalRecords} records (Page {pagination.page} of {pagination.totalPages})
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-7 text-xs border-border"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-7 text-xs border-border"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Product Side Panel */}
        {selectedProduct && (
          <div className="w-full xl:w-[380px] bg-[#101020] border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base">Product Details & Control</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            {selectedProduct.image_url && (
              <img src={selectedProduct.image_url} alt="" className="w-full h-40 object-cover rounded-lg border border-border" />
            )}

            <div className="space-y-2 text-xs text-gray-300">
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-mono block">Title</span>
                <span className="text-white font-bold text-sm">{selectedProduct.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-mono block">Price</span>
                  <span className="text-emerald-400 font-bold font-mono">${selectedProduct.price?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[10px] font-mono block">Type / Mode</span>
                  <span className="text-indigo-300 font-mono uppercase">{selectedProduct.type} / {selectedProduct.mode}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-mono block">Seller</span>
                <span className="text-white">{selectedProduct.seller_name} ({selectedProduct.seller_email})</span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-mono block">Description</span>
                <p className="text-gray-400 line-clamp-3 text-[11px] bg-black/20 p-2 rounded">{selectedProduct.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase font-mono mb-1">Administrative Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {selectedProduct.status !== 'active' && (
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'approve', { flag_reason: flagReason })} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                )}
                {selectedProduct.status !== 'suspended' && (
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'suspend', { flag_reason: flagReason })} className="bg-red-600/30 text-red-400 hover:bg-red-600/50 border border-red-500/30 text-xs">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Suspend
                  </Button>
                )}
                {Boolean(selectedProduct.is_featured) ? (
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'unfeature')} variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs">
                    <Star className="w-3.5 h-3.5 mr-1 fill-amber-300" /> Unfeature
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'feature')} className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                    <Star className="w-3.5 h-3.5 mr-1" /> Feature
                  </Button>
                )}
                {selectedProduct.status === 'archived' ? (
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'restore')} variant="outline" className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 text-xs">
                    Restore
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'archive')} variant="outline" className="border-border text-gray-300 hover:text-white text-xs">
                    <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                  </Button>
                )}
              </div>

              {/* Moderation Flagging */}
              <div className="pt-2">
                <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Flag Moderation Reason</label>
                <div className="flex gap-2">
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="bg-[#141428] border border-border rounded px-2 py-1 text-xs text-white flex-1"
                  >
                    <option value="Policy Violation">Policy Violation</option>
                    <option value="Copyright / IP Infringement">Copyright / IP Infringement</option>
                    <option value="Duplicate Listing">Duplicate Listing</option>
                    <option value="Malware / Suspicious File">Malware / Suspicious File</option>
                    <option value="Prohibited Content">Prohibited Content</option>
                  </select>
                  <Button size="sm" onClick={() => executeAction(selectedProduct.id, 'flag', { flag_reason: flagReason })} className="bg-red-600 hover:bg-red-700 text-white text-xs">
                    <Flag className="w-3 h-3" /> Flag
                  </Button>
                </div>
              </div>

              <Button size="sm" onClick={() => openDeleteModal(selectedProduct)} variant="outline" className="w-full border-red-900 text-red-500 hover:bg-red-950 text-xs mt-2">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Product Permanently
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Double Confirmation Delete Modal */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121226] border border-red-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Permanently Remove Listing</h3>
                <p className="text-xs text-red-400 font-mono mt-0.5">Destructive Marketplace Action</p>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span className="text-muted-foreground font-mono">Product:</span>
                <span className="font-bold text-white">{productToDelete.title}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="text-muted-foreground font-mono">ID:</span>
                <span className="font-mono text-indigo-300">{productToDelete.id}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span className="text-muted-foreground font-mono">Seller:</span>
                <span>{productToDelete.seller_name || productToDelete.seller_email}</span>
              </div>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-[11px] text-gray-300 leading-relaxed space-y-1">
              <p className="font-semibold text-red-300">Safety & Preservation Guarantee:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>This listing will be immediately removed from marketplace browsing, search, and seller dashboard.</li>
                <li>Financial transaction history and existing buyer download access are strictly preserved.</li>
                <li>An immutable audit log entry is recorded for administrative accountability.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteConfirmChecked}
                  onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                  className="mt-0.5 rounded bg-black/40 border-gray-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-gray-300">
                  I confirm that I want to remove this product from the marketplace and seller dashboard.
                </span>
              </label>

              <div>
                <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                  Type <span className="text-red-400 font-bold">DELETE</span> or <span className="text-white font-bold">{productToDelete.title}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE or product title"
                  className="w-full bg-black/50 border border-border/60 rounded-lg px-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)} className="border-border text-gray-300 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!deleteConfirmChecked || (deleteConfirmText.trim() !== 'DELETE' && deleteConfirmText.trim().toLowerCase() !== productToDelete.title.trim().toLowerCase())}
                onClick={() => {
                  executeAction(productToDelete.id, 'delete');
                  setDeleteModalOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
