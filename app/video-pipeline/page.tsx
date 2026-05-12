"use client";

import { useState, useMemo } from "react";
import { Film, Search, ExternalLink, Video, Monitor, Instagram, Tv } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import rawProjects from "@/data/video_projects.json";
import rawCompleted from "@/data/completed_videos.json";
import { formatDate, truncate, progressColor } from "@/lib/utils";

type VideoProject = Record<string, unknown>;

const projects = rawProjects as VideoProject[];
const completed = rawCompleted as VideoProject[];

function UsagePill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border
      ${active ? "bg-bo-orange/20 text-bo-orange border-bo-orange/40" : "bg-bo-muted/20 text-bo-muted border-bo-border opacity-40"}`}>
      {label}
    </span>
  );
}

export default function VideoPipeline() {
  const [tab, setTab]       = useState<"projects" | "completed">("projects");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statuses = useMemo(() => {
    const s = new Set<string>();
    projects.forEach(p => {
      const v = p["Progress"];
      if (typeof v === "string") s.add(v);
    });
    return ["all", ...Array.from(s)];
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(r => {
      const task = String(r["Task"] || "").toLowerCase();
      const desc = String(r["Description"] || "").toLowerCase();
      const q = search.toLowerCase();
      const matchSearch = !q || task.includes(q) || desc.includes(q);
      const progress = String(r["Progress"] || "");
      const matchStatus = statusFilter === "all" || progress === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const filteredCompleted = useMemo(() => {
    return completed.filter(r => {
      const desc = String(r["Description"] || "").toLowerCase();
      return !search || desc.includes(search.toLowerCase());
    });
  }, [search]);

  const totalAssets = projects.reduce((sum, p) => {
    const n = Number(p["# Assets Created"]);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const doneCount = projects.filter(p =>
    typeof p["Progress"] === "string" && (p["Progress"] as string).toLowerCase().includes("complet")
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Video Pipeline" subtitle={`${projects.length} projects · ${totalAssets} total assets produced`} icon={Film} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Projects",    val: projects.length,   icon: Film },
          { label: "Completed",         val: doneCount,         icon: Video },
          { label: "Assets Created",    val: totalAssets,       icon: Monitor },
          { label: "Archive (Refs)",    val: completed.length,  icon: Tv },
        ].map(s => (
          <div key={s.label} className="bo-card p-4 flex items-center gap-3">
            <s.icon size={18} className="text-bo-orange" />
            <div>
              <div className="text-2xl font-bold text-bo-text">{s.val}</div>
              <div className="text-bo-subtle text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex rounded-lg overflow-hidden border border-bo-border">
          {(["projects","completed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-colors
                ${tab === t ? "bg-bo-orange text-white" : "bg-bo-surface text-bo-subtle hover:text-bo-text"}`}>
              {t === "projects" ? `Projects (${projects.length})` : `Archive (${completed.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle" />
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tab === "projects" && (
          <select className="bo-input text-sm"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
          </select>
        )}
      </div>

      {/* Projects table */}
      {tab === "projects" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Task","Description","Usage","Format","Due Date","Status","Assets","Ad Launch","Link"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((row, i) => {
                  const progress = String(row["Progress"] || "");
                  const badgeClass = progressColor(progress);
                  const link = String(row["Finished Video Link"] || "");
                  const isUrl = link.startsWith("http");
                  return (
                    <tr key={i} className="border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-bo-text whitespace-nowrap max-w-[160px]">
                        {truncate(String(row["Task"] || ""), 28)}
                      </td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs max-w-[200px]">
                        {truncate(String(row["Description"] || ""), 45)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          <UsagePill label="Ads"     active={row["Paid Ads"] === true} />
                          <UsagePill label="Web"     active={row["Website"] === true || row["Unnamed: 6"] === true} />
                          <UsagePill label="Organic" active={row["Organic"] === true} />
                          <UsagePill label="Teak"    active={row["Teak Isle"] === true || row["Unnamed: 9"] === true} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">
                        {truncate(String(row["Format"] || ""), 20)}
                      </td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">
                        {formatDate(String(row["Due Date"] || ""))}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={badgeClass}>{progress || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-bo-text">
                        {row["# Assets Created"] ? String(row["# Assets Created"]) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">
                        {formatDate(String(row["AD Launch Date"] || ""))}
                      </td>
                      <td className="px-3 py-2.5">
                        {isUrl ? (
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">
                            View <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-bo-muted text-xs">{truncate(link, 15) || "—"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed archive */}
      {tab === "completed" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Description","Paid Ads","Website","Organic","Boosted","Teak Isle","Post Link"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCompleted.map((row, i) => {
                  const postLink = String(row["Post Link"] || "");
                  const isUrl = postLink.startsWith("http");
                  return (
                    <tr key={i} className="border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-bo-text">{truncate(String(row["Description"] || ""), 45)}</td>
                      {["Paid Ads","Website","Organic","Boosted","Teak Isle"].map(col => (
                        <td key={col} className="px-3 py-2.5 text-center">
                          {row[col] === true
                            ? <span className="bo-badge-success">✓</span>
                            : <span className="text-bo-muted text-xs">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        {isUrl ? (
                          <a href={postLink} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">
                            View Post <ExternalLink size={10} />
                          </a>
                        ) : <span className="text-bo-muted text-xs">—</span>}
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
