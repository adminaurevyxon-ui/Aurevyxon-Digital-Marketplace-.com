import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Layout, Megaphone } from "lucide-react";

export function AdminCMS() {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/cms/announcements", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setAnnouncements(json.announcements || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const addAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/cms/announcements", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        toast("Announcement posted");
        setTitle("");
        setContent("");
        loadData();
      }
    } catch (err) {
      toast("Error posting announcement");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#141428]/80 backdrop-blur-xl border-border">
        <CardContent className="p-6">
           <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6">
             <Megaphone className="w-5 h-5 text-indigo-400" /> Platform Announcements
           </h2>
           <form onSubmit={addAnnouncement} className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Content</label>
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  required 
                  className="w-full h-24 bg-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">Post Announcement</Button>
           </form>

           <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Recent Announcements</h3>
              {announcements.map((a) => (
                <div key={a.id} className="bg-white/[0.02] border border-border/10 p-4 rounded-lg">
                  <h4 className="font-bold text-white mb-1">{a.title}</h4>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
