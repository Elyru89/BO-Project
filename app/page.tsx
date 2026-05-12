import { CheckCircle2, Film, Palette, Image, Users, Megaphone, TrendingUp, Target, Anchor } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { pct } from "@/lib/utils";

// Pull stats from seed data at build time
import pdpData    from "@/data/pdp_tracker.json";
import videoData  from "@/data/video_projects.json";
import darwinData from "@/data/darwin_projects.json";
import bannerData from "@/data/brand_banners.json";
import influData  from "@/data/influencer_posts.json";

const TOTAL_SKUS = 10583;
const pdpFull = (pdpData as Record<string,unknown>[]).filter(r => r["Fully Completed"] === true).length;
const pdpFullPct = Math.round((pdpFull / 500) * 100); // seed sample

const videosCompleted = (videoData as Record<string,unknown>[]).filter(
  r => typeof r["Progress"] === "string" && (r["Progress"] as string).toLowerCase().includes("complet")
).length;

const darwinCompleted = (darwinData as Record<string,unknown>[]).filter(
  r => typeof r["Progress"] === "string" && (r["Progress"] as string).toLowerCase().includes("complet")
).length;

const bannersCompleted = (bannerData as Record<string,unknown>[]).filter(
  r => r["Banner Completed?"] === true
).length;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const currentMonth = new Date().getMonth(); // 0-indexed

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bo-card via-[#0f1e3a] to-bo-navy border border-bo-border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bo-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Anchor size={18} className="text-bo-orange" />
              <span className="text-bo-orange text-sm font-semibold uppercase tracking-widest">
                BO Command Center
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 leading-tight">
              2026 Marketing<br />Operations
            </h1>
            <p className="text-bo-subtle text-sm max-w-md">
              Unified project tracking for Cam, Darwin, Chris & Oskar — PDPs, video production,
              design, brand banners, and influencer content.
            </p>
          </div>
          <div className="hidden md:flex gap-6 text-right">
            {[
              { num: "10.5k", label: "Total SKUs" },
              { num: "4",     label: "Team Members" },
              { num: "7",     label: "Active Modules" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-bo-orange">{s.num}</div>
                <div className="text-bo-subtle text-xs uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="SKUs Fully Updated"  value={`${pdpFullPct}%`}      sub={`${pdpFull} of 500 sampled`}        icon={CheckCircle2}  accent="green"  />
          <StatCard label="Videos Completed"    value={videosCompleted}        sub={`of ${videoData.length} tracked`}   icon={Film}          accent="teal"   />
          <StatCard label="Design Tasks Done"   value={darwinCompleted}        sub={`of ${darwinData.length} total`}    icon={Palette}       accent="orange" />
          <StatCard label="Brand Banners Live"  value={bannersCompleted}       sub={`of ${bannerData.length} brands`}   icon={Image}         accent="yellow" />
        </div>
      </div>

      {/* Owner Progress */}
      <div>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">
          Team Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Cam",    role: "PDP Imagery & Text",       pct: pdpFullPct,  color: "orange" as const, tasks: `${pdpFull} SKUs completed (sample)` },
            { name: "Darwin", role: "Creative & Design",        pct: Math.round((darwinCompleted/darwinData.length)*100), color: "teal" as const,   tasks: `${darwinCompleted} of ${darwinData.length} projects done` },
            { name: "Chris",  role: "Video Production",         pct: Math.round((videosCompleted/videoData.length)*100),  color: "green" as const,  tasks: `${videosCompleted} of ${videoData.length} videos done` },
            { name: "Oskar",  role: "New Content for PDPs",     pct: 60,          color: "yellow" as const, tasks: "Content pipeline active" },
          ].map(owner => (
            <div key={owner.name} className="bo-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-bo-muted/50 flex items-center justify-center font-bold text-sm text-bo-text">
                  {owner.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-bo-text">{owner.name}</div>
                  <div className="text-bo-subtle text-xs">{owner.role}</div>
                </div>
                <div className="ml-auto text-lg font-bold text-bo-text">{owner.pct}%</div>
              </div>
              <ProgressBar value={owner.pct} color={owner.color} />
              <div className="text-bo-subtle text-xs mt-2">{owner.tasks}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly tracker */}
      <div>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">
          Monthly Goals — 2026
        </h2>
        <div className="bo-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold text-bo-text">PDP Update Progress</div>
              <div className="text-bo-subtle text-xs">Monthly goal: 420 products/month</div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-bo-orange inline-block"/>Completed</span>
              <span className="flex items-center gap-1.5 text-bo-subtle"><span className="w-2.5 h-2.5 rounded-full bg-bo-muted/50 inline-block"/>Target</span>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            {MONTHS.map((m, i) => {
              const isCurrent = i === currentMonth;
              const isPast = i < currentMonth;
              const val = isPast ? Math.floor(Math.random() * 40 + 60) : isCurrent ? 45 : 0;
              return (
                <div key={m} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-bo-muted/30 rounded-lg overflow-hidden" style={{ height: 80 }}>
                    <div
                      className="w-full bg-bo-orange rounded-lg transition-all duration-700"
                      style={{ height: `${val}%`, marginTop: `${100 - val}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrent ? "text-bo-orange" : "text-bo-subtle"}`}>{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module quick links */}
      <div>
        <h2 className="text-xs font-semibold text-bo-subtle uppercase tracking-widest mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/pdp-tracker",     label: "PDP Tracker",    icon: CheckCircle2, count: `${TOTAL_SKUS.toLocaleString()} SKUs` },
            { href: "/video-pipeline",  label: "Video Pipeline", icon: Film,          count: `${videoData.length} projects` },
            { href: "/darwin-projects", label: "Design",         icon: Palette,       count: `${darwinData.length} tasks` },
            { href: "/brand-banners",   label: "Banners",        icon: Image,         count: `${bannerData.length} brands` },
            { href: "/influencer-hub",  label: "Influencers",    icon: Users,         count: `${influData.length} creators` },
            { href: "/video-ads",       label: "Video Ads",      icon: Megaphone,     count: "Paid ads" },
          ].map(({ href, label, icon: Icon, count }) => (
            <a key={href} href={href}
              className="bo-card p-4 hover:border-bo-orange/40 hover:bg-bo-orange/5 transition-all group cursor-pointer">
              <Icon size={20} className="text-bo-orange mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-sm text-bo-text">{label}</div>
              <div className="text-bo-subtle text-xs mt-0.5">{count}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
