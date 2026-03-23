import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function exportAuth() {
  console.log("Fetching profiles to export auth...");
  const { data: profiles, error } = await supabase.from('profiles').select('id, email');
  
  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  // Create CSV format: localId,email
  let csv = 'localId,email\n';
  
  for (const profile of profiles) {
    if (profile.email) {
      csv += `${profile.id},${profile.email}\n`;
    }
  }

  fs.writeFileSync('users.csv', csv);
  console.log(`Exported ${profiles.length} users to users.csv`);
  process.exit(0);
}

exportAuth();
