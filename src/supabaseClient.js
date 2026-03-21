import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ftniaephtjhxcfcayjfp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bmlhZXBodGpoeGNmY2F5amZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODIxMDQsImV4cCI6MjA4OTY1ODEwNH0.Xddsl0yWyyPct8UoNcihH7AnRO90nM3ZRp9oqKeYUGc"
);
