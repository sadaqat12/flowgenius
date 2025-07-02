# Supabase Setup Guide

This guide will help you set up Supabase as the database backend for the Service Call Manager application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `service-call-manager` (or any name you prefer)
   - **Database Password**: Generate a secure password and save it
   - **Region**: Choose the region closest to you
5. Click "Create new project"
6. Wait for the project to be created (usually 1-2 minutes)

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor** tab
2. Copy the contents of `docs/supabase-schema.sql` and paste it into the SQL Editor
3. Click "Run" to execute the SQL and create your tables

The schema creates:
- `service_calls` table with all required fields
- `work_logs` table for tracking work performed
- Indexes for better performance
- Row Level Security policies
- Automatic timestamp updating triggers

## 3. Get Your Project Configuration

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **Project API Key** (anon public key)

## 4. Configure Environment Variables

1. In your project root directory, create a `.env` file:
   ```bash
   touch .env
   ```

2. Add your Supabase configuration to the `.env` file:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   
   # Development
   NODE_ENV=development
   ```

3. Replace the placeholder values with your actual Supabase project URL and API key

## 5. Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application should now:
   - Connect to Supabase successfully
   - Create sample data automatically in development mode
   - Display real data in the dashboard and service calls list

## 6. Verify Database Tables

1. In your Supabase dashboard, go to **Database** → **Tables**
2. You should see:
   - `service_calls` table with sample data
   - `work_logs` table (empty initially)

## Security Notes

- The current setup uses Row Level Security (RLS) with permissive policies for development
- For production, you should implement proper RLS policies based on your authentication requirements
- Never commit your `.env` file to version control
- Consider using environment-specific configurations for different deployment stages

## Benefits of Using Supabase

✅ **No Native Module Issues** - Pure JavaScript, no compilation problems
✅ **Real-time Updates** - Built-in real-time subscriptions
✅ **Automatic Backups** - Supabase handles database backups
✅ **Scalability** - Easy to scale from single-user to multi-tenant
✅ **Built-in Auth** - Ready for user authentication when needed
✅ **API Generation** - Automatic REST and GraphQL APIs
✅ **Better Development Experience** - No local database setup required

## Troubleshooting

### Connection Issues
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active and running
- Ensure the `.env` file is in the project root directory

### Schema Issues
- Make sure you ran the complete SQL schema from `docs/supabase-schema.sql`
- Verify tables exist in your Supabase dashboard
- Check that Row Level Security policies are enabled

### Sample Data Issues
- Sample data is only added in development mode
- If data already exists, sample data creation is skipped
- Check the console logs for any error messages

## Next Steps

With Supabase configured, you can now:
1. Continue with Sprint 3 development
2. Implement real-time UI updates using Supabase subscriptions
3. Add user authentication using Supabase Auth
4. Deploy to production with automatic database management 