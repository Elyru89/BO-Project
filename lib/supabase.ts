import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://uivnfojktrepxuwkphko.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_qddNbA66UGhEgXCNW4Qmww_qehtj2_N";

export const supabase = createClient(url, key);
