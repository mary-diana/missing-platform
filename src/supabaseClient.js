import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://kspwepcgqvmqxefjyzeb.supabase.co" // from Step 3
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHdlcGNncXZtcXhlZmp5emViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzkxMjcsImV4cCI6MjA3MDY1NTEyN30.qQvewBDRth0l7Dusn05eMzqq7IsZBxHuLiPg_d_6R3A" // from Step 3

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
