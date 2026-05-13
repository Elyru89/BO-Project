-- BO Command Center — Supabase Schema
-- Paste this entire file into Supabase → SQL Editor → Run

-- Darwin Projects (Design tasks)
create table if not exists darwin_projects (
  id uuid default gen_random_uuid() primary key,
  task text,
  description text,
  assets text,
  uses text,
  format text,
  priority text,
  due_date date,
  progress text default 'Pending',
  link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Video Projects
create table if not exists video_projects (
  id uuid default gen_random_uuid() primary key,
  task text,
  description text,
  assets text,
  paid_ads boolean default false,
  website boolean default false,
  organic boolean default false,
  teak_isle boolean default false,
  format text,
  due_date date,
  progress text default 'Pending',
  assets_created integer default 0,
  ad_launch_date date,
  finished_video_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Completed Videos Archive
create table if not exists completed_videos (
  id uuid default gen_random_uuid() primary key,
  description text,
  video_url text,
  paid_ads boolean default false,
  website boolean default false,
  organic boolean default false,
  boosted boolean default false,
  teak_isle boolean default false,
  post_link text,
  created_at timestamptz default now()
);

-- Brand Banners
create table if not exists brand_banners (
  id uuid default gen_random_uuid() primary key,
  brand text,
  added_to_klevu boolean default false,
  banner_completed boolean default false,
  meta_titles text,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PDP Tracker
create table if not exists pdp_tracker (
  id uuid default gen_random_uuid() primary key,
  part_number text,
  name text,
  pdp_image_suite boolean default false,
  lifestyle_images boolean default false,
  hover_image boolean default false,
  images_fully_updated boolean default false,
  pdp_teaser boolean default false,
  pdp_bullets boolean default false,
  gmc_title boolean default false,
  gmc_description boolean default false,
  search_terms boolean default false,
  all_text_completed boolean default false,
  fully_completed boolean default false,
  website_live boolean default false,
  image_due_date date,
  text_due_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Influencer Posts
create table if not exists influencer_posts (
  id uuid default gen_random_uuid() primary key,
  influencer text,
  social_handles text,
  channels text,
  products_shown text,
  social_post_links text,
  raw_content_link text,
  bo_repurposed_links text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Video Ads
create table if not exists video_ads (
  id uuid default gen_random_uuid() primary key,
  ad_to_create text,
  products_to_promote text,
  notes text,
  content_to_utilize text,
  actionable boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (open for internal tool)
alter table darwin_projects enable row level security;
alter table video_projects enable row level security;
alter table completed_videos enable row level security;
alter table brand_banners enable row level security;
alter table pdp_tracker enable row level security;
alter table influencer_posts enable row level security;
alter table video_ads enable row level security;

-- Allow all access (internal tool, no auth needed yet)
create policy "Allow all" on darwin_projects for all using (true) with check (true);
create policy "Allow all" on video_projects for all using (true) with check (true);
create policy "Allow all" on completed_videos for all using (true) with check (true);
create policy "Allow all" on brand_banners for all using (true) with check (true);
create policy "Allow all" on pdp_tracker for all using (true) with check (true);
create policy "Allow all" on influencer_posts for all using (true) with check (true);
create policy "Allow all" on video_ads for all using (true) with check (true);
