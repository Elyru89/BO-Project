"use client";
import { useState, useEffect, useMemo } from "react";
import { Film, Plus, Search, ExternalLink, Edit2, CheckCircle, Trash2 } from "lucide-react";
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
};

const BLANK_VP: Omit<VideoProject,"id"|"created_at"> = {
  task:"", description:"", assets:"", paid_ads:false, website:false,
  organic:false, teak_isle:false, format:"", due_date:"",
  progress:"Pending", assets_created:0, ad_launch_date:"", finished_video_link:""
};
const STATUSES = ["Pending","In Progress","Review","Completed"];

export default function VideoPipeline() {
  const [projects, setProjects]     = useState<VideoProject[]>([]);
  const [completed, setCompleted]   = useState<CompletedVideo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"projects"|"archive">("projects");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [modal, setModal]           = useState<"create"|"edit"|"detail"|null>(null);
  const [selected, setSelected]     = useState<VideoProject|null>(null);
  const [form, setForm]             = useState<typeof BLANK_VP>(BLANK_VP);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: vp }, { data: cv }] = await Promise.all([
      supabase.from("video_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("completed_videos").select("*").order("created_at", { ascending: false }),
    ]);
    setProjects(vp ?? []);
    setCompleted(cv ?? []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (modal === "create") await supabase.from("video_projects").insert(payload);
    else if (modal === "edit" && selected) await supabase.from("video_projects").update(payload).eq("id", selected.id);
    setSaving(false);
    setModal(null);
    loadAll();
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

  function openEdit(p: VideoProject) {
    setSelected(p);
    setForm({ task:p.task, description:p.description, assets:p.assets||"",
      paid_ads:p.paid_ads, website:p.website, organic:p.organic, teak_isle:p.teak_isle,
      format:p.format||"", due_date:p.due_date?.slice(0,10)||"",
      progress:p.progress, assets_created:p.assets_created||0,
      ad_launch_date:p.ad_launch_date?.slice(0,10)||"", finished_video_link:p.finished_video_link||"" });
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
    return matchQ && matchS;
  }), [projects, search, statusFilter]);

  const filteredC = useMemo(() => completed.filter(r =>
    !search || r.description?.toLowerCase().includes(search.toLowerCase())
  ), [completed, search]);

  const doneCount = projects.filter(r=>r.progress==="Completed").length;
  const totalAssets = projects.reduce((s,r) => s + (r.assets_created||0), 0);

  function UsagePill({ label, active }: { label: string; active: boolean }) {
    return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium
      ${active ? "bg-bo-orange/20 text-bo-orange border-bo-orange/40" : "bg-transparent text-bo-muted border-bo-border opacity-40"}`}>{label}</span>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Video Pipeline" subtitle={`${projects.length} projects · ${totalAssets} assets produced`} icon={Film}>
        <button onClick={()=>{ setForm(BLANK_VP); setModal("create"); }} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> New Project
        </button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-3">
        {[
          {label:"Total Projects",  val:projects.length},
          {label:"Completed",       val:doneCount},
          {label:"Assets Created",  val:totalAssets},
          {label:"Archived",        val:completed.length},
        ].map(s=>(
          <div key={s.label} className="bo-card p-4 text-center">
            <div className="text-2xl font-bold text-bo-text">{s.val}</div>
            <div className="text-bo-subtle text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg overflow-hidden border border-bo-border">
          {(["projects","archive"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-colors
                ${tab===t?"bg-bo-orange text-white":"bg-bo-surface text-bo-subtle"}`}>
              {t==="projects" ? `Projects (${projects.length})` : `Archive (${completed.length})`}
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
      </div>

      {loading && <div className="text-bo-subtle text-center py-12">Loading…</div>}

      {!loading && tab==="projects" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Task","Description","Usage","Format","Due","Status","Assets","Link","Actions"].map(h=>(
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredP.map(row=>(
                  <tr key={row.id} className="border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors cursor-pointer"
                    onClick={()=>{ setSelected(row); setModal("detail"); }}>
                    <td className="px-3 py-2.5 font-medium text-bo-text max-w-[160px]"><span className="line-clamp-1">{row.task||"—"}</span></td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs max-w-[200px]"><span className="line-clamp-2">{row.description||"—"}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        <UsagePill label="Ads" active={row.paid_ads}/>
                        <UsagePill label="Web" active={row.website}/>
                        <UsagePill label="Org" active={row.organic}/>
                        <UsagePill label="Teak" active={row.teak_isle}/>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs">{row.format||"—"}</td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">{formatDate(row.due_date)}</td>
                    <td className="px-3 py-2.5"><span className={progressColor(row.progress)}>{row.progress||"—"}</span></td>
                    <td className="px-3 py-2.5 text-center font-bold text-bo-text">{row.assets_created||"—"}</td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      {row.finished_video_link?.startsWith("http")
                        ? <a href={row.finished_video_link} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">View <ExternalLink size={10}/></a>
                        : <span className="text-bo-muted text-xs">{row.finished_video_link||"—"}</span>}
                    </td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        {row.progress!=="Completed" && (
                          <button onClick={()=>markComplete(row.id)} className="text-green-400 hover:text-green-300"><CheckCircle size={14}/></button>
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

      {!loading && tab==="archive" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Description","Paid Ads","Website","Organic","Boosted","Teak Isle","Post Link"].map(h=>(
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredC.map(row=>(
                  <tr key={row.id} className="border-b border-bo-border/40 hover:bg-bo-surface/30">
                    <td className="px-3 py-2.5 text-bo-text">{row.description||"—"}</td>
                    {(["paid_ads","website","organic","boosted","teak_isle"] as const).map(col=>(
                      <td key={col} className="px-3 py-2.5 text-center">
                        {row[col] ? <span className="bo-badge-success">✓</span> : <span className="text-bo-muted text-xs">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      {row.post_link?.startsWith("http")
                        ? <a href={row.post_link} target="_blank" rel="noopener noreferrer"
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">View <ExternalLink size={10}/></a>
                        : <span className="text-bo-muted text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="create"?"New Video Project":"Edit Video Project"} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Task Name *</label>
              <input className="bo-input w-full" value={form.task} onChange={fld("task")} placeholder="e.g. Fillet Table AD"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Description / Brief</label>
              <textarea className="bo-input w-full min-h-[80px] resize-y" value={form.description} onChange={fld("description")}/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Distribution Channels</label>
              <div className="flex gap-4">
                {(["paid_ads","website","organic","teak_isle"] as const).map(ch=>(
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!form[ch]}
                      onChange={e=>setForm(f=>({...f,[ch]:e.target.checked}))}
                      className="w-3.5 h-3.5 accent-orange-500"/>
                    <span className="text-xs text-bo-text capitalize">{ch.replace("_"," ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Format</label>
                <input className="bo-input w-full" value={form.format} onChange={fld("format")} placeholder="vertical, horizontal…"/>
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
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Ad Launch Date</label>
                <input type="date" className="bo-input w-full" value={form.ad_launch_date} onChange={fld("ad_launch_date")}/>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Source Assets</label>
              <input className="bo-input w-full" value={form.assets} onChange={fld("assets")} placeholder="SharePoint link…"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Finished Video Link</label>
              <input className="bo-input w-full" value={form.finished_video_link} onChange={fld("finished_video_link")} placeholder="YouTube, SharePoint…"/>
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

      {/* Detail modal */}
      {modal==="detail" && selected && (
        <Modal title={selected.task||"Video Project"} onClose={()=>setModal(null)} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={progressColor(selected.progress)}>{selected.progress}</span>
              {selected.assets_created > 0 && <span className="bo-badge-info">{selected.assets_created} assets</span>}
              <span className="text-bo-subtle text-xs ml-auto">Due {formatDate(selected.due_date)}</span>
            </div>
            {selected.description && (
              <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1">Brief</div>
              <p className="text-bo-text text-sm leading-relaxed bg-bo-surface rounded-lg p-3">{selected.description}</p></div>
            )}
            <div className="flex gap-2">
              {[["Paid Ads",selected.paid_ads],["Website",selected.website],["Organic",selected.organic],["Teak Isle",selected.teak_isle]].map(([l,v])=>(
                <span key={String(l)} className={`text-xs px-2 py-1 rounded border ${v?"bg-bo-orange/20 text-bo-orange border-bo-orange/40":"bg-transparent text-bo-muted border-bo-border opacity-40"}`}>{String(l)}</span>
              ))}
            </div>
            {selected.assets && <div><div className="text-[11px] text-bo-subtle mb-1">Source Assets</div>
              {selected.assets.startsWith("http")
                ? <a href={selected.assets} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">Open Assets <ExternalLink size={12}/></a>
                : <p className="text-sm text-bo-text">{selected.assets}</p>}
            </div>}
            {selected.finished_video_link && <div><div className="text-[11px] text-bo-subtle mb-1">Finished Video</div>
              {selected.finished_video_link.startsWith("http")
                ? <a href={selected.finished_video_link} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">View Video <ExternalLink size={12}/></a>
                : <p className="text-sm text-bo-text">{selected.finished_video_link}</p>}
            </div>}
            {selected.ad_launch_date && <div><div className="text-[11px] text-bo-subtle mb-1">Ad Launch</div><p className="text-sm text-bo-text">{formatDate(selected.ad_launch_date)}</p></div>}
            <div className="flex gap-3 pt-2 border-t border-bo-border">
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
