"use client";
import { useState, useEffect, useMemo } from "react";
import { Zap, Plus, BarChart2, TrendingUp, Play, RotateCcw, Edit2, Trash2, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";

type Ad = {
  id: string;
  asset_name: string;
  description: string;
  original_use: string;
  hook_type: string;
  creative_style: string;
  angle: string;
  products_highlighted: string;
  ad_in_rotation: boolean;
  channels_yt: boolean;
  channels_fb: boolean;
  channels_insta: boolean;
  channels_tiktok: boolean;
  ctr_prospecting: number | null;
  notes: string;
};

const HOOK_TYPES = [
  "Problem/Solution",
  "Product Demo",
  "Authority/Expert Walkthrough",
  "Social Proof/Customer Project",
  "Relatable Boater Pain Point",
  "Unexpected Use/Lifestyle",
  "Before/After",
  "Unpopular Opinion",
];

const CREATIVE_STYLES = [
  "Product in Use Demo",
  "Voiceover B-Roll",
  "Fast-Cut Showcase",
  "Text Overlay Video",
  "UGC/Testimonial",
  "Installation/Process",
  "Talking Head",
  "Shop Walkthrough",
  "Static Image/Slideshow",
  "Customer Project Feature",
];

const BLANK: Omit<Ad, "id"> = {
  asset_name: "", description: "", original_use: "", hook_type: "",
  creative_style: "", angle: "", products_highlighted: "", ad_in_rotation: false,
  channels_yt: false, channels_fb: false, channels_insta: false, channels_tiktok: false,
  ctr_prospecting: null, notes: "",
};

const HOOK_COLORS: Record<string, string> = {
  "Problem/Solution": "bg-orange-500",
  "Product Demo": "bg-blue-500",
  "Authority/Expert Walkthrough": "bg-purple-500",
  "Social Proof/Customer Project": "bg-green-500",
  "Relatable Boater Pain Point": "bg-yellow-500",
  "Unexpected Use/Lifestyle": "bg-teal-500",
  "Before/After": "bg-pink-500",
  "Unpopular Opinion": "bg-red-500",
};

const STYLE_COLORS: Record<string, string> = {
  "Product in Use Demo": "bg-blue-500",
  "Voiceover B-Roll": "bg-purple-500",
  "Fast-Cut Showcase": "bg-orange-500",
  "Text Overlay Video": "bg-teal-500",
  "UGC/Testimonial": "bg-green-500",
  "Installation/Process": "bg-yellow-500",
  "Talking Head": "bg-pink-500",
  "Shop Walkthrough": "bg-red-500",
};

function pct(v: number | null) {
  if (v === null || v === undefined) return "—";
  return (v * 100).toFixed(2) + "%";
}

function CtrBar({ ctr, max }: { ctr: number; max: number }) {
  const w = max > 0 ? Math.round((ctr / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-bo-muted/30 rounded-full overflow-hidden">
        <div className="h-full bg-bo-orange rounded-full transition-all" style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs font-mono text-bo-orange w-12 text-right">{(ctr * 100).toFixed(2)}%</span>
    </div>
  );
}

function ChannelTag({ label, active }: { label: string; active: boolean }) {
  return active ? (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bo-orange/15 text-bo-orange border border-bo-orange/30">
      {label}
    </span>
  ) : null;
}

export default function AdIntelligence() {
  const [data, setData] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterHook, setFilterHook] = useState("all");
  const [filterStyle, setFilterStyle] = useState("all");
  const [filterRotation, setFilterRotation] = useState<"all" | "active" | "inactive">("all");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Ad | null>(null);
  const [form, setForm] = useState<Omit<Ad, "id">>(BLANK);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("creative_ad_library")
      .select("*")
      .order("ctr_prospecting", { ascending: false, nullsFirst: false });
    setData(rows ?? []);
    setLoading(false);
  }

  async function save() {
    if (!form.asset_name.trim()) return;
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (modal === "create") {
      await supabase.from("creative_ad_library").insert(payload);
    } else if (modal === "edit" && selected) {
      await supabase.from("creative_ad_library").update(payload).eq("id", selected.id);
    }
    setSaving(false);
    setModal(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this ad?")) return;
    await supabase.from("creative_ad_library").delete().eq("id", id);
    load();
  }

  async function toggleRotation(id: string, cur: boolean) {
    await supabase.from("creative_ad_library")
      .update({ ad_in_rotation: !cur, updated_at: new Date().toISOString() })
      .eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, ad_in_rotation: !cur } : r));
  }

  function openEdit(r: Ad) {
    setSelected(r);
    setForm({
      asset_name: r.asset_name, description: r.description || "",
      original_use: r.original_use || "", hook_type: r.hook_type || "",
      creative_style: r.creative_style || "", angle: r.angle || "",
      products_highlighted: r.products_highlighted || "",
      ad_in_rotation: r.ad_in_rotation,
      channels_yt: r.channels_yt, channels_fb: r.channels_fb,
      channels_insta: r.channels_insta, channels_tiktok: r.channels_tiktok,
      ctr_prospecting: r.ctr_prospecting, notes: r.notes || "",
    });
    setModal("edit");
  }

  // ── Analytics ────────────────────────────────────────────────────────────────
  const hookStats = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of data) {
      const h = r.hook_type || "Unknown";
      if (!map[h]) map[h] = [];
      if (r.ctr_prospecting !== null) map[h].push(r.ctr_prospecting);
    }
    return Object.entries(map)
      .map(([h, ctrs]) => ({
        hook: h,
        avg: ctrs.length ? ctrs.reduce((a, b) => a + b, 0) / ctrs.length : 0,
        count: data.filter(r => r.hook_type === h).length,
        withCtr: ctrs.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [data]);

  const styleStats = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const r of data) {
      const s = r.creative_style || "Unknown";
      if (!map[s]) map[s] = [];
      if (r.ctr_prospecting !== null) map[s].push(r.ctr_prospecting);
    }
    return Object.entries(map)
      .map(([s, ctrs]) => ({
        style: s,
        avg: ctrs.length ? ctrs.reduce((a, b) => a + b, 0) / ctrs.length : 0,
        count: data.filter(r => r.creative_style === s).length,
        withCtr: ctrs.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [data]);

  const maxHookCtr = Math.max(...hookStats.map(h => h.avg), 0.001);
  const maxStyleCtr = Math.max(...styleStats.map(s => s.avg), 0.001);

  const filtered = useMemo(() => data.filter(r => {
    const matchH = filterHook === "all" || r.hook_type === filterHook;
    const matchS = filterStyle === "all" || r.creative_style === filterStyle;
    const matchR = filterRotation === "all"
      ? true
      : filterRotation === "active" ? r.ad_in_rotation : !r.ad_in_rotation;
    return matchH && matchS && matchR;
  }), [data, filterHook, filterStyle, filterRotation]);

  const inRotation = data.filter(r => r.ad_in_rotation).length;
  const withCtr = data.filter(r => r.ctr_prospecting !== null).length;
  const avgCtr = withCtr > 0
    ? data.filter(r => r.ctr_prospecting !== null).reduce((a, r) => a + (r.ctr_prospecting ?? 0), 0) / withCtr
    : 0;
  const topAd = data.find(r => r.ctr_prospecting === Math.max(...data.map(r => r.ctr_prospecting ?? 0)));

  const fld = (k: keyof typeof BLANK) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad Intelligence"
        subtitle={`${data.length} ads · CTR analysis by hook type & creative style`}
        icon={Zap}
      >
        <button
          onClick={() => { setForm(BLANK); setModal("create"); }}
          className="bo-btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={14} /> Add Ad
        </button>
      </PageHeader>

      {/* ── Overview stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-text">{data.length}</div>
          <div className="text-bo-subtle text-xs mt-0.5">Ads in Library</div>
        </div>
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{inRotation}</div>
          <div className="text-bo-subtle text-xs mt-0.5">Currently Running</div>
        </div>
        <div className="bo-card p-4 text-center">
          <div className="text-2xl font-bold text-bo-orange">{pct(avgCtr)}</div>
          <div className="text-bo-subtle text-xs mt-0.5">Avg Prospecting CTR</div>
        </div>
        <div className="bo-card p-4">
          <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-1">Top Hook Type</div>
          <div className="text-sm font-semibold text-bo-text leading-tight">
            {hookStats[0]?.hook || "—"}
          </div>
          <div className="text-bo-orange text-xs font-mono mt-0.5">
            {pct(hookStats[0]?.avg ?? null)} avg CTR
          </div>
        </div>
      </div>

      {/* ── CTR Analysis ───────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Hook Type Rankings */}
        <div className="bo-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-bo-orange" />
            <h3 className="font-semibold text-bo-text text-sm">Hook Type Performance</h3>
            <span className="text-[10px] text-bo-subtle ml-auto">by avg prospecting CTR</span>
          </div>
          <div className="space-y-3">
            {hookStats.map((h, i) => (
              <div key={h.hook}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-bo-muted w-4">{i + 1}</span>
                    <span className="text-xs text-bo-text font-medium">{h.hook}</span>
                  </div>
                  <span className="text-[10px] text-bo-subtle">{h.count} ads{h.withCtr > 0 ? ` · ${h.withCtr} w/ CTR` : ""}</span>
                </div>
                {h.withCtr > 0 ? (
                  <CtrBar ctr={h.avg} max={maxHookCtr} />
                ) : (
                  <div className="text-[10px] text-bo-muted italic pl-6">No CTR data yet</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-bo-border/40">
            <p className="text-[11px] text-bo-subtle leading-relaxed">
              <span className="text-bo-orange font-semibold">Tip:</span> Unexpected Use/Lifestyle and Problem/Solution consistently outperform Authority-style hooks. Lead with the problem or a surprising use case.
            </p>
          </div>
        </div>

        {/* Creative Style Rankings */}
        <div className="bo-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-bo-teal" />
            <h3 className="font-semibold text-bo-text text-sm">Creative Style Performance</h3>
            <span className="text-[10px] text-bo-subtle ml-auto">by avg prospecting CTR</span>
          </div>
          <div className="space-y-3">
            {styleStats.map((s, i) => (
              <div key={s.style}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-bo-muted w-4">{i + 1}</span>
                    <span className="text-xs text-bo-text font-medium">{s.style}</span>
                  </div>
                  <span className="text-[10px] text-bo-subtle">{s.count} ads{s.withCtr > 0 ? ` · ${s.withCtr} w/ CTR` : ""}</span>
                </div>
                {s.withCtr > 0 ? (
                  <CtrBar ctr={s.avg} max={maxStyleCtr} />
                ) : (
                  <div className="text-[10px] text-bo-muted italic pl-6">No CTR data yet</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-bo-border/40">
            <p className="text-[11px] text-bo-subtle leading-relaxed">
              <span className="text-bo-teal font-semibold">Tip:</span> Text Overlay and Product-in-Use Demo styles outperform UGC/Testimonial for prospecting. Fast-Cut Showcase works best paired with a strong hook.
            </p>
          </div>
        </div>
      </div>

      {/* ── Ad Library ─────────────────────────────────────────────────────── */}
      <div className="bo-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-bo-text text-sm">Ad Library</h3>
          <div className="flex flex-wrap gap-2">
            {/* Hook filter */}
            <select
              value={filterHook}
              onChange={e => setFilterHook(e.target.value)}
              className="bo-input text-xs py-1.5 pr-7"
            >
              <option value="all">All Hook Types</option>
              {[...new Set(data.map(r => r.hook_type).filter(Boolean))].map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {/* Style filter */}
            <select
              value={filterStyle}
              onChange={e => setFilterStyle(e.target.value)}
              className="bo-input text-xs py-1.5 pr-7"
            >
              <option value="all">All Styles</option>
              {[...new Set(data.map(r => r.creative_style).filter(Boolean))].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {/* Rotation filter */}
            {(["all", "active", "inactive"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterRotation(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                  ${filterRotation === f
                    ? "bg-bo-orange text-white"
                    : "bg-bo-surface border border-bo-border text-bo-subtle hover:text-bo-text"
                  }`}
              >
                {f === "active" ? "In Rotation" : f === "inactive" ? "Not Running" : "All"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-bo-subtle text-center py-12">Loading…</div>
        ) : (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-bo-subtle text-center py-8 text-sm">No ads match this filter.</div>
            )}
            {filtered.map(row => (
              <div key={row.id} className={`rounded-xl border transition-all overflow-hidden
                ${row.ad_in_rotation
                  ? "border-green-500/25 bg-green-500/[0.03]"
                  : "border-bo-border bg-bo-surface/20"
                }`}>
                {/* Row header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bo-surface/30 transition-colors"
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                >
                  {/* CTR badge */}
                  <div className="w-16 text-right flex-shrink-0">
                    {row.ctr_prospecting !== null ? (
                      <span className="text-sm font-bold font-mono text-bo-orange">
                        {(row.ctr_prospecting * 100).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-xs text-bo-muted">—</span>
                    )}
                    <div className="text-[9px] text-bo-muted uppercase">CTR</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-bo-text text-sm truncate">{row.asset_name}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {row.hook_type && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bo-muted/30 text-bo-subtle border border-bo-border/50">
                          🪝 {row.hook_type}
                        </span>
                      )}
                      {row.creative_style && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bo-muted/30 text-bo-subtle border border-bo-border/50">
                          🎬 {row.creative_style}
                        </span>
                      )}
                      <ChannelTag label="YT" active={row.channels_yt} />
                      <ChannelTag label="FB" active={row.channels_fb} />
                      <ChannelTag label="IG" active={row.channels_insta} />
                      <ChannelTag label="TT" active={row.channels_tiktok} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); toggleRotation(row.id, row.ad_in_rotation); }}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors
                        ${row.ad_in_rotation
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : "border-bo-border text-bo-muted hover:border-bo-orange hover:text-bo-orange"
                        }`}
                    >
                      {row.ad_in_rotation ? <><CheckCircle size={9} className="inline mr-0.5" />Live</> : "Off"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); openEdit(row); }} className="text-bo-subtle hover:text-bo-orange">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); del(row.id); }} className="text-bo-subtle hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                    <span className={`text-bo-subtle text-xs transition-transform ${expanded === row.id ? "rotate-90" : ""}`}>▶</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === row.id && (
                  <div className="px-4 pb-4 pt-3 border-t border-bo-border/30 grid grid-cols-2 gap-4 text-xs">
                    {row.description && (
                      <div>
                        <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-1">Description</div>
                        <p className="text-bo-text">{row.description}</p>
                      </div>
                    )}
                    {row.angle && (
                      <div>
                        <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-1">Angle / Hook Premise</div>
                        <p className="text-bo-text">{row.angle}</p>
                      </div>
                    )}
                    {row.products_highlighted && (
                      <div>
                        <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-1">Products</div>
                        <p className="text-bo-text">{row.products_highlighted}</p>
                      </div>
                    )}
                    {row.original_use && (
                      <div>
                        <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-1">Original Use</div>
                        <p className="text-bo-text capitalize">{row.original_use}</p>
                      </div>
                    )}
                    {row.notes && (
                      <div className="col-span-2">
                        <div className="text-[10px] text-bo-subtle uppercase tracking-wider mb-1">Notes</div>
                        <p className="text-bo-text">{row.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reference guide ─────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bo-card p-5">
          <h3 className="font-semibold text-bo-text text-sm mb-3">Hook Type Guide</h3>
          <div className="space-y-2 text-xs">
            {[
              ["Problem/Solution", "Starts with a pain point and shows the fix"],
              ["Before/After", "Transformation is the main attention grabber"],
              ["Product Demo", '"Watch how this works" is the hook'],
              ["Unexpected Use/Lifestyle", "Shows a use case people may not think of"],
              ["Authority/Expert Walkthrough", "Someone knowledgeable explains why it matters"],
              ["Social Proof/Customer Project", "Real customer story or project build"],
              ["Relatable Boater Pain Point", "Speaks directly to a frustration boaters know"],
              ["Unpopular Opinion", "Contrarian take that sparks curiosity"],
            ].map(([h, desc]) => (
              <div key={h} className="flex gap-2">
                <span className="font-semibold text-bo-orange w-40 flex-shrink-0">{h}</span>
                <span className="text-bo-subtle">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bo-card p-5">
          <h3 className="font-semibold text-bo-text text-sm mb-3">Creative Style Guide</h3>
          <div className="space-y-2 text-xs">
            {[
              ["Product in Use Demo", "Product shown being actively used in real context"],
              ["Voiceover B-Roll", "VO narration over footage — no on-camera talent"],
              ["Fast-Cut Showcase", "Quick cuts, high energy, showcases multiple angles"],
              ["Text Overlay Video", "Bold text on screen drives the message"],
              ["UGC/Testimonial", "Real customer or creator talking naturally"],
              ["Installation/Process", "Step-by-step install or setup content"],
              ["Talking Head", "On-camera spokesperson addresses viewer directly"],
              ["Customer Project Feature", "Full customer build or project highlight"],
            ].map(([s, desc]) => (
              <div key={s} className="flex gap-2">
                <span className="font-semibold text-bo-teal w-40 flex-shrink-0">{s}</span>
                <span className="text-bo-subtle">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Add New Ad" : "Edit Ad"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Asset Name / Title *</label>
              <input className="bo-input w-full" value={form.asset_name}
                onChange={fld("asset_name")} placeholder="Video title or ad name…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Hook Type</label>
                <select className="bo-input w-full text-sm" value={form.hook_type} onChange={fld("hook_type")}>
                  <option value="">Select hook…</option>
                  {HOOK_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Creative Style</label>
                <select className="bo-input w-full text-sm" value={form.creative_style} onChange={fld("creative_style")}>
                  <option value="">Select style…</option>
                  {CREATIVE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Angle / Hook Premise</label>
              <input className="bo-input w-full" value={form.angle} onChange={fld("angle")}
                placeholder="The main idea that grabs attention…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Products Highlighted</label>
                <input className="bo-input w-full" value={form.products_highlighted} onChange={fld("products_highlighted")} />
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Original Use</label>
                <input className="bo-input w-full" value={form.original_use} onChange={fld("original_use")}
                  placeholder="Paid Ad / Organic / Creator Content" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Prospecting CTR (e.g. 0.0283 for 2.83%)</label>
              <input className="bo-input w-full" type="number" step="0.0001" min="0" max="1"
                value={form.ctr_prospecting ?? ""}
                onChange={e => setForm(f => ({ ...f, ctr_prospecting: e.target.value ? parseFloat(e.target.value) : null }))}
                placeholder="0.0283" />
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-2">Channels</label>
              <div className="flex gap-4">
                {(["channels_yt", "channels_fb", "channels_insta", "channels_tiktok"] as const).map(ch => (
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-orange-500"
                      checked={!!form[ch]}
                      onChange={e => setForm(f => ({ ...f, [ch]: e.target.checked }))} />
                    <span className="text-xs text-bo-text">{ch === "channels_yt" ? "YouTube" : ch === "channels_fb" ? "Facebook" : ch === "channels_insta" ? "Instagram" : "TikTok"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Description / Notes</label>
              <textarea className="bo-input w-full min-h-[60px] resize-y" value={form.description}
                onChange={fld("description")} placeholder="What the video shows…" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-orange-500"
                checked={form.ad_in_rotation}
                onChange={e => setForm(f => ({ ...f, ad_in_rotation: e.target.checked }))} />
              <span className="text-sm text-bo-text">Currently in rotation (running)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={!form.asset_name.trim() || saving}
                className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving ? "Saving…" : modal === "create" ? "Add Ad" : "Save"}
              </button>
              <button onClick={() => setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
