"use client";
import { useState, useEffect } from "react";
import { Megaphone, Plus, Play, ExternalLink, Edit2, CheckCircle, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";

type VideoAd = { id:string; ad_to_create:string; products_to_promote:string; notes:string; content_to_utilize:string; actionable:boolean; };
const BLANK = { ad_to_create:"", products_to_promote:"", notes:"", content_to_utilize:"", actionable:false };

export default function VideoAds() {
  const [data, setData]       = useState<VideoAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [modal, setModal]     = useState<"create"|"edit"|null>(null);
  const [selected, setSelected] = useState<VideoAd|null>(null);
  const [form, setForm]       = useState<typeof BLANK>(BLANK);
  const [saving, setSaving]   = useState(false);

  useEffect(()=>{ load(); },[]);
  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("video_ads").select("*").order("created_at", { ascending:false });
    setData(rows ?? []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    if (modal==="create") await supabase.from("video_ads").insert({ ...form, updated_at:new Date().toISOString() });
    else if (modal==="edit"&&selected) await supabase.from("video_ads").update({ ...form, updated_at:new Date().toISOString() }).eq("id",selected.id);
    setSaving(false); setModal(null); load();
  }

  async function toggleActionable(id:string, cur:boolean) {
    await supabase.from("video_ads").update({ actionable:!cur, updated_at:new Date().toISOString() }).eq("id",id);
    setData(prev=>prev.map(r=>r.id===id?{...r,actionable:!cur}:r));
  }

  async function del(id:string) {
    if (!confirm("Delete this ad spec?")) return;
    await supabase.from("video_ads").delete().eq("id",id);
    load();
  }

  function openEdit(r:VideoAd) {
    setSelected(r);
    setForm({ ad_to_create:r.ad_to_create, products_to_promote:r.products_to_promote||"",
      notes:r.notes||"", content_to_utilize:r.content_to_utilize||"", actionable:r.actionable });
    setModal("edit");
  }

  const fld = (k:keyof typeof BLANK) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(f=>({...f,[k]:e.target.value}));

  const actionable = data.filter(r=>r.actionable).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Video Ads" subtitle={`Paid advertising specs — ${data.length} ads`} icon={Megaphone}>
        <button onClick={()=>{ setForm(BLANK); setModal("create"); }} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> New Ad Spec
        </button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-text">{data.length}</div><div className="text-bo-subtle text-xs">Total Specs</div></div>
        <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-green-400">{actionable}</div><div className="text-bo-subtle text-xs">Actionable Now</div></div>
        <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-orange">Meta</div><div className="text-bo-subtle text-xs">Primary Platform</div></div>
      </div>

      {loading ? <div className="text-bo-subtle text-center py-12">Loading…</div> : (
        <div className="space-y-3">
          {data.map(row=>(
            <div key={row.id} className={`bo-card overflow-hidden transition-all ${row.actionable?"border-green-500/30":""}`}>
              <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-bo-surface/30 transition-colors"
                onClick={()=>setExpanded(expanded===row.id?null:row.id)}>
                <div className="w-10 h-10 rounded-xl bg-bo-orange/10 border border-bo-orange/20 flex items-center justify-center flex-shrink-0">
                  <Play size={16} className="text-bo-orange"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-bo-text">{row.ad_to_create||"—"}</div>
                  {row.products_to_promote && <div className="text-bo-subtle text-xs mt-0.5 line-clamp-1">{row.products_to_promote}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={e=>{e.stopPropagation();toggleActionable(row.id,row.actionable)}}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors
                      ${row.actionable?"bo-badge-success":"bo-badge-muted hover:border-bo-orange"}`}>
                    {row.actionable ? <><CheckCircle size={10} className="inline mr-1"/>Actionable</> : "Mark Actionable"}
                  </button>
                  <button onClick={e=>{e.stopPropagation();openEdit(row)}} className="text-bo-subtle hover:text-bo-orange"><Edit2 size={14}/></button>
                  <button onClick={e=>{e.stopPropagation();del(row.id)}} className="text-bo-subtle hover:text-red-400"><Trash2 size={14}/></button>
                  <span className={`text-bo-subtle text-xs transition-transform ${expanded===row.id?"rotate-90":""}`}>▶</span>
                </div>
              </div>
              {expanded===row.id && (
                <div className="px-5 pb-5 pt-4 border-t border-bo-border/40 space-y-4">
                  {row.products_to_promote && (
                    <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Products to Promote</div>
                      <p className="text-bo-text text-sm bg-bo-surface rounded-lg p-3">{row.products_to_promote}</p></div>
                  )}
                  {row.notes && (
                    <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Creative Direction / Notes</div>
                      <p className="text-bo-text text-sm bg-bo-surface rounded-lg p-3 leading-relaxed">{row.notes}</p></div>
                  )}
                  {row.content_to_utilize && (
                    <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1.5">Content to Utilize</div>
                      {row.content_to_utilize.startsWith("http")
                        ? <a href={row.content_to_utilize} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">Open Source Material <ExternalLink size={12}/></a>
                        : <p className="text-sm text-bo-text">{row.content_to_utilize}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="create"?"New Ad Spec":"Edit Ad Spec"} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Ad to Create *</label>
              <input className="bo-input w-full" value={form.ad_to_create} onChange={fld("ad_to_create")} placeholder="e.g. Meta 30sec fillet table ad"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Products to Promote</label>
              <textarea className="bo-input w-full min-h-[60px] resize-y" value={form.products_to_promote} onChange={fld("products_to_promote")}/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Creative Direction / Notes</label>
              <textarea className="bo-input w-full min-h-[80px] resize-y" value={form.notes} onChange={fld("notes")} placeholder="Specs, tone, references…"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Content to Utilize</label>
              <input className="bo-input w-full" value={form.content_to_utilize} onChange={fld("content_to_utilize")} placeholder="SharePoint or source link…"/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.actionable} onChange={e=>setForm(f=>({...f,actionable:e.target.checked}))} className="w-4 h-4 accent-orange-500"/>
              <span className="text-sm text-bo-text">Actionable now</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={!form.ad_to_create||saving} className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving?"Saving…":modal==="create"?"Create Spec":"Save"}
              </button>
              <button onClick={()=>setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
