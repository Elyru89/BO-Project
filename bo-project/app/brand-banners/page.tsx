"use client";
import { useState, useEffect, useMemo } from "react";
import { Image, Search, CheckCircle, XCircle, Plus, Edit2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";

type Banner = { id:string; brand:string; added_to_klevu:boolean; banner_completed:boolean; meta_titles:string; due_date:string; };
const BLANK = { brand:"", added_to_klevu:false, banner_completed:false, meta_titles:"", due_date:"" };

export default function BrandBanners() {
  const [data, setData]       = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"all"|"complete"|"pending">("all");
  const [modal, setModal]     = useState<"create"|"edit"|null>(null);
  const [selected, setSelected] = useState<Banner|null>(null);
  const [form, setForm]       = useState<typeof BLANK>(BLANK);
  const [saving, setSaving]   = useState(false);

  useEffect(()=>{ load(); },[]);
  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("brand_banners").select("*").order("brand");
    setData(rows ?? []);
    setLoading(false);
  }

  async function toggle(id:string, field:"banner_completed"|"added_to_klevu", cur:boolean) {
    await supabase.from("brand_banners").update({ [field]:!cur, updated_at:new Date().toISOString() }).eq("id",id);
    setData(prev=>prev.map(r=>r.id===id?{...r,[field]:!cur}:r));
  }

  async function save() {
    setSaving(true);
    if (modal==="create") await supabase.from("brand_banners").insert({ ...form, updated_at:new Date().toISOString() });
    else if (modal==="edit"&&selected) await supabase.from("brand_banners").update({ ...form, updated_at:new Date().toISOString() }).eq("id",selected.id);
    setSaving(false); setModal(null); load();
  }

  function openEdit(b:Banner) {
    setSelected(b);
    setForm({ brand:b.brand, added_to_klevu:b.added_to_klevu, banner_completed:b.banner_completed,
      meta_titles:b.meta_titles||"", due_date:b.due_date?.slice(0,10)||"" });
    setModal("edit");
  }

  const filtered = useMemo(()=>data.filter(r=>{
    const matchQ = !search || r.brand?.toLowerCase().includes(search.toLowerCase());
    const matchF = filter==="all"?true:filter==="complete"?r.banner_completed:!r.banner_completed;
    return matchQ && matchF;
  }),[data,search,filter]);

  const completed = data.filter(r=>r.banner_completed).length;
  const klevu = data.filter(r=>r.added_to_klevu).length;
  const pct = data.length ? Math.round((completed/data.length)*100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Brand Banners" subtitle={`${data.length} partner brands`} icon={Image}>
        <button onClick={()=>{ setForm(BLANK); setModal("create"); }} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> Add Brand
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bo-card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div><div className="text-2xl font-bold text-bo-text">{completed} <span className="text-bo-subtle text-base font-normal">of {data.length}</span></div>
              <div className="text-bo-subtle text-sm">Banners Completed</div></div>
            <div className="text-3xl font-black text-bo-orange">{pct}%</div>
          </div>
          <ProgressBar value={pct} color="orange"/>
        </div>
        <div className="bo-card p-5">
          <div className="text-2xl font-bold text-bo-text mb-1">{klevu}</div>
          <div className="text-bo-subtle text-sm mb-2">Added to Klevu</div>
          <ProgressBar value={data.length?Math.round((klevu/data.length)*100):0} color="teal" size="sm"/>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle"/>
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search brands…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {(["all","complete","pending"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
              ${filter===f?"bg-bo-orange text-white":"bg-bo-surface border border-bo-border text-bo-subtle hover:text-bo-text"}`}>{f}</button>
        ))}
      </div>

      {loading ? <div className="text-bo-subtle text-center py-12">Loading…</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(row=>(
            <div key={row.id} className={`bo-card p-4 hover:border-bo-orange/30 transition-all ${row.banner_completed?"border-green-500/20":""}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="font-semibold text-bo-text text-sm">{row.brand||"—"}</div>
                <div className="flex gap-1.5">
                  <button onClick={()=>openEdit(row)} className="text-bo-subtle hover:text-bo-orange"><Edit2 size={13}/></button>
                  {row.banner_completed ? <CheckCircle size={15} className="text-green-400"/> : <XCircle size={15} className="text-bo-muted"/>}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-bo-subtle">Banner</span>
                  <button onClick={()=>toggle(row.id,"banner_completed",row.banner_completed)}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors
                      ${row.banner_completed?"bg-green-900/40 text-green-400 border-green-800/50":"bg-bo-muted/30 text-bo-subtle border-bo-border hover:border-bo-orange"}`}>
                    {row.banner_completed?"Complete":"Mark Done"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-bo-subtle">Klevu</span>
                  <button onClick={()=>toggle(row.id,"added_to_klevu",row.added_to_klevu)}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors
                      ${row.added_to_klevu?"bg-sky-900/40 text-sky-400 border-sky-800/50":"bg-bo-muted/30 text-bo-subtle border-bo-border hover:border-bo-orange"}`}>
                    {row.added_to_klevu?"Added":"Add"}
                  </button>
                </div>
                {row.meta_titles && <div className="text-[11px] text-bo-muted pt-1 border-t border-bo-border/40">{row.meta_titles}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="create"?"Add Brand Banner":"Edit Brand Banner"} onClose={()=>setModal(null)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Brand Name *</label>
              <input className="bo-input w-full" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} placeholder="e.g. Sierra"/>
            </div>
            <div className="flex gap-4">
              {([["banner_completed","Banner Complete"],["added_to_klevu","Added to Klevu"]] as const).map(([k,l])=>(
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))} className="w-4 h-4 accent-orange-500"/>
                  <span className="text-sm text-bo-text">{l}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Meta Titles / Notes</label>
              <input className="bo-input w-full" value={form.meta_titles} onChange={e=>setForm(f=>({...f,meta_titles:e.target.value}))}/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Due Date</label>
              <input type="date" className="bo-input w-full" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={!form.brand||saving} className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving?"Saving…":modal==="create"?"Add Brand":"Save"}
              </button>
              <button onClick={()=>setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
