"""
BO Command Center — Supabase Seed Script
Run: python3 seed.py
Requires: pip3 install requests
"""
import json, requests
from pathlib import Path

SUPABASE_URL = "https://uivnfojktrepxuwkphko.supabase.co"
SUPABASE_KEY = "sb_publishable_qddNbA66UGhEgXCNW4Qmww_qehtj2_N"
DATA_DIR = Path(__file__).parent / "data"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def clean(v):
    if v is None or (isinstance(v, float) and v != v): return None
    if isinstance(v, str) and v.strip() in ("", "null", "None", "NaT"): return None
    return v

def safe_bool(v):
    if v is True or v == 1 or str(v).lower() == "true": return True
    if v is False or v == 0 or str(v).lower() == "false": return False
    return None

def safe_date(v):
    if not v or str(v).startswith("NaT"): return None
    try:
        s = str(v)[:10]
        if len(s) == 10 and "-" in s: return s
    except: pass
    return None

def insert(table, records):
    cleaned = [r for r in records if any(v is not None for v in r.values())]
    batch = 100
    ok = 0
    for i in range(0, len(cleaned), batch):
        chunk = cleaned[i:i+batch]
        r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=chunk)
        if r.status_code < 300:
            ok += len(chunk)
        else:
            print(f"  ⚠ Error batch {i//batch}: {r.status_code} {r.text[:120]}")
    print(f"  ✓ {table}: {ok}/{len(cleaned)} inserted")

def load(filename):
    with open(DATA_DIR / filename) as f:
        return json.load(f)

print("\n🚀 Seeding BO Command Center database...\n")

# ── Darwin Projects ──────────────────────────────────────────────────────
raw = load("darwin_projects.json")
rows = []
for r in raw:
    rows.append({
        "task":        clean(r.get("Task")),
        "description": clean(r.get("Description")),
        "assets":      clean(r.get("Assets")),
        "uses":        clean(r.get("Uses")),
        "format":      clean(r.get("Format")),
        "priority":    clean(r.get("Priority")),
        "due_date":    safe_date(r.get("Due Date")),
        "progress":    clean(r.get("Progress")) or "Pending",
        "link":        clean(r.get("Link to Finished Content")),
    })
insert("darwin_projects", rows)

# ── Video Projects ───────────────────────────────────────────────────────
raw = load("video_projects.json")
rows = []
for r in raw:
    rows.append({
        "task":                clean(r.get("Task")),
        "description":         clean(r.get("Description")),
        "assets":              clean(r.get("Assets")),
        "paid_ads":            safe_bool(r.get("Paid Ads")),
        "website":             safe_bool(r.get("Website") or r.get("Unnamed: 6")),
        "organic":             safe_bool(r.get("Organic")),
        "teak_isle":           safe_bool(r.get("Teak Isle") or r.get("Unnamed: 9")),
        "format":              clean(r.get("Format")),
        "due_date":            safe_date(r.get("Due Date")),
        "progress":            clean(r.get("Progress")) or "Pending",
        "assets_created":      int(r["# Assets Created"]) if r.get("# Assets Created") and str(r["# Assets Created"]).replace(".","").isdigit() else 0,
        "ad_launch_date":      safe_date(r.get("AD Launch Date")),
        "finished_video_link": clean(r.get("Finished Video Link")),
    })
insert("video_projects", rows)

# ── Completed Videos ─────────────────────────────────────────────────────
raw = load("completed_videos.json")
rows = []
for r in raw:
    rows.append({
        "description": clean(r.get("Description")),
        "video_url":   clean(r.get("Video URL")),
        "paid_ads":    safe_bool(r.get("Paid Ads")),
        "website":     safe_bool(r.get("Website")),
        "organic":     safe_bool(r.get("Organic")),
        "boosted":     safe_bool(r.get("Boosted")),
        "teak_isle":   safe_bool(r.get("Teak Isle")),
        "post_link":   clean(r.get("Post Link")),
    })
insert("completed_videos", rows)

# ── Brand Banners ────────────────────────────────────────────────────────
raw = load("brand_banners.json")
rows = []
for r in raw:
    rows.append({
        "brand":            clean(r.get("Brand")),
        "added_to_klevu":   safe_bool(r.get("Added to Klevu")),
        "banner_completed": safe_bool(r.get("Banner Completed?")),
        "meta_titles":      clean(r.get("Meta Titles & Des.")),
        "due_date":         safe_date(r.get("Due Date")),
    })
insert("brand_banners", rows)

# ── PDP Tracker (500 seed records) ──────────────────────────────────────
raw = load("pdp_tracker.json")
rows = []
for r in raw:
    rows.append({
        "part_number":         clean(r.get("PartNumber")),
        "name":                clean(r.get("Name")),
        "pdp_image_suite":     safe_bool(r.get("PDP Image Suite")),
        "lifestyle_images":    safe_bool(r.get("Lifestyle Images")),
        "hover_image":         safe_bool(r.get("Hover Image")),
        "images_fully_updated":safe_bool(r.get("Images Fully Updated?")),
        "pdp_teaser":          safe_bool(r.get("PDP Teaser")),
        "pdp_bullets":         safe_bool(r.get("PDP Bullets")),
        "gmc_title":           safe_bool(r.get("GMC Title")),
        "gmc_description":     safe_bool(r.get("GMC Description")),
        "search_terms":        safe_bool(r.get("Search Terms")),
        "all_text_completed":  safe_bool(r.get("All Text Completed?")),
        "fully_completed":     safe_bool(r.get("Fully Completed")),
        "image_due_date":      safe_date(r.get("Image Suite Due Date")),
        "text_due_date":       safe_date(r.get("Texts Due Date")),
        "notes":               clean(r.get("Notes")),
    })
insert("pdp_tracker", rows)

# ── Influencer Posts ─────────────────────────────────────────────────────
raw = load("influencer_posts.json")
rows = []
for r in raw:
    rows.append({
        "influencer":        clean(r.get("Influencer")),
        "social_handles":    clean(r.get("Social Handles")),
        "channels":          clean(r.get("Channels")),
        "products_shown":    clean(r.get("Products Shown")),
        "social_post_links": clean(r.get("Social Post Links")),
        "raw_content_link":  clean(r.get("Raw Content Link")),
        "bo_repurposed_links": clean(r.get("BO Repurposed Video Links")),
    })
insert("influencer_posts", rows)

# ── Video Ads ────────────────────────────────────────────────────────────
raw = load("video_ads.json")
rows = []
for r in raw:
    rows.append({
        "ad_to_create":       clean(r.get("Ad to Create")),
        "products_to_promote": clean(r.get("Products to Promote")),
        "notes":              clean(r.get("Notes")),
        "content_to_utilize": clean(r.get("Content to Utilize")),
        "actionable":         safe_bool(r.get("Actionable?")),
    })
insert("video_ads", rows)

print("\n✅ Seed complete! Open your app to see live data.\n")
