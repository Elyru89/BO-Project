"use client";

import { useState, useMemo } from "react";
import { Palette, Search, ExternalLink, Layers, Clock, CheckCircle, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import rawData from "@/data/darwin_projects.json";
import { formatDate, truncate, priorityColor, progressColor } from "@/lib/utils";

type DProject = Record<string, unknown>;
const data = rawData as DProject[];

const USES = ["All","Website","Organic Social","Paid Advertising","Branding","BO PRO","Teak Isle"];

export default function DarwinProjects() {
  const [search, setSearch] = useState("");
  const [useFilter, setUseFilter]  = useState("All");
  const [prioFilter, setPrioFilter] = useState("all");
  const [view, setView] = useState<"kanban"|"list">("list");

  const filtered = useMemo(() => {
    return data.filter(r => {
      const q = search.toLowerCase();
      const task = String(r["Task"] || "").toLowerCase();
      const desc = String(r["Description"] || "").toLowerCase();
      const matchSearch = !q || task.includes(q) || desc.includes(q);

      const uses = String(r["Uses"] || "");
      const matchUse = useFilter === "All" || uses.includes(useFilter);

      const prio = String(r["Priority"] || "").toLowerCase();
      const matchPrio = prioFilter === "all" || prio === prioFilter;

      return matchSearch && matchUse && matchPrio;
    });
  }, [search, useFilter, prioFilter]);

  const completed = data.filter(r =>
    typeof r["Progress"] === "string" && (r["Progress"] as string).toLowerCase().includes("complet")).length;
  const high = data.filter(r => String(r["Priority"]||"").toLowerCase() === "high").length;
  const overdue = data.filter(r => {
    const d = r["Due Date"];
    if (!d) return false;
    return new Date(String(d)) < new Date();
  }).length;

  const byStatus: Record<string,DProject[]> = { "Completed": [], "In Progress": [], "Pending": [] };
  data.forEach(r => {
    const p = String(r["Progress"] || "");
    if (p.toLowerCase().includes("complet")) byStatus["Completed"].push(r);
    else if (p.toLowerCase().includes("progress")) byStatus["In Progress"].push(r);
    else byStatus["Pending"].push(r);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Design Projects" subtitle={`Darwin's creative task board — ${data.length} projects`} icon={Palette}>
        <div className="flex rounded-lg overflow-hidden border border-bo-border">
          {(["list","kanban"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors
                ${view === v ? "bg-bo-orange text-white" : "bg-bo-surface text-bo-subtle"}`}>
              {v === "list" ? "List" : "Kanban"}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks",   val: data.length,  icon: Layers,       color: "text-bo-orange" },
          { label: "Completed",     val: completed,    icon: CheckCircle,  color: "text-green-400" },
          { label: "High Priority", val: high,         icon: AlertCircle,  color: "text-red-400"   },
          { label: "Overdue",       val: overdue,      icon: Clock,        color: "text-yellow-400"},
        ].map(s => (
          <div key={s.label} className="bo-card p-4 flex items-center gap-3">
            <s.icon size={18} className={s.color} />
            <div>
              <div className="text-2xl font-bold text-bo-text">{s.val}</div>
              <div className="text-bo-subtle text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle" />
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search tasks…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bo-input text-sm" value={useFilter} onChange={e => setUseFilter(e.target.value)}>
          {USES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className="bo-input text-sm" value={prioFilter} onChange={e => setPrioFilter(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(byStatus).map(([status, tasks]) => (
            <div key={status} className="bo-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${
                  status === "Completed" ? "bg-green-400" :
                  status === "In Progress" ? "bg-blue-400" : "bg-bo-muted"}`} />
                <span className="font-semibold text-bo-text text-sm">{status}</span>
                <span className="ml-auto text-xs text-bo-subtle bg-bo-muted/30 px-2 py-0.5 rounded-full">{tasks.length}</span>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {tasks.map((t, i) => {
                  const link = String(t["Link to Finished Content"] || "");
                  const isUrl = link.startsWith("http");
                  return (
                    <div key={i} className="bg-bo-surface border border-bo-border rounded-lg p-3 hover:border-bo-orange/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-bo-text text-xs font-medium leading-tight">{truncate(String(t["Task"]||""),40)}</span>
                        <span className={`${priorityColor(String(t["Priority"]||""))} flex-shrink-0`}>
                          {String(t["Priority"]||"").toLowerCase()}
                        </span>
                      </div>
                      <div className="text-bo-subtle text-[11px] mb-2 leading-relaxed">
                        {truncate(String(t["Description"]||""), 60)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-bo-muted">{formatDate(String(t["Due Date"]||""))}</span>
                        {isUrl && (
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-0.5 text-[10px]">
                            Figma <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Task","Description","Uses","Format","Priority","Due Date","Status","Link"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const link = String(row["Link to Finished Content"] || "");
                  const isUrl = link.startsWith("http");
                  const prio = String(row["Priority"] || "");
                  const prog = String(row["Progress"] || "");
                  return (
                    <tr key={i} className="border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-bo-text max-w-[180px]">{truncate(String(row["Task"]||""),30)}</td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs max-w-[220px]">{truncate(String(row["Description"]||""),50)}</td>
                      <td className="px-3 py-2.5">
                        <span className="bo-badge-info">{truncate(String(row["Uses"]||""),20)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs">{truncate(String(row["Format"]||""),18)}</td>
                      <td className="px-3 py-2.5">
                        <span className={priorityColor(prio)}>{prio || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">{formatDate(String(row["Due Date"]||""))}</td>
                      <td className="px-3 py-2.5">
                        <span className={progressColor(prog)}>{prog || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {isUrl ? (
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">
                            Open <ExternalLink size={10} />
                          </a>
                        ) : <span className="text-bo-muted text-xs">{truncate(link,15)||"—"}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
