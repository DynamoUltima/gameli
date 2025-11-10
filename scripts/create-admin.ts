import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory path for import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: resolve(__dirname, '../.env') });

const createAdmin = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure you have VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
    process.exit(1);
  }

  // Initialize Supabase client with admin key
  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
  );

  try {
    // 1. Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@gameli.com',
      password: 'Admin@123!', // Change this to a secure password
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        phone: '+233000000000', // Update with actual phone
      }
    });

    if (authError) throw authError;
    
    console.log('User created successfully');

    // 2. Set admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: 'admin'
      });

    if (roleError) throw roleError;

    console.log('Admin role assigned successfully');
    console.log('Admin creation complete. You can now log in with:');
    console.log('Email: admin@gameli.com');
    console.log('Password: Admin@123!');

  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

createAdmin();