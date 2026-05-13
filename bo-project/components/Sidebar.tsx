"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Table2, Film, Palette, Image,
  Users, Megaphone, BarChart2, ChevronRight, Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",                  label: "Dashboard",      icon: LayoutDashboard, tag: null },
  { href: "/analytics",         label: "Analytics",      icon: BarChart2,       tag: null },
  { href: "/pdp-tracker",       label: "PDP Tracker",    icon: Table2,          tag: "10.5k SKUs" },
  { href: "/video-pipeline",    label: "Video Pipeline", icon: Film,            tag: null },
  { href: "/darwin-projects",   label: "Design Projects",icon: Palette,         tag: null },
  { href: "/brand-banners",     label: "Brand Banners",  icon: Image,           tag: null },
  { href: "/influencer-hub",    label: "Influencer Hub", icon: Users,           tag: null },
  { href: "/video-ads",         label: "Video Ads",      icon: Megaphone,       tag: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col px-4 py-5 border-b border-bo-border">
        <img src="/bo-logo-white.svg" alt="Boat Outfitters" className="h-6 w-auto mb-1" />
        <div className="text-bo-subtle text-[10px] uppercase tracking-widest">Command Center</div>
      </div>

      {/* Links */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, tag }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                active
                  ? "bg-bo-orange/15 text-bo-orange border border-bo-orange/30"
                  : "text-bo-subtle hover:text-bo-text hover:bg-bo-surface border border-transparent"
              )}
            >
              <Icon size={17} className={active ? "text-bo-orange" : "text-current"} />
              <span className="text-sm font-medium flex-1">{label}</span>
              {tag && (
                <span className="text-[10px] font-semibold bg-bo-muted/50 text-bo-subtle px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              )}
              {active && <ChevronRight size={14} className="text-bo-orange opacity-70" />}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-bo-border">
        <div className="text-[11px] text-bo-muted text-center">2026 Marketing Operations</div>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col bg-bo-surface border-r border-bo-border h-screen sticky top-0">
        {nav}
      </aside>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-bo-card border border-bo-border rounded-lg p-2 text-bo-text"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-bo-surface border-r border-bo-border">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
