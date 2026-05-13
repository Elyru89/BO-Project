"use client";
import { useState, useEffect, useMemo } from "react";
import { Film, Plus, Search, ExternalLink, Edit2, CheckCircle, Trash2, Play, Eye, ThumbsUp, BarChart2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { formatDate, progressColor } from "@/lib/utils";

type VideoProject = {
  id: string; task: string; description: string; assets: string;
  paid_ads: boolean; website: boolean; organic: boolean; teak_isle: boolean;
  format: string; due_date: string; progress: string; assets_created: number;
  ad_launch_date: string; finished_video_link: string; created_at: string;
};
type CompletedVideo = {
  id: string; description: string; video_url: string;
  paid_ads: boolean; website: boolean; organic: boolean;
  boosted: boolean; teak_isle: boolean; post_link: string;
  date_posted: string; view_count: number; like_count: number;
  metrics_updated_at: string;
};

function fmtNum(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const BLANK_VP: Omit<VideoProject,"id"|"created_at"> = {
  task:"", description:"", assets:"", paid_ads:false, website:false,
  organic:false, teak_isle:false, format:"", due_date:"",
  progress:"Pending", assets_created:0, ad_launch_date:"", finished_video_link:""
};
const STATUSES = ["Pending","In Progress","Review","Completed"];

function detectPlatform(url: string): { label: string; color: string } {
  if (!url) return { label:"—", color:"text-bo-subtle" };
  const u = url.toLowerCase();
  if (u.includes("youtube") || u.includes("youtu.be")) return { label:"YouTube", color:"text-red-400" };
  if (u.includes("facebook") || u.includes("fb.com") || u.includes("fb.watch")) return { label:"Facebook", color:"text-blue-400" };
  if (u.includes("instagram") || u.includes("instagr.am")) return { label:"Instagram", color:"text-pink-400" };
  if (u.includes("tiktok")) return { label:"TikTok", color:"text-cyan-400" };
  if (u.includes("sharepoint") || u.includes("teakisle")) return { label:"SharePoint", color:"text-bo-teal" };
  return { label:"Link", color:"text-bo-teal" };
}

function ChannelPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium
      ${active ? "bg-bo-orange/20 text-bo-orange border-bo-orange/40" : "hidden"}`}>
      {label}
    </span>
  );
}

export default function VideoPipeline() {
  const [projects, setProjects]   = useState<VideoProject[]>([]);
  const [completed, setCompleted] = useState<CompletedVideo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<"projects"|"archive">("projects");
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [channelFilter, setChannel] = useState("all");
  const [modal, setModal]         = useState<"create"|"edit"|"detail"|"metrics"|null>(null);
  const [selected, setSelected]   = useState<VideoProject|null>(null);
  const [selectedCV, setSelectedCV] = useState<CompletedVideo|null>(null);
  const [form, setForm]           = useState<typeof BLANK_VP>(BLANK_VP);
  const [metricsForm, setMetricsForm] = useState({ view_count:0, like_count:0, date_posted:"" });
  const [saving, setSaving]       = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: vp }, { data: cv }] = await Promise.all([
      supabase.from("video_projects").select("*").order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("completed_videos").select("*").order("created_at", { ascending: false }),
    ]);
    setProjects(vp ?? []);
    setCompleted(cv ?? []);
    setLoading(false);
  }

  async function save() {
    if (!form.task.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      due_date: form.due_date || null,
      ad_launch_date: form.ad_launch_date || null,
      updated_at: new Date().toISOString(),
    };
    let error;
    if (modal === "create") ({ error } = await supabase.from("video_projects").insert(payload));
    else if (modal === "edit" && selected) ({ error } = await supabase.from("video_projects").update(payload).eq("id", selected.id));
    setSaving(false);
    if (error) { alert("Save failed: " + error.message); return; }
    setModal(null); loadAll();
  }

  async function markComplete(id: string) {
    await supabase.from("video_projects").update({ progress:"Completed", updated_at: new Date().toISOString() }).eq("id", id);
    loadAll();
  }

  async function del(id: string) {
    if (!confirm("Delete this project?")) return;
    await supabase.from("video_projects").delete().eq("id", id);
    loadAll();
  }

  function openMetrics(cv: CompletedVideo) {
    setSelectedCV(cv);
    setMetricsForm({
      view_count: cv.view_count ?? 0,
      like_count: cv.like_count ?? 0,
      date_posted: cv.date_posted?.slice(0,10) ?? "",
    });
    setModal("metrics");
  }

  async function saveMetrics() {
    if (!selectedCV) return;
    setSaving(true);
    await supabase.from("completed_videos").update({
      view_count: metricsForm.view_count || 0,
      like_count: metricsForm.like_count || 0,
      date_posted: metricsForm.date_posted || null,
      metrics_updated_at: new Date().toISOString(),
    }).eq("id", selectedCV.id);
    setSaving(false);
    setModal(null);
    loadAll();
  }

  function openEdit(p: VideoProject) {
    setSelected(p);
    setForm({ task:p.task, description:p.description||"", assets:p.assets||"",
      paid_ads:p.paid_ads, website:p.website, organic:p.organic, teak_isle:p.teak_isle,
      format:p.format||"", due_date:p.due_date?.slice(0,10)||"",
      progress:p.progress, assets_created:p.assets_created||0,
      ad_launch_date:p.ad_launch_date?.slice(0,10)||"",
      finished_video_link:p.finished_video_link||"" });
    setModal("edit");
  }

  const fld = (k: keyof typeof BLANK_VP) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
      setForm(f => ({...f, [k]: e.target.type==="checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.type==="number" ? Number(e.target.value) : e.target.value }));

  const filteredP = useMemo(() => projects.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.task?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || r.progress === statusFilter;
    const matchC = channelFilter === "all"
      || (channelFilter === "paid_ads" && r.paid_ads)
      || (channelFilter === "website" && r.website)
      || (channelFilter === "organic" && r.organic)
      || (channelFilter === "teak_isle" && r.teak_isle);
    return matchQ && matchS && matchC;
  }), [projects, search, statusFilter, channelFilter]);

  const filteredC = useMemo(() => completed.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.description?.toLowerCase().includes(q);
    const matchC = channelFilter === "all"
      || (channelFilter === "paid_ads" && r.paid_ads)
      || (channelFilter === "website" && r.website)
      || (channelFilter === "organic" && r.organic)
      || (channelFilter === "boosted" && r.boosted)
      || (channelFilter === "teak_isle" && r.teak_isle);
    return matchQ && matchC;
  }), [completed, search, channelFilter]);

  const doneCount = projects.filter(r=>r.progress==="Completed").length;
  const totalAssets = projects.reduce((s,r) => s + (r.assets_created||0), 0);
  const paidCount = completed.filter(r=>r.paid_ads).length;
  const organicCount = completed.filter(r=>r.organic).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Video Pipeline" subtitle={`${projects.length} projects · ${totalAssets} assets produced`} icon={Film}>
        <button onClick={()=>{ setForm(BLANK_VP); setModal("create"); }} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> New Project
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"Total Projects",  val:projects.length},
          {label:"Completed",       val:doneCount},
          {label:"Assets Created",  val:totalAssets},
          {label:"Published Videos",val:completed.length},
        ].map(s=>(
          <div key={s.label} className="bo-card p-4 text-center">
            <div className="text-2xl font-bold text-bo-text">{s.val}</div>
            <div className="text-bo-subtle text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg overflow-hidden border border-bo-border">
          {(["projects","archive"] as const).map(t=>(
            <button key={t} onClick={()=>{ setTab(t); setSearch(""); setStatus("all"); setChannel("all"); }}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-colors
                ${tab===t?"bg-bo-orange text-white":"bg-bo-surface text-bo-subtle hover:text-bo-text"}`}>
              {t==="projects" ? `Projects (${projects.length})` : `Published (${completed.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle"/>
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {tab==="projects" && (
          <select className="bo-input text-sm" value={statusFilter} onChange={e=>setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        )}
        <select className="bo-input text-sm" value={channelFilter} onChange={e=>setChannel(e.target.value)}>
          <option value="all">All Channels</option>
          <option value="paid_ads">Paid Ads</option>
          <option value="website">Website</option>
          <option value="organic">Organic</option>
          {tab==="archive" && <option value="boosted">Boosted</option>}
          <option value="teak_isle">Teak Isle</option>
        </select>
      </div>

      {loading && <div className="text-bo-subtle text-center py-12">Loading…</div>}

      {/* ── Projects tab ── */}
      {!loading && tab==="projects" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Task","Description","Channels","Format","Due","Status","Assets","Finished Video","Actions"].map(h=>(
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredP.map(row=>(
                  <tr key={row.id} className={`border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors cursor-pointer
                    ${row.progress==="Completed"?"opacity-70":""}`}
                    onClick={()=>{ setSelected(row); setModal("detail"); }}>
                    <td className="px-3 py-2.5 font-medium text-bo-text max-w-[180px]">
                      <span className="line-clamp-2">{row.task||"—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs max-w-[220px]">
                      <span className="line-clamp-2">{row.description||"—"}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        <ChannelPill label="Paid" active={row.paid_ads}/>
                        <ChannelPill label="Web" active={row.website}/>
                        <ChannelPill label="Organic" active={row.organic}/>
                        <ChannelPill label="Teak" active={row.teak_isle}/>
                        {!row.paid_ads && !row.website && !row.organic && !row.teak_isle &&
                          <span className="text-bo-muted text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs">{row.format||"—"}</td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">{formatDate(row.due_date)}</td>
                    <td className="px-3 py-2.5"><span className={progressColor(row.progress)}>{row.progress||"—"}</span></td>
                    <td className="px-3 py-2.5 text-center font-bold text-bo-text">{row.assets_created||"—"}</td>
                    <td className="px-3 py-2.5 max-w-[160px]" onClick={e=>e.stopPropagation()}>
                      {row.finished_video_link ? (
                        row.finished_video_link.startsWith("http")
                          ? <a href={row.finished_video_link} target="_blank" rel="noopener noreferrer"
                              className="text-bo-teal hover:underline flex items-center gap-1 text-xs whitespace-nowrap">
                              View <ExternalLink size={10}/>
                            </a>
                          : <span className="text-bo-subtle text-xs line-clamp-1" title={row.finished_video_link}>
                              {row.finished_video_link}
                            </span>
                      ) : <span className="text-bo-muted text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        {row.progress!=="Completed" && (
                          <button onClick={()=>markComplete(row.id)} title="Mark complete" className="text-green-400 hover:text-green-300"><CheckCircle size={14}/></button>
                        )}
                        <button onClick={()=>openEdit(row)} className="text-bo-subtle hover:text-bo-orange"><Edit2 size={14}/></button>
                        <button onClick={()=>del(row.id)} className="text-bo-subtle hover:text-red-400"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredP.length===0 && <div className="text-bo-subtle text-center py-10">No projects found.</div>}
        </div>
      )}

      {/* ── Published / Archive tab ── */}
      {!loading && tab==="archive" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-text">{completed.length}</div><div className="text-bo-subtle text-xs">Total Published</div></div>
            <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-orange">{paidCount}</div><div className="text-bo-subtle text-xs">Paid Ad Campaigns</div></div>
            <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-green-400">{organicCount}</div><div className="text-bo-subtle text-xs">Organic Posts</div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredC.map(row => {
              const platform = detectPlatform(row.post_link||"");
              const hasSourceLink = row.video_url?.startsWith("http");
              const sourceLabel = row.video_url && !row.video_url.startsWith("http") ? row.video_url : null;
              return (
                <div key={row.id} className={`bo-card p-4 hover:border-bo-orange/30 transition-all
                  ${row.paid_ads ? "border-bo-orange/20" : ""}`}>
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-bo-orange/10 border border-bo-orange/20 flex items-center justify-center flex-shrink-0">
                      <Play size={14} className="text-bo-orange"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-bo-text text-sm line-clamp-2">{row.description||"—"}</div>
                      {sourceLabel && <div className="text-bo-subtle text-xs mt-0.5 line-clamp-1">{sourceLabel}</div>}
                    </div>
                  </div>

                  {/* Channel tags */}
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {row.paid_ads && <span className="text-[10px] px-1.5 py-0.5 rounded bg-bo-orange/20 text-bo-orange border border-bo-orange/40 font-medium">Paid Ad</span>}
                    {row.organic  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-800/40 font-medium">Organic</span>}
                    {row.website  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-bo-teal/10 text-bo-teal border border-bo-teal/30 font-medium">Website</span>}
                    {row.boosted  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400 border border-purple-800/40 font-medium">Boosted</span>}
                    {row.teak_isle && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/20 text-yellow-400 border border-yellow-800/30 font-medium">Teak Isle</span>}
                  </div>

                  {/* Metrics row */}
                  {(row.view_count > 0 || row.like_count > 0) && (
                    <div className="flex gap-3 mb-2">
                      <span className="flex items-center gap-1 text-xs text-bo-subtle">
                        <Eye size={10}/> {fmtNum(row.view_count)} views
                      </span>
                      <span className="flex items-center gap-1 text-xs text-bo-subtle">
                        <ThumbsUp size={10}/> {fmtNum(row.like_count)} likes
                      </span>
                      {row.date_posted && (
                        <span className="text-xs text-bo-muted">{new Date(row.date_posted).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${platform.color}`}>{platform.label}</span>
                    <div className="flex gap-2 items-center">
                      <button onClick={()=>openMetrics(row)}
                        className="text-xs text-bo-muted hover:text-bo-orange flex items-center gap-1 transition-colors"
                        title="Update view/like counts">
                        <BarChart2 size={11}/> {row.view_count > 0 ? "Edit" : "Add"} Metrics
                      </button>
                      {hasSourceLink && (
                        <a href={row.video_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-bo-subtle hover:text-bo-teal flex items-center gap-1">
                          Source <ExternalLink size={10}/>
                        </a>
                      )}
                      {row.post_link?.startsWith("http") && (
                        <a href={row.post_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-bo-teal hover:underline flex items-center gap-1 font-medium">
                          Watch Post <ExternalLink size={10}/>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredC.length===0 && <div className="text-bo-subtle text-center py-10">No published videos found.</div>}
        </>
      )}

      {/* ── Create / Edit modal ── */}
      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="create"?"New Video Project":"Edit Video Project"} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Task Name *</label>
              <input className="bo-input w-full" value={form.task} onChange={fld("task")} placeholder="e.g. Fillet Table AD"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Description / Brief</label>
              <textarea className="bo-input w-full min-h-[80px] resize-y" value={form.description} onChange={fld("description")} placeholder="What needs to be filmed/created and why…"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Distribution Channels</label>
              <div className="flex flex-wrap gap-4">
                {([["paid_ads","Paid Ads"],["website","Website"],["organic","Organic"],["teak_isle","Teak Isle"]] as const).map(([ch,label])=>(
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!form[ch]}
                      onChange={e=>setForm(f=>({...f,[ch]:e.target.checked}))}
                      className="w-3.5 h-3.5 accent-orange-500"/>
                    <span className="text-xs text-bo-text">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Format</label>
                <input className="bo-input w-full" value={form.format} onChange={fld("format")} placeholder="Vertical, Horizontal, Square…"/>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Assets Created</label>
                <input type="number" className="bo-input w-full" value={form.assets_created} onChange={fld("assets_created")} min={0}/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Status</label>
                <select className="bo-input w-full" value={form.progress} onChange={fld("progress")}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Due Date</label>
                <input type="date" className="bo-input w-full" value={form.due_date} onChange={fld("due_date")}/>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Ad Launch</label>
                <input type="date" className="bo-input w-full" value={form.ad_launch_date} onChange={fld("ad_launch_date")}/>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Source Assets</label>
              <input className="bo-input w-full" value={form.assets} onChange={fld("assets")} placeholder="SharePoint link or description…"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Finished Video Link</label>
              <input className="bo-input w-full" value={form.finished_video_link} onChange={fld("finished_video_link")} placeholder="YouTube, SharePoint, or video title…"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={!form.task||saving} className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving?"Saving…":modal==="create"?"Create Project":"Save Changes"}
              </button>
              <button onClick={()=>setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Metrics modal (for published videos) ── */}
      {modal==="metrics" && selectedCV && (
        <Modal title="Update Post Metrics" onClose={()=>setModal(null)} size="sm">
          <div className="space-y-4">
            <div className="bg-bo-surface rounded-lg p-3">
              <div className="text-bo-text text-sm font-medium line-clamp-2">{selectedCV.description || "—"}</div>
              {selectedCV.post_link?.startsWith("http") && (
                <a href={selectedCV.post_link} target="_blank" rel="noopener noreferrer"
                  className="text-bo-teal text-xs flex items-center gap-1 mt-1 hover:underline">
                  View post <ExternalLink size={10}/>
                </a>
              )}
            </div>
            <p className="text-bo-subtle text-xs">Enter the current numbers from the platform dashboard. YouTube is auto-fetched — this is for Facebook, TikTok, Instagram, etc.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">View Count</label>
                <input type="number" className="bo-input w-full" min={0}
                  value={metricsForm.view_count || ""}
                  onChange={e=>setMetricsForm(f=>({...f, view_count: parseInt(e.target.value)||0}))}
                  placeholder="e.g. 14500"/>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Like Count</label>
                <input type="number" className="bo-input w-full" min={0}
                  value={metricsForm.like_count || ""}
                  onChange={e=>setMetricsForm(f=>({...f, like_count: parseInt(e.target.value)||0}))}
                  placeholder="e.g. 340"/>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Date Posted</label>
              <input type="date" className="bo-input w-full"
                value={metricsForm.date_posted}
                onChange={e=>setMetricsForm(f=>({...f, date_posted: e.target.value}))}/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveMetrics} disabled={saving} className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving ? "Saving…" : "Save Metrics"}
              </button>
              <button onClick={()=>setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Detail modal ── */}
      {modal==="detail" && selected && (
        <Modal title={selected.task||"Video Project"} onClose={()=>setModal(null)} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={progressColor(selected.progress)}>{selected.progress}</span>
              {selected.assets_created > 0 && <span className="bo-badge-info">{selected.assets_created} assets created</span>}
              {selected.due_date && <span className="text-bo-subtle text-xs">Due {formatDate(selected.due_date)}</span>}
              {selected.ad_launch_date && <span className="text-bo-subtle text-xs">Ad launch {formatDate(selected.ad_launch_date)}</span>}
            </div>
            {selected.description && (
              <div>
                <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Brief</div>
                <p className="text-bo-text text-sm leading-relaxed bg-bo-surface rounded-lg p-3">{selected.description}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {[["Paid Ads",selected.paid_ads],["Website",selected.website],["Organic",selected.organic],["Teak Isle",selected.teak_isle]].map(([l,v])=>(
                v ? <span key={String(l)} className="text-xs px-2 py-1 rounded border bg-bo-orange/20 text-bo-orange border-bo-orange/40">{String(l)}</span> : null
              ))}
            </div>
            {selected.format && <div><div className="text-[11px] text-bo-subtle mb-1">Format</div><p className="text-sm text-bo-text">{selected.format}</p></div>}
            {selected.assets && (
              <div>
                <div className="text-[11px] text-bo-subtle mb-1">Source Assets</div>
                {selected.assets.startsWith("http")
                  ? <a href={selected.assets} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">Open Assets <ExternalLink size={12}/></a>
                  : <p className="text-sm text-bo-text">{selected.assets}</p>}
              </div>
            )}
            {selected.finished_video_link && (
              <div>
                <div className="text-[11px] text-bo-subtle mb-1">Finished Video</div>
                {selected.finished_video_link.startsWith("http")
                  ? <a href={selected.finished_video_link} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">View Video <ExternalLink size={12}/></a>
                  : <p className="text-sm text-bo-text">{selected.finished_video_link}</p>}
              </div>
            )}
            <div className="flex gap-3 pt-3 border-t border-bo-border">
              {selected.progress!=="Completed" && (
                <button onClick={()=>{ markComplete(selected.id); setModal(null); }} className="bo-btn-primary flex items-center gap-1.5">
                  <CheckCircle size={14}/> Mark Complete
                </button>
              )}
              <button onClick={()=>openEdit(selected)} className="bo-btn-ghost flex items-center gap-1.5"><Edit2 size={14}/> Edit</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
