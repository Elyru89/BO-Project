"use client";

import { useState } from "react";
import { Megaphone, CheckCircle, XCircle, ExternalLink, Play } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import rawData from "@/data/video_ads.json";
import { truncate } from "@/lib/utils";

type VideoAd = Record<string, unknown>;
const data = rawData as VideoAd[];

export default function VideoAds() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const actionable = data.filter(r => r["Actionable?"] === true).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Video Ads" subtitle={`Paid advertising specs & production queue — ${data.length} ads`} icon={Megaphone} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-text">{data.length}</div>
          <div className="text-bo-subtle text-xs">Total Ad Specs</div>
        </div>
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{actionable}</div>
          <div className="text-bo-subtle text-xs">Actionable Now</div>
        </div>
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-orange">Meta</div>
          <div className="text-bo-subtle text-xs">Primary Platform</div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bo-card p-4 bg-bo-orange/5 border-bo-orange/20">
        <div className="text-bo-orange text-sm font-semibold mb-1">🎯 Video Ads Pipeline</div>
        <div className="text-bo-subtle text-xs">
          These are paid advertising specs — each card shows what to create, what products to feature,
          creative direction, and source material. Mark as actionable when ready to produce.
        </div>
      </div>

      {/* Ad cards */}
      <div className="space-y-3">
        {data.map((row, i) => {
          const adName = String(row["Ad to Create"] || `Ad #${i+1}`);
          const products = String(row["Products to Promote"] || "");
          const notes = String(row["Notes"] || "");
          const content = String(row["Content to Utilize"] || "");
          const isActionable = row["Actionable?"] === true;
          const isExpanded = expanded === i;

          // Find any URL values
          const urlCols = Object.entries(row).filter(([,v]) => typeof v === "string" && String(v).startsWith("http"));

          return (
            <div key={i} className={`bo-card overflow-hidden transition-all
              ${isActionable ? "border-green-500/30" : "border-bo-border"}`}>
              {/* Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : i)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-bo-surface/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-bo-orange/10 border border-bo-orange/20 flex items-center justify-center flex-shrink-0">
                  <Play size={16} className="text-bo-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-bo-text">{adName}</div>
                  {products && (
                    <div className="text-bo-subtle text-xs mt-0.5">{truncate(products, 70)}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isActionable
                    ? <span className="bo-badge-success flex items-center gap-1"><CheckCircle size={10}/> Actionable</span>
                    : <span className="bo-badge-muted flex items-center gap-1"><XCircle size={10}/> Hold</span>}
                  <span className={`text-bo-subtle text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-bo-border/40 pt-4 space-y-4">
                  {products && (
                    <div>
                      <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Products to Promote</div>
                      <div className="text-bo-text text-sm bg-bo-surface rounded-lg p-3">{products}</div>
                    </div>
                  )}
                  {notes && notes !== "null" && (
                    <div>
                      <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Creative Direction / Notes</div>
                      <div className="text-bo-text text-sm bg-bo-surface rounded-lg p-3 leading-relaxed">{notes}</div>
                    </div>
                  )}
                  {content && content !== "null" && (
                    <div>
                      <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Content to Utilize</div>
                      <div className="text-bo-text text-sm">
                        {content.startsWith("http") ? (
                          <a href={content} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-1">
                            View Source Material <ExternalLink size={12} />
                          </a>
                        ) : content}
                      </div>
                    </div>
                  )}
                  {urlCols.length > 0 && (
                    <div>
                      <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Source Files</div>
                      <div className="space-y-1.5">
                        {urlCols.map(([col, url], j) => (
                          <a key={j} href={String(url)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-bo-teal hover:underline text-xs">
                            <ExternalLink size={11} /> {truncate(String(url), 60)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
