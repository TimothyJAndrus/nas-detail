# NAS Detail Database Setup Guide

## Overview
This guide will help you set up the PostgreSQL database for the NAS Detail car detailing website using Supabase.

## Prerequisites
- Supabase account (free tier available)
- Basic understanding of SQL

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up or log in to your account
3. Create a new project:
   - Choose your organization
   - Enter project name: `nas-detail`
   - Set a strong database password
   - Choose a region close to your users

## Step 2: Get Your Credentials

After project creation, get these credentials from your Supabase dashboard:

1. **Project URL**: Found in Settings > API
2. **Anon Key**: Found in Settings > API  
3. **Service Role Key**: Found in Settings > API (keep this secret!)

## Step 3: Update Environment Files

Replace the placeholder values in your environment files:

### `/src/environments/environment.development.ts`
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here',
    serviceRoleKey: 'your-service-role-key-here'
  },
  // ... other config
};
```

### `/src/environments/environment.ts` (Production)
```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here',
    serviceRoleKey: 'your-service-role-key-here'
  },
  // ... other config
};
```

## Step 4: Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Click "Run" to execute the schema

## Step 5: Set Up Row Level Security

1. In the SQL Editor, run the contents of `security-policies.sql`
2. This will set up proper access controls for your data

## Step 6: Seed Sample Data (Optional)

For development and testing:

1. In the SQL Editor, run the contents of `seed-data.sql`
2. This will populate your database with sample services, promotions, and testimonials

## Step 7: Configure Authentication

### Email Authentication
1. Go to Authentication > Settings in Supabase
2. Enable email authentication
3. Configure email templates (optional)
4. Set up custom SMTP (optional, recommended for production)

### Social Authentication (Optional)
1. Go to Authentication > Settings > Social
2. Configure providers:
   - **Google**: Get credentials from Google Cloud Console
   - **Facebook**: Get credentials from Facebook Developers

## Step 8: Set Up Storage Buckets

1. Go to Storage in Supabase dashboard
2. Create these buckets:
   - `avatars` (for user profile pictures)
   - `vehicle-photos` (for customer vehicle images)
   - `before-after-photos` (for service completion photos)

3. Configure bucket policies:
```sql
-- Allow authenticated users to upload their own avatars
INSERT INTO storage.policies (name, definition, check_expression, command, table_name)
VALUES (
  'Users can upload their own avatar',
  '(bucket_id = ''avatars'') AND (auth.uid() = (storage.foldername(name))[1]::uuid)',
  '(bucket_id = ''avatars'') AND (auth.uid() = (storage.foldername(name))[1]::uuid)',
  'INSERT',
  'objects'
);
```

## Step 9: Database Maintenance

### Regular Backups
- Supabase automatically backs up your database
- For additional backups, use `pg_dump` or set up automated backups

### Performance Monitoring
1. Monitor database performance in Supabase dashboard
2. Check slow queries and optimize indexes as needed
3. Monitor storage usage and costs

### Scaling
- Supabase will handle most scaling automatically
- For high-traffic scenarios, consider:
  - Connection pooling (included in Supabase)
  - Read replicas (Supabase Pro+)
  - Caching strategies

## Step 10: Environment Variables Security

### Development
- Keep development credentials in environment files
- Never commit real credentials to version control

### Production
- Use environment variables or secret management
- Set up proper CI/CD with secure credential injection

## Database Schema Overview

### Core Tables
- `users` - User profiles and authentication data
- `services` - Available car detailing services
- `service_packages` - Bundled service offerings
- `bookings` - Customer appointments and service requests
- `payments` - Payment tracking and history
- `subscriptions` - Monthly/recurring service plans

### Supporting Tables
- `vehicles` - Customer vehicle information
- `locations` - Service location addresses
- `testimonials` - Customer reviews and feedback
- `notifications` - System notifications
- `promotions` - Discount codes and offers
- `technicians` - Service provider profiles

### Key Features
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates
- Full-text search capabilities
- Automated timestamps and triggers
- Comprehensive indexing for performance

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check your Supabase URL and keys
   - Verify network connectivity
   - Check for typos in credentials

2. **Permission Errors**
   - Verify RLS policies are set up correctly
   - Check user authentication status
   - Review table permissions

3. **Performance Issues**
   - Review query patterns
   - Check database indexes
   - Monitor connection usage

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NAS Detail GitHub Issues](https://github.com/your-repo/nas-detail/issues)

## Next Steps

After database setup:

1. Test database connections in your Angular app
2. Implement user authentication flows
3. Set up payment processing with Stripe
4. Configure real-time features
5. Deploy to production

## Security Best Practices

- Use Row Level Security (RLS) policies
- Regularly rotate service keys
- Monitor access logs
- Keep Supabase and dependencies updated
- Use HTTPS for all connections
- Implement proper error handling
- Regular security audits