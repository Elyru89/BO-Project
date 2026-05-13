"use client";
import { useState, useEffect, useMemo } from "react";
import { Table2, Search, Download, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

type PDP = {
  id: string; part_number: string; name: string;
  pdp_image_suite: boolean; lifestyle_images: boolean; hover_image: boolean;
  images_fully_updated: boolean; pdp_teaser: boolean; pdp_bullets: boolean;
  gmc_title: boolean; gmc_description: boolean; search_terms: boolean;
  all_text_completed: boolean; fully_completed: boolean;
  image_due_date: string; text_due_date: string; notes: string;
};

const BOOL_FIELDS: (keyof PDP)[] = [
  "pdp_image_suite","lifestyle_images","hover_image","images_fully_updated",
  "pdp_teaser","pdp_bullets","gmc_title","gmc_description","search_terms",
  "all_text_completed","fully_completed"
];
const BLANK = { part_number:"", name:"", pdp_image_suite:false, lifestyle_images:false,
  hover_image:false, images_fully_updated:false, pdp_teaser:false, pdp_bullets:false,
  gmc_title:false, gmc_description:false, search_terms:false,
  all_text_completed:false, fully_completed:false,
  image_due_date:"", text_due_date:"", notes:"" };

const PAGE_SIZE = 50;

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={e=>{ e.stopPropagation(); onChange(); }}
      className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0
        ${checked ? "bg-green-500 border-green-500 text-white" : "border-bo-muted hover:border-bo-orange bg-transparent"}`}>
      {checked && <span className="text-[10px] font-bold">✓</span>}
    </button>
  );
}

export default function PDPTracker() {
  const [data, setData]         = useState<PDP[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all"|"complete"|"incomplete"|"partial">("all");
  const [page, setPage]         = useState(0);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState<typeof BLANK>(BLANK);
  const [saving, setSaving]     = useState(false);
  const [toggling, setToggling] = useState<string|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("pdp_tracker").select("*").order("name");
    setData(rows ?? []);
    setLoading(false);
  }

  async function toggle(id: string, field: keyof PDP, current: boolean) {
    setToggling(`${id}-${String(field)}`);
    const updates: Partial<PDP> & { updated_at: string } = {
      [field]: !current, updated_at: new Date().toISOString()
    };
    // Auto-compute derived fields
    const row = data.find(r=>r.id===id);
    if (row) {
      const newRow = { ...row, [field]: !current };
      const imgDone = newRow.pdp_image_suite && newRow.lifestyle_images && newRow.hover_image;
      const txtDone = newRow.pdp_teaser && newRow.pdp_bullets && newRow.gmc_title && newRow.gmc_description && newRow.search_terms;
      updates.images_fully_updated = imgDone;
      updates.all_text_completed = txtDone;
      updates.fully_completed = imgDone && txtDone;
    }
    await supabase.from("pdp_tracker").update(updates).eq("id", id);
    setData(prev => prev.map(r => r.id===id ? { ...r, ...updates } as PDP : r));
    setToggling(null);
  }

  async function addSKU() {
    setSaving(true);
    await supabase.from("pdp_tracker").insert({ ...form, updated_at: new Date().toISOString() });
    setSaving(false);
    setModal(false);
    setForm(BLANK);
    load();
  }

  const filtered = useMemo(() => data.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.part_number?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q);
    const matchF = filter==="all" ? true
      : filter==="complete" ? r.fully_completed
      : filter==="incomplete" ? (!r.images_fully_updated && !r.all_text_completed)
      : (r.images_fully_updated || r.all_text_completed) && !r.fully_completed;
    return matchQ && matchF;
  }), [data, search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE);
  const completed = data.filter(r=>r.fully_completed).length;
  const imgDone = data.filter(r=>r.images_fully_updated).length;
  const txtDone = data.filter(r=>r.all_text_completed).length;

  const COL_HEADERS = [
    {key:"pdp_image_suite",    label:"Img Suite"},
    {key:"lifestyle_images",   label:"Lifestyle"},
    {key:"hover_image",        label:"Hover"},
    {key:"images_fully_updated",label:"Imgs ✓"},
    {key:"pdp_teaser",         label:"Teaser"},
    {key:"pdp_bullets",        label:"Bullets"},
    {key:"gmc_title",          label:"GMC Title"},
    {key:"gmc_description",    label:"GMC Desc"},
    {key:"search_terms",       label:"Search"},
    {key:"all_text_completed", label:"Text ✓"},
    {key:"fully_completed",    label:"DONE"},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="PDP Tracker" subtitle={`${data.length} SKUs · Click any checkbox to toggle`} icon={Table2}>
        <button onClick={()=>setModal(true)} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> Add SKU
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"Fully Done",    val:completed, total:data.length, color:"green" as const},
          {label:"Images Done",   val:imgDone,   total:data.length, color:"teal" as const},
          {label:"Text Done",     val:txtDone,   total:data.length, color:"orange" as const},
          {label:"Remaining",     val:data.length-completed, total:data.length, color:"yellow" as const},
        ].map(s=>(
          <div key={s.label} className="bo-card p-4">
            <div className="text-bo-subtle text-xs uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-bold text-bo-text mb-2">{s.val.toLocaleString()}</div>
            <ProgressBar value={s.total ? Math.round((s.val/s.total)*100) : 0} color={s.color} size="sm"/>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle"/>
          <input className="bo-input w-full pl-9 text-sm" placeholder="Search part # or name…"
            value={search} onChange={e=>{ setSearch(e.target.value); setPage(0); }}/>
        </div>
        {(["all","complete","incomplete","partial"] as const).map(f=>(
          <button key={f} onClick={()=>{ setFilter(f); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
              ${filter===f?"bg-bo-orange text-white":"bg-bo-surface border border-bo-border text-bo-subtle hover:text-bo-text"}`}>{f}</button>
        ))}
      </div>

      <div className="text-bo-subtle text-xs">{filtered.length.toLocaleString()} SKUs shown · {page>0?`Page ${page+1} of ${totalPages}`:""}</div>

      {loading ? (
        <div className="text-bo-subtle text-center py-12">Loading SKUs…</div>
      ) : (
        <div className="bo-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bo-border bg-bo-surface/50">
                  <th className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3 whitespace-nowrap">Part #</th>
                  <th className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3">Name</th>
                  {COL_HEADERS.map(h=>(
                    <th key={h.key} className={`text-center text-[11px] font-semibold uppercase tracking-wider px-2 py-3 whitespace-nowrap
                      ${h.key==="fully_completed"?"text-green-400":"text-bo-subtle"}`}>{h.label}</th>
                  ))}
                  <th className="text-left text-[11px] font-semibold text-bo-subtle uppercase tracking-wider px-3 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row=>(
                  <tr key={row.id} className={`border-b border-bo-border/40 hover:bg-bo-surface/20 transition-colors
                    ${row.fully_completed?"border-l-2 border-l-green-500/40":""}`}>
                    <td className="px-3 py-2 font-mono text-xs text-bo-orange whitespace-nowrap">{row.part_number||"—"}</td>
                    <td className="px-3 py-2 text-bo-text text-xs max-w-[200px]">
                      <span className="line-clamp-2" title={row.name}>{row.name||"—"}</span>
                    </td>
                    {COL_HEADERS.map(h=>(
                      <td key={h.key} className="px-2 py-2 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={!!row[h.key as keyof PDP]}
                            onChange={()=>toggle(row.id, h.key as keyof PDP, !!row[h.key as keyof PDP])}/>
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2 text-bo-subtle text-xs max-w-[160px]">
                      <span className="line-clamp-2" title={row.notes||""}>{row.notes||"—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-bo-border">
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                className="bo-btn-ghost text-xs disabled:opacity-40">← Prev</button>
              <span className="text-bo-subtle text-xs">Page {page+1} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                className="bo-btn-ghost text-xs disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <Modal title="Add New SKU" onClose={()=>setModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Part Number</label>
                <input className="bo-input w-full" value={form.part_number}
                  onChange={e=>setForm(f=>({...f,part_number:e.target.value}))} placeholder="260-0533-CP"/>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Product Name</label>
                <input className="bo-input w-full" value={form.name}
                  onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Product name…"/>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-2">Initial Completion Status</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {k:"pdp_image_suite",l:"PDP Image Suite"},{k:"lifestyle_images",l:"Lifestyle Images"},
                  {k:"hover_image",l:"Hover Image"},{k:"pdp_teaser",l:"PDP Teaser"},
                  {k:"pdp_bullets",l:"PDP Bullets"},{k:"gmc_title",l:"GMC Title"},
                  {k:"gmc_description",l:"GMC Description"},{k:"search_terms",l:"Search Terms"},
                ].map(({k,l})=>(
                  <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!form[k as keyof typeof BLANK]}
                      onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))}
                      className="w-3.5 h-3.5 accent-orange-500"/>
                    <span className="text-xs text-bo-text">{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Notes</label>
              <textarea className="bo-input w-full min-h-[60px] resize-y" value={form.notes}
                onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any special notes…"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={addSKU} disabled={!form.part_number&&!form.name||saving}
                className="bo-btn-primary flex-1 disabled:opacity-50">{saving?"Saving…":"Add SKU"}</button>
              <button onClick={()=>setModal(false)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
