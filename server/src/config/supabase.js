import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable Supabase storage",
  );
}

const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: { persistSession: false },
  },
);

export default supabase;
