const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const doctorId = '205b3281-d09d-450d-86f7-4fe7473c9b9f';
  // March 16. The getDay() will give 1 (Monday)
  const dateStr = '2026-03-16';
  const date = new Date(`${dateStr}T12:00:00Z`);
  
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = daysOfWeek[date.getDay()];
  
  console.log('Checking', dateStr, dayOfWeek);
  
  const { data: rawSlots } = await supabase.from('doctor_availability').select('*').eq('doctor_id', doctorId);
  console.log('Raw Slots:', rawSlots.length);
  
  let availabilitySlots = rawSlots?.filter(slot => slot.date === dateStr) || [];
  if (availabilitySlots.length === 0) {
      availabilitySlots = rawSlots?.filter(slot => !slot.date && slot.day_of_week === dayOfWeek) || [];
  }
  console.log('Matched Slots:', availabilitySlots);
  
  const allSlots = [];
  availabilitySlots.forEach((availability) => {
    const startParts = availability.start_time.split(':');
    const startHour = parseInt(startParts[0], 10);
    const startMinute = parseInt(startParts[1] || '0', 10);
    
    const endParts = availability.end_time.split(':');
    const endHour = parseInt(endParts[0], 10);
    const endMinute = parseInt(endParts[1] || '0', 10);
    
    const slotDate = new Date(dateStr + "T00:00:00"); // Use local, not UTC, to mirror how browser handles basic dates
    slotDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(dateStr + "T00:00:00");
    endDate.setHours(endHour, endMinute, 0, 0);
    
    const slotDuration = 30 * 60 * 1000;
    
    console.log("Generating times between", slotDate.toISOString(), endDate.toISOString());
    while (slotDate < endDate) {
      allSlots.push(new Date(slotDate));
      slotDate.setTime(slotDate.getTime() + slotDuration);
    }
  });
  
  console.log('Generated total slots:', allSlots.map(x => x.toISOString()));
}
run().catch(console.error);
