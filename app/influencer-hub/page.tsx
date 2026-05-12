"use client";

import { useState, useMemo } from "react";
import { Users, Search, ExternalLink, Youtube, Instagram } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import rawData from "@/data/influencer_posts.json";
import { truncate } from "@/lib/utils";

type Influencer = Record<string, unknown>;
const data = rawData as Influencer[];

function SocialIcon({ url }: { url: string }) {
  if (url.includes("youtube") || url.includes("youtu.be")) return <Youtube size={12} className="text-red-400" />;
  if (url.includes("instagram") || url.includes("insta")) return <Instagram size={12} className="text-pink-400" />;
  if (url.includes("tiktok")) return <span className="text-[10px] font-bold text-bo-text">TT</span>;
  return <ExternalLink size={12} className="text-bo-subtle" />;
}

function LinkButton({ href, label }: { href: string; label: string }) {
  if (!href || !href.startsWith("http")) return <span className="text-bo-muted text-xs">—</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 text-bo-teal hover:underline text-xs">
      <SocialIcon url={href} /> {label}
    </a>
  );
}

// Parse multiple URLs from a cell value
function parseUrls(val: unknown): string[] {
  if (!val || val === "null") return [];
  const str = String(val);
  return str.split(/[\n,+]/).map(s => s.trim()).filter(s => s.startsWith("http"));
}

export default function InfluencerHub() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("All");

  const channels = useMemo(() => {
    const set = new Set<string>(["All"]);
    data.forEach(r => {
      const ch = String(r["Channels"] || "");
      ch.split("/").forEach(c => { if (c.trim()) set.add(c.trim()); });
    });
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    return data.filter(r => {
      const name = String(r["Influencer"] || "").toLowerCase();
      const handle = String(r["Social Handles"] || "").toLowerCase();
      const q = search.toLowerCase();
      const matchSearch = !q || name.includes(q) || handle.includes(q);
      const ch = String(r["Channels"] || "");
      const matchChannel = channelFilter === "All" || ch.includes(channelFilter);
      return matchSearch && matchChannel;
    });
  }, [search, channelFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Influencer Hub" subtitle={`${data.length} creator partnerships tracked`} icon={Users} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-text">{data.length}</div>
          <div className="text-bo-subtle text-xs">Total Creators</div>
        </div>
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-text">
            {data.filter(r => String(r["Channels"]||"").includes("YouTube")).length}
          </div>
          <div className="text-bo-subtle text-xs">YouTube Partners</div>
        </div>
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-text">
            {data.filter(r => {
              const urls = parseUrls(r["BO Repurposed Video Links"]);
              return urls.length > 0;
            }).length}
          </div>
          <div className="text-bo-subtle text-xs">With BO Reposts</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle" />
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search creators…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bo-input text-sm" value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
          {channels.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((row, i) => {
          const influencer = String(row["Influencer"] || "—");
          const handle = String(row["Social Handles"] || "");
          const channels = String(row["Channels"] || "");
          const products = String(row["Products Shown"] || "");
          const rawContent = String(row["Raw Content Link"] || "");
          const boLinks = parseUrls(row["BO Repurposed Video Links"]);
          const postLinks = parseUrls(row["Social Post Links"]);

          return (
            <div key={i} className="bo-card p-5 hover:border-bo-orange/30 transition-all">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bo-orange to-orange-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {influencer.slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-bo-text">{influencer}</div>
                  {handle && (
                    <div className="text-bo-orange text-xs font-medium">{handle}</div>
                  )}
                  <div className="text-bo-subtle text-xs mt-0.5">{channels}</div>
                </div>
              </div>

              {/* Products */}
              {products && products !== "null" && (
                <div className="mb-3">
                  <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1">Products Shown</div>
                  <div className="text-xs text-bo-text">{truncate(products, 80)}</div>
                </div>
              )}

              {/* Social posts */}
              {postLinks.length > 0 && (
                <div className="mb-3">
                  <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Social Posts</div>
                  <div className="space-y-1">
                    {postLinks.slice(0,3).map((url, j) => (
                      <LinkButton key={j} href={url} label={`View Post ${j+1}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* BO repurposed */}
              {boLinks.length > 0 && (
                <div className="mb-3">
                  <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">BO Repurposed</div>
                  <div className="space-y-1">
                    {boLinks.slice(0,3).map((url, j) => (
                      <LinkButton key={j} href={url} label={`BO Post ${j+1}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Raw content */}
              {rawContent && rawContent !== "null" && (
                <div className="pt-3 border-t border-bo-border/40">
                  <div className="text-[11px] text-bo-muted">Raw: {truncate(rawContent, 40)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
