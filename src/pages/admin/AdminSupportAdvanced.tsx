import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  LifeBuoy, MessageSquare, Users, ShieldAlert, FileText, Send, 
  Paperclip, Clock, CheckCircle2, AlertCircle, ArrowUpRight, Search, 
  Plus, Edit3, Tag, UserCheck, CornerDownRight, RotateCcw, Lock, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSupportAdvancedProps {
  token: string;
}

export function AdminSupportAdvanced({ token }: AdminSupportAdvancedProps) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Form states
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [assignedAgent, setAssignedAgent] = useState("admin_master");
  const [activeTemplate, setActiveTemplate] = useState("");

  // Direct Seller Messages State
  const [sellerConvs, setSellerConvs] = useState<any[]>([]);
  const [selectedSellerConv, setSelectedSellerConv] = useState<any>(null);
  const [sellerThreadMsgs, setSellerThreadMsgs] = useState<any[]>([]);
  const [sellerReplyText, setSellerReplyText] = useState("");
  const [sendingSellerReply, setSendingSellerReply] = useState(false);

  const fetchSellerConvs = async () => {
    try {
      const res = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSellerConvs(data.conversations || []);
        if (data.conversations?.length > 0 && !selectedSellerConv) {
          selectSellerConv(data.conversations[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch seller conversations:", e);
    }
  };

  const selectSellerConv = async (conv: any) => {
    setSelectedSellerConv(conv);
    if (!conv?.seller_user_id) return;
    try {
      const res = await fetch(`/api/messages/thread/${conv.seller_user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSellerThreadMsgs(data.messages || []);
      }
    } catch (e) {
      console.warn("Failed to fetch thread:", e);
    }
  };

  const handleReplySellerDirect = async () => {
    if (!selectedSellerConv?.seller_user_id || !sellerReplyText.trim()) return;
    setSendingSellerReply(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          seller_id: selectedSellerConv.seller_user_id,
          category: selectedSellerConv.category || 'General',
          subject: selectedSellerConv.subject || '',
          message: sellerReplyText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      toast.success("Reply dispatched to seller as AUREVYXON Support");
      setSellerReplyText("");
      selectSellerConv(selectedSellerConv);
      fetchSellerConvs();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSendingSellerReply(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'seller_direct') {
      fetchSellerConvs();
    }
  }, [activeTab]);
  const [liveChats, setLiveChats] = useState<any[]>([
    {
      id: "chat_101",
      user_name: "Alex Rivera",
      user_role: "buyer",
      last_message: "Can I get assistance with my license key for Apex Analytics?",
      unread: 2,
      online: true,
      agent: "Agent Sarah",
      timestamp: "10 mins ago",
      messages: [
        { sender: "user", text: "Hello, my license key is showing unverified.", time: "10:15 AM" },
        { sender: "agent", text: "Hi Alex! Let me verify your transaction record.", time: "10:16 AM" },
        { sender: "user", text: "Can I get assistance with my license key for Apex Analytics?", time: "10:20 AM" }
      ]
    },
    {
      id: "chat_102",
      user_name: "Quantum Code Inc",
      user_role: "seller",
      last_message: "When will my pending payout request be cleared?",
      unread: 0,
      online: false,
      agent: "Agent John",
      timestamp: "1 hour ago",
      messages: [
        { sender: "user", text: "Submitted payout request #PO-882 yesterday.", time: "09:00 AM" },
        { sender: "agent", text: "Checking escrow holding status now.", time: "09:05 AM" }
      ]
    }
  ]);
  const [selectedChat, setSelectedChat] = useState<any>(liveChats[0]);
  const [chatInput, setChatInput] = useState("");

  // Agents list
  const agents = [
    { id: "admin_master", name: "Super Admin (You)", role: "Tier 3 Lead", active_tickets: 4, online: true, sla_compliance: "99.4%" },
    { id: "agent_sarah", name: "Sarah Jenkins", role: "Tier 2 Support", active_tickets: 8, online: true, sla_compliance: "98.1%" },
    { id: "agent_john", name: "John Davis", role: "Tier 1 Specialist", active_tickets: 12, online: false, sla_compliance: "95.0%" },
    { id: "agent_tech", name: "Dev Escalations", role: "Technical Lead", active_tickets: 3, online: true, sla_compliance: "100%" }
  ];

  // Canned Templates
  const cannedTemplates = [
    { id: "t1", category: "Refunds", title: "Standard Refund Policy", text: "Hello! Our digital marketplace policy allows refunds within 14 days if the code product is defective or undelivered as advertised." },
    { id: "t2", category: "KYC", title: "KYC Resubmission Needed", text: "Dear Seller, please re-upload a high-resolution clear scan of your ID and bank document for verification." },
    { id: "t3", category: "Technical", title: "License Verification Fix", text: "Please ensure you have included your API Bearer Token in the authorization header when calling license check." }
  ];

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/advanced/tickets/advanced?search=${encodeURIComponent(search)}&status=${statusFilter}&priority=${priorityFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleAction = async (ticketId: string, action: string, extraData: any = {}) => {
    try {
      const res = await fetch(`/api/admin/advanced/tickets/${ticketId}/action`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData })
      });
      if (!res.ok) throw new Error("Ticket action failed");
      const data = await res.json();
      toast.success(data.message || `Action ${action} completed`);
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          status: data.new_status || selectedTicket.status,
          assigned_to: extraData.agent || selectedTicket.assigned_to
        });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !selectedChat) return;
    const newMsg = { sender: "agent", text: chatInput, time: "Just now" };
    const updatedChats = liveChats.map(c => {
      if (c.id === selectedChat.id) {
        return {
          ...c,
          messages: [...c.messages, newMsg],
          last_message: chatInput
        };
      }
      return c;
    });
    setLiveChats(updatedChats);
    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, newMsg],
      last_message: chatInput
    });
    setChatInput("");
    toast.success("Message sent to buyer/seller chat");
  };

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6 shadow-2xl font-sans text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-indigo-400" /> Support, SLA & Real-time Helpdesk
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ticket lifecycle, buyer/seller live chat, SLA auto-escalation & canned resolution templates</p>
        </div>
      </div>

      {/* Main Subtabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/10">
        {[
          { id: 'tickets', label: 'Tickets Desk' },
          { id: 'seller_direct', label: 'Direct Seller Messages' },
          { id: 'live_chat', label: 'Live Chat Console' },
          { id: 'agents', label: 'Support Roster & SLA' },
          { id: 'templates', label: 'Response Templates' }
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

      {/* Tab 1: Tickets Desk */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-[#101020] p-3 rounded-lg border border-border/50">
            <div className="flex gap-2 items-center flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground ml-2" />
              <input
                type="text"
                placeholder="Search ticket ID, subject, user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                className="w-full bg-transparent text-xs text-white placeholder-muted-foreground focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#141428] border border-border rounded px-2.5 py-1 text-xs text-white font-mono"
              >
                <option value="all">Status: All</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#141428] border border-border rounded px-2.5 py-1 text-xs text-white font-mono"
              >
                <option value="all">Priority: All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Tickets Table + Side Inspector */}
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-[11px] font-mono text-indigo-300 uppercase">
                    <th className="py-3 px-4">Ticket ID & Subject</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Priority / SLA</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Agent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{t.subject || 'Support Request'}</div>
                        <div className="text-[10px] font-mono text-indigo-400">{t.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{t.user_name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.user_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          t.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          t.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {t.priority || 'Medium'}
                        </span>
                        <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> SLA: {t.sla_remaining || '1h 15m'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          t.status === 'open' ? 'bg-amber-500/20 text-amber-400' :
                          t.status === 'escalated' ? 'bg-red-500/20 text-red-400' :
                          t.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-300">
                        {t.assigned_to || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTicket(t)}
                          className="h-7 text-[10px] border-border text-gray-300 hover:text-white"
                        >
                          Manage Ticket
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground font-mono">
                        No support tickets match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Ticket Management Inspector Drawer */}
            {selectedTicket && (
              <div className="w-full xl:w-[420px] bg-[#101020] border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <h3 className="font-bold text-white text-base">Ticket Resolution Center</h3>
                  <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-white text-sm">✕</button>
                </div>

                {/* Ticket Details & Order Link */}
                <div className="bg-black/30 p-3 rounded-lg space-y-2 text-xs border border-white/5">
                  <div className="text-indigo-400 font-mono font-bold">{selectedTicket.id}</div>
                  <div className="font-bold text-white text-sm">{selectedTicket.subject}</div>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                  
                  {selectedTicket.order_id && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Linked Order:</span>
                      <span className="text-emerald-400 font-mono">{selectedTicket.order_id}</span>
                    </div>
                  )}
                </div>

                {/* Canned Template Selection */}
                <div>
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">Insert Quick Template</label>
                  <select
                    onChange={(e) => {
                      const t = cannedTemplates.find(ct => ct.id === e.target.value);
                      if (t) setReplyMessage(t.text);
                    }}
                    className="w-full bg-[#141428] border border-border rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">Select Canned Response...</option>
                    {cannedTemplates.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.category}: {ct.title}</option>
                    ))}
                  </select>
                </div>

                {/* Reply Form */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono text-muted-foreground block">Customer Reply</label>
                  <textarea
                    rows={3}
                    placeholder="Type official support reply to requester..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full bg-[#141428] border border-border rounded p-2 text-xs text-white"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!replyMessage) return toast.error("Reply text is empty");
                      handleAction(selectedTicket.id, "reply", { reply: replyMessage });
                      setReplyMessage("");
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" /> Send Customer Reply
                  </Button>
                </div>

                {/* Internal Admin Note */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-[10px] uppercase font-mono text-amber-400 block">Internal Staff Note (Private)</label>
                  <textarea
                    rows={2}
                    placeholder="Staff notes visible only to admins..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    className="w-full bg-[#141428] border border-border rounded p-2 text-xs text-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!internalNote) return;
                      handleAction(selectedTicket.id, "add_internal_note", { note: internalNote });
                      setInternalNote("");
                    }}
                    className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs"
                  >
                    Save Internal Note
                  </Button>
                </div>

                {/* Status & Assignment Controls */}
                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(selectedTicket.id, "escalate")}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    Escalate Ticket
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(selectedTicket.id, "resolve")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    Mark Resolved
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Chat Console */}
      {activeTab === 'live_chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
          {/* Chat Threads List */}
          <div className="bg-[#101020] border border-border/50 rounded-xl p-4 overflow-y-auto space-y-3">
            <h3 className="font-bold text-white text-sm mb-2 flex items-center justify-between">
              <span>Active Helpdesk Chats</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Real-time</span>
            </h3>
            {liveChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                  selectedChat?.id === chat.id
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                    : 'bg-black/20 border-white/5 hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    {chat.user_name}
                    {chat.online && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{chat.timestamp}</span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">{chat.last_message}</div>
              </div>
            ))}
          </div>

          {/* Active Chat Conversation Panel */}
          <div className="lg:col-span-2 bg-[#101020] border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      {selectedChat.user_name}
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                        {selectedChat.user_role}
                      </span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground">Assigned: {selectedChat.agent}</span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {selectedChat.messages.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[75%] p-3 rounded-xl text-xs ${
                        m.sender === 'agent'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-[#141428] border border-white/10 text-gray-200 rounded-bl-none'
                      }`}>
                        {m.text}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1 px-1">{m.time}</span>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <input
                    type="text"
                    placeholder="Type live response to user..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    className="flex-1 bg-[#141428] border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
                  />
                  <Button size="sm" onClick={sendChatMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
                Select a chat thread to initiate live support response
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Support Roster */}
      {activeTab === 'agents' && (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center justify-between">
            <span>Support Agents & SLA Compliance Roster</span>
            <Button size="sm" onClick={() => toast.success("Agent schedule updated")} className="bg-indigo-600 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Support Agent
            </Button>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(ag => (
              <div key={ag.id} className="p-4 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {ag.name}
                    {ag.online && <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400">ONLINE</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ag.role}</div>
                  <div className="text-[11px] text-indigo-300 font-mono mt-2">
                    Active Assigned Tickets: <span className="font-bold text-white">{ag.active_tickets}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-mono">SLA Score</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">{ag.sla_compliance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Response Templates */}
      {activeTab === 'templates' && (
        <div className="bg-[#101020] border border-border/50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Canned Response Library</h3>
          <div className="space-y-3">
            {cannedTemplates.map(t => (
              <div key={t.id} className="p-4 bg-black/30 border border-white/10 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white text-sm">{t.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">{t.category}</span>
                </div>
                <p className="text-xs text-gray-300">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Direct Seller Messages */}
      {activeTab === 'seller_direct' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Conversations List */}
          <div className="bg-[#101020] border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Active Seller Threads ({sellerConvs.length})
              </h3>
              <Button size="sm" variant="ghost" onClick={fetchSellerConvs} className="h-7 text-[10px] text-muted-foreground hover:text-white">
                Refresh
              </Button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sellerConvs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs font-mono">
                  No active seller message conversations found.
                </div>
              ) : (
                sellerConvs.map(conv => {
                  const isSelected = selectedSellerConv?.conversation_id === conv.conversation_id;
                  return (
                    <div
                      key={conv.conversation_id}
                      onClick={() => selectSellerConv(conv)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                          : 'bg-black/30 border-white/5 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white truncate max-w-[150px]">
                          {conv.store_name || conv.seller_name || conv.sender_display_name || 'Seller'}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                            {conv.unread_count} NEW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-indigo-300 font-mono mb-1 truncate">
                        {conv.seller_email} • <span className="uppercase text-emerald-400">{conv.kyc_status || 'verified'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        "{conv.last_message}"
                      </p>
                      <div className="text-[9px] font-mono text-muted-foreground mt-1 text-right">
                        {new Date(conv.last_message_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Conversation Detail & Reply Console */}
          <div className="lg:col-span-2 bg-[#101020] border border-border/50 rounded-xl p-5 flex flex-col justify-between min-h-[500px]">
            {selectedSellerConv ? (
              <div className="flex flex-col h-full space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {selectedSellerConv.store_name || selectedSellerConv.seller_name || 'Verified Seller'}
                    </h3>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      User ID: {selectedSellerConv.seller_user_id} • {selectedSellerConv.seller_email}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg">
                    Official Support Channel
                  </span>
                </div>

                {/* Thread Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-black/40 rounded-xl border border-white/5 max-h-[350px]">
                  {sellerThreadMsgs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs font-mono">
                      No messages loaded in this thread.
                    </div>
                  ) : (
                    sellerThreadMsgs.map(m => {
                      const isAdmin = m.sender_role === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl max-w-[85%] text-xs ${
                            isAdmin
                              ? 'ml-auto bg-indigo-600/30 border border-indigo-500/40 text-indigo-100'
                              : 'mr-auto bg-[#1A1A38] border border-white/10 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 border-b border-white/10 pb-1">
                            <span className={`font-bold text-[11px] ${isAdmin ? 'text-indigo-300' : 'text-emerald-400'}`}>
                              {m.sender_display_name || (isAdmin ? 'AUREVYXON Support' : 'Seller')}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              {new Date(m.created_at).toLocaleString()}
                            </span>
                          </div>
                          {m.subject && (
                            <div className="font-semibold text-blue-300 text-[11px] mb-0.5">
                              Re: {m.subject} ({m.category})
                            </div>
                          )}
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{m.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Composer */}
                <div className="p-3 bg-[#14142D] border border-white/10 rounded-xl space-y-2">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Reply as <span className="text-indigo-300 font-bold">AUREVYXON Support</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Type official response to this seller..."
                    value={sellerReplyText}
                    onChange={(e) => setSellerReplyText(e.target.value)}
                    className="w-full bg-[#0A0A18] border border-border rounded-lg p-2.5 text-xs text-white resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={sendingSellerReply || !sellerReplyText.trim()}
                      onClick={handleReplySellerDirect}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 h-8"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Dispatch Reply to Seller
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 text-indigo-400/30 mb-3" />
                <p className="text-sm font-bold text-white">Select a Seller Conversation</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Choose a seller thread from the left panel to review message history and reply as AUREVYXON Support.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
