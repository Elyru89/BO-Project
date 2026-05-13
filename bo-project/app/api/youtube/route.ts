import { NextRequest, NextResponse } from "next/server";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 503 });
  }

  const { urls } = await req.json() as { urls: string[] };
  if (!urls?.length) return NextResponse.json({ stats: {} });

  // Extract IDs from URLs
  const idMap: Record<string, string> = {};
  for (const url of urls) {
    const id = extractYouTubeId(url);
    if (id) idMap[url] = id;
  }

  const ids = [...new Set(Object.values(idMap))];
  if (!ids.length) return NextResponse.json({ stats: {} });

  // Batch fetch up to 50 at a time
  const allItems: Record<string, {
    viewCount: string; likeCount: string; commentCount: string; title: string; thumbnail: string;
  }> = {};

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${batch}&part=statistics,snippet&key=${apiKey}`,
      { next: { revalidate: 3600 } } // cache 1 hour
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const item of data.items ?? []) {
      allItems[item.id] = {
        viewCount:    item.statistics?.viewCount    ?? "0",
        likeCount:    item.statistics?.likeCount    ?? "0",
        commentCount: item.statistics?.commentCount ?? "0",
        title:        item.snippet?.title           ?? "",
        thumbnail:    item.snippet?.thumbnails?.medium?.url ?? "",
      };
    }
  }

  // Map back url → stats
  const stats: Record<string, typeof allItems[string]> = {};
  for (const [url, vid] of Object.entries(idMap)) {
    if (allItems[vid]) stats[url] = allItems[vid];
  }

  return NextResponse.json({ stats });
}
