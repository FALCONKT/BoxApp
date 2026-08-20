// Supabaseクライアントの初期化。
// Project URL / Publishable Key は .env で管理し、リポジトリにはコミットしない（.gitignore対象）。
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
