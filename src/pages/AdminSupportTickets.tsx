import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { safeJson } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const { token, user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolutionText, setResolutionText] = useState("");

  const fetchTickets = () => {
    fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` }})
      .then(r => safeJson(r, { tickets: [] }))
      .then(d => setTickets(d.tickets || [])).catch(e => console.warn(e));
  };

  useEffect(() => { fetchTickets(); }, [token]);

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update ticket");
      toast("Ticket updated successfully");
      fetchTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, ...updates });
      }
    } catch(e: any) {
      toast(e.message);
    }
  };

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-4">Dispute & Support Resolution</h2>
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="text-xs uppercase bg-black/40 text-foreground dark:text-white">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No support tickets found.</td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-border hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                   <div className="font-medium text-white">{t.user_name}</div>
                   <div className="text-xs">{t.user_email}</div>
                </td>
                <td className="px-4 py-3 font-medium">{t.subject}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${t.status === 'open' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedTicket(t); setResolutionText(t.resolution || ""); }}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div className="w-full md:w-[400px] border-l border-border pl-6">
          <h3 className="font-bold text-lg mb-2">Ticket Details</h3>
          <div className="bg-black/20 p-4 rounded-lg mb-4">
            <p className="font-medium text-white mb-1">Subject: {selectedTicket.subject}</p>
            <p className="text-sm text-gray-300">{selectedTicket.message}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-300">Resolution / Admin Notes</label>
              <Textarea 
                value={resolutionText} 
                onChange={(e) => setResolutionText(e.target.value)}
                className="bg-black/40 border-border"
                placeholder="Detail the resolution actions taken..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleUpdate(selectedTicket.id, { resolution: resolutionText })}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              >
                Save Notes
              </Button>
              {selectedTicket.status === 'open' ? (
                <Button 
                  onClick={() => handleUpdate(selectedTicket.id, { status: 'resolved', resolution: resolutionText })}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                >
                  Mark Resolved
                </Button>
              ) : (
                <Button 
                  onClick={() => handleUpdate(selectedTicket.id, { status: 'open' })}
                  variant="outline"
                  className="flex-1 border-border"
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
