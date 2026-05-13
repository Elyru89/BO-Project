"use client";
import { useState, useEffect, useMemo } from "react";
import { Palette, Plus, Search, ExternalLink, Edit2, CheckCircle, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { formatDate, priorityColor, progressColor } from "@/lib/utils";

type Project = {
  id: string; task: string; description: string; assets: string;
  uses: string; format: string; priority: string; due_date: string;
  progress: string; link: string; created_at: string;
};

const BLANK: Omit<Project, "id"|"created_at"> = {
  task:"", description:"", assets:"", uses:"", format:"",
  priority:"medium", due_date:"", progress:"Pending", link:""
};
const USES = ["Website","Organic Social","Paid Advertising","Branding","BO PRO","Teak Isle"];
const PRIORITIES = ["high","medium","low"];
const STATUSES = ["Pending","In Progress","Review","Completed"];

export default function DarwinProjects() {
  const [data, setData]         = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [useFilter, setUseFilter]   = useState("All");
  const [prioFilter, setPrioFilter] = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [view, setView]         = useState<"list"|"kanban">("list");
  const [modal, setModal]       = useState<"create"|"edit"|"detail"|null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [form, setForm]         = useState<typeof BLANK>(BLANK);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetch(); }, []);

  async function fetch() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("darwin_projects").select("*").order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    if (modal === "create") {
      await supabase.from("darwin_projects").insert({ ...form, updated_at: new Date().toISOString() });
    } else if (modal === "edit" && selected) {
      await supabase.from("darwin_projects").update({ ...form, updated_at: new Date().toISOString() }).eq("id", selected.id);
    }
    setSaving(false);
    setModal(null);
    fetch();
  }

  async function markComplete(id: string) {
    await supabase.from("darwin_projects").update({ progress: "Completed", updated_at: new Date().toISOString() }).eq("id", id);
    fetch();
  }

  async function del(id: string) {
    if (!confirm("Delete this project?")) return;
    await supabase.from("darwin_projects").delete().eq("id", id);
    fetch();
  }

  function openEdit(p: Project) {
    setSelected(p);
    setForm({ task:p.task, description:p.description, assets:p.assets, uses:p.uses,
      format:p.format, priority:p.priority, due_date:p.due_date?.slice(0,10) ?? "",
      progress:p.progress, link:p.link });
    setModal("edit");
  }

  function openDetail(p: Project) { setSelected(p); setModal("detail"); }

  const filtered = useMemo(() => data.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.task?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    const matchUse = useFilter === "All" || r.uses?.includes(useFilter);
    const matchPrio = prioFilter === "all" || r.priority?.toLowerCase() === prioFilter;
    const matchStatus = statusFilter === "all" || r.progress === statusFilter;
    return matchQ && matchUse && matchPrio && matchStatus;
  }), [data, search, useFilter, prioFilter, statusFilter]);

  const byStatus = { "Completed": filtered.filter(r=>r.progress==="Completed"),
    "In Progress": filtered.filter(r=>r.progress==="In Progress"),
    "Pending": filtered.filter(r=>!["Completed","In Progress"].includes(r.progress)) };

  const completed = data.filter(r=>r.progress==="Completed").length;
  const high = data.filter(r=>r.priority?.toLowerCase()==="high").length;

  const fld = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="space-y-6">
      <PageHeader title="Design Projects" subtitle={`${data.length} projects — Darwin's creative board`} icon={Palette}>
        <div className="flex rounded-lg overflow-hidden border border-bo-border">
          {(["list","kanban"] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors
                ${view===v?"bg-bo-orange text-white":"bg-bo-surface text-bo-subtle"}`}>{v}</button>
          ))}
        </div>
        <button onClick={()=>{ setForm(BLANK); setModal("create"); }} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> New Task
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {label:"Total",    val:data.length,  color:"text-bo-text"},
          {label:"Done",     val:completed,    color:"text-green-400"},
          {label:"High Pri", val:high,         color:"text-red-400"},
          {label:"Active",   val:data.filter(r=>r.progress==="In Progress").length, color:"text-sky-400"},
        ].map(s=>(
          <div key={s.label} className="bo-card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-bo-subtle text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle"/>
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="bo-input text-sm" value={useFilter} onChange={e=>setUseFilter(e.target.value)}>
          {["All",...USES].map(u=><option key={u}>{u}</option>)}
        </select>
        <select className="bo-input text-sm" value={prioFilter} onChange={e=>setPrioFilter(e.target.value)}>
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <select className="bo-input text-sm" value={statusFilter} onChange={e=>setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <div className="text-bo-subtle text-center py-12">Loading projects…</div>}

      {/* Kanban */}
      {!loading && view==="kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(byStatus).map(([status,tasks])=>(
            <div key={status} className="bo-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${status==="Completed"?"bg-green-400":status==="In Progress"?"bg-sky-400":"bg-bo-muted"}`}/>
                <span className="font-semibold text-bo-text text-sm">{status}</span>
                <span className="ml-auto text-xs text-bo-subtle bg-bo-muted/30 px-2 py-0.5 rounded-full">{tasks.length}</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {tasks.map(t=>(
                  <div key={t.id} className="bg-bo-surface border border-bo-border rounded-lg p-3 hover:border-bo-orange/30 transition-all cursor-pointer"
                    onClick={()=>openDetail(t)}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-bo-text text-xs font-medium leading-tight">{t.task}</span>
                      <span className={`${priorityColor(t.priority)} flex-shrink-0 text-[10px]`}>{t.priority}</span>
                    </div>
                    {t.description && <p className="text-bo-subtle text-[11px] leading-relaxed line-clamp-2">{t.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-bo-muted">{formatDate(t.due_date)}</span>
                      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                        {t.progress!=="Completed" && (
                          <button onClick={()=>markComplete(t.id)} className="text-green-400 hover:text-green-300" title="Mark complete"><CheckCircle size={12}/></button>
                        )}
                        <button onClick={()=>openEdit(t)} className="text-bo-subtle hover:text-bo-orange"><Edit2 size={12}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {!loading && view==="list" && (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  {["Task","Description","Uses","Format","Priority","Due","Status","Assets","Link","Actions"].map(h=>(
                    <th key={h} className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row=>(
                  <tr key={row.id} className="border-b border-bo-border/40 hover:bg-bo-surface/30 transition-colors cursor-pointer"
                    onClick={()=>openDetail(row)}>
                    <td className="px-3 py-2.5 font-medium text-bo-text max-w-[160px]">
                      <span className="line-clamp-1">{row.task||"—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs max-w-[200px]">
                      <span className="line-clamp-2">{row.description||"—"}</span>
                    </td>
                    <td className="px-3 py-2.5"><span className="bo-badge-info text-[10px]">{row.uses||"—"}</span></td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs">{row.format||"—"}</td>
                    <td className="px-3 py-2.5"><span className={priorityColor(row.priority)}>{row.priority||"—"}</span></td>
                    <td className="px-3 py-2.5 text-bo-subtle text-xs whitespace-nowrap">{formatDate(row.due_date)}</td>
                    <td className="px-3 py-2.5"><span className={progressColor(row.progress)}>{row.progress||"—"}</span></td>
                    <td className="px-3 py-2.5">
                      {row.assets?.startsWith("http")
                        ? <a href={row.assets} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">Assets <ExternalLink size={10}/></a>
                        : <span className="text-bo-muted text-xs line-clamp-1 max-w-[80px]">{row.assets||"—"}</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.link?.startsWith("http")
                        ? <a href={row.link} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                            className="text-bo-teal hover:underline flex items-center gap-1 text-xs">Open <ExternalLink size={10}/></a>
                        : <span className="text-bo-muted text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {row.progress!=="Completed" && (
                          <button onClick={()=>markComplete(row.id)} className="text-green-400 hover:text-green-300 transition-colors" title="Mark complete">
                            <CheckCircle size={14}/>
                          </button>
                        )}
                        <button onClick={()=>openEdit(row)} className="text-bo-subtle hover:text-bo-orange transition-colors"><Edit2 size={14}/></button>
                        <button onClick={()=>del(row.id)} className="text-bo-subtle hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="text-bo-subtle text-center py-12">No projects match your filters.</div>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="create"?"New Design Task":"Edit Task"} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Task Name *</label>
              <input className="bo-input w-full" value={form.task} onChange={fld("task")} placeholder="e.g. Off-season Hero Banner"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Description</label>
              <textarea className="bo-input w-full min-h-[80px] resize-y" value={form.description} onChange={fld("description")} placeholder="Creative brief, specs, context…"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Uses / Channel</label>
                <select className="bo-input w-full" value={form.uses} onChange={fld("uses")}>
                  <option value="">Select…</option>
                  {USES.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Format</label>
                <input className="bo-input w-full" value={form.format} onChange={fld("format")} placeholder="e.g. 1920x1080"/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Priority</label>
                <select className="bo-input w-full" value={form.priority} onChange={fld("priority")}>
                  {PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Due Date</label>
                <input type="date" className="bo-input w-full" value={form.due_date} onChange={fld("due_date")}/>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Status</label>
                <select className="bo-input w-full" value={form.progress} onChange={fld("progress")}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Assets / Source URL</label>
              <input className="bo-input w-full" value={form.assets} onChange={fld("assets")} placeholder="SharePoint, Figma, or reference link…"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Finished Content Link</label>
              <input className="bo-input w-full" value={form.link} onChange={fld("link")} placeholder="Figma, SharePoint, YouTube…"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={!form.task||saving} className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving?"Saving…":modal==="create"?"Create Task":"Save Changes"}
              </button>
              <button onClick={()=>setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail modal */}
      {modal==="detail" && selected && (
        <Modal title={selected.task||"Project Detail"} onClose={()=>setModal(null)} size="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={priorityColor(selected.priority)}>{selected.priority}</span>
              <span className={progressColor(selected.progress)}>{selected.progress}</span>
              <span className="text-bo-subtle text-xs ml-auto">Due {formatDate(selected.due_date)}</span>
            </div>
            {selected.description && (
              <div>
                <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">Description</div>
                <p className="text-bo-text text-sm leading-relaxed bg-bo-surface rounded-lg p-3">{selected.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {selected.uses && <div><div className="text-[11px] text-bo-subtle mb-1">Channel</div><div className="text-sm text-bo-text">{selected.uses}</div></div>}
              {selected.format && <div><div className="text-[11px] text-bo-subtle mb-1">Format</div><div className="text-sm text-bo-text">{selected.format}</div></div>}
            </div>
            {selected.assets && (
              <div>
                <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">Source Assets</div>
                {selected.assets.startsWith("http")
                  ? <a href={selected.assets} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">
                      Open Assets <ExternalLink size={13}/>
                    </a>
                  : <p className="text-sm text-bo-text bg-bo-surface rounded-lg p-3">{selected.assets}</p>}
              </div>
            )}
            {selected.link && (
              <div>
                <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">Finished Content</div>
                {selected.link.startsWith("http")
                  ? <a href={selected.link} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">
                      View Finished Work <ExternalLink size={13}/>
                    </a>
                  : <p className="text-sm text-bo-text">{selected.link}</p>}
              </div>
            )}
            <div className="flex gap-3 pt-2 border-t border-bo-border">
              {selected.progress!=="Completed" && (
                <button onClick={()=>{ markComplete(selected.id); setModal(null); }}
                  className="bo-btn-primary flex items-center gap-1.5">
                  <CheckCircle size={14}/> Mark Complete
                </button>
              )}
              <button onClick={()=>openEdit(selected)} className="bo-btn-ghost flex items-center gap-1.5">
                <Edit2 size={14}/> Edit
              </button>
              <button onClick={()=>{ del(selected.id); setModal(null); }} className="bo-btn-ghost text-red-400 border-red-500/30 hover:bg-red-900/20 ml-auto">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
