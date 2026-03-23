import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateData() {
  console.log("Starting Migration...");

  // 1. Migrate Profiles -> Users
  console.log("Migrating profiles...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.error("Error fetching profiles:", pErr);
  
  if (profiles) {
    for (const profile of profiles) {
      // Also fetch role
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', profile.id).single();
      const role = roleData ? roleData.role : 'patient';
      
      await setDoc(doc(db, "users", profile.id), {
        ...profile,
        role: role
      });
      console.log(`Migrated user profile: ${profile.id}`);
    }
  }

  // 2. Migrate Campaigns
  console.log("Migrating campaigns...");
  const { data: campaigns, error: cErr } = await supabase.from('awareness_campaigns').select('*');
  if (cErr) console.error("Error fetching campaigns:", cErr);
  
  if (campaigns) {
    for (const campaign of campaigns) {
      await setDoc(doc(db, "campaigns", campaign.id), campaign);
      console.log(`Migrated campaign: ${campaign.id}`);
    }
  }

  // 3. Migrate Appointments
  console.log("Migrating appointments...");
  const { data: appointments, error: aErr } = await supabase.from('appointments').select('*');
  if (aErr) console.error("Error fetching appointments:", aErr);
  
  if (appointments) {
    for (const apt of appointments) {
      await setDoc(doc(db, "appointments", apt.id), apt);
      console.log(`Migrated appointment: ${apt.id}`);
    }
  }

  console.log("Migration Complete!");
  process.exit(0);
}

migrateData();
