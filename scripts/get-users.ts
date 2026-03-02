import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://ykxbqenlsnqnphuiyexn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY"
);

async function main() {
  const { data, error } = await sb.from("users").select("id,name,clerk_id,weight_kg");
  if (error) console.error(error.message);
  else console.log(JSON.stringify(data, null, 2));
}
main();
