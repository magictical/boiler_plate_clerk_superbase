import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://ykxbqenlsnqnphuiyexn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY"
);

async function main() {
  const { data, error } = await sb
    .from("routines")
    .select("id, title, structure_json, energy_system, equipment_type")
    .eq("user_id", "c3d3bd22-3262-4584-a52c-abb9a159b6f0")
    .order("created_at", { ascending: true });

  if (error) { console.error(error.message); return; }

  for (const r of data || []) {
    console.log(`\n=== ${r.title} ===`);
    console.log(`ID: ${r.id}`);
    console.log(`energy: ${r.energy_system} | equipment: ${r.equipment_type}`);
    console.log("structure_json:", JSON.stringify(r.structure_json, null, 2));
  }
}
main().catch(console.error);
