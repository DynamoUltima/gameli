import { db } from './src/integrations/firebase/client';
import { collection, getDocs } from 'firebase/firestore';

async function check() {
  console.log('Querying doctors...');
  const qs = await getDocs(collection(db, 'doctors'));
  console.log(`Found ${qs.docs.length} doctors.`);
  qs.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });

  console.log('\nQuerying doctor_specialties...');
  const sqs = await getDocs(collection(db, 'doctor_specialties'));
  console.log(`Found ${sqs.docs.length} doctor_specialties.`);
  sqs.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });

  process.exit(0);
}

check().catch(console.error);
