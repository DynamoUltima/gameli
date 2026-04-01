import { supabase } from '../src/integrations/supabase/client';

async function test() {
    const doctorId = "the actual doctor ID"; // we need dr greg's ID
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(today);
    end.setHours(23,59,59,999);
    
    console.log("Date range:", today.toISOString(), "to", end.toISOString());
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, doctor_id, scheduled_at, status')
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', end.toISOString());
        
    console.log("Appointments:", appointments);
    console.log("Error:", error);
}
test();
