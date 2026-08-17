import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { safeJson } from "@/lib/utils";

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const { token } = useAuth();
  
  useEffect(() => {
    fetch("/api/admin/audit-logs", { headers: { Authorization: `Bearer ${token}` }})
      .then(r => safeJson(r, { logs: [] }))
      .then(d => setLogs(d.logs || [])).catch(e => console.warn(e));
  }, [token]);

  return (
    <div className="bg-[#141428]/80 backdrop-blur-xl border border-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Security & Audit Logs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="text-xs uppercase bg-black/40 text-foreground dark:text-white">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Admin ID</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Target ID</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border hover:bg-white/[0.02]">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 font-mono text-xs">{log.admin_id.slice(0,8)}...</td>
                <td className="px-6 py-4 font-bold text-indigo-400">{log.action}</td>
                <td className="px-6 py-4 font-mono text-xs">{log.target}</td>
                <td className="px-6 py-4 text-xs">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
