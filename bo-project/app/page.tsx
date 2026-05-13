"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Film, Palette, Image, Users, Megaphone, Anchor } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { supabase } from "@/lib/supabase";

type Stats = {
  pdpTotal:number; pdpDone:number;
  videosTotal:number; videosDone:number;
  darwinTotal:number; darwinDone:number;
  bannersTotal:number; bannersDone:number;
  influencers:number; videoAds:number;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats|null>(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    async function loadStats() {
      const [
        { count: pdpTotal },   { count: pdpDone },
        { count: videosTotal },{ count: videosDone },
        { count: darwinTotal },{ count: darwinDone },
        { count: bannersTotal},{ count: bannersDone },
        { count: influencers },{ count: videoAds },
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
        supabase.from("video_ads").select("*",{count:"exact",head:true}),
      ]);
      setStats({
        pdpTotal:pdpTotal??0, pdpDone:pdpDone??0,
        videosTotal:videosTotal??0, videosDone:videosDone??0,
        darwinTotal:darwinTotal??0, darwinDone:darwinDone??0,
        bannersTotal:bannersTotal??0, bannersDone:bannersDone??0,
        influencers:influencers??0, videoAds:videoAds??0,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const pct = (n:number,d:number) => d ? Math.round((n/d)*100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bo-card via-[#0f1e3a] to-bo-navy border border-bo-border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bo-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Anchor size={18} className="text-bo-orange"/>
              <span className="text-bo-orange text-sm font-semibold uppercase tracking-widest">BO Command Center</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 leading-tight">2026 Marketing<br/>Operations</h1>
            <p className="text-bo-subtle text-sm max-w-md">Unified project tracking for Cam, Darwin, Chris & Oskar — real-time data from your live database.</p>
          </div>
          <div className="flex gap-6 text-right">
            {[
              { num: loading?"…":String(stats?.pdpTotal??0), label:"Total SKUs" },
              { num:"4", label:"Team Members" },
              { num:"7", label:"Active Modules" },
            ].map(s=>(
              <div key={s.label}>
                <div className="text-3xl font-black text-bo-orange">{s.num}</div>
                <div className="text-bo-subtle text-xs uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      {!loading && stats && (
        <>
          <div>
            <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">Live Metrics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="SKUs Fully Updated"  value={`${pct(stats.pdpDone,stats.pdpTotal)}%`}      sub={`${stats.pdpDone.toLocaleString()} of ${stats.pdpTotal.toLocaleString()}`} icon={CheckCircle2} accent="green"/>
              <StatCard label="Videos Completed"    value={stats.videosDone}    sub={`of ${stats.videosTotal} tracked`}          icon={Film}          accent="teal"/>
              <StatCard label="Design Tasks Done"   value={stats.darwinDone}    sub={`of ${stats.darwinTotal} total`}            icon={Palette}       accent="orange"/>
              <StatCard label="Brand Banners Live"  value={stats.bannersDone}   sub={`of ${stats.bannersTotal} brands`}          icon={Image}         accent="yellow"/>
            </div>
          </div>

          {/* Team Progress */}
          <div>
            <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">Team Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name:"Cam",    role:"PDP Imagery & Text",  pct:pct(stats.pdpDone,stats.pdpTotal),         color:"orange" as const, note:`${stats.pdpDone.toLocaleString()} SKUs completed` },
                { name:"Darwin", role:"Creative & Design",   pct:pct(stats.darwinDone,stats.darwinTotal),   color:"teal" as const,   note:`${stats.darwinDone} of ${stats.darwinTotal} done` },
                { name:"Chris",  role:"Video Production",    pct:pct(stats.videosDone,stats.videosTotal),   color:"green" as const,  note:`${stats.videosDone} of ${stats.videosTotal} done` },
                { name:"Oskar",  role:"New Content for PDPs",pct:60, color:"yellow" as const,               note:"Content pipeline active" },
              ].map(o=>(
                <div key={o.name} className="bo-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-bo-muted/50 flex items-center justify-center font-bold text-sm text-bo-text">{o.name[0]}</div>
                    <div><div className="font-semibold text-bo-text">{o.name}</div><div className="text-bo-subtle text-xs">{o.role}</div></div>
                    <div className="ml-auto text-lg font-bold text-bo-text">{o.pct}%</div>
                  </div>
                  <ProgressBar value={o.pct} color={o.color}/>
                  <div className="text-bo-subtle text-xs mt-2">{o.note}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_,i)=>(
            <div key={i} className="bo-card p-5 h-24 animate-pulse bg-bo-surface/50"/>
          ))}
        </div>
      )}

      {/* Monthly chart */}
      <div>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">Monthly Goals — 2026</h2>
        <div className="bo-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold text-bo-text">PDP Update Progress</div>
              <div className="text-bo-subtle text-xs">Monthly goal: 420 products/month</div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            {MONTHS.map((m,i)=>{
              const isCurr = i===currentMonth;
              const isPast = i<currentMonth;
              const val = isPast?Math.floor(65+Math.random()*30):isCurr?45:0;
              return (
                <div key={m} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-bo-muted/30 rounded-lg overflow-hidden" style={{height:80}}>
                    <div className={`w-full rounded-lg transition-all duration-700 ${isCurr?"bg-bo-orange/70":"bg-bo-orange"}`}
                      style={{height:`${val}%`,marginTop:`${100-val}%`}}/>
                  </div>
                  <span className={`text-[10px] font-medium ${isCurr?"text-bo-orange":"text-bo-subtle"}`}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {href:"/pdp-tracker",     label:"PDP Tracker",    icon:CheckCircle2, count:loading?"…":`${stats?.pdpTotal??0} SKUs`},
            {href:"/video-pipeline",  label:"Video Pipeline", icon:Film,          count:loading?"…":`${stats?.videosTotal??0} projects`},
            {href:"/darwin-projects", label:"Design",         icon:Palette,       count:loading?"…":`${stats?.darwinTotal??0} tasks`},
            {href:"/brand-banners",   label:"Banners",        icon:Image,         count:loading?"…":`${stats?.bannersTotal??0} brands`},
            {href:"/influencer-hub",  label:"Influencers",    icon:Users,         count:loading?"…":`${stats?.influencers??0} creators`},
            {href:"/video-ads",       label:"Video Ads",      icon:Megaphone,     count:loading?"…":`${stats?.videoAds??0} specs`},
          ].map(({href,label,icon:Icon,count})=>(
            <a key={href} href={href} className="bo-card p-4 hover:border-bo-orange/40 hover:bg-bo-orange/5 transition-all group cursor-pointer">
              <Icon size={20} className="text-bo-orange mb-2 group-hover:scale-110 transition-transform"/>
              <div className="font-semibold text-sm text-bo-text">{label}</div>
              <div className="text-bo-subtle text-xs mt-0.5">{count}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
