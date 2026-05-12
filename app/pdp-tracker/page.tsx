"use client";

import { useState, useMemo } from "react";
import { Table2, Search, Filter, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import rawData from "@/data/pdp_tracker.json";
import { formatDate, truncate } from "@/lib/utils";

type PDP = {
  PartNumber?: string;
  Name?: string;
  "PDP Image Suite"?: boolean;
  "Lifestyle Images"?: boolean;
  "Hover Image"?: boolean;
  "Images Fully Updated?"?: boolean;
  "PDP Teaser"?: boolean;
  "PDP Bullets"?: boolean;
  "GMC Title"?: boolean;
  "GMC Description"?: boolean;
  "Search Terms"?: boolean;
  "All Text Completed?"?: boolean;
  "Fully Completed"?: boolean;
  "Image Suite Due Date"?: string;
  "Texts Due Date"?: string;
  Notes?: string;
};

const data = rawData as PDP[];
const TOTAL_SKUS = 10583;
const PAGE_SIZE = 50;

function Check({ val }: { val: boolean | null | undefined }) {
  if (val === true)  return <CheckCircle size={14} className="text-green-400" />;
  if (val === false) return <XCircle size={14} className="text-red-400/60" />;
  return <Clock size={14} className="text-bo-muted" />;
}

export default function PDPTracker() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete" | "partial">("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return data.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (r.PartNumber?.toLowerCase().includes(q)) ||
        (r.Name?.toLowerCase().includes(q));

      const imagesOk = r["Images Fully Updated?"] === true;
      const textOk   = r["All Text Completed?"]   === true;
      const fullOk   = r["Fully Completed"]        === true;

      const matchFilter =
        filter === "all"       ? true :
        filter === "complete"  ? fullOk :
        filter === "incomplete"? (!imagesOk && !textOk) :
        /* partial */            ((imagesOk || textOk) && !fullOk);

      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const completed = data.filter(r => r["Fully Completed"] === true).length;
  const imgDone   = data.filter(r => r["Images Fully Updated?"] === true).length;
  const txtDone   = data.filter(r => r["All Text Completed?"] === true).length;
  const completedPct = Math.round((completed / data.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title="PDP Tracker" subtitle={`10,583 SKUs · Showing ${data.length} in seed (import CSV for full catalog)`} icon={Table2}>
        <button className="bo-btn-ghost flex items-center gap-1.5 text-sm">
          <Download size={14} /> Export
        </button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Fully Complete",   val: completed, total: data.length, pct: completedPct,         color: "green" as const },
          { label: "Images Updated",   val: imgDone,   total: data.length, pct: Math.round((imgDone/data.length)*100), color: "teal" as const },
          { label: "Text Completed",   val: txtDone,   total: data.length, pct: Math.round((txtDone/data.length)*100), color: "orange" as const },
          { label: "Remaining",        val: data.length - completed, total: data.length, pct: 100 - completedPct, color: "yellow" as const },
        ].map(s => (
          <div key={s.label} className="bo-card p-4">
            <div className="text-bo-subtle text-xs uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-bold text-bo-text mb-2">{s.val.toLocaleString()}</div>
            <ProgressBar value={s.pct} color={s.color} size="sm" />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle" />
          <input
            className="bo-input w-full pl-9 text-sm"
            placeholder="Search by part number or name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex gap-2">
          <Filter size={15} className="text-bo-subtle self-center" />
          {(["all","complete","incomplete","partial"] as const).map(f => (
            <button key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filter === f ? "bg-bo-orange text-white" : "bg-bo-surface border border-bo-border text-bo-subtle hover:text-bo-text"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-bo-subtle text-xs">
        Showing {visible.length} of {filtered.length} results
        {search && ` for "${search}"`}
        {page > 0 && ` · Page ${page + 1} of ${totalPages}`}
      </div>

      {/* Table */}
      <div className="bo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bo-border bg-bo-surface/50">
                {["Part #","Name","Img Suite","Lifestyle","Hover","Images ✓","Teaser","Bullets","GMC Title","GMC Desc","Search","Text ✓","Fully Done","Notes"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={i}
                  className={`border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors
                    ${row["Fully Completed"] ? "border-l-2 border-l-green-500/30" : ""}`}>
                  <td className="px-3 py-2.5 font-mono text-xs text-bo-orange whitespace-nowrap">{row.PartNumber || "—"}</td>
                  <td className="px-3 py-2.5 text-bo-text max-w-[220px]" title={row.Name || ""}>{truncate(row.Name || null, 40)}</td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["PDP Image Suite"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["Lifestyle Images"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["Hover Image"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["Images Fully Updated?"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["PDP Teaser"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["PDP Bullets"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["GMC Title"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["GMC Description"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["Search Terms"]} /></td>
                  <td className="px-3 py-2.5 text-center"><Check val={row["All Text Completed?"]} /></td>
                  <td className="px-3 py-2.5 text-center">
                    {row["Fully Completed"]
                      ? <span className="bo-badge-success">Done</span>
                      : <span className="bo-badge-muted">Pending</span>}
                  </td>
                  <td className="px-3 py-2.5 text-bo-subtle text-xs max-w-[180px]" title={row.Notes || ""}>
                    {truncate(row.Notes || null, 35)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-bo-border">
            <button
              onClick={() => setPage(p => Math.max(0, p-1))}
              disabled={page === 0}
              className="bo-btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <span className="text-bo-subtle text-xs">Page {page+1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages-1, p+1))}
              disabled={page >= totalPages - 1}
              className="bo-btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Import note */}
      <div className="bo-card p-4 border-bo-orange/30 bg-bo-orange/5">
        <div className="text-bo-orange text-sm font-semibold mb-1">📦 Full Catalog Import</div>
        <div className="text-bo-subtle text-xs">
          This view shows 500 seed records. To load all 10,583 SKUs, export your Excel sheet as CSV
          and use the import button (coming in v2 with Supabase backend).
        </div>
      </div>
    </div>
  );
}
