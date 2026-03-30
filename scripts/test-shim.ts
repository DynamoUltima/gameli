import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const result = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'eTZbHblv9VgsLzWbd3d6hgRBkBH2')
    .maybeSingle();

  console.log("RESULT:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
