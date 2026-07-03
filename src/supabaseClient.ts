import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Supabase URL missing");
}

// REPLACE THESE WITH YOUR ACTUAL SUPABASE VALUES WITH ENV FALLBACK
const DEFAULT_URL = "https://ltmtgirkowbjwbrpvgdd.supabase.co";
const DEFAULT_KEY = "sb_publishable_neMM_YXw0cnkz7soAFiHwA_vgaxt9bN";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_URL;
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, "");
const SUPABASE_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
