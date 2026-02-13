# Installation - Authentication System

## Step 1: Install Required Package

Run this command in the `lvmh-analytics` directory:

```bash
npm install @supabase/ssr
```

## Step 2: Verify Database Setup

The `profiles` table has been created with:
- ✅ `id` (uuid, references auth.users.id)
- ✅ `role` (enum: 'sales', 'analyst', 'admin')
- ✅ RLS policies configured
- ✅ Auto-profile creation trigger

## Step 3: Create Test Users

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. After creation, note the user ID
5. Run this SQL in Supabase SQL Editor:

```sql
-- Replace USER_ID_HERE with the actual user ID from step 4
UPDATE public.profiles 
SET role = 'sales'  -- or 'analyst' or 'admin'
WHERE id = 'USER_ID_HERE';
```

### Quick Test Users Setup

Create 3 users:
- **Sales User**: email `sales@lvmh.test`, role `sales`
- **Analyst User**: email `analyst@lvmh.test`, role `analyst`  
- **Admin User**: email `admin@lvmh.test`, role `admin`

## Step 4: Test the System

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Try logging in with different users
4. Verify redirects:
   - Sales → `/upload`
   - Analyst/Admin → `/dashboard`
5. Test route protection:
   - Sales cannot access `/dashboard` or `/taxonomy`
   - Analyst cannot access `/upload`
   - Admin can access everything

## Architecture

- **Middleware** (`src/middleware.ts`): Edge-level route protection
- **AppShell** (`src/components/layout/AppShell.tsx`): Client-side role checks
- **useSupabaseAuth** (`src/hooks/useSupabaseAuth.ts`): Session & role management
- **Login Page**: Role-based redirect after login

## Troubleshooting

### "Cannot find module '@supabase/ssr'"
→ Run `npm install @supabase/ssr`

### "Profile not found"
→ Check that the user exists in `auth.users` and `public.profiles`

### "Access denied" errors
→ Verify RLS policies allow authenticated users to read their own profile
