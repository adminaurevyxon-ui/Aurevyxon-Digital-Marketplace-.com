import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, ShieldCheck, AlertTriangle, LifeBuoy, Clock } from "lucide-react";
import { persistMessageToFirestore } from "@/lib/firestoreService";

interface SellerMessageAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: any;
  kycStatus?: string;
}

export function SellerMessageAdminModal({
  isOpen,
  onClose,
  token,
  user,
  kycStatus
}: SellerMessageAdminModalProps) {
  const isVerified = kycStatus === 'verified' || kycStatus === 'approved' || user?.role === 'admin';

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("Payment Issue");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchThread = async () => {
    if (!token || !user?.id || !isVerified) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/thread/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.warn("Failed to load seller messages thread:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchThread();
    }
  }, [isOpen, token, user?.id]);

  const handleSend = async () => {
    if (!message.trim()) {
      return toast.error("Please type your message before sending.");
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          subject,
          message
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message to Admin.");
      }

      // Persist message to Cloud Firestore collection 'messages'
      await persistMessageToFirestore({
        id: data.msgId || "msg_" + Date.now(),
        conversation_id: `conv_seller_${user.id}`,
        sender_id: user.id,
        sender_role: "seller",
        sender_display_name: user.name || "Seller",
        recipient_id: "admin",
        category,
        subject,
        message
      });

      toast.success("Your message has been dispatched to AUREVYXON Support.");
      setMessage("");
      setSubject("");
      fetchThread();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0F0F23] border border-indigo-500/30 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-white">
            <LifeBuoy className="w-5 h-5 text-indigo-400" /> Message Admin & Support
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Direct priority messaging line with AUREVYXON Support & System Administrators.
          </p>
        </DialogHeader>

        {!isVerified ? (
          <div className="py-10 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Feature Restricted to Verified Sellers</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
                Direct Admin communication is available exclusively to active, KYC-verified sellers.
                Please complete your verification in the <strong>KYC Verification</strong> tab to unlock support messaging.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Conversation History */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground px-1 font-mono">
                <span>Conversation Thread with AUREVYXON Support</span>
                {loading && <span className="text-indigo-400 flex items-center gap-1"><Clock className="w-3 h-3 animate-spin" /> Loading...</span>}
              </div>

              <div className="h-64 overflow-y-auto space-y-3 p-3 bg-black/40 rounded-xl border border-white/10 font-sans">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 text-indigo-400/40 mb-2" />
                    <p className="text-xs font-medium text-white">No previous messages found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Submit an inquiry below to start a conversation with Admin.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.sender_role === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl max-w-[85%] text-xs ${
                          isAdmin
                            ? 'mr-auto bg-[#1A1A38] border border-blue-500/30 text-white'
                            : 'ml-auto bg-indigo-600/30 border border-indigo-500/40 text-indigo-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 border-b border-white/10 pb-1">
                          <span className={`font-bold text-[11px] ${isAdmin ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {isAdmin ? 'AUREVYXON Support' : 'You (Seller)'}
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
            </div>

            {/* Message Input Box */}
            <div className="p-4 bg-[#14142D] border border-white/10 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0A0A18] border border-border rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="Payment Issue">Payment / Payout Issue</option>
                    <option value="Product Issue">Product Listing Inquiry</option>
                    <option value="Account Issue">Account & Verification</option>
                    <option value="Technical Issue">Technical / Platform Issue</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Subject Header (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief summary..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#0A0A18] border border-border rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Message Detail</label>
                <textarea
                  rows={3}
                  placeholder="Describe your issue or question in detail for the Admin team..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#0A0A18] border border-border rounded-lg p-2.5 text-xs text-white resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  Messages are encrypted and saved permanently in database.
                </span>
                <Button
                  disabled={sending || !message.trim()}
                  onClick={handleSend}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 h-8"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Dispatch to Admin
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
