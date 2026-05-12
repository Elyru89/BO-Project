"use client";
import { useState, useEffect, useMemo } from "react";
import { Users, Plus, Search, ExternalLink, Edit2, Trash2, Youtube, Instagram } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";

type Influencer = { id:string; influencer:string; social_handles:string; channels:string;
  products_shown:string; social_post_links:string; raw_content_link:string; bo_repurposed_links:string; };
const BLANK = { influencer:"", social_handles:"", channels:"", products_shown:"",
  social_post_links:"", raw_content_link:"", bo_repurposed_links:"" };

function parseUrls(v:string|null):string[] {
  if (!v) return [];
  return v.split(/[\n,+]/).map(s=>s.trim()).filter(s=>s.startsWith("http"));
}
function SocialIcon({ url }:{url:string}) {
  if (url.includes("youtube")) return <Youtube size={11} className="text-red-400"/>;
  if (url.includes("instagram")||url.includes("insta")) return <Instagram size={11} className="text-pink-400"/>;
  if (url.includes("tiktok")) return <span className="text-[9px] font-bold">TT</span>;
  return <ExternalLink size={11} className="text-bo-subtle"/>;
}

export default function InfluencerHub() {
  const [data, setData]       = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState<"create"|"edit"|"detail"|null>(null);
  const [selected, setSelected] = useState<Influencer|null>(null);
  const [form, setForm]       = useState<typeof BLANK>(BLANK);
  const [saving, setSaving]   = useState(false);

  useEffect(()=>{ load(); },[]);
  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("influencer_posts").select("*").order("influencer");
    setData(rows ?? []);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    if (modal==="create") await supabase.from("influencer_posts").insert({ ...form, updated_at:new Date().toISOString() });
    else if (modal==="edit"&&selected) await supabase.from("influencer_posts").update({ ...form, updated_at:new Date().toISOString() }).eq("id",selected.id);
    setSaving(false); setModal(null); load();
  }

  async function del(id:string) {
    if (!confirm("Remove this influencer?")) return;
    await supabase.from("influencer_posts").delete().eq("id",id);
    load();
  }

  function openEdit(r:Influencer) {
    setSelected(r);
    setForm({ influencer:r.influencer, social_handles:r.social_handles||"", channels:r.channels||"",
      products_shown:r.products_shown||"", social_post_links:r.social_post_links||"",
      raw_content_link:r.raw_content_link||"", bo_repurposed_links:r.bo_repurposed_links||"" });
    setModal("edit");
  }

  const filtered = useMemo(()=>data.filter(r=>{
    const q = search.toLowerCase();
    return !q || r.influencer?.toLowerCase().includes(q) || r.social_handles?.toLowerCase().includes(q) || r.channels?.toLowerCase().includes(q);
  }),[data,search]);

  const fld = (k:keyof typeof BLANK) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <div className="space-y-6">
      <PageHeader title="Influencer Hub" subtitle={`${data.length} creator partnerships`} icon={Users}>
        <button onClick={()=>{ setForm(BLANK); setModal("create"); }} className="bo-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={14}/> Add Creator
        </button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-text">{data.length}</div><div className="text-bo-subtle text-xs">Total Creators</div></div>
        <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-text">{data.filter(r=>r.channels?.includes("YouTube")).length}</div><div className="text-bo-subtle text-xs">YouTube Partners</div></div>
        <div className="bo-card p-4 text-center"><div className="text-2xl font-bold text-bo-text">{data.filter(r=>parseUrls(r.bo_repurposed_links).length>0).length}</div><div className="text-bo-subtle text-xs">With BO Reposts</div></div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bo-subtle"/>
        <input className="bo-input w-full pl-9 text-sm" placeholder="Search creators, handles…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading ? <div className="text-bo-subtle text-center py-12">Loading…</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(row=>(
            <div key={row.id} className="bo-card p-5 hover:border-bo-orange/30 transition-all cursor-pointer"
              onClick={()=>{ setSelected(row); setModal("detail"); }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bo-orange to-orange-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {(row.influencer||"?").slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-bo-text">{row.influencer||"—"}</div>
                  {row.social_handles && <div className="text-bo-orange text-xs">{row.social_handles}</div>}
                  {row.channels && <div className="text-bo-subtle text-xs">{row.channels}</div>}
                </div>
                <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>openEdit(row)} className="text-bo-subtle hover:text-bo-orange"><Edit2 size={13}/></button>
                  <button onClick={()=>del(row.id)} className="text-bo-subtle hover:text-red-400"><Trash2 size={13}/></button>
                </div>
              </div>
              {row.products_shown && (
                <div className="mb-3">
                  <div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-1">Products</div>
                  <div className="text-xs text-bo-text line-clamp-2">{row.products_shown}</div>
                </div>
              )}
              {parseUrls(row.social_post_links).length > 0 && (
                <div className="flex gap-2 mt-2">
                  {parseUrls(row.social_post_links).slice(0,3).map((url,j)=>(
                    <a key={j} href={url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                      className="flex items-center gap-1 text-bo-teal hover:underline text-xs">
                      <SocialIcon url={url}/> Post {j+1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit */}
      {(modal==="create"||modal==="edit") && (
        <Modal title={modal==="create"?"Add Creator":"Edit Creator"} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Name *</label>
                <input className="bo-input w-full" value={form.influencer} onChange={fld("influencer")} placeholder="e.g. Capt Mike"/>
              </div>
              <div>
                <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Social Handles</label>
                <input className="bo-input w-full" value={form.social_handles} onChange={fld("social_handles")} placeholder="@handle"/>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Channels</label>
              <input className="bo-input w-full" value={form.channels} onChange={fld("channels")} placeholder="YouTube/Insta/TikTok"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Products Shown</label>
              <textarea className="bo-input w-full min-h-[60px] resize-y" value={form.products_shown} onChange={fld("products_shown")}/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Social Post Links (one per line)</label>
              <textarea className="bo-input w-full min-h-[70px] resize-y font-mono text-xs" value={form.social_post_links} onChange={fld("social_post_links")} placeholder="https://youtube.com/…&#10;https://instagram.com/…"/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">BO Repurposed Links (one per line)</label>
              <textarea className="bo-input w-full min-h-[60px] resize-y font-mono text-xs" value={form.bo_repurposed_links} onChange={fld("bo_repurposed_links")}/>
            </div>
            <div>
              <label className="text-[11px] text-bo-subtle uppercase tracking-wider block mb-1.5">Raw Content Link</label>
              <input className="bo-input w-full" value={form.raw_content_link} onChange={fld("raw_content_link")} placeholder="SharePoint or folder link…"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={!form.influencer||saving} className="bo-btn-primary flex-1 disabled:opacity-50">
                {saving?"Saving…":modal==="create"?"Add Creator":"Save"}
              </button>
              <button onClick={()=>setModal(null)} className="bo-btn-ghost">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail */}
      {modal==="detail" && selected && (
        <Modal title={selected.influencer} onClose={()=>setModal(null)} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {selected.social_handles && <div><div className="text-[11px] text-bo-subtle mb-1">Handle</div><div className="text-bo-orange font-medium">{selected.social_handles}</div></div>}
              {selected.channels && <div><div className="text-[11px] text-bo-subtle mb-1">Channels</div><div className="text-bo-text text-sm">{selected.channels}</div></div>}
            </div>
            {selected.products_shown && <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">Products Featured</div><p className="text-bo-text text-sm bg-bo-surface rounded-lg p-3">{selected.products_shown}</p></div>}
            {parseUrls(selected.social_post_links).length>0 && (
              <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">Social Posts</div>
                <div className="space-y-1.5">
                  {parseUrls(selected.social_post_links).map((url,j)=>(
                    <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-bo-teal hover:underline text-sm">
                      <SocialIcon url={url}/> {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {parseUrls(selected.bo_repurposed_links).length>0 && (
              <div><div className="text-[11px] text-bo-subtle uppercase tracking-wider mb-2">BO Repurposed Content</div>
                <div className="space-y-1.5">
                  {parseUrls(selected.bo_repurposed_links).map((url,j)=>(
                    <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-bo-teal hover:underline text-sm">
                      <SocialIcon url={url}/> {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {selected.raw_content_link && <div><div className="text-[11px] text-bo-subtle mb-1">Raw Content</div>
              {selected.raw_content_link.startsWith("http")
                ? <a href={selected.raw_content_link} target="_blank" rel="noopener noreferrer" className="text-bo-teal hover:underline flex items-center gap-1 text-sm">Open Folder <ExternalLink size={12}/></a>
                : <p className="text-sm text-bo-text">{selected.raw_content_link}</p>}
            </div>}
            <div className="flex gap-3 pt-2 border-t border-bo-border">
              <button onClick={()=>openEdit(selected)} className="bo-btn-ghost flex items-center gap-1.5"><Edit2 size={14}/> Edit</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
