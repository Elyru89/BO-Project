"use client";

import { useState, useMemo } from "react";
import { Image, Search, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import rawData from "@/data/brand_banners.json";
import { formatDate, truncate } from "@/lib/utils";

type Banner = Record<string, unknown>;
const data = rawData as Banner[];

export default function BrandBanners() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"complete"|"pending">("all");

  const filtered = useMemo(() => {
    return data.filter(r => {
      const brand = String(r["Brand"] || "").toLowerCase();
      const matchSearch = !search || brand.includes(search.toLowerCase());
      const done = r["Banner Completed?"] === true;
      const matchFilter = filter === "all" ? true : filter === "complete" ? done : !done;
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  const completed = data.filter(r => r["Banner Completed?"] === true).length;
  const klevu = data.filter(r => r["Added to Klevu"] === true).length;
  const pct = Math.round((completed / data.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Brand Banners" subtitle={`${data.length} partner brands tracked`} icon={Image} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bo-card p-5 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-bo-text">{completed} <span className="text-bo-subtle text-base font-normal">of {data.length}</span></div>
              <div className="text-bo-subtle text-sm">Banners Completed</div>
            </div>
            <div className="text-3xl font-black text-bo-orange">{pct}%</div>
          </div>
          <ProgressBar value={pct} color="orange" />
        </div>
        <div className="bo-card p-5">
          <div className="text-2xl font-bold text-bo-text mb-1">{klevu}</div>
          <div className="text-bo-subtle text-sm">Added to Klevu</div>
          <ProgressBar value={Math.round((klevu/data.length)*100)} color="teal" size="sm" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle" />
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search brands…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["all","complete","pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filter === f ? "bg-bo-orange text-white" : "bg-bo-surface border border-bo-border text-bo-subtle hover:text-bo-text"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="text-bo-subtle text-xs">{filtered.length} brands shown</div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((row, i) => {
          const brand = String(row["Brand"] || "—");
          const bannerDone = row["Banner Completed?"] === true;
          const klevuDone  = row["Added to Klevu"] === true;
          const dueDate = String(row["Due Date"] || "");
          const metaTitles = row["Meta Titles & Des."];
          return (
            <div key={i} className={`bo-card p-4 hover:border-bo-orange/30 transition-all
              ${bannerDone ? "border-green-500/20" : "border-bo-border"}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="font-semibold text-bo-text text-sm leading-tight">{brand}</div>
                {bannerDone
                  ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  : <XCircle    size={16} className="text-bo-muted flex-shrink-0" />}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-bo-subtle">Banner</span>
                  <span className={bannerDone ? "text-green-400 font-medium" : "text-bo-muted"}>
                    {bannerDone ? "Complete" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-bo-subtle">Klevu</span>
                  <span className={klevuDone ? "text-green-400 font-medium" : "text-bo-muted"}>
                    {klevuDone ? "Added" : "Not yet"}
                  </span>
                </div>
                {typeof metaTitles === "string" && metaTitles && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-bo-subtle">Meta</span>
                    <span className="text-bo-text truncate ml-2 max-w-[100px]">{String(metaTitles)}</span>
                  </div>
                )}
                {dueDate && dueDate !== "null" && (
                  <div className="text-[11px] text-bo-muted mt-1 pt-1.5 border-t border-bo-border/40">
                    Due {formatDate(dueDate)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
