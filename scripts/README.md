# Creating Master Admin

To create the master admin account:

1. First, install the required dependency:
```bash
npm install dotenv typescript ts-node @types/node --save-dev
```

2. Create a `.env` file in your project root (if not already present) and add:
```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Get this from Supabase dashboard
```

3. Run the admin creation script:
```bash
npx ts-node scripts/create-admin.ts
```

4. After running the script successfully, you can log in with:
- Email: admin@gameli.com
- Password: Admin@123!

5. IMPORTANT: Change the admin password after first login!

## Security Notes

- Keep your `SUPABASE_SERVICE_ROLE_KEY` secure and never commit it to version control
- The admin creation script should only be run once in a secure environment
- Delete or secure the script after creating the admin account
- Update the admin's email and password in production