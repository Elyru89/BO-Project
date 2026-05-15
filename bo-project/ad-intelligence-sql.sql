-- BO Command Center — Ad Intelligence Migration
-- Run this in Supabase → SQL Editor

-- ── Create creative_ad_library table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creative_ad_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name text NOT NULL,
  description text,
  original_use text,
  hook_type text,
  creative_style text,
  angle text,
  products_highlighted text,
  ad_in_rotation boolean DEFAULT false,
  channels_yt boolean DEFAULT false,
  channels_fb boolean DEFAULT false,
  channels_insta boolean DEFAULT false,
  channels_tiktok boolean DEFAULT false,
  ctr_prospecting numeric(6,4),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE creative_ad_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all"   ON creative_ad_library FOR SELECT USING (true);
CREATE POLICY "Write all"  ON creative_ad_library FOR INSERT WITH CHECK (true);
CREATE POLICY "Update all" ON creative_ad_library FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Delete all" ON creative_ad_library FOR DELETE USING (true);

-- ── Seed existing ads from Excel ──────────────────────────────────────────────
INSERT INTO creative_ad_library (asset_name, description, original_use, hook_type, creative_style, angle, products_highlighted, ad_in_rotation, channels_yt, channels_fb, channels_insta, channels_tiktok, ctr_prospecting) VALUES
('Pontoon Folding Table with Drawer', 'Check this out!', 'Paid Ad', 'Product Demo', 'Voiceover B-Roll', 'Tired of the old pop-up changing room taking up space on your pontoon?', 'Pontoon Folding table', true, true, true, true, true, 0.0142),
('Universal Transom Table: Built Tough for Fishing & Boating', 'Rigging, cutting, serving, grilling - all in one transom table', 'Paid Ad', 'Relatable Boater Pain Point', 'Fast-Cut Showcase', 'Adds usable rigging/prep space at the transom', 'Transom Rigging Table', true, true, true, true, true, 0.0236),
('Storage Solutions for Boats', 'Jason walking through custom tackle box on Freeman', 'Paid Ad', 'Problem/Solution', 'Product in Use Demo', 'Organizes boat gear with built-in console storage', 'Tackle box', true, true, true, true, true, 0.0283),
('Console Storage', 'Matt talking through console organization and ways to maximize space', 'Paid Ad', 'Unexpected Use/Lifestyle', 'Product in Use Demo', 'Never enough storage on a boat', 'storage nets, drawer units', true, false, true, true, true, 0.0344),
('3650 Tackle Box Storage Solutions', 'Capt Tommy before/after and installation testimonial on a tackle box', 'Creator Content', 'Social Proof/Customer Project', 'Installation/Process', 'Easy-access tackle tray storage for better organization', '3650 Tackle Storage', true, true, true, true, true, 0.0255),
('65 Qrt Cooler Slide', 'Jason showcasing the 65 qt cooler + benefits', 'Paid Ad', 'Authority/Expert Walkthrough', 'Product in Use Demo', 'Easier cooler access under leaning posts', 'Cooler Slide', true, true, true, true, true, 0.0333),
('Tilt Out Tackle Storage', 'Matt walkthrough of tilt out storage options', 'Paid Ad', 'Authority/Expert Walkthrough', 'Product in Use Demo', 'Built-in tackle storage without taking up deck space', 'Tilt Out Storage', true, true, true, true, true, 0.0085),
('Triple Offset Rod Holder With Rigging Tray', 'Matt''s walkthrough on the offset rigging tray', 'Paid Ad', 'Authority/Expert Walkthrough', 'Product in Use Demo', 'Combines rod storage and rigging space in one mount', 'Offset rigging tray', false, false, false, false, false, 0.0227),
('Boat Parts Built for Real Boaters', 'Capt Mike on the water showing the bucket holder and fire ext.', 'Creator Content', 'Authority/Expert Walkthrough', 'UGC/Testimonial', 'Practical, durable upgrades for serious boat owners', 'bucket holder, fire extinguisher bracket, fillet tables', true, true, true, true, true, 0.0062),
('The Right Fish Cleaning Table for Your Dock', 'Edgy, hype video for our fillet tables', 'Creator Content', 'Problem/Solution', 'Text Overlay Video', 'Dock fish-cleaning setup / choosing the right table', 'Dock Fillet Tables', true, true, true, true, true, 0.0316),
('Best Invention Since Sliced Bread', 'Capt Mike talks about the bucket holder and tool holder', 'Organic', 'Product Demo', 'Product in Use Demo', 'This might be one of the best boat upgrades out there.', 'Bucket Holder', true, true, true, true, true, 0.0219),
('Probably the EASIEST Upgrade You''ll Make', '"spotted" - rod holder fillet table', 'Organic', 'Social Proof/Customer Project', 'Voiceover B-Roll', 'Easy add-on workspace for rigging and filleting', 'Rod Holder Mount Fillet Table', false, false, false, false, false, NULL),
('Switch out your Pontoon Changing Room with THIS!', 'Struggling with pontoon changing station and then wala, new table', 'Organic', 'Problem/Solution', 'Fast-Cut Showcase', 'Turns unused changing-room space into functional table/storage', 'Pontoon Table', false, false, false, false, false, NULL),
('Hey, your boat''s missing this.', 'Entertainment table being used - pouring drinks and chilling at the sandbar', 'Organic', 'Product Demo', 'Fast-Cut Showcase', 'Adds convenience, drink storage, and extra surface space', 'Entertainment Table', false, false, false, false, false, NULL);
