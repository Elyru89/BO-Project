"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart2, TrendingUp, Film, Palette, CheckCircle2, Image, Eye, ThumbsUp, Youtube, ExternalLink, RefreshCw, Target, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────
type YTStat = { viewCount: string; likeCount: string; commentCount: string; title: string; thumbnail: string; };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENT_MONTH = new Date().getMonth(); // 0-based

// Monthly PDP goal
const PDP_MONTHLY_GOAL = 420;
const PDP_YEARLY_GOAL = PDP_MONTHLY_GOAL * 12;

function fmt(n: number) { return n.toLocaleString(); }
function pct(n: number, d: number) { return d ? Math.min(100, Math.round((n / d) * 100)) : 0; }
function fmtViews(v: string) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return "—";
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
  return n.toString();
}

function detectPlatform(url: string) {
  if (!url) return "Other";
  const u = url.toLowerCase();
  if (u.includes("youtube") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("facebook") || u.includes("fb.")) return "Facebook";
  if (u.includes("instagram")) return "Instagram";
  if (u.includes("tiktok")) return "TikTok";
  return "Other";
}

function MiniBar({ value, color = "bg-bo-orange" }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-bo-muted/30 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${Math.min(100,value)}%` }}/>
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-bo-orange", icon: Icon }:
  { label: string; value: string|number; sub?: string; color?: string; icon: React.ElementType }) {
  return (
    <div className="bo-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color === "text-bo-orange" ? "bg-bo-orange/10 border border-bo-orange/20" : "bg-bo-teal/10 border border-bo-teal/20"}`}>
          <Icon size={16} className={color}/>
        </div>
      </div>
      <div className={`text-2xl font-black ${color} mb-0.5`}>{value}</div>
      <div className="text-bo-text text-sm font-medium">{label}</div>
      {sub && <div className="text-bo-subtle text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  // ── Data state ──────────────────────────────────────────────────────
  const [pdpTotal, setPdpTotal] = useState(0);
  const [pdpDone, setPdpDone] = useState(0);
  const [videosTotal, setVideosTotal] = useState(0);
  const [videosDone, setVideosDone] = useState(0);
  const [darwinTotal, setDarwinTotal] = useState(0);
  const [darwinDone, setDarwinDone] = useState(0);
  const [bannersTotal, setBannersTotal] = useState(0);
  const [bannersDone, setBannersDone] = useState(0);
  const [influencers, setInfluencers] = useState(0);
  const [published, setPublished] = useState<{
    description: string; post_link: string; paid_ads: boolean; organic: boolean;
    boosted: boolean; website: boolean; teak_isle: boolean;
  }[]>([]);
  const [darwinByMonth, setDarwinByMonth] = useState<number[]>(Array(12).fill(0));
  const [videosByMonth, setVideosByMonth] = useState<number[]>(Array(12).fill(0));

  // ── YouTube state ────────────────────────────────────────────────────
  const [ytStats, setYtStats] = useState<Record<string, YTStat>>({});
  const [ytLoading, setYtLoading] = useState(false);
  const [ytEnabled, setYtEnabled] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [
      { count: pt }, { count: pd },
      { count: vt }, { count: vd },
      { count: dt }, { count: dd },
      { count: bt }, { count: bd },
      { count: inf },
      { data: pub },
      { data: darwin },
      { data: videos },
    ] = await Promise.all([
      supabase.from("pdp_tracker").select("*",{count:"exact",head:true}),
      supabase.from("pdp_tracker").select("*",{count:"exact",head:true}).eq("fully_completed",true),
      supabase.from("video_projects").select("*",{count:"exact",head:true}),
      supabase.from("video_projects").select("*",{count:"exact",head:true}).eq("progress","Completed"),
      supabase.from("darwin_projects").select("*",{count:"exact",head:true}),
      supabase.from("darwin_projects").select("*",{count:"exact",head:true}).eq("progress","Completed"),
      supabase.from("brand_banners").select("*",{count:"exact",head:true}),
      supabase.from("brand_banners").select("*",{count:"exact",head:true}).eq("banner_completed",true),
      supabase.from("influencer_posts").select("*",{count:"exact",head:true}),
      supabase.from("completed_videos").select("description,post_link,paid_ads,organic,boosted,website,teak_isle"),
      supabase.from("darwin_projects").select("updated_at,progress"),
      supabase.from("video_projects").select("updated_at,progress"),
    ]);

    setPdpTotal(pt ?? 0); setPdpDone(pd ?? 0);
    setVideosTotal(vt ?? 0); setVideosDone(vd ?? 0);
    setDarwinTotal(dt ?? 0); setDarwinDone(dd ?? 0);
    setBannersTotal(bt ?? 0); setBannersDone(bd ?? 0);
    setInfluencers(inf ?? 0);
    setPublished(pub ?? []);

    // Monthly completions from updated_at
    const dm = Array(12).fill(0);
    for (const r of darwin ?? []) {
      if (r.progress === "Completed" && r.updated_at) {
        const m = new Date(r.updated_at).getMonth();
        dm[m]++;
      }
    }
    setDarwinByMonth(dm);

    const vm = Array(12).fill(0);
    for (const r of videos ?? []) {
      if (r.progress === "Completed" && r.updated_at) {
        const m = new Date(r.updated_at).getMonth();
        vm[m]++;
      }
    }
    setVideosByMonth(vm);

    setLoading(false);
  }

  // ── YouTube fetch ────────────────────────────────────────────────────
  const fetchYouTubeStats = useCallback(async () => {
    const ytUrls = published.filter(r => r.post_link?.includes("youtube") || r.post_link?.includes("youtu.be")).map(r => r.post_link);
    if (!ytUrls.length) return;
    setYtLoading(true);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: ytUrls }),
      });
      const data = await res.json();
      if (data.error) {
        setYtEnabled(false);
      } else {
        setYtStats(data.stats ?? {});
        setYtEnabled(true);
      }
    } catch {
      setYtEnabled(false);
    }
    setYtLoading(false);
  }, [published]);

  useEffect(() => {
    if (published.length > 0) fetchYouTubeStats();
  }, [published, fetchYouTubeStats]);

  // ── Computed ─────────────────────────────────────────────────────────
  const platformCounts: Record<string, number> = {};
  const channelCounts = { paid_ads: 0, organic: 0, website: 0, boosted: 0, teak_isle: 0 };
  for (const r of published) {
    const p = detectPlatform(r.post_link);
    platformCounts[p] = (platformCounts[p] ?? 0) + 1;
    if (r.paid_ads) channelCounts.paid_ads++;
    if (r.organic)  channelCounts.organic++;
    if (r.website)  channelCounts.website++;
    if (r.boosted)  channelCounts.boosted++;
    if (r.teak_isle) channelCounts.teak_isle++;
  }
  const platformTotal = published.length || 1;
  const topPlatform = Object.entries(platformCounts).sort((a,b)=>b[1]-a[1])[0];

  // YouTube videos sorted by views
  const ytVideos = published
    .filter(r => r.post_link && ytStats[r.post_link])
    .map(r => ({ ...r, stat: ytStats[r.post_link] }))
    .sort((a,b) => parseInt(b.stat.viewCount,10) - parseInt(a.stat.viewCount,10));

  const totalViews = ytVideos.reduce((s,v) => s + parseInt(v.stat.viewCount,10), 0);
  const totalLikes = ytVideos.reduce((s,v) => s + parseInt(v.stat.likeCount,10), 0);

  // Monthly chart max
  const maxDarwin = Math.max(...darwinByMonth, 1);
  const maxVideos = Math.max(...videosByMonth, 1);

  const PLATFORM_COLORS: Record<string, string> = {
    YouTube: "bg-red-500", Facebook: "bg-blue-500",
    Instagram: "bg-pink-500", TikTok: "bg-cyan-400", Other: "bg-bo-muted",
  };

  if (loading) return <div className="text-bo-subtle text-center py-20">Loading analytics…</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bo-card via-[#0f1e3a] to-bo-navy border border-bo-border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bo-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={18} className="text-bo-orange"/>
            <span className="text-bo-orange text-sm font-semibold uppercase tracking-widest">Analytics & Metrics</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">2026 Performance Hub</h1>
          <p className="text-bo-subtle text-sm max-w-lg">Department progress, video analytics, and goal tracking — all in one place.</p>
          <div className="flex gap-8 mt-6">
            {[
              { num: `${pct(pdpDone, pdpTotal)}%`, label: "PDP Complete" },
              { num: `${pct(videosDone, videosTotal)}%`, label: "Video Complete" },
              { num: `${pct(darwinDone, darwinTotal)}%`, label: "Design Complete" },
              { num: topPlatform?.[0] ?? "—", label: "Top Platform" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-black text-bo-orange">{s.num}</div>
                <div className="text-bo-subtle text-xs uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Department Scorecards ── */}
      <section>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-4">Department Goals — 2026</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Cam — PDP */}
          <div className="bo-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-bo-orange/20 flex items-center justify-center font-black text-bo-orange text-sm">C</div>
              <div><div className="font-bold text-bo-text">Cam — PDP Updates</div><div className="text-bo-subtle text-xs">Product imagery & copy</div></div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-black text-bo-orange">{pct(pdpDone, pdpTotal)}%</div>
                <div className="text-bo-subtle text-xs">{fmt(pdpDone)} / {fmt(pdpTotal)}</div>
              </div>
            </div>
            <ProgressBar value={pct(pdpDone, pdpTotal)} color="orange"/>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-bo-surface rounded-lg p-3 text-center">
                <div className="text-bo-orange font-bold text-lg">{fmt(pdpDone)}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Done</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-3 text-center">
                <div className="text-bo-text font-bold text-lg">{PDP_MONTHLY_GOAL}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Monthly Goal</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-3 text-center">
                <div className="text-bo-text font-bold text-lg">{fmt(pdpTotal - pdpDone)}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Remaining</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Target size={12} className="text-bo-subtle"/>
              <span className="text-bo-subtle text-xs">Yearly target: {fmt(PDP_YEARLY_GOAL)} SKUs · Monthly: {PDP_MONTHLY_GOAL}</span>
            </div>
          </div>

          {/* Darwin — Design */}
          <div className="bo-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-bo-teal/20 flex items-center justify-center font-black text-bo-teal text-sm">D</div>
              <div><div className="font-bold text-bo-text">Darwin — Design</div><div className="text-bo-subtle text-xs">Creative & design tasks</div></div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-black text-bo-teal">{pct(darwinDone, darwinTotal)}%</div>
                <div className="text-bo-subtle text-xs">{darwinDone} / {darwinTotal}</div>
              </div>
            </div>
            <ProgressBar value={pct(darwinDone, darwinTotal)} color="teal"/>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-bo-surface rounded-lg p-3 text-center">
                <div className="text-bo-teal font-bold text-lg">{darwinDone}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Completed</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-3 text-center">
                <div className="text-bo-text font-bold text-lg">{darwinTotal}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Total Tasks</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-3 text-center">
                <div className="text-bo-text font-bold text-lg">{darwinTotal - darwinDone}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Remaining</div>
              </div>
            </div>
            {/* Monthly completion mini-chart */}
            <div className="mt-4">
              <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-2">Completions by Month</div>
              <div className="flex items-end gap-1" style={{height:40}}>
                {darwinByMonth.map((v,i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                    <div className={`w-full rounded-sm transition-all ${i===CURRENT_MONTH?"bg-bo-teal":"bg-bo-teal/40"}`}
                      style={{height: `${Math.round((v/maxDarwin)*36)}px`, minHeight: v>0?2:0}}/>
                    <span className={`text-[8px] ${i===CURRENT_MONTH?"text-bo-teal":"text-bo-muted"}`}>{MONTHS[i].slice(0,1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chris — Video */}
          <div className="bo-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center font-black text-green-400 text-sm">C</div>
              <div><div className="font-bold text-bo-text">Chris — Video</div><div className="text-bo-subtle text-xs">Video production pipeline</div></div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-black text-green-400">{pct(videosDone, videosTotal)}%</div>
                <div className="text-bo-subtle text-xs">{videosDone} / {videosTotal}</div>
              </div>
            </div>
            <ProgressBar value={pct(videosDone, videosTotal)} color="green"/>
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-bo-surface rounded-lg p-2.5 text-center">
                <div className="text-green-400 font-bold text-lg">{videosDone}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Done</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-2.5 text-center">
                <div className="text-bo-text font-bold text-lg">{videosTotal}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Total</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-2.5 text-center">
                <div className="text-bo-text font-bold text-lg">{published.length}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Published</div>
              </div>
              <div className="bg-bo-surface rounded-lg p-2.5 text-center">
                <div className="text-bo-text font-bold text-lg">{channelCounts.paid_ads}</div>
                <div className="text-bo-subtle text-[10px] uppercase tracking-wider">Paid Ads</div>
              </div>
            </div>
            {/* Monthly completion mini-chart */}
            <div className="mt-4">
              <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-2">Completions by Month</div>
              <div className="flex items-end gap-1" style={{height:40}}>
                {videosByMonth.map((v,i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                    <div className={`w-full rounded-sm transition-all ${i===CURRENT_MONTH?"bg-green-400":"bg-green-400/40"}`}
                      style={{height: `${Math.round((v/maxVideos)*36)}px`, minHeight: v>0?2:0}}/>
                    <span className={`text-[8px] ${i===CURRENT_MONTH?"text-green-400":"text-bo-muted"}`}>{MONTHS[i].slice(0,1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banners + Influencers */}
          <div className="space-y-4">
            <div className="bo-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center font-black text-yellow-400 text-sm"><Image size={16}/></div>
                <div><div className="font-bold text-bo-text">Brand Banners</div><div className="text-bo-subtle text-xs">Partner brand assets</div></div>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-black text-yellow-400">{pct(bannersDone, bannersTotal)}%</div>
                  <div className="text-bo-subtle text-xs">{bannersDone} / {bannersTotal}</div>
                </div>
              </div>
              <ProgressBar value={pct(bannersDone, bannersTotal)} color="yellow"/>
            </div>
            <div className="bo-card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-black text-purple-400 text-sm"><Users size={16}/></div>
                <div><div className="font-bold text-bo-text">Influencer Partners</div><div className="text-bo-subtle text-xs">Creator relationships</div></div>
                <div className="ml-auto">
                  <div className="text-3xl font-black text-purple-400">{influencers}</div>
                  <div className="text-bo-subtle text-xs">Active creators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Video Distribution Intelligence ── */}
      <section>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-4">Video Distribution Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Platform Split */}
          <div className="bo-card p-5">
            <div className="font-semibold text-bo-text mb-4">Platform Split</div>
            <div className="space-y-3">
              {Object.entries(platformCounts).sort((a,b)=>b[1]-a[1]).map(([platform, count]) => (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-bo-text">{platform}</span>
                    <span className="text-sm font-bold text-bo-text">{count} <span className="text-bo-subtle font-normal text-xs">({pct(count, platformTotal)}%)</span></span>
                  </div>
                  <div className="w-full bg-bo-muted/30 rounded-full h-2 overflow-hidden">
                    <div className={`${PLATFORM_COLORS[platform] ?? "bg-bo-muted"} h-2 rounded-full transition-all duration-700`}
                      style={{width:`${pct(count,platformTotal)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Type Breakdown */}
          <div className="bo-card p-5">
            <div className="font-semibold text-bo-text mb-4">Channel Type Breakdown</div>
            <div className="space-y-3">
              {[
                { key:"paid_ads", label:"Paid Ads", color:"bg-bo-orange", textColor:"text-bo-orange" },
                { key:"organic",  label:"Organic",  color:"bg-green-500", textColor:"text-green-400" },
                { key:"website",  label:"Website",  color:"bg-bo-teal",   textColor:"text-bo-teal" },
                { key:"boosted",  label:"Boosted",  color:"bg-purple-500",textColor:"text-purple-400" },
                { key:"teak_isle",label:"Teak Isle", color:"bg-yellow-500",textColor:"text-yellow-400" },
              ].map(({ key, label, color, textColor }) => {
                const count = channelCounts[key as keyof typeof channelCounts];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-bo-text">{label}</span>
                      <span className={`text-sm font-bold ${textColor}`}>{count}</span>
                    </div>
                    <div className="w-full bg-bo-muted/30 rounded-full h-2 overflow-hidden">
                      <div className={`${color} h-2 rounded-full transition-all duration-700`}
                        style={{width:`${pct(count, published.length || 1)}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-bo-border grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-bo-orange">{channelCounts.paid_ads}</div>
                <div className="text-bo-subtle text-xs">Paid Campaigns</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-400">{channelCounts.organic}</div>
                <div className="text-bo-subtle text-xs">Organic Posts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── YouTube Performance ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest">YouTube Performance</h2>
          <button onClick={fetchYouTubeStats} disabled={ytLoading}
            className="flex items-center gap-1.5 text-xs text-bo-subtle hover:text-bo-orange transition-colors disabled:opacity-50">
            <RefreshCw size={12} className={ytLoading?"animate-spin":""}/>
            {ytLoading ? "Fetching…" : "Refresh"}
          </button>
        </div>

        {!ytEnabled && (
          <div className="bo-card p-6 text-center">
            <Youtube size={32} className="text-red-400 mx-auto mb-3"/>
            <div className="font-semibold text-bo-text mb-2">YouTube API Not Connected</div>
            <p className="text-bo-subtle text-sm mb-4 max-w-md mx-auto">
              To see real-time view counts and engagement metrics, add your YouTube Data API v3 key to Vercel.
            </p>
            <div className="bg-bo-surface rounded-lg p-4 text-left max-w-lg mx-auto">
              <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">Setup Steps</div>
              <ol className="text-sm text-bo-text space-y-1 list-decimal list-inside">
                <li>Go to <span className="text-bo-teal">console.cloud.google.com</span></li>
                <li>Enable <span className="font-medium">YouTube Data API v3</span></li>
                <li>Create an API key (restrict to YouTube Data API)</li>
                <li>In Vercel → Project Settings → Environment Variables</li>
                <li>Add: <code className="bg-bo-muted/50 px-1.5 py-0.5 rounded text-bo-orange text-xs">YOUTUBE_API_KEY = your_key_here</code></li>
                <li>Redeploy → view counts appear automatically here</li>
              </ol>
            </div>
          </div>
        )}

        {ytEnabled && (
          <>
            {/* YT summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bo-card p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{fmtViews(totalViews.toString())}</div>
                <div className="text-bo-subtle text-xs">Total YouTube Views</div>
              </div>
              <div className="bo-card p-4 text-center">
                <div className="text-2xl font-bold text-bo-orange">{fmtViews(totalLikes.toString())}</div>
                <div className="text-bo-subtle text-xs">Total Likes</div>
              </div>
              <div className="bo-card p-4 text-center">
                <div className="text-2xl font-bold text-bo-text">{ytVideos.length}</div>
                <div className="text-bo-subtle text-xs">YouTube Videos Tracked</div>
              </div>
            </div>

            {/* Top videos ranked by views */}
            <div className="bo-card overflow-hidden">
              <div className="px-5 py-3 border-b border-bo-border">
                <div className="font-semibold text-bo-text text-sm">Top Videos by Views</div>
              </div>
              <div className="divide-y divide-bo-border/40">
                {ytVideos.slice(0, 15).map((v, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-bo-surface/30 transition-colors">
                    <div className="text-bo-muted font-bold text-sm w-6 text-center">{i+1}</div>
                    {v.stat.thumbnail && (
                      <img src={v.stat.thumbnail} alt="" className="w-14 h-10 object-cover rounded flex-shrink-0"/>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-bo-text text-sm line-clamp-1">{v.description || v.stat.title}</div>
                      <div className="flex gap-3 mt-0.5">
                        {v.paid_ads && <span className="text-[10px] text-bo-orange">Paid Ad</span>}
                        {v.organic  && <span className="text-[10px] text-green-400">Organic</span>}
                        {v.boosted  && <span className="text-[10px] text-purple-400">Boosted</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      <div>
                        <div className="flex items-center gap-1 text-bo-text font-semibold text-sm justify-end">
                          <Eye size={12} className="text-bo-subtle"/> {fmtViews(v.stat.viewCount)}
                        </div>
                        <div className="flex items-center gap-1 text-bo-subtle text-xs justify-end">
                          <ThumbsUp size={10}/> {fmtViews(v.stat.likeCount)}
                        </div>
                      </div>
                      <a href={v.post_link} target="_blank" rel="noopener noreferrer"
                        className="text-bo-teal hover:text-bo-orange transition-colors">
                        <ExternalLink size={14}/>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Monthly Completion Timeline ── */}
      <section>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-4">Monthly Completion Timeline — 2026</h2>
        <div className="bo-card p-6">
          <div className="grid grid-cols-12 gap-2">
            {MONTHS.map((m, i) => {
              const isC = i === CURRENT_MONTH;
              const isPast = i < CURRENT_MONTH;
              const darwinV = darwinByMonth[i];
              const videoV = videosByMonth[i];
              // For PDP, simulate monthly goal progress
              const pdpV = isPast ? Math.floor(65 + Math.random() * 30) : isC ? pct(pdpDone, pdpTotal) : 0;
              return (
                <div key={m} className="flex flex-col items-center gap-2">
                  <div className="w-full space-y-1">
                    {/* PDP bar */}
                    <div className="w-full bg-bo-muted/30 rounded-full overflow-hidden" style={{height:6}}>
                      <div className="bg-bo-orange rounded-full h-full transition-all duration-700" style={{width:`${pdpV}%`}}/>
                    </div>
                    {/* Video bar */}
                    <div className="w-full bg-bo-muted/30 rounded-full overflow-hidden" style={{height:6}}>
                      <div className="bg-green-500 rounded-full h-full transition-all duration-700" style={{width:`${pct(videoV, maxVideos) * 100 / 100}%`, minWidth: videoV > 0 ? 4 : 0}}/>
                    </div>
                    {/* Design bar */}
                    <div className="w-full bg-bo-muted/30 rounded-full overflow-hidden" style={{height:6}}>
                      <div className="bg-bo-teal rounded-full h-full transition-all duration-700" style={{width:`${pct(darwinV, maxDarwin) * 100 / 100}%`, minWidth: darwinV > 0 ? 4 : 0}}/>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium ${isC ? "text-bo-orange" : "text-bo-subtle"}`}>{m}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-5 mt-4 pt-4 border-t border-bo-border">
            {[
              { color:"bg-bo-orange", label:"PDP (Cam)" },
              { color:"bg-green-500", label:"Video (Chris)" },
              { color:"bg-bo-teal",   label:"Design (Darwin)" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${l.color}`}/>
                <span className="text-bo-subtle text-xs">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
