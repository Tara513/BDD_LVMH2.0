import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars manquantes dans .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

