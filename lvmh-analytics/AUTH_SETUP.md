# Authentication Setup Guide

## Installation

Install the required package for middleware cookie handling:

```bash
npm install @supabase/ssr
```

## Database Setup

The `profiles` table has been created via migration. It includes:
- `id` (uuid, references auth.users.id)
- `role` (enum: 'sales', 'analyst', 'admin')
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Creating Test Users

1. Go to Supabase Dashboard → Authentication → Users
2. Create users manually or use the SQL script below

### SQL Script to Create Test Users

```sql
-- Note: You need to create users in Supabase Auth UI first, then update their profiles

-- After creating a user in Auth UI, update their profile:
-- UPDATE public.profiles SET role = 'sales' WHERE id = 'USER_ID_HERE';
-- UPDATE public.profiles SET role = 'analyst' WHERE id = 'USER_ID_HERE';
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'USER_ID_HERE';
```

## Role-Based Access

- **sales**: Can access `/upload` and `/clients` only
- **analyst**: Can access `/dashboard` and `/taxonomy` only
- **admin**: Full access to all routes

## How It Works

1. **Middleware** (`src/middleware.ts`): Protects routes at the edge, checks authentication and roles
2. **AppShell** (`src/components/layout/AppShell.tsx`): Additional client-side protection
3. **Login Page**: Redirects users based on their role after successful login
4. **useSupabaseAuth Hook**: Fetches user session and profile/role

## Testing

1. Create users in Supabase Auth UI
2. Update their profiles with appropriate roles
3. Test login and route access based on roles
