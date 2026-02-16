import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Variables Supabase manquantes. Créez le fichier lvmh-analytics/.env.local avec :\n" +
      "NEXT_PUBLIC_SUPABASE_URL=votre_url\n" +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon"
  );
}

// Client Supabase pour usage côté client (React components)
// Utilise la clé publishable ou anon pour l'authentification
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
